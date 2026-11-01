import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt.js';
import { asyncHandler, ApiError } from '../../middleware/errorHandler.js';
import { requireAuth } from '../../middleware/auth.js';

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  role: z.enum(['customer', 'executor']),
  executorType: z.enum(['individual', 'sole_proprietor', 'legal_entity']).optional(),
  companyName: z.string().optional(),
  inn: z.string().optional(),
});

function serializeUser(user: { id: string; email: string; fullName: string; role: string; phone: string | null; avatarUrl: string | null }) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
  };
}

function issueTokens(user: { id: string; role: 'customer' | 'executor' | 'admin' }) {
  const payload = { sub: user.id, role: user.role };
  return { accessToken: signAccessToken(payload), refreshToken: signRefreshToken(payload) };
}

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const input = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new ApiError(409, 'Пользователь с таким email уже зарегистрирован');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        fullName: input.fullName,
        phone: input.phone,
        role: input.role,
        ...(input.role === 'executor'
          ? {
              executorProfile: {
                create: {
                  executorType: input.executorType ?? 'individual',
                  companyName: input.companyName,
                  inn: input.inn,
                },
              },
            }
          : {}),
      },
    });

    const tokens = issueTokens(user);
    res.status(201).json({ user: serializeUser(user), ...tokens });
  }),
);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      throw new ApiError(401, 'Неверный email или пароль');
    }
    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new ApiError(401, 'Неверный email или пароль');
    }
    const tokens = issueTokens(user);
    res.json({ user: serializeUser(user), ...tokens });
  }),
);

const refreshSchema = z.object({ refreshToken: z.string() });

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const { refreshToken } = refreshSchema.parse(req.body);
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new ApiError(401, 'Refresh-токен недействителен');
    }
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new ApiError(401, 'Пользователь не найден');
    }
    const tokens = issueTokens(user);
    res.json(tokens);
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.sub },
      include: { executorProfile: { include: { drones: true } } },
    });
    if (!user) {
      throw new ApiError(404, 'Пользователь не найден');
    }
    res.json({ user: serializeUser(user), executorProfile: user.executorProfile });
  }),
);
