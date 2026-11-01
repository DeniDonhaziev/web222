import type { Server as HttpServer } from 'http';
import { Server, type Socket } from 'socket.io';
import { verifyAccessToken } from '../lib/jwt.js';
import { env } from '../lib/env.js';

export let io: Server | undefined;

interface ClientToServerEvents {
  'join:order': (orderId: string) => void;
  'leave:order': (orderId: string) => void;
}

export function initSockets(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: env.clientOrigin, credentials: true },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Требуется токен авторизации'));
    try {
      const payload = verifyAccessToken(token);
      socket.data.auth = payload;
      next();
    } catch {
      next(new Error('Токен недействителен'));
    }
  });

  io.on('connection', (socket: Socket<ClientToServerEvents>) => {
    const auth = socket.data.auth as { sub: string } | undefined;
    if (auth) socket.join(`user:${auth.sub}`);

    socket.on('join:order', (orderId: string) => {
      socket.join(`order:${orderId}`);
    });
    socket.on('leave:order', (orderId: string) => {
      socket.leave(`order:${orderId}`);
    });
  });

  return io;
}

export function emitOrderUpdate(orderId: string, payload: unknown) {
  io?.to(`order:${orderId}`).emit('order:update', payload);
}

export function emitTrackingPoint(orderId: string, point: unknown) {
  io?.to(`order:${orderId}`).emit('order:location', point);
}
