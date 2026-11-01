import type { Prisma } from '@prisma/client';
import type { NotificationType } from '@drone/shared';
import { prisma } from '../../lib/prisma.js';
import { io } from '../../sockets/tracking.socket.js';

export async function notify(userId: string, type: NotificationType, payload: Prisma.InputJsonValue) {
  const notification = await prisma.notification.create({
    data: { userId, type, payload },
  });
  io?.to(`user:${userId}`).emit('notification', notification);
  return notification;
}
