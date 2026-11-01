import { usePendingExecutors, useVerifyExecutor } from '../../features/admin/api';
import { GlassCard } from '../../design-system/GlassPanel';
import { Button } from '../../design-system/Button';
import { Spinner, EmptyState } from '../../design-system/Spinner';

const TYPE_LABEL: Record<string, string> = { individual: 'Физ. лицо', sole_proprietor: 'ИП', legal_entity: 'Юр. лицо' };

export function AdminExecutorVerification() {
  const { data: executors, isLoading } = usePendingExecutors();
  const verify = useVerifyExecutor();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-ink-900">Верификация исполнителей</h1>
      {isLoading && <Spinner />}
      {!isLoading && executors?.length === 0 && <EmptyState title="Нет заявок на верификацию" />}

      <div className="grid gap-4 sm:grid-cols-2">
        {executors?.map((executor: any) => (
          <GlassCard key={executor.id} className="flex flex-col gap-3">
            <div>
              <p className="font-semibold text-ink-900">{executor.companyName ?? executor.user.fullName}</p>
              <p className="text-xs text-ink-300">{TYPE_LABEL[executor.executorType]} · {executor.user.email}</p>
              {executor.inn && <p className="text-xs text-ink-300">ИНН {executor.inn}</p>}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => verify.mutate({ id: executor.id, status: 'approved' })} loading={verify.isPending}>
                Подтвердить
              </Button>
              <Button variant="danger" onClick={() => verify.mutate({ id: executor.id, status: 'rejected' })} loading={verify.isPending}>
                Отклонить
              </Button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
