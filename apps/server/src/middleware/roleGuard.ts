import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@drone/shared';

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    next();
  };
}
