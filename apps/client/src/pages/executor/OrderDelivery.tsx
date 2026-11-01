import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS_RU, type OrderStatus } from '@drone/shared';
import { useOrder, useSendLocation, useUpdateOrderStatus } from '../../features/orders/api';
import { useOrderSocket } from '../../features/tracking/useOrderSocket';
import { GlassPanel, GlassCard } from '../../design-system/GlassPanel';
import { StatusBadge } from '../../design-system/StatusBadge';
import { StatusTimeline } from '../../features/orders/StatusTimeline';
import { Spinner } from '../../design-system/Spinner';
import { Button } from '../../design-system/Button';
import { LiveTrackingMap } from '../../map/LiveTrackingMap';

const SIMULATION_ELIGIBLE = new Set(['accepted', 'preparing', 'departed', 'in_transit', 'arriving']);

export function OrderDelivery() {
  const { id } = useParams();
  const { data, isLoading } = useOrder(id);
  const { latestPoint, trail } = useOrderSocket(id);
  const updateStatus = useUpdateOrderStatus();
  const sendLocation = useSendLocation();

  const [simulating, setSimulating] = useState(false);
  const progressRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (isLoading) return <Spinner />;
  if (!data?.order) return <p className="text-ink-500">Заказ не найден</p>;

  const { order, trackingPoints } = data;
  const combinedTrail = [...trackingPoints.map((p: any) => ({ lat: p.lat, lng: p.lng })), ...trail];
  const dronePosition = latestPoint ?? combinedTrail[combinedTrail.length - 1];

  const currentIdx = ORDER_STATUS_FLOW.indexOf(order.status as OrderStatus);
  const nextStatus = order.status === 'cancelled' ? null : ORDER_STATUS_FLOW[currentIdx + 1];

  function toggleSimulation() {
    if (simulating) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setSimulating(false);
      return;
    }
    setSimulating(true);
    intervalRef.current = setInterval(() => {
      progressRef.current = Math.min(progressRef.current + 0.05, 1);
      const t = progressRef.current;
      const lat = order.pickupLat + (order.dropoffLat - order.pickupLat) * t;
      const lng = order.pickupLng + (order.dropoffLng - order.pickupLng) * t;
      sendLocation.mutate({ orderId: order.id, lat, lng, speedKmh: order.drone?.speedKmh ?? 40 });
      if (t >= 1 && intervalRef.current) {
        clearInterval(intervalRef.current);
        setSimulating(false);
      }
    }, 2000);
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

          {SIMULATION_ELIGIBLE.has(order.status) && (
            <GlassCard className="flex flex-col gap-2">
              <p className="text-sm font-medium text-ink-900">GPS-симулятор (демо вместо мобильного приложения)</p>
              <p className="text-xs text-ink-500">Имитирует передачу координат дрона от точки отправления к точке получения.</p>
              <Button onClick={toggleSimulation} variant={simulating ? 'danger' : 'secondary'}>
                {simulating ? 'Остановить симуляцию' : 'Начать симуляцию GPS'}
              </Button>
            </GlassCard>
          )}

          <GlassCard className="flex flex-col gap-3">
            <p className="text-sm font-medium text-ink-900">Управление доставкой</p>
            <div className="flex flex-wrap gap-2">
              {nextStatus && (
                <Button
                  onClick={() => updateStatus.mutate({ orderId: order.id, status: nextStatus })}
                  loading={updateStatus.isPending}
                >
                  Отметить: {ORDER_STATUS_LABELS_RU[nextStatus]}
                </Button>
              )}
              {!['delivered', 'completed', 'cancelled'].includes(order.status) && (
                <Button
                  variant="danger"
                  onClick={() => updateStatus.mutate({ orderId: order.id, status: 'cancelled', cancelReason: 'Отменено исполнителем' })}
                >
                  Отменить заказ
                </Button>
              )}
            </div>
          </GlassCard>
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
              <span className="text-ink-500">Заказчик</span>
              <span className="text-ink-900">{order.customer.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">Вес</span>
              <span className="text-ink-900">{order.weightKg} кг</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">Ваша выплата</span>
              <span className="font-semibold text-ink-900">{Number(order.executorPayout).toLocaleString('ru-RU')} ₽</span>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
