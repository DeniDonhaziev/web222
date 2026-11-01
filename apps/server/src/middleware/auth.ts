import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken, type AuthTokenPayload } from '../lib/jwt.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthTokenPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }
  try {
    req.auth = verifyAccessToken(header.slice('Bearer '.length));
    next();
  } catch {
    return res.status(401).json({ error: 'Токен недействителен или истёк' });
  }
}
