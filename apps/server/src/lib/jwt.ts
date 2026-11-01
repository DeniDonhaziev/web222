import jwt from 'jsonwebtoken';
import type { UserRole } from '@drone/shared';
import { env } from './env.js';

export interface AuthTokenPayload {
  sub: string;
  role: UserRole;
}

export function signAccessToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.jwtAccessSecret, { expiresIn: env.jwtAccessTtl as jwt.SignOptions['expiresIn'] });
}

export function signRefreshToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshTtl as jwt.SignOptions['expiresIn'] });
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.jwtAccessSecret) as AuthTokenPayload;
}

export function verifyRefreshToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.jwtRefreshSecret) as AuthTokenPayload;
}
