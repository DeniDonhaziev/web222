import { ORDER_STATUS_LABELS_RU, type OrderStatus } from '@drone/shared';

const STATUS_STYLES: Record<OrderStatus, string> = {
  created: 'bg-ink-300/15 text-ink-500',
  awaiting_executor: 'bg-amber-100 text-amber-700',
  executor_found: 'bg-amber-100 text-amber-700',
  accepted: 'bg-brand-100 text-brand-700',
  preparing: 'bg-brand-100 text-brand-700',
  departed: 'bg-sky-100 text-sky-700',
  in_transit: 'bg-sky-100 text-sky-700',
  arriving: 'bg-violet-100 text-violet-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-600',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}>
      {ORDER_STATUS_LABELS_RU[status]}
    </span>
  );
}
