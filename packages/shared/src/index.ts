// Единый источник правды для ролей, статусов и enum-ов, используемых и на сервере, и на клиенте.

export const UserRole = {
  CUSTOMER: 'customer',
  EXECUTOR: 'executor',
  ADMIN: 'admin',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ExecutorType = {
  INDIVIDUAL: 'individual',
  SOLE_PROPRIETOR: 'sole_proprietor',
  LEGAL_ENTITY: 'legal_entity',
} as const;
export type ExecutorType = (typeof ExecutorType)[keyof typeof ExecutorType];

export const VerificationStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];

export const DroneStatus = {
  IDLE: 'idle',
  BUSY: 'busy',
  MAINTENANCE: 'maintenance',
} as const;
export type DroneStatus = (typeof DroneStatus)[keyof typeof DroneStatus];

// Порядок значим — используется для проверки допустимых переходов статуса заказа.
export const OrderStatus = {
  CREATED: 'created',
  AWAITING_EXECUTOR: 'awaiting_executor',
  EXECUTOR_FOUND: 'executor_found',
  ACCEPTED: 'accepted',
  PREPARING: 'preparing',
  DEPARTED: 'departed',
  IN_TRANSIT: 'in_transit',
  ARRIVING: 'arriving',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  OrderStatus.CREATED,
  OrderStatus.AWAITING_EXECUTOR,
  OrderStatus.EXECUTOR_FOUND,
  OrderStatus.ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.DEPARTED,
  OrderStatus.IN_TRANSIT,
  OrderStatus.ARRIVING,
  OrderStatus.DELIVERED,
  OrderStatus.COMPLETED,
];

export const ORDER_STATUS_LABELS_RU: Record<OrderStatus, string> = {
  [OrderStatus.CREATED]: 'Создан',
  [OrderStatus.AWAITING_EXECUTOR]: 'Ожидает исполнителя',
  [OrderStatus.EXECUTOR_FOUND]: 'Исполнитель найден',
  [OrderStatus.ACCEPTED]: 'Принят',
  [OrderStatus.PREPARING]: 'Подготовка',
  [OrderStatus.DEPARTED]: 'Вылетел',
  [OrderStatus.IN_TRANSIT]: 'В пути',
  [OrderStatus.ARRIVING]: 'Почти прибыл',
  [OrderStatus.DELIVERED]: 'Доставлен',
  [OrderStatus.COMPLETED]: 'Завершен',
  [OrderStatus.CANCELLED]: 'Отменен',
};

export const Urgency = {
  STANDARD: 'standard',
  EXPRESS: 'express',
  URGENT: 'urgent',
} as const;
export type Urgency = (typeof Urgency)[keyof typeof Urgency];

export const URGENCY_MULTIPLIER: Record<Urgency, number> = {
  [Urgency.STANDARD]: 1,
  [Urgency.EXPRESS]: 1.35,
  [Urgency.URGENT]: 1.75,
};

export const PaymentStatus = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PayoutStatus = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
} as const;
export type PayoutStatus = (typeof PayoutStatus)[keyof typeof PayoutStatus];

export const ComplaintStatus = {
  OPEN: 'open',
  IN_REVIEW: 'in_review',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
} as const;
export type ComplaintStatus = (typeof ComplaintStatus)[keyof typeof ComplaintStatus];

export const NotificationType = {
  ORDER_STATUS_CHANGED: 'order_status_changed',
  ORDER_MATCHED: 'order_matched',
  NEW_ORDER_REQUEST: 'new_order_request',
  PAYMENT_RECEIVED: 'payment_received',
  EXECUTOR_VERIFIED: 'executor_verified',
  PAYOUT_SENT: 'payout_sent',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const DEFAULT_COMMISSION_PERCENT = 10;

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface CreateOrderInput {
  pickupAddress: string;
  pickup: GeoPoint;
  dropoffAddress: string;
  dropoff: GeoPoint;
  weightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  description?: string;
  urgency: Urgency;
}

export interface PriceBreakdown {
  distanceKm: number;
  basePrice: number;
  weightSurcharge: number;
  urgencyMultiplier: number;
  totalPrice: number;
  commissionAmount: number;
  executorPayout: number;
}

export interface DroneInput {
  name: string;
  payloadCapacityKg: number;
  maxRangeKm: number;
  speedKmh: number;
  maxFlightTimeMin: number;
}

export function haversineDistanceKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}
