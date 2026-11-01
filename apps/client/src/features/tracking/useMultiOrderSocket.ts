import { useEffect, useState } from 'react';
import type { GeoPoint } from '@drone/shared';
import { getSocket } from '../../lib/socket';
import { useAuthStore } from '../auth/authStore';

interface TrackingPointDto extends GeoPoint {
  remainingKm?: number;
  etaMinutes?: number;
}

/** Подписывается на несколько комнат заказов сразу и отдаёт последнюю известную позицию по каждому. */
export function useMultiOrderSocket(orderIds: string[]) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [positions, setPositions] = useState<Record<string, TrackingPointDto>>({});
  const idsKey = orderIds.slice().sort().join(',');

  useEffect(() => {
    if (!accessToken || orderIds.length === 0) return;
    const socket = getSocket(accessToken);

    orderIds.forEach((id) => socket.emit('join:order', id));

    const handlers: Record<string, (point: TrackingPointDto) => void> = {};
    orderIds.forEach((id) => {
      const handler = (point: TrackingPointDto) => setPositions((prev) => ({ ...prev, [id]: point }));
      handlers[id] = handler;
    });

    const onLocation = (point: TrackingPointDto & { orderId?: string }) => {
      // Событие приходит внутри комнаты конкретного заказа — все подписчики получают его вместе, поэтому
      // сопоставляем по совпадению координат/времени не требуется: сервер шлёт это в комнату order:{id},
      // а сокет клиента состоит в нескольких комнатах, поэтому дополнительно передаём orderId с сервера.
      if (point.orderId) {
        setPositions((prev) => ({ ...prev, [point.orderId as string]: point }));
      }
    };

    socket.on('order:location', onLocation);

    return () => {
      orderIds.forEach((id) => socket.emit('leave:order', id));
      socket.off('order:location', onLocation);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, idsKey]);

  return positions;
}
