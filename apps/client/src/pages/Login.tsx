import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GlassPanel } from '../design-system/GlassPanel';
import { Input } from '../design-system/Input';
import { Button } from '../design-system/Button';
import { useLogin } from '../features/auth/api';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { user } = await login.mutateAsync({ email, password });
    navigate(user.role === 'admin' ? '/admin' : user.role === 'executor' ? '/executor' : '/customer');
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 pt-12">
      <GlassPanel className="flex flex-col gap-5">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-ink-900">Вход в SkyDrop</h1>
          <p className="mt-1 text-sm text-ink-500">Войдите, чтобы управлять заказами</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <Input
            label="Пароль"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          {login.isError && <p className="text-sm text-red-500">Неверный email или пароль</p>}
          <Button type="submit" loading={login.isPending} className="mt-1 w-full">
            Войти
          </Button>
        </form>

        <p className="text-center text-sm text-ink-500">
          Нет аккаунта?{' '}
          <Link to="/register" className="font-medium text-brand-600">
            Зарегистрироваться
          </Link>
        </p>
        <p className="text-center text-xs text-ink-300">
          Демо-доступ: customer@drone.market / executor@drone.market / admin@drone.market, пароль password123
        </p>
      </GlassPanel>
    </div>
  );
}
