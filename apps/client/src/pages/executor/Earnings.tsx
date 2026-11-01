import { useMyOrders } from '../../features/orders/api';
import { GlassCard } from '../../design-system/GlassPanel';
import { StatusBadge } from '../../design-system/StatusBadge';
import { Spinner, EmptyState } from '../../design-system/Spinner';

export function Earnings() {
  const { data: orders, isLoading } = useMyOrders();

  const completed = (orders ?? []).filter((o: any) => o.status === 'completed');
  const totalEarned = completed
    .filter((o: any) => o.paymentStatus === 'paid')
    .reduce((sum: number, o: any) => sum + Number(o.executorPayout), 0);
  const pending = (orders ?? [])
    .filter((o: any) => o.paymentStatus !== 'paid' && !['cancelled'].includes(o.status))
    .reduce((sum: number, o: any) => sum + Number(o.executorPayout), 0);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-ink-900">Заработок</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <GlassCard>
          <p className="text-xs text-ink-300">Выплачено</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900">{totalEarned.toLocaleString('ru-RU')} ₽</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-ink-300">Ожидает оплаты заказчиком</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900">{pending.toLocaleString('ru-RU')} ₽</p>
        </GlassCard>
      </div>

      {isLoading && <Spinner />}
      {!isLoading && orders?.length === 0 && <EmptyState title="Пока нет доставок" />}

      <div className="flex flex-col gap-3">
        {orders?.map((order: any) => (
          <GlassCard key={order.id} className="flex items-center justify-between">
            <div>
              <p className="text-xs text-ink-300">№{order.id.slice(-8)}</p>
              <p className="text-sm font-medium text-ink-900">{order.dropoffAddress}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-ink-900">{Number(order.executorPayout).toLocaleString('ru-RU')} ₽</span>
              <StatusBadge status={order.status} />
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
