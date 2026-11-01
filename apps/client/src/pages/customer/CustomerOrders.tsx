import { Link } from 'react-router-dom';
import { useMyOrders } from '../../features/orders/api';
import { GlassCard } from '../../design-system/GlassPanel';
import { StatusBadge } from '../../design-system/StatusBadge';
import { Spinner, EmptyState } from '../../design-system/Spinner';
import { Button } from '../../design-system/Button';

export function CustomerOrders() {
  const { data: orders, isLoading } = useMyOrders();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink-900">Мои заказы</h1>
        <Link to="/customer/new-order">
          <Button>Новый заказ</Button>
        </Link>
      </div>

      {isLoading && <Spinner />}
      {!isLoading && orders?.length === 0 && (
        <EmptyState title="Пока нет заказов" description="Оформите первую доставку дроном — это займёт пару минут." />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {orders?.map((order: any) => (
          <Link key={order.id} to={`/customer/orders/${order.id}`}>
            <GlassCard className="flex flex-col gap-3 transition hover:-translate-y-0.5 hover:shadow-glass">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-ink-300">№{order.id.slice(-8)}</p>
                  <p className="mt-0.5 text-sm font-medium text-ink-900">{order.pickupAddress}</p>
                  <p className="text-xs text-ink-300">→ {order.dropoffAddress}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div className="flex items-center justify-between border-t border-black/5 pt-3 text-sm">
                <span className="text-ink-500">{order.weightKg} кг</span>
                <span className="font-semibold text-ink-900">{Number(order.totalPrice).toLocaleString('ru-RU')} ₽</span>
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
