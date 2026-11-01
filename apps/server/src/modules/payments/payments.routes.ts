import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/roleGuard.js';
import { asyncHandler, ApiError } from '../../middleware/errorHandler.js';
import { createYookassaPayment } from '../../lib/yookassa.js';
import { notify } from '../notifications/notify.js';

export const paymentsRouter = Router();

const createPaymentSchema = z.object({ orderId: z.string() });

paymentsRouter.post(
  '/create',
  requireAuth,
  requireRole('customer'),
  asyncHandler(async (req, res) => {
    const { orderId } = createPaymentSchema.parse(req.body);
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new ApiError(404, 'Заказ не найден');
    if (order.customerId !== req.auth!.sub) throw new ApiError(403, 'Нет доступа к заказу');
    if (order.paymentStatus === 'paid') throw new ApiError(409, 'Заказ уже оплачен');

    const amount = Number(order.totalPrice);
    const ykPayment = await createYookassaPayment({
      amount,
      orderId: order.id,
      description: `Доставка дроном: заказ №${order.id.slice(-8)}`,
    });

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: 'yookassa',
        providerPaymentId: ykPayment.id,
        amount,
        status: 'pending',
        confirmationUrl: ykPayment.confirmation?.confirmation_url,
      },
    });

    res.status(201).json({ payment, confirmationUrl: ykPayment.confirmation?.confirmation_url });
  }),
);

// Webhook от ЮKassa: https://yookassa.ru/developers/using-api/webhooks
const webhookSchema = z.object({
  event: z.string(),
  object: z.object({
    id: z.string(),
    status: z.string(),
    metadata: z.object({ orderId: z.string().optional() }).optional(),
  }),
});

paymentsRouter.post(
  '/webhook',
  asyncHandler(async (req, res) => {
    const body = webhookSchema.parse(req.body);

    const payment = await prisma.payment.findUnique({ where: { providerPaymentId: body.object.id } });
    if (!payment) {
      // Неизвестный платёж — отвечаем 200, чтобы ЮKassa не повторяла вебхук бесконечно.
      return res.status(200).json({ received: true });
    }

    if (body.event === 'payment.succeeded' && body.object.status === 'succeeded') {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({ where: { id: payment.id }, data: { status: 'paid', paidAt: new Date() } });
        const order = await tx.order.update({
          where: { id: payment.orderId },
          data: { paymentStatus: 'paid' },
        });
        if (order.executorId) {
          await tx.payout.upsert({
            where: { orderId: order.id },
            update: {},
            create: { executorId: order.executorId, orderId: order.id, amount: order.executorPayout, status: 'pending' },
          });
        }
        await notify(order.customerId, 'payment_received', { orderId: order.id });
      });
    } else if (body.event === 'payment.canceled') {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: 'failed' } });
    }

    res.status(200).json({ received: true });
  }),
);

// Для локальной разработки без реального вебхука ЮKassa — ручное подтверждение мок-платежа.
paymentsRouter.post(
  '/mock-confirm/:orderId',
  requireAuth,
  requireRole('customer'),
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
    if (!order || order.customerId !== req.auth!.sub) throw new ApiError(404, 'Заказ не найден');

    const updated = await prisma.$transaction(async (tx) => {
      await tx.payment.updateMany({ where: { orderId: order.id }, data: { status: 'paid', paidAt: new Date() } });
      const o = await tx.order.update({ where: { id: order.id }, data: { paymentStatus: 'paid' } });
      if (o.executorId) {
        await tx.payout.upsert({
          where: { orderId: o.id },
          update: {},
          create: { executorId: o.executorId, orderId: o.id, amount: o.executorPayout, status: 'pending' },
        });
      }
      return o;
    });

    res.json({ order: updated });
  }),
);
