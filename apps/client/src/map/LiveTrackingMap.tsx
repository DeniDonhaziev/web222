import { Map, Placemark, Polyline } from '@pbe/react-yandex-maps';
import type { GeoPoint } from '@drone/shared';
import { hasMapsApiKey } from './MapProvider';

interface LiveTrackingMapProps {
  pickup: GeoPoint;
  dropoff: GeoPoint;
  dronePosition?: GeoPoint;
  trail: GeoPoint[];
}

export function LiveTrackingMap({ pickup, dropoff, dronePosition, trail }: LiveTrackingMapProps) {
  if (!hasMapsApiKey()) {
    return (
      <div className="flex h-[360px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-black/15 bg-white/50 text-center text-sm text-ink-500">
        <p className="font-medium text-ink-700">Карта недоступна</p>
        <p className="max-w-xs">Добавьте VITE_YANDEX_MAPS_API_KEY, чтобы видеть маршрут и позицию дрона на карте.</p>
        {dronePosition && (
          <p className="text-xs text-ink-300">
            Текущие координаты дрона: {dronePosition.lat.toFixed(5)}, {dronePosition.lng.toFixed(5)}
          </p>
        )}
      </div>
    );
  }

  const points: GeoPoint[] = [pickup, dropoff, ...(dronePosition ? [dronePosition] : [])];
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const latSpan = Math.max(...lats) - Math.min(...lats);
  const lngSpan = Math.max(...lngs) - Math.min(...lngs);
  // Отступ по краям, чтобы метки не упирались в границу карты; минимум — для доставок внутри одного города.
  const latPad = Math.max(latSpan * 0.15, 0.01);
  const lngPad = Math.max(lngSpan * 0.15, 0.01);
  const bounds: [[number, number], [number, number]] = [
    [Math.min(...lats) - latPad, Math.min(...lngs) - lngPad],
    [Math.max(...lats) + latPad, Math.max(...lngs) + lngPad],
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-black/10">
      <Map defaultState={{ bounds }} state={{ bounds }} width="100%" height="360px">
        <Placemark geometry={[pickup.lat, pickup.lng]} options={{ preset: 'islands#greenDotIcon' }} properties={{ hintContent: 'Отправление' }} />
        <Placemark geometry={[dropoff.lat, dropoff.lng]} options={{ preset: 'islands#redDotIcon' }} properties={{ hintContent: 'Получение' }} />
        <Polyline
          geometry={[
            [pickup.lat, pickup.lng],
            [dropoff.lat, dropoff.lng],
          ]}
          options={{ strokeColor: '#8a92a6', strokeWidth: 2, strokeStyle: 'dash', strokeOpacity: 0.6 }}
        />
        {trail.length > 1 && (
          <Polyline
            geometry={trail.map((p) => [p.lat, p.lng])}
            options={{ strokeColor: '#5b4bd6', strokeWidth: 3, strokeOpacity: 0.8 }}
          />
        )}
        {dronePosition && (
          <Placemark
            geometry={[dronePosition.lat, dronePosition.lng]}
            options={{ preset: 'islands#darkBlueAircraftIcon' }}
            properties={{ hintContent: 'Дрон' }}
          />
        )}
      </Map>
    </div>
  );
}
