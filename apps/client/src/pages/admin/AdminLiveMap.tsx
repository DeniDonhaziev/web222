import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Map, Placemark } from '@pbe/react-yandex-maps';
import type { GeoPoint } from '@drone/shared';
import { ORDER_STATUS_LABELS_RU } from '@drone/shared';
import { useLiveOrders } from '../../features/admin/api';
import { useMultiOrderSocket } from '../../features/tracking/useMultiOrderSocket';
import { useAuthStore } from '../../features/auth/authStore';
import { hasMapsApiKey } from '../../map/MapProvider';
import {
  GridIcon,
  UsersIcon,
  ShieldCheckIcon,
  ListIcon,
  BoltIcon,
  LogoutIcon,
  PhoneIcon,
  MessageIcon,
  XIcon,
  SearchIcon,
  UserIcon,
  RouteIcon,
} from '../../design-system/icons';

const NAV_ITEMS = [
  { to: '/admin', icon: GridIcon, label: 'Обзор' },
  { to: '/admin/users', icon: UsersIcon, label: 'Пользователи' },
  { to: '/admin/executors', icon: ShieldCheckIcon, label: 'Верификация' },
  { to: '/admin/orders', icon: ListIcon, label: 'Заказы' },
];

const FILTERS = [
  { key: 'all', label: 'Все' },
  { key: 'transit', label: 'В пути' },
  { key: 'waiting', label: 'Ожидают' },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

export function AdminLiveMap() {
  const { data: orders } = useLiveOrders();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const orderIds = useMemo(() => (orders ?? []).map((o: any) => o.id), [orders]);
  const livePositions = useMultiOrderSocket(orderIds);

  const enriched = useMemo(
    () =>
      (orders ?? []).map((order: any, index: number) => {
        const live = livePositions[order.id];
        const position: GeoPoint = live ?? order.latestPoint ?? { lat: order.pickupLat, lng: order.pickupLng };
        return { ...order, position, badge: index + 1 };
      }),
    [orders, livePositions],
  );

  const filtered = enriched.filter((o: any) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'transit' && ['departed', 'in_transit', 'arriving'].includes(o.status)) ||
      (filter === 'waiting' && ['accepted', 'preparing'].includes(o.status));
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      o.id.slice(-8).toLowerCase().includes(q) ||
      o.executor?.user.fullName.toLowerCase().includes(q) ||
      o.pickupAddress.toLowerCase().includes(q) ||
      o.dropoffAddress.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const selected = enriched.find((o: any) => o.id === selectedId) ?? null;

  // Выбор заказа "трекает" его — сужаем границы карты до одного маршрута вместо всех активных доставок.
  const focusSet = selected ? [selected] : filtered;

  const bounds = useMemo((): [[number, number], [number, number]] | undefined => {
    if (focusSet.length === 0) return undefined;
    const lats = focusSet.flatMap((o: any) => [o.position.lat, o.pickupLat, o.dropoffLat]);
    const lngs = focusSet.flatMap((o: any) => [o.position.lng, o.pickupLng, o.dropoffLng]);
    const latPad = Math.max((Math.max(...lats) - Math.min(...lats)) * 0.15, 0.02);
    const lngPad = Math.max((Math.max(...lngs) - Math.min(...lngs)) * 0.15, 0.02);
    return [
      [Math.min(...lats) - latPad, Math.min(...lngs) - lngPad],
      [Math.max(...lats) + latPad, Math.max(...lngs) + lngPad],
    ];
  }, [focusSet]);

  return (
    <div className="fixed inset-0 flex bg-[#f5f6fa]">
      <aside className="flex w-16 shrink-0 flex-col items-center gap-2 border-r border-black/5 bg-white py-4">
        <Link to="/" className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white">
          ✈
        </Link>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            title={item.label}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-500 transition hover:bg-black/5 hover:text-ink-900"
          >
            <item.icon />
          </Link>
        ))}
        <Link
          to="/admin/live"
          title="Live-карта"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-soft"
        >
          <BoltIcon />
        </Link>
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

      <div className="relative flex-1 overflow-hidden">
        {hasMapsApiKey() ? (
          <Map defaultState={{ center: [55.75, 37.61], zoom: 5 }} state={bounds ? { bounds } : undefined} width="100%" height="100%">
            {filtered.map((order: any) => (
              <Placemark
                key={order.id}
                geometry={[order.position.lat, order.position.lng]}
                properties={{ iconContent: `№${order.badge}` }}
                options={{
                  preset: order.id === selectedId ? 'islands#blueStretchyIcon' : 'islands#blackStretchyIcon',
                }}
                onClick={() => setSelectedId(order.id)}
              />
            ))}
          </Map>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-ink-500">
            <p className="font-medium text-ink-700">Карта недоступна</p>
            <p className="max-w-xs">Добавьте VITE_YANDEX_MAPS_API_KEY, чтобы видеть live-карту доставок.</p>
          </div>
        )}

        <div className="pointer-events-none absolute right-5 top-5 flex items-center gap-2 rounded-full bg-white/90 px-2.5 py-1.5 shadow-soft">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
            {user ? initials(user.fullName) : '—'}
          </span>
          <span className="text-sm font-medium text-ink-900">{user?.fullName}</span>
        </div>

        {selected && (
          <span className="absolute left-0 top-52 z-10 rounded-r-full bg-ink-900 py-2 pl-4 pr-4 text-xs font-semibold uppercase tracking-wide text-white shadow-glass-lg">
            Track
          </span>
        )}

        {selected && (
          <div className="absolute left-5 top-5 w-72 rounded-2xl border border-black/5 bg-white p-4 shadow-glass-lg">
            <button onClick={() => setSelectedId(null)} className="absolute right-3 top-3 text-ink-300 hover:text-ink-700">
              <XIcon width={16} height={16} />
            </button>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 ring-2 ring-white shadow-soft">
                {initials(selected.executor?.user.fullName ?? '?')}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900">{selected.executor?.user.fullName ?? 'Не назначен'}</p>
                <p className="text-xs font-medium text-amber-500">★ {selected.executor?.rating?.toFixed(1) ?? '—'}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-ink-300">№{selected.id.slice(-8)} · {ORDER_STATUS_LABELS_RU[selected.status as keyof typeof ORDER_STATUS_LABELS_RU]}</p>
            <p className="mt-1 text-xs text-ink-500">
              {selected.pickupAddress} → {selected.dropoffAddress}
            </p>
            <div className="mt-3 flex gap-2">
              <a
                href={selected.executor?.user.phone ? `tel:${selected.executor.user.phone}` : undefined}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-xs font-medium text-white ${
                  selected.executor?.user.phone ? 'bg-success-500 hover:bg-success-600' : 'cursor-not-allowed bg-black/10'
                }`}
              >
                <PhoneIcon width={14} height={14} /> Позвонить
              </a>
              <Link
                to={`/admin/orders`}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-success-500 py-2 text-xs font-medium text-white hover:bg-success-600"
              >
                <MessageIcon width={14} height={14} /> Заказ
              </Link>
            </div>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-black/5 bg-white p-4 shadow-glass-lg">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1 rounded-full bg-black/5 p-1">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                    filter === f.key ? 'bg-brand-600 text-white shadow-soft' : 'text-ink-500'
                  }`}
                >
                  {f.label}
                </button>
              ))}
              <span className="self-center px-2 text-xs text-ink-300">{filtered.length} активных</span>
            </div>
            <div className="relative w-64 max-w-full">
              <SearchIcon width={16} height={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по заказу или исполнителю"
                className="w-full rounded-full border border-black/10 bg-white py-1.5 pl-9 pr-3 text-xs outline-none focus:border-brand-400"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-300">Нет активных доставок по выбранным условиям</p>
          ) : (
            <div className="flex divide-x divide-black/5 overflow-x-auto">
              {filtered.map((order: any) => {
                const inTransit = ['departed', 'in_transit', 'arriving'].includes(order.status);
                const statusColor = inTransit ? 'text-success-600' : 'text-warning-600';
                const statusLabel = ORDER_STATUS_LABELS_RU[order.status as keyof typeof ORDER_STATUS_LABELS_RU];
                return (
                  <button
                    key={order.id}
                    onClick={() => setSelectedId(order.id)}
                    className={`flex w-56 shrink-0 flex-col gap-2.5 px-4 py-1.5 text-left transition first:pl-1 ${
                      order.id === selectedId ? 'bg-brand-50' : 'hover:bg-black/[0.02]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-900 text-[10px] font-bold text-white">
                        {order.badge}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-ink-900">№{order.id.slice(-8)}</p>
                        <p className={`text-[10px] font-semibold uppercase tracking-wide ${statusColor}`}>{statusLabel}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-[3px] bg-brand-500" />
                        <span className="truncate text-[11px] text-ink-500">{order.pickupAddress}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-[3px] bg-red-500" />
                        <span className="truncate text-[11px] text-ink-500">{order.dropoffAddress}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-ink-500">
                      <UserIcon width={13} height={13} className="shrink-0 text-ink-300" />
                      <span className="truncate">{order.executor?.user.fullName ?? 'Не назначен'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-ink-300">
                      <RouteIcon width={13} height={13} className="shrink-0" />
                      <span>{order.distanceKm} км</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
