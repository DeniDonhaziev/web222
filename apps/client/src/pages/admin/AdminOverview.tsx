import { useAdminSummary } from '../../features/admin/api';
import { GlassCard } from '../../design-system/GlassPanel';
import { Spinner } from '../../design-system/Spinner';

export function AdminOverview() {
  const { data, isLoading } = useAdminSummary();

  if (isLoading) return <Spinner />;

  const cards = [
    { label: 'Всего заказов', value: data?.totalOrders ?? 0 },
    { label: 'Завершено', value: data?.completedOrders ?? 0 },
    { label: 'Комиссия платформы', value: `${Number(data?.totalCommission ?? 0).toLocaleString('ru-RU')} ₽` },
    { label: 'Активных исполнителей', value: data?.activeExecutors ?? 0 },
    { label: 'Ожидают верификации', value: data?.pendingVerifications ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-ink-900">Обзор платформы</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <GlassCard key={c.label}>
            <p className="text-xs text-ink-300">{c.label}</p>
            <p className="mt-1 text-2xl font-semibold text-ink-900">{c.value}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
