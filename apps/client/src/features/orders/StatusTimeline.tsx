import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS_RU, type OrderStatus } from '@drone/shared';

export function StatusTimeline({ current }: { current: OrderStatus }) {
  if (current === 'cancelled') {
    return <p className="text-sm font-medium text-red-500">Заказ отменён</p>;
  }
  const currentIdx = ORDER_STATUS_FLOW.indexOf(current);

  return (
    <ol className="flex flex-col gap-0">
      {ORDER_STATUS_FLOW.map((status, i) => {
        const done = i <= currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <li key={status} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  done ? 'bg-brand-600 text-white' : 'bg-black/10 text-ink-300'
                }`}
              >
                {done ? '✓' : ''}
              </span>
              {i < ORDER_STATUS_FLOW.length - 1 && (
                <span className={`h-6 w-0.5 ${i < currentIdx ? 'bg-brand-600' : 'bg-black/10'}`} />
              )}
            </div>
            <span className={`pb-5 text-sm ${isCurrent ? 'font-semibold text-ink-900' : done ? 'text-ink-700' : 'text-ink-300'}`}>
              {ORDER_STATUS_LABELS_RU[status]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
