import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useOrder } from '../../features/orders/api';
import { useOrderSocket } from '../../features/tracking/useOrderSocket';
import { useCreatePayment, useMockConfirmPayment } from '../../features/payments/api';
import { useRateOrder } from '../../features/orders/api';
import { useCreateComplaint } from '../../features/complaints/api';
import { GlassPanel, GlassCard } from '../../design-system/GlassPanel';
import { StatusBadge } from '../../design-system/StatusBadge';
import { StatusTimeline } from '../../features/orders/StatusTimeline';
import { Spinner } from '../../design-system/Spinner';
import { Button } from '../../design-system/Button';
import { Textarea } from '../../design-system/Input';
import { LiveTrackingMap } from '../../map/LiveTrackingMap';

const ACTIVE_STATUSES = new Set(['accepted', 'preparing', 'departed', 'in_transit', 'arriving']);

export function OrderTracking() {
  const { id } = useParams();
  const { data, isLoading } = useOrder(id);
  const { latestPoint, trail } = useOrderSocket(id);

  const createPayment = useCreatePayment();
  const mockConfirm = useMockConfirmPayment();
  const rateOrder = useRateOrder();
  const createComplaint = useCreateComplaint();

  const [confirmationUrl, setConfirmationUrl] = useState<string | null>(null);
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [complaintText, setComplaintText] = useState('');

  if (isLoading) return <Spinner />;
  if (!data?.order) return <p className="text-ink-500">Заказ не найден</p>;

  const { order, trackingPoints } = data;
  const combinedTrail = [...trackingPoints.map((p: any) => ({ lat: p.lat, lng: p.lng })), ...trail];
  const dronePosition = latestPoint ?? combinedTrail[combinedTrail.length - 1];

  async function handlePay() {
    const res = await createPayment.mutateAsync(order.id);
    setConfirmationUrl(res.confirmationUrl);
  }

  async function handleMockConfirm() {
    await mockConfirm.mutateAsync(order.id);
    setConfirmationUrl(null);
  }

  async function handleRate() {
    await rateOrder.mutateAsync({ orderId: order.id, score, comment: comment || undefined });
  }

  async function handleComplaint() {
    await createComplaint.mutateAsync({ orderId: order.id, subject: 'Проблема с заказом', description: complaintText });
    setComplaintText('');
    setComplaintOpen(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Заказ №{order.id.slice(-8)}</h1>
          <p className="text-sm text-ink-500">
            {order.pickupAddress} → {order.dropoffAddress}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-6">
          <LiveTrackingMap
            pickup={{ lat: order.pickupLat, lng: order.pickupLng }}
            dropoff={{ lat: order.dropoffLat, lng: order.dropoffLng }}
            dronePosition={dronePosition}
            trail={combinedTrail}
          />

          {ACTIVE_STATUSES.has(order.status) && (
            <GlassCard className="flex items-center justify-between text-sm">
              <span className="text-ink-500">Осталось</span>
              <span className="font-semibold text-ink-900">
                {latestPoint?.remainingKm != null ? `${latestPoint.remainingKm} км` : '—'}
              </span>
              <span className="text-ink-500">ETA</span>
              <span className="font-semibold text-ink-900">
                {latestPoint?.etaMinutes != null ? `~${latestPoint.etaMinutes} мин` : '—'}
              </span>
            </GlassCard>
          )}

          {order.executor && (
            <GlassCard className="flex items-center justify-between">
              <div>
                <p className="text-xs text-ink-300">Исполнитель</p>
                <p className="text-sm font-medium text-ink-900">{order.executor.companyName ?? order.executor.user.fullName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-ink-300">Рейтинг</p>
                <p className="text-sm font-semibold text-ink-900">★ {order.executor.rating.toFixed(1)}</p>
              </div>
            </GlassCard>
          )}

          {order.paymentStatus !== 'paid' && order.status !== 'cancelled' && (
            <GlassCard className="flex flex-col gap-3">
              <p className="text-sm font-medium text-ink-900">Оплата</p>
              <p className="text-sm text-ink-500">
                К оплате: <span className="font-semibold text-ink-900">{Number(order.totalPrice).toLocaleString('ru-RU')} ₽</span>
              </p>
              {!confirmationUrl ? (
                <Button onClick={handlePay} loading={createPayment.isPending} className="w-full">
                  Оплатить онлайн
                </Button>
              ) : (
                <div className="flex flex-col gap-2">
                  <a href={confirmationUrl} target="_blank" rel="noreferrer">
                    <Button variant="secondary" className="w-full">
                      Перейти к оплате (ЮKassa)
                    </Button>
                  </a>
                  <Button onClick={handleMockConfirm} loading={mockConfirm.isPending} variant="ghost" className="w-full">
                    Тестовое подтверждение оплаты (dev)
                  </Button>
                </div>
              )}
            </GlassCard>
          )}

          {['delivered', 'completed'].includes(order.status) && !order.rating && (
            <GlassCard className="flex flex-col gap-3">
              <p className="text-sm font-medium text-ink-900">Оцените исполнителя</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setScore(s)} className={`text-2xl ${s <= score ? 'text-amber-400' : 'text-black/10'}`}>
                    ★
                  </button>
                ))}
              </div>
              <Textarea placeholder="Комментарий (необязательно)" value={comment} onChange={(e) => setComment(e.target.value)} />
              <Button onClick={handleRate} loading={rateOrder.isPending} className="w-full">
                Отправить оценку
              </Button>
            </GlassCard>
          )}

          <div>
            {!complaintOpen ? (
              <button onClick={() => setComplaintOpen(true)} className="text-sm font-medium text-red-500">
                Пожаловаться на заказ
              </button>
            ) : (
              <GlassCard className="flex flex-col gap-3">
                <Textarea placeholder="Опишите проблему" value={complaintText} onChange={(e) => setComplaintText(e.target.value)} />
                <div className="flex gap-2">
                  <Button onClick={handleComplaint} loading={createComplaint.isPending} variant="danger">
                    Отправить жалобу
                  </Button>
                  <Button onClick={() => setComplaintOpen(false)} variant="ghost">
                    Отмена
                  </Button>
                </div>
              </GlassCard>
            )}
          </div>
        </div>

        <GlassPanel className="flex flex-col gap-4 self-start">
          <div>
            <p className="text-sm font-medium text-ink-900">Статус доставки</p>
            <div className="mt-3">
              <StatusTimeline current={order.status} />
            </div>
          </div>
          <div className="flex flex-col gap-1 border-t border-black/5 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-500">Вес</span>
              <span className="text-ink-900">{order.weightKg} кг</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">Расстояние</span>
              <span className="text-ink-900">{order.distanceKm} км</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">Стоимость</span>
              <span className="font-semibold text-ink-900">{Number(order.totalPrice).toLocaleString('ru-RU')} ₽</span>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
