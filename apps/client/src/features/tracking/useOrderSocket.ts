import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { GeoPoint } from '@drone/shared';
import { getSocket } from '../../lib/socket';
import { useAuthStore } from '../auth/authStore';

interface TrackingPointDto extends GeoPoint {
  remainingKm?: number;
  etaMinutes?: number;
  recordedAt?: string;
}

export function useOrderSocket(orderId: string | undefined) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const [latestPoint, setLatestPoint] = useState<TrackingPointDto | null>(null);
  const [trail, setTrail] = useState<GeoPoint[]>([]);

  useEffect(() => {
    if (!orderId || !accessToken) return;
    const socket = getSocket(accessToken);

    socket.emit('join:order', orderId);

    const onLocation = (point: TrackingPointDto) => {
      setLatestPoint(point);
      setTrail((prev) => [...prev, { lat: point.lat, lng: point.lng }].slice(-200));
    };
    const onStatusUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    };

    socket.on('order:location', onLocation);
    socket.on('order:update', onStatusUpdate);

    return () => {
      socket.emit('leave:order', orderId);
      socket.off('order:location', onLocation);
      socket.off('order:update', onStatusUpdate);
    };
  }, [orderId, accessToken, queryClient]);

  return { latestPoint, trail };
}
