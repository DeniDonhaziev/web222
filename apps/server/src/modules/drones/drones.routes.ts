import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/roleGuard.js';
import { asyncHandler, ApiError } from '../../middleware/errorHandler.js';

export const dronesRouter = Router();

async function getOwnExecutorProfile(userId: string) {
  const profile = await prisma.executorProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw new ApiError(404, 'Профиль исполнителя не найден');
  }
  return profile;
}

dronesRouter.get(
  '/',
  requireAuth,
  requireRole('executor'),
  asyncHandler(async (req, res) => {
    const profile = await getOwnExecutorProfile(req.auth!.sub);
    const drones = await prisma.drone.findMany({ where: { executorId: profile.id }, orderBy: { createdAt: 'desc' } });
    res.json({ drones });
  }),
);

const droneSchema = z.object({
  name: z.string().min(1),
  payloadCapacityKg: z.number().positive(),
  maxRangeKm: z.number().positive(),
  speedKmh: z.number().positive(),
  maxFlightTimeMin: z.number().int().positive(),
});

dronesRouter.post(
  '/',
  requireAuth,
  requireRole('executor'),
  asyncHandler(async (req, res) => {
    const profile = await getOwnExecutorProfile(req.auth!.sub);
    const input = droneSchema.parse(req.body);
    const drone = await prisma.drone.create({ data: { ...input, executorId: profile.id } });
    res.status(201).json({ drone });
  }),
);

const droneUpdateSchema = droneSchema.partial().extend({
  status: z.enum(['idle', 'busy', 'maintenance']).optional(),
});

dronesRouter.patch(
  '/:id',
  requireAuth,
  requireRole('executor'),
  asyncHandler(async (req, res) => {
    const profile = await getOwnExecutorProfile(req.auth!.sub);
    const drone = await prisma.drone.findUnique({ where: { id: req.params.id } });
    if (!drone || drone.executorId !== profile.id) {
      throw new ApiError(404, 'Дрон не найден');
    }
    const input = droneUpdateSchema.parse(req.body);
    const updated = await prisma.drone.update({ where: { id: drone.id }, data: input });
    res.json({ drone: updated });
  }),
);

dronesRouter.delete(
  '/:id',
  requireAuth,
  requireRole('executor'),
  asyncHandler(async (req, res) => {
    const profile = await getOwnExecutorProfile(req.auth!.sub);
    const drone = await prisma.drone.findUnique({ where: { id: req.params.id } });
    if (!drone || drone.executorId !== profile.id) {
      throw new ApiError(404, 'Дрон не найден');
    }
    await prisma.drone.delete({ where: { id: drone.id } });
    res.status(204).send();
  }),
);
