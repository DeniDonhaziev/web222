import { haversineDistanceKm, type GeoPoint } from '@drone/shared';
import { prisma } from './prisma.js';

export interface ExecutorCandidate {
  executorId: string;
  companyName: string | null;
  fullName: string;
  droneId: string;
  droneName: string;
  distanceToPickupKm: number;
  rating: number;
  ratingCount: number;
  score: number;
}

/**
 * Возвращает кандидатов-исполнителей, отсортированных по убыванию score.
 * Score комбинирует близость базы к точке отправления и рейтинг исполнителя —
 * при равной пригодности ближе и надёжнее выигрывает выше.
 */
export async function findCandidateExecutors(
  pickup: GeoPoint,
  distanceKm: number,
  weightKg: number,
  limit = 5,
): Promise<ExecutorCandidate[]> {
  const executors = await prisma.executorProfile.findMany({
    where: {
      verificationStatus: 'approved',
      isAvailable: true,
      drones: {
        some: {
          status: 'idle',
          payloadCapacityKg: { gte: weightKg },
          maxRangeKm: { gte: distanceKm },
        },
      },
    },
    include: {
      user: true,
      drones: {
        where: {
          status: 'idle',
          payloadCapacityKg: { gte: weightKg },
          maxRangeKm: { gte: distanceKm },
        },
      },
    },
  });

  const candidates: ExecutorCandidate[] = [];

  for (const executor of executors) {
    const bestDrone = [...executor.drones].sort((a, b) => b.payloadCapacityKg - a.payloadCapacityKg)[0];
    if (!bestDrone) continue;

    const distanceToPickupKm =
      executor.baseLat != null && executor.baseLng != null
        ? haversineDistanceKm({ lat: executor.baseLat, lng: executor.baseLng }, pickup)
        : distanceKm;

    const ratingScore = executor.rating / 5;
    const proximityScore = 1 / (1 + distanceToPickupKm / 10);
    const score = proximityScore * 0.6 + ratingScore * 0.4;

    candidates.push({
      executorId: executor.id,
      companyName: executor.companyName,
      fullName: executor.user.fullName,
      droneId: bestDrone.id,
      droneName: bestDrone.name,
      distanceToPickupKm: Math.round(distanceToPickupKm * 100) / 100,
      rating: executor.rating,
      ratingCount: executor.ratingCount,
      score: Math.round(score * 1000) / 1000,
    });
  }

  return candidates.sort((a, b) => b.score - a.score).slice(0, limit);
}
