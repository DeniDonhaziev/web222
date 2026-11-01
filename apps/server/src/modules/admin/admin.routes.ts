import { Router } from 'express';
import { z } from 'zod';
import type { OrderStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/roleGuard.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { notify } from '../notifications/notify.js';

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole('admin'));

adminRouter.get(
  '/users',
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      include: { executorProfile: { include: { drones: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ users });
  }),
);

adminRouter.get(
  '/executors/pending',
  asyncHandler(async (_req, res) => {
    const executors = await prisma.executorProfile.findMany({
      where: { verificationStatus: 'pending' },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ executors });
  }),
);

const verifySchema = z.object({ status: z.enum(['approved', 'rejected']) });

adminRouter.patch(
  '/executors/:id/verify',
  asyncHandler(async (req, res) => {
    const { status } = verifySchema.parse(req.body);
    const executor = await prisma.executorProfile.update({
      where: { id: req.params.id },
      data: { verificationStatus: status },
      include: { user: true },
    });
    if (status === 'approved') {
      await notify(executor.userId, 'executor_verified', { executorId: executor.id });
    }
    res.json({ executor });
  }),
);

adminRouter.get(
  '/orders',
  asyncHandler(async (_req, res) => {
    const orders = await prisma.order.findMany({
      include: {
        customer: { select: { id: true, fullName: true, email: true } },
        executor: { include: { user: { select: { fullName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.json({ orders });
  }),
);

const ACTIVE_STATUSES: OrderStatus[] = ['accepted', 'preparing', 'departed', 'in_transit', 'arriving'];

adminRouter.get(
  '/orders/live',
  asyncHandler(async (_req, res) => {
    const orders = await prisma.order.findMany({
      where: { status: { in: ACTIVE_STATUSES } },
      include: {
        customer: { select: { id: true, fullName: true, phone: true } },
        executor: { include: { user: { select: { fullName: true, phone: true, avatarUrl: true } } } },
        drone: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const withLatestPoint = await Promise.all(
      orders.map(async (order) => {
        const latestPoint = await prisma.trackingPoint.findFirst({
          where: { orderId: order.id },
          orderBy: { recordedAt: 'desc' },
        });
        return { ...order, latestPoint };
      }),
    );

    res.json({ orders: withLatestPoint });
  }),
);

adminRouter.get(
  '/complaints',
  asyncHandler(async (_req, res) => {
    const complaints = await prisma.complaint.findMany({
      include: { order: true, user: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ complaints });
  }),
);

const complaintStatusSchema = z.object({ status: z.enum(['in_review', 'resolved', 'rejected']) });

adminRouter.patch(
  '/complaints/:id',
  asyncHandler(async (req, res) => {
    const { status } = complaintStatusSchema.parse(req.body);
    const complaint = await prisma.complaint.update({
      where: { id: req.params.id },
      data: { status, resolvedAt: status === 'resolved' ? new Date() : undefined },
    });
    res.json({ complaint });
  }),
);

adminRouter.get(
  '/tariffs',
  asyncHandler(async (_req, res) => {
    const tariffs = await prisma.tariff.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ tariffs });
  }),
);

const tariffSchema = z.object({
  name: z.string(),
  basePricePerKm: z.number().positive(),
  pricePerKg: z.number().positive(),
  minPrice: z.number().positive(),
  commissionPercent: z.number().min(0).max(100),
});

adminRouter.post(
  '/tariffs',
  asyncHandler(async (req, res) => {
    const input = tariffSchema.parse(req.body);
    const tariff = await prisma.tariff.create({ data: input });
    res.status(201).json({ tariff });
  }),
);

adminRouter.patch(
  '/tariffs/:id',
  asyncHandler(async (req, res) => {
    const input = tariffSchema.partial().extend({ isActive: z.boolean().optional() }).parse(req.body);
    const tariff = await prisma.tariff.update({ where: { id: req.params.id }, data: input });
    res.json({ tariff });
  }),
);

adminRouter.get(
  '/analytics/summary',
  asyncHandler(async (_req, res) => {
    const [totalOrders, completedOrders, totalCommission, activeExecutors, pendingVerifications] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'completed' } }),
      prisma.order.aggregate({ _sum: { commissionAmount: true }, where: { paymentStatus: 'paid' } }),
      prisma.executorProfile.count({ where: { verificationStatus: 'approved', isAvailable: true } }),
      prisma.executorProfile.count({ where: { verificationStatus: 'pending' } }),
    ]);
    res.json({
      totalOrders,
      completedOrders,
      totalCommission: totalCommission._sum.commissionAmount ?? 0,
      activeExecutors,
      pendingVerifications,
    });
  }),
);
