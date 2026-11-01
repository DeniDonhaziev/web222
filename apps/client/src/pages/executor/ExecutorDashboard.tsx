import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOpenOrders, useAcceptOrder, useMyOrders } from '../../features/orders/api';
import { useDrones } from '../../features/drones/api';
import { GlassCard } from '../../design-system/GlassPanel';
import { Select } from '../../design-system/Input';
import { Button } from '../../design-system/Button';
import { StatusBadge } from '../../design-system/StatusBadge';
import { Spinner, EmptyState } from '../../design-system/Spinner';

function AcceptOrderRow({ order, drones }: { order: any; drones: any[] }) {
  const eligible = drones.filter((d: any) => d.status === 'idle' && d.payloadCapacityKg >= order.weightKg && d.maxRangeKm >= order.distanceKm);
  const [droneId, setDroneId] = useState(eligible[0]?.id ?? '');
  const acceptOrder = useAcceptOrder();

  return (
    <GlassCard className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-ink-300">№{order.id.slice(-8)} · {order.urgency === 'urgent' ? 'Срочно' : order.urgency === 'express' ? 'Экспресс' : 'Стандарт'}</p>
          <p className="text-sm font-medium text-ink-900">{order.pickupAddress}</p>
          <p className="text-xs text-ink-300">→ {order.dropoffAddress}</p>
        </div>
        <span className="text-sm font-semibold text-ink-900">{Number(order.totalPrice).toLocaleString('ru-RU')} ₽</span>
      </div>
      <div className="flex items-center justify-between text-xs text-ink-500">
        <span>{order.weightKg} кг</span>
        <span>{order.distanceKm} км</span>
        <span>Выплата: {Number(order.executorPayout).toLocaleString('ru-RU')} ₽</span>
      </div>

      {eligible.length === 0 ? (
        <p className="text-xs text-red-500">Нет свободного дрона с подходящей грузоподъёмностью/дальностью</p>
      ) : (
        <div className="flex gap-2">
          <Select value={droneId} onChange={(e) => setDroneId(e.target.value)} className="flex-1">
            {eligible.map((d: any) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.payloadCapacityKg} кг, {d.maxRangeKm} км)
              </option>
            ))}
          </Select>
          <Button
            onClick={() => acceptOrder.mutate({ orderId: order.id, droneId })}
            loading={acceptOrder.isPending}
          >
            Принять
          </Button>
        </div>
      )}
    </GlassCard>
  );
}

export function ExecutorDashboard() {
  const { data: openOrders, isLoading: loadingOpen } = useOpenOrders();
  const { data: myOrders, isLoading: loadingMine } = useMyOrders();
  const { data: drones } = useDrones();

  const activeOrders = (myOrders ?? []).filter((o: any) => !['completed', 'cancelled'].includes(o.status));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Новые заявки</h1>
        <p className="text-sm text-ink-500">Заказы, подходящие под парк ваших дронов</p>
      </div>

      {loadingOpen && <Spinner />}
      {!loadingOpen && (openOrders?.length ?? 0) === 0 && (
        <EmptyState title="Пока нет доступных заявок" description="Как только появится подходящий заказ, он отобразится здесь." />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {openOrders?.map((order: any) => (
          <AcceptOrderRow key={order.id} order={order} drones={drones ?? []} />
        ))}
      </div>

      <div>
        <h2 className="text-xl font-semibold text-ink-900">Активные доставки</h2>
        {loadingMine && <Spinner />}
        {!loadingMine && activeOrders.length === 0 && <p className="mt-2 text-sm text-ink-500">Нет активных доставок</p>}
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {activeOrders.map((order: any) => (
            <Link key={order.id} to={`/executor/orders/${order.id}`}>
              <GlassCard className="flex items-center justify-between transition hover:-translate-y-0.5 hover:shadow-glass">
                <div>
                  <p className="text-xs text-ink-300">№{order.id.slice(-8)}</p>
                  <p className="text-sm font-medium text-ink-900">{order.dropoffAddress}</p>
                </div>
                <StatusBadge status={order.status} />
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
