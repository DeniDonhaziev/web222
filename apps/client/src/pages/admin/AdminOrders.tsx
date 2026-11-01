import { useAdminOrders } from '../../features/admin/api';
import { GlassPanel } from '../../design-system/GlassPanel';
import { StatusBadge } from '../../design-system/StatusBadge';
import { Spinner } from '../../design-system/Spinner';

export function AdminOrders() {
  const { data: orders, isLoading } = useAdminOrders();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-ink-900">Все заказы</h1>
      {isLoading && <Spinner />}
      {!isLoading && (
        <GlassPanel className="overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-black/5 text-ink-300">
              <tr>
                <th className="px-5 py-3 font-medium">№</th>
                <th className="px-5 py-3 font-medium">Заказчик</th>
                <th className="px-5 py-3 font-medium">Исполнитель</th>
                <th className="px-5 py-3 font-medium">Статус</th>
                <th className="px-5 py-3 font-medium">Стоимость</th>
                <th className="px-5 py-3 font-medium">Комиссия</th>
              </tr>
            </thead>
            <tbody>
              {orders?.map((o: any) => (
                <tr key={o.id} className="border-b border-black/5 last:border-0">
                  <td className="px-5 py-3 text-ink-500">{o.id.slice(-8)}</td>
                  <td className="px-5 py-3 text-ink-900">{o.customer.fullName}</td>
                  <td className="px-5 py-3 text-ink-500">{o.executor?.user.fullName ?? '—'}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-5 py-3 text-ink-900">{Number(o.totalPrice).toLocaleString('ru-RU')} ₽</td>
                  <td className="px-5 py-3 text-ink-500">{Number(o.commissionAmount).toLocaleString('ru-RU')} ₽</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassPanel>
      )}
    </div>
  );
}
