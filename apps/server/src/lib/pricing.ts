import { haversineDistanceKm, URGENCY_MULTIPLIER, type GeoPoint, type PriceBreakdown, type Urgency } from '@drone/shared';

interface TariffLike {
  basePricePerKm: number;
  pricePerKg: number;
  minPrice: number;
  commissionPercent: number;
}

export function calculatePrice(
  pickup: GeoPoint,
  dropoff: GeoPoint,
  weightKg: number,
  urgency: Urgency,
  tariff: TariffLike,
): PriceBreakdown {
  const distanceKm = Math.max(haversineDistanceKm(pickup, dropoff), 0.1);
  const basePrice = distanceKm * tariff.basePricePerKm;
  const weightSurcharge = weightKg * tariff.pricePerKg;
  const urgencyMultiplier = URGENCY_MULTIPLIER[urgency];

  const rawTotal = (basePrice + weightSurcharge) * urgencyMultiplier;
  const totalPrice = Math.round(Math.max(rawTotal, tariff.minPrice) * 100) / 100;

  const commissionAmount = Math.round(totalPrice * (tariff.commissionPercent / 100) * 100) / 100;
  const executorPayout = Math.round((totalPrice - commissionAmount) * 100) / 100;

  return {
    distanceKm: Math.round(distanceKm * 100) / 100,
    basePrice: Math.round(basePrice * 100) / 100,
    weightSurcharge: Math.round(weightSurcharge * 100) / 100,
    urgencyMultiplier,
    totalPrice,
    commissionAmount,
    executorPayout,
  };
}
