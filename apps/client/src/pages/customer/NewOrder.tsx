import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GeoPoint, Urgency } from '@drone/shared';
import { GlassPanel } from '../../design-system/GlassPanel';
import { Input, Select, Textarea } from '../../design-system/Input';
import { Button } from '../../design-system/Button';
import { AddressPicker } from '../../map/AddressPicker';
import { useCreateOrder } from '../../features/orders/api';

type AddressValue = { address: string; point: GeoPoint };

const URGENCY_OPTIONS: { value: Urgency; label: string }[] = [
  { value: 'standard', label: 'Стандартная (х1.0)' },
  { value: 'express', label: 'Экспресс (х1.35)' },
  { value: 'urgent', label: 'Срочная (х1.75)' },
];

export function NewOrder() {
  const [pickup, setPickup] = useState<AddressValue | null>(null);
  const [dropoff, setDropoff] = useState<AddressValue | null>(null);
  const [weightKg, setWeightKg] = useState('1');
  const [dimensions, setDimensions] = useState({ length: '', width: '', height: '' });
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<Urgency>('standard');

  const createOrder = useCreateOrder();
  const navigate = useNavigate();

  const canSubmit = pickup && dropoff && Number(weightKg) > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pickup || !dropoff) return;

    const result = await createOrder.mutateAsync({
      pickupAddress: pickup.address,
      pickup: pickup.point,
      dropoffAddress: dropoff.address,
      dropoff: dropoff.point,
      weightKg: Number(weightKg),
      lengthCm: dimensions.length ? Number(dimensions.length) : undefined,
      widthCm: dimensions.width ? Number(dimensions.width) : undefined,
      heightCm: dimensions.height ? Number(dimensions.height) : undefined,
      description: description || undefined,
      urgency,
    });

    navigate(`/customer/orders/${result.order.id}`);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold text-ink-900">Новый заказ</h1>

      <GlassPanel as="section" className="flex flex-col gap-5">
        <AddressPicker label="Точка отправления" value={pickup} onChange={setPickup} />
        <AddressPicker label="Точка получения" value={dropoff} onChange={setDropoff} defaultCenter={pickup?.point} />

        <div className="grid grid-cols-3 gap-3">
          <Input label="Вес, кг" type="number" min={0.1} step={0.1} value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
          <Input
            label="Габариты, см (Д×Ш×В)"
            placeholder="Длина"
            type="number"
            value={dimensions.length}
            onChange={(e) => setDimensions((d) => ({ ...d, length: e.target.value }))}
          />
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Input
              placeholder="Ширина"
              type="number"
              value={dimensions.width}
              onChange={(e) => setDimensions((d) => ({ ...d, width: e.target.value }))}
            />
            <Input
              placeholder="Высота"
              type="number"
              value={dimensions.height}
              onChange={(e) => setDimensions((d) => ({ ...d, height: e.target.value }))}
            />
          </div>
        </div>

        <Textarea label="Описание груза" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Например: документы, хрупкий груз" />

        <Select label="Срочность доставки" value={urgency} onChange={(e) => setUrgency(e.target.value as Urgency)}>
          {URGENCY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>

        {createOrder.isError && (
          <p className="text-sm text-red-500">Не удалось создать заказ. Проверьте адреса и попробуйте снова.</p>
        )}

        <Button onClick={onSubmit} loading={createOrder.isPending} disabled={!canSubmit} className="w-full">
          Рассчитать стоимость и найти исполнителя
        </Button>
      </GlassPanel>
    </div>
  );
}
