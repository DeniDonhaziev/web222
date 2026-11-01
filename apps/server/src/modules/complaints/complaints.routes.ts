import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler, ApiError } from '../../middleware/errorHandler.js';

export const complaintsRouter = Router();

const createComplaintSchema = z.object({
  orderId: z.string(),
  subject: z.string().min(1),
  description: z.string().min(1),
});

complaintsRouter.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const input = createComplaintSchema.parse(req.body);
    const order = await prisma.order.findUnique({ where: { id: input.orderId }, include: { executor: true } });
    if (!order) throw new ApiError(404, 'Заказ не найден');

    const { sub, role } = req.auth!;
    const hasAccess = role === 'admin' || order.customerId === sub || order.executor?.userId === sub;
    if (!hasAccess) throw new ApiError(403, 'Нет доступа к заказу');

    const complaint = await prisma.complaint.create({
      data: { orderId: order.id, userId: sub, subject: input.subject, description: input.description },
    });
    res.status(201).json({ complaint });
  }),
);

complaintsRouter.get(
  '/mine',
  requireAuth,
  asyncHandler(async (req, res) => {
    const complaints = await prisma.complaint.findMany({
      where: { userId: req.auth!.sub },
      include: { order: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ complaints });
  }),
);
