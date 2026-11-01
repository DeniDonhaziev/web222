import type { PropsWithChildren } from 'react';
import { YMaps } from '@pbe/react-yandex-maps';

const API_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY ?? '';

export function MapProvider({ children }: PropsWithChildren) {
  return (
    <YMaps query={{ apikey: API_KEY, lang: 'ru_RU', load: 'package.full' }}>
      {children}
    </YMaps>
  );
}

export function hasMapsApiKey() {
  return API_KEY.length > 0;
}
