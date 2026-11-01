import { useCallback, useState } from 'react';
import { Map, Placemark, SearchControl } from '@pbe/react-yandex-maps';
import type { GeoPoint } from '@drone/shared';
import { hasMapsApiKey } from './MapProvider';

declare global {
  interface Window {
    ymaps?: any;
  }
}

interface AddressPickerProps {
  label: string;
  value: { address: string; point: GeoPoint } | null;
  onChange: (value: { address: string; point: GeoPoint }) => void;
  defaultCenter?: GeoPoint;
}

const MOSCOW: GeoPoint = { lat: 55.751244, lng: 37.618423 };

export function AddressPicker({ label, value, onChange, defaultCenter = MOSCOW }: AddressPickerProps) {
  const [center] = useState<[number, number]>([value?.point.lat ?? defaultCenter.lat, value?.point.lng ?? defaultCenter.lng]);

  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      try {
        const res = await window.ymaps?.geocode([lat, lng]);
        const firstGeoObject = res?.geoObjects?.get(0);
        const address = firstGeoObject?.getAddressLine?.() ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        onChange({ address, point: { lat, lng } });
      } catch {
        onChange({ address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, point: { lat, lng } });
      }
    },
    [onChange],
  );

  const handleMapClick = useCallback(
    (e: any) => {
      const coords = e.get('coords') as [number, number];
      reverseGeocode(coords[0], coords[1]);
    },
    [reverseGeocode],
  );

  const handleSearchResult = useCallback(
    (e: any) => {
      const index = e.get('index');
      const results = e.originalEvent?.target?.getResultsArray?.();
      const geoObject = results?.[index];
      const coords = geoObject?.geometry?.getCoordinates?.();
      if (coords) {
        const address = geoObject?.getAddressLine?.() ?? '';
        onChange({ address, point: { lat: coords[0], lng: coords[1] } });
      }
    },
    [onChange],
  );

  if (!hasMapsApiKey()) {
    return (
      <div className="rounded-2xl border border-dashed border-black/15 bg-white/50 p-4 text-sm text-ink-500">
        <p className="font-medium text-ink-700">{label}</p>
        <p className="mt-1">
          Укажите VITE_YANDEX_MAPS_API_KEY в .env, чтобы включить карту. Пока введите адрес и координаты вручную.
        </p>
        <input
          className="mt-2 w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
          placeholder="Адрес"
          value={value?.address ?? ''}
          onChange={(e) => onChange({ address: e.target.value, point: value?.point ?? defaultCenter })}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-ink-700">{label}</p>
      <div className="overflow-hidden rounded-2xl border border-black/10">
        <SearchControl options={{ float: 'right', noPlacemark: true }} onResultSelect={handleSearchResult} />
        <Map defaultState={{ center, zoom: 11 }} width="100%" height="280px" onClick={handleMapClick}>
          {value?.point && <Placemark geometry={[value.point.lat, value.point.lng]} />}
        </Map>
      </div>
      {value?.address && <p className="text-xs text-ink-500">{value.address}</p>}
    </div>
  );
}
