import type { ComponentType } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../features/auth/authStore';
import {
  GridIcon,
  UsersIcon,
  ShieldCheckIcon,
  ListIcon,
  BoltIcon,
  LogoutIcon,
  PlusCircleIcon,
  PackageIcon,
  DroneIcon,
  WalletIcon,
  ChevronDownIcon,
} from '../design-system/icons';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  end?: boolean;
}

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  customer: [
    { to: '/customer', label: 'Мои заказы', icon: PackageIcon, end: true },
    { to: '/customer/new-order', label: 'Новый заказ', icon: PlusCircleIcon },
  ],
  executor: [
    { to: '/executor', label: 'Заявки', icon: GridIcon, end: true },
    { to: '/executor/drones', label: 'Парк дронов', icon: DroneIcon },
    { to: '/executor/earnings', label: 'Заработок', icon: WalletIcon },
  ],
  admin: [
    { to: '/admin', label: 'Обзор', icon: GridIcon, end: true },
    { to: '/admin/users', label: 'Пользователи', icon: UsersIcon },
    { to: '/admin/executors', label: 'Верификация', icon: ShieldCheckIcon },
    { to: '/admin/orders', label: 'Заказы', icon: ListIcon },
    { to: '/admin/live', label: 'Live-карта', icon: BoltIcon },
  ],
};

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

export function AppShell() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-20 border-b border-black/5 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white">✈</span>
              SkyDrop
            </button>
            <button
              onClick={() => navigate('/login')}
              className="rounded-full bg-brand-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-brand-700"
            >
              Войти
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">
          <Outlet />
        </main>
      </div>
    );
  }

  const navItems = NAV_BY_ROLE[user.role] ?? [];

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f4f7]">
      <aside className="flex w-16 shrink-0 flex-col items-center gap-1.5 border-r border-black/5 bg-white py-4">
        <button
          onClick={() => navigate('/')}
          className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white"
        >
          ✈
        </button>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={item.label}
            className={({ isActive }) =>
              `flex h-10 w-10 items-center justify-center rounded-xl transition ${
                isActive ? 'bg-brand-600 text-white shadow-soft' : 'text-ink-500 hover:bg-black/5 hover:text-ink-900'
              }`
            }
          >
            <item.icon />
          </NavLink>
        ))}
        <div className="flex-1" />
        <button
          title="Выйти"
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-500 transition hover:bg-black/5 hover:text-red-500"
        >
          <LogoutIcon />
        </button>
      </aside>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-6xl items-center justify-end px-6 pt-5">
          <button className="flex items-center gap-2 rounded-full border border-black/5 bg-white px-2.5 py-1.5 shadow-soft transition hover:bg-black/[0.02]">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
              {initials(user.fullName)}
            </span>
            <span className="text-sm font-medium text-ink-900">{user.fullName}</span>
            <ChevronDownIcon className="h-4 w-4 text-ink-300" />
          </button>
        </div>
        <main className="mx-auto max-w-6xl px-6 pb-10 pt-3">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
