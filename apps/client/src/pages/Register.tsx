import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import type { ExecutorType, UserRole } from '@drone/shared';
import { GlassPanel } from '../design-system/GlassPanel';
import { Input, Select } from '../design-system/Input';
import { Button } from '../design-system/Button';
import { useRegister } from '../features/auth/api';

export function Register() {
  const [params] = useSearchParams();
  const initialRole = (params.get('role') as UserRole) === 'executor' ? 'executor' : 'customer';

  const [role, setRole] = useState<UserRole>(initialRole);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [executorType, setExecutorType] = useState<ExecutorType>('individual');
  const [companyName, setCompanyName] = useState('');
  const [inn, setInn] = useState('');

  const register = useRegister();
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { user } = await register.mutateAsync({
      email,
      password,
      fullName,
      phone: phone || undefined,
      role,
      ...(role === 'executor' ? { executorType, companyName: companyName || undefined, inn: inn || undefined } : {}),
    });
    navigate(user.role === 'executor' ? '/executor' : '/customer');
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 pb-16 pt-12">
      <GlassPanel className="flex flex-col gap-5">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-ink-900">Регистрация</h1>
          <p className="mt-1 text-sm text-ink-500">Выберите роль и заполните данные</p>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-full bg-black/5 p-1">
          {(['customer', 'executor'] as UserRole[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`rounded-full py-2 text-sm font-medium transition ${
                role === r ? 'bg-white shadow-soft text-ink-900' : 'text-ink-500'
              }`}
            >
              {r === 'customer' ? 'Заказчик' : 'Исполнитель'}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Input label="Имя / название" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Телефон" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 900 000-00-00" />
          <Input
            label="Пароль"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint="Минимум 8 символов"
          />

          {role === 'executor' && (
            <>
              <Select label="Тип исполнителя" value={executorType} onChange={(e) => setExecutorType(e.target.value as ExecutorType)}>
                <option value="individual">Физическое лицо</option>
                <option value="sole_proprietor">ИП</option>
                <option value="legal_entity">Юридическое лицо</option>
              </Select>
              {executorType !== 'individual' && (
                <>
                  <Input label="Название компании" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                  <Input label="ИНН" value={inn} onChange={(e) => setInn(e.target.value)} />
                </>
              )}
            </>
          )}

          {register.isError && <p className="text-sm text-red-500">Не удалось зарегистрироваться. Проверьте данные.</p>}

          <Button type="submit" loading={register.isPending} className="mt-1 w-full">
            Создать аккаунт
          </Button>
        </form>

        <p className="text-center text-sm text-ink-500">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="font-medium text-brand-600">
            Войти
          </Link>
        </p>
      </GlassPanel>
    </div>
  );
}
