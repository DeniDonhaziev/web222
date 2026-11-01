import { Router } from 'express';
import { z } from 'zod';
import { ORDER_STATUS_FLOW, type OrderStatus } from '@drone/shared';
import { prisma } from '../../lib/prisma.js';
import { calculatePrice } from '../../lib/pricing.js';
import { findCandidateExecutors } from '../../lib/matching.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/roleGuard.js';
import { asyncHandler, ApiError } from '../../middleware/errorHandler.js';
import { emitOrderUpdate } from '../../sockets/tracking.socket.js';
import { notify } from '../../modules/notifications/notify.js';

export const ordersRouter = Router();

const geoPointSchema = z.object({ lat: z.number(), lng: z.number() });

const createOrderSchema = z.object({
  pickupAddress: z.string().min(1),
  pickup: geoPointSchema,
  dropoffAddress: z.string().min(1),
  dropoff: geoPointSchema,
  weightKg: z.number().positive(),
  lengthCm: z.number().positive().optional(),
  widthCm: z.number().positive().optional(),
  heightCm: z.number().positive().optional(),
  description: z.string().optional(),
  urgency: z.enum(['standard', 'express', 'urgent']),
});

const orderInclude = {
  customer: { select: { id: true, fullName: true, phone: true } },
  executor: { include: { user: { select: { id: true, fullName: true, phone: true } } } },
  drone: true,
  statusHistory: { orderBy: { changedAt: 'asc' as const } },
  payments: true,
  rating: true,
};

ordersRouter.post(
  '/',
  requireAuth,
  requireRole('customer'),
  asyncHandler(async (req, res) => {
    const input = createOrderSchema.parse(req.body);

    const tariff = await prisma.tariff.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });
    if (!tariff) {
      throw new ApiError(500, 'Тариф не настроен');
    }

    const priceBreakdown = calculatePrice(input.pickup, input.dropoff, input.weightKg, input.urgency, {
      basePricePerKm: Number(tariff.basePricePerKm),
      pricePerKg: Number(tariff.pricePerKg),
      minPrice: Number(tariff.minPrice),
      commissionPercent: Number(tariff.commissionPercent),
    });

    const order = await prisma.order.create({
      data: {
        customerId: req.auth!.sub,
        pickupAddress: input.pickupAddress,
        pickupLat: input.pickup.lat,
        pickupLng: input.pickup.lng,
        dropoffAddress: input.dropoffAddress,
        dropoffLat: input.dropoff.lat,
        dropoffLng: input.dropoff.lng,
        weightKg: input.weightKg,
        lengthCm: input.lengthCm,
        widthCm: input.widthCm,
        heightCm: input.heightCm,
        description: input.description,
        urgency: input.urgency,
        distanceKm: priceBreakdown.distanceKm,
        totalPrice: priceBreakdown.totalPrice,
        commissionAmount: priceBreakdown.commissionAmount,
        executorPayout: priceBreakdown.executorPayout,
        status: 'awaiting_executor',
        statusHistory: { create: [{ status: 'created' }, { status: 'awaiting_executor' }] },
      },
      include: orderInclude,
    });

    const candidates = await findCandidateExecutors(input.pickup, priceBreakdown.distanceKm, input.weightKg);

    res.status(201).json({ order, priceBreakdown, candidates });
  }),
);

ordersRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { role, sub } = req.auth!;
    let where = {};
    if (role === 'customer') {
      where = { customerId: sub };
    } else if (role === 'executor') {
      const profile = await prisma.executorProfile.findUnique({ where: { userId: sub } });
      where = { executorId: profile?.id ?? '__none__' };
    }
    const orders = await prisma.order.findMany({ where, include: orderInclude, orderBy: { createdAt: 'desc' } });
    res.json({ orders });
  }),
);

ordersRouter.get(
  '/open/available',
  requireAuth,
  requireRole('executor'),
  asyncHandler(async (req, res) => {
    const profile = await prisma.executorProfile.findUnique({ where: { userId: req.auth!.sub }, include: { drones: true } });
    if (!profile || profile.verificationStatus !== 'approved') {
      return res.json({ orders: [] });
    }
    const maxCapacity = Math.max(0, ...profile.drones.map((d) => d.payloadCapacityKg));
    const maxRange = Math.max(0, ...profile.drones.map((d) => d.maxRangeKm));

    const orders = await prisma.order.findMany({
      where: {
        status: { in: ['awaiting_executor', 'executor_found'] },
        weightKg: { lte: maxCapacity },
        distanceKm: { lte: maxRange },
      },
      include: orderInclude,
      orderBy: { createdAt: 'asc' },
    });
    res.json({ orders });
  }),
);

async function loadOrderOr404(id: string) {
  const order = await prisma.order.findUnique({ where: { id }, include: orderInclude });
  if (!order) throw new ApiError(404, 'Заказ не найден');
  return order;
}

function assertOrderAccess(order: { customerId: string; executor: { userId: string } | null }, auth: { sub: string; role: string }) {
  if (auth.role === 'admin') return;
  if (auth.role === 'customer' && order.customerId === auth.sub) return;
  if (auth.role === 'executor' && order.executor?.userId === auth.sub) return;
  throw new ApiError(403, 'Нет доступа к заказу');
}

ordersRouter.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const order = await loadOrderOr404(req.params.id);
    assertOrderAccess(order, req.auth!);
    const trackingPoints = await prisma.trackingPoint.findMany({
      where: { orderId: order.id },
      orderBy: { recordedAt: 'asc' },
      take: 500,
    });
    res.json({ order, trackingPoints });
  }),
);

ordersRouter.get(
  '/:id/match',
  requireAuth,
  asyncHandler(async (req, res) => {
    const order = await loadOrderOr404(req.params.id);
    assertOrderAccess(order, req.auth!);
    const candidates = await findCandidateExecutors(
      { lat: order.pickupLat, lng: order.pickupLng },
      order.distanceKm,
      order.weightKg,
    );
    res.json({ candidates });
  }),
);

const acceptSchema = z.object({ droneId: z.string() });

ordersRouter.post(
  '/:id/accept',
  requireAuth,
  requireRole('executor'),
  asyncHandler(async (req, res) => {
    const { droneId } = acceptSchema.parse(req.body);
    const order = await loadOrderOr404(req.params.id);
    if (order.status !== 'awaiting_executor' && order.status !== 'executor_found') {
      throw new ApiError(409, 'Заказ уже принят другим исполнителем или недоступен');
    }
    const profile = await prisma.executorProfile.findUnique({ where: { userId: req.auth!.sub } });
    if (!profile) throw new ApiError(404, 'Профиль исполнителя не найден');

    const drone = await prisma.drone.findUnique({ where: { id: droneId } });
    if (!drone || drone.executorId !== profile.id) throw new ApiError(404, 'Дрон не найден');
    if (drone.payloadCapacityKg < order.weightKg || drone.maxRangeKm < order.distanceKm) {
      throw new ApiError(400, 'Дрон не подходит по грузоподъёмности или дальности');
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.drone.update({ where: { id: drone.id }, data: { status: 'busy' } });
      return tx.order.update({
        where: { id: order.id },
        data: {
          executorId: profile.id,
          droneId: drone.id,
          status: 'accepted',
          statusHistory: { create: { status: 'accepted' } },
        },
        include: orderInclude,
      });
    });

    emitOrderUpdate(order.id, { type: 'status', order: updated });
    await notify(order.customerId, 'order_matched', { orderId: order.id });
    res.json({ order: updated });
  }),
);

const statusUpdateSchema = z.object({
  status: z.enum(['preparing', 'departed', 'in_transit', 'arriving', 'delivered', 'completed', 'cancelled']),
  note: z.string().optional(),
  cancelReason: z.string().optional(),
});

function assertValidTransition(current: OrderStatus, next: OrderStatus) {
  if (next === 'cancelled') return;
  const currentIdx = ORDER_STATUS_FLOW.indexOf(current);
  const nextIdx = ORDER_STATUS_FLOW.indexOf(next);
  if (currentIdx === -1 || nextIdx !== currentIdx + 1) {
    throw new ApiError(409, `Недопустимый переход статуса: ${current} → ${next}`);
  }
}

ordersRouter.patch(
  '/:id/status',
  requireAuth,
  requireRole('executor', 'customer'),
  asyncHandler(async (req, res) => {
    const input = statusUpdateSchema.parse(req.body);
    const order = await loadOrderOr404(req.params.id);
    assertOrderAccess(order, req.auth!);

    if (input.status === 'cancelled') {
      if (order.status === 'delivered' || order.status === 'completed') {
        throw new ApiError(409, 'Нельзя отменить завершённый заказ');
      }
    } else {
      if (req.auth!.role !== 'executor') {
        throw new ApiError(403, 'Статус доставки меняет исполнитель');
      }
      assertValidTransition(order.status, input.status);
    }

    const updated = await prisma.$transaction(async (tx) => {
      if ((input.status === 'completed' || input.status === 'cancelled') && order.droneId) {
        await tx.drone.update({ where: { id: order.droneId }, data: { status: 'idle' } });
      }
      return tx.order.update({
        where: { id: order.id },
        data: {
          status: input.status,
          ...(input.status === 'completed' ? { completedAt: new Date() } : {}),
          ...(input.status === 'cancelled' ? { cancelledAt: new Date(), cancelReason: input.cancelReason } : {}),
          statusHistory: { create: { status: input.status, note: input.note } },
        },
        include: orderInclude,
      });
    });

    emitOrderUpdate(order.id, { type: 'status', order: updated });
    await notify(order.customerId, 'order_status_changed', { orderId: order.id, status: input.status });
    res.json({ order: updated });
  }),
);

const rateSchema = z.object({ score: z.number().int().min(1).max(5), comment: z.string().optional() });

ordersRouter.post(
  '/:id/rate',
  requireAuth,
  requireRole('customer'),
  asyncHandler(async (req, res) => {
    const input = rateSchema.parse(req.body);
    const order = await loadOrderOr404(req.params.id);
    assertOrderAccess(order, req.auth!);
    if (order.customerId !== req.auth!.sub) throw new ApiError(403, 'Нет доступа');
    if (!['delivered', 'completed'].includes(order.status)) {
      throw new ApiError(409, 'Оценить можно только доставленный заказ');
    }
    if (!order.executor) throw new ApiError(409, 'У заказа нет исполнителя');

    const rating = await prisma.$transaction(async (tx) => {
      const created = await tx.rating.create({
        data: { orderId: order.id, customerId: req.auth!.sub, score: input.score, comment: input.comment },
      });
      const executor = await tx.executorProfile.findUniqueOrThrow({ where: { id: order.executor!.id } });
      const newCount = executor.ratingCount + 1;
      const newRating = (executor.rating * executor.ratingCount + input.score) / newCount;
      await tx.executorProfile.update({
        where: { id: executor.id },
        data: { rating: newRating, ratingCount: newCount },
      });
      return created;
    });

    res.status(201).json({ rating });
  }),
);
