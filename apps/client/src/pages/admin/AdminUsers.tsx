import { useAdminUsers } from '../../features/admin/api';
import { GlassPanel } from '../../design-system/GlassPanel';
import { Spinner } from '../../design-system/Spinner';

const ROLE_LABEL: Record<string, string> = { customer: 'Заказчик', executor: 'Исполнитель', admin: 'Администратор' };

export function AdminUsers() {
  const { data: users, isLoading } = useAdminUsers();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-ink-900">Пользователи</h1>
      {isLoading && <Spinner />}
      {!isLoading && (
        <GlassPanel className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-black/5 text-ink-300">
              <tr>
                <th className="px-5 py-3 font-medium">Имя</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Роль</th>
                <th className="px-5 py-3 font-medium">Верификация</th>
                <th className="px-5 py-3 font-medium">Дронов</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u: any) => (
                <tr key={u.id} className="border-b border-black/5 last:border-0">
                  <td className="px-5 py-3 font-medium text-ink-900">{u.fullName}</td>
                  <td className="px-5 py-3 text-ink-500">{u.email}</td>
                  <td className="px-5 py-3 text-ink-500">{ROLE_LABEL[u.role]}</td>
                  <td className="px-5 py-3 text-ink-500">{u.executorProfile?.verificationStatus ?? '—'}</td>
                  <td className="px-5 py-3 text-ink-500">{u.executorProfile?.drones?.length ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassPanel>
      )}
    </div>
  );
}
