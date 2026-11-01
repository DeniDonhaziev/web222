import { Router } from 'express';
import { z } from 'zod';
import { haversineDistanceKm } from '@drone/shared';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/roleGuard.js';
import { asyncHandler, ApiError } from '../../middleware/errorHandler.js';
import { emitTrackingPoint } from '../../sockets/tracking.socket.js';

export const trackingRouter = Router();

const ACTIVE_STATUSES = new Set(['accepted', 'preparing', 'departed', 'in_transit', 'arriving']);

const locationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  altitudeM: z.number().optional(),
  speedKmh: z.number().optional(),
});

// Координаты приходят либо от мобильного приложения исполнителя, либо от API производителя дрона.
trackingRouter.post(
  '/:id/location',
  requireAuth,
  requireRole('executor'),
  asyncHandler(async (req, res) => {
    const input = locationSchema.parse(req.body);
    const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { executor: true } });
    if (!order) throw new ApiError(404, 'Заказ не найден');
    if (order.executor?.userId !== req.auth!.sub) throw new ApiError(403, 'Нет доступа к заказу');
    if (!ACTIVE_STATUSES.has(order.status)) {
      throw new ApiError(409, 'Заказ сейчас не в статусе активной доставки');
    }

    const point = await prisma.trackingPoint.create({
      data: { orderId: order.id, lat: input.lat, lng: input.lng, altitudeM: input.altitudeM, speedKmh: input.speedKmh },
    });

    const remainingKm = haversineDistanceKm({ lat: input.lat, lng: input.lng }, { lat: order.dropoffLat, lng: order.dropoffLng });
    const speed = input.speedKmh && input.speedKmh > 0 ? input.speedKmh : 40;
    const etaMinutes = Math.round((remainingKm / speed) * 60);

    const enrichedPoint = { ...point, remainingKm: Math.round(remainingKm * 100) / 100, etaMinutes };
    emitTrackingPoint(order.id, enrichedPoint);

    res.status(201).json({ point: enrichedPoint });
  }),
);
