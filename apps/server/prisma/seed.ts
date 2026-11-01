import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.tariff.upsert({
    where: { id: 'default-tariff' },
    update: {},
    create: {
      id: 'default-tariff',
      name: 'Стандартный тариф',
      basePricePerKm: 25,
      pricePerKg: 15,
      minPrice: 150,
      commissionPercent: 10,
      isActive: true,
    },
  });

  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@drone.market' },
    update: {},
    create: {
      email: 'admin@drone.market',
      passwordHash,
      fullName: 'Администратор Платформы',
      role: 'admin',
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@drone.market' },
    update: {},
    create: {
      email: 'customer@drone.market',
      passwordHash,
      fullName: 'Иван Заказчиков',
      role: 'customer',
    },
  });

  const executorUser = await prisma.user.upsert({
    where: { email: 'executor@drone.market' },
    update: {},
    create: {
      email: 'executor@drone.market',
      passwordHash,
      fullName: 'ООО «СкайДоставка»',
      role: 'executor',
    },
  });

  const executorProfile = await prisma.executorProfile.upsert({
    where: { userId: executorUser.id },
    update: {},
    create: {
      userId: executorUser.id,
      executorType: 'legal_entity',
      companyName: 'ООО «СкайДоставка»',
      inn: '7701234567',
      verificationStatus: 'approved',
      isAvailable: true,
      baseLat: 55.751244,
      baseLng: 37.618423,
      rating: 4.8,
      ratingCount: 32,
    },
  });

  await prisma.drone.upsert({
    where: { id: 'demo-drone-1' },
    update: {},
    create: {
      id: 'demo-drone-1',
      executorId: executorProfile.id,
      name: 'SkyHawk X1',
      payloadCapacityKg: 5,
      maxRangeKm: 25,
      speedKmh: 60,
      maxFlightTimeMin: 40,
      status: 'idle',
    },
  });

  console.log('Seed complete:', { admin: admin.email, customer: customer.email, executor: executorUser.email });
  console.log('Пароль для всех тестовых аккаунтов: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
