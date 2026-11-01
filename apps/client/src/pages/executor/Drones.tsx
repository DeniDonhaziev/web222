import { useState } from 'react';
import { useCreateDrone, useDeleteDrone, useDrones, useUpdateDrone } from '../../features/drones/api';
import { GlassCard, GlassPanel } from '../../design-system/GlassPanel';
import { Input } from '../../design-system/Input';
import { Button } from '../../design-system/Button';
import { Spinner, EmptyState } from '../../design-system/Spinner';

const DRONE_STATUS_LABEL: Record<string, string> = { idle: 'Свободен', busy: 'На доставке', maintenance: 'На обслуживании' };

const emptyForm = { name: '', payloadCapacityKg: '', maxRangeKm: '', speedKmh: '', maxFlightTimeMin: '' };

export function Drones() {
  const { data: drones, isLoading } = useDrones();
  const createDrone = useCreateDrone();
  const updateDrone = useUpdateDrone();
  const deleteDrone = useDeleteDrone();
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createDrone.mutateAsync({
      name: form.name,
      payloadCapacityKg: Number(form.payloadCapacityKg),
      maxRangeKm: Number(form.maxRangeKm),
      speedKmh: Number(form.speedKmh),
      maxFlightTimeMin: Number(form.maxFlightTimeMin),
    });
    setForm(emptyForm);
    setShowForm(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink-900">Парк дронов</h1>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Отмена' : 'Добавить дрон'}</Button>
      </div>

      {showForm && (
        <GlassPanel as="section">
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <Input label="Название" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input
              label="Грузоподъёмность, кг"
              type="number"
              step="0.1"
              required
              value={form.payloadCapacityKg}
              onChange={(e) => setForm({ ...form, payloadCapacityKg: e.target.value })}
            />
            <Input
              label="Макс. дальность, км"
              type="number"
              step="0.1"
              required
              value={form.maxRangeKm}
              onChange={(e) => setForm({ ...form, maxRangeKm: e.target.value })}
            />
            <Input
              label="Скорость, км/ч"
              type="number"
              step="0.1"
              required
              value={form.speedKmh}
              onChange={(e) => setForm({ ...form, speedKmh: e.target.value })}
            />
            <Input
              label="Макс. время полёта, мин"
              type="number"
              required
              value={form.maxFlightTimeMin}
              onChange={(e) => setForm({ ...form, maxFlightTimeMin: e.target.value })}
            />
            <div className="sm:col-span-2">
              <Button type="submit" loading={createDrone.isPending} className="w-full">
                Сохранить дрон
              </Button>
            </div>
          </form>
        </GlassPanel>
      )}

      {isLoading && <Spinner />}
      {!isLoading && drones?.length === 0 && <EmptyState title="Дронов пока нет" description="Добавьте первый дрон, чтобы начать принимать заказы." />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {drones?.map((drone: any) => (
          <GlassCard key={drone.id} className="flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <p className="font-semibold text-ink-900">{drone.name}</p>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  drone.status === 'idle' ? 'bg-emerald-100 text-emerald-700' : drone.status === 'busy' ? 'bg-amber-100 text-amber-700' : 'bg-black/10 text-ink-500'
                }`}
              >
                {DRONE_STATUS_LABEL[drone.status]}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-y-1 text-xs text-ink-500">
              <span>Грузоподъёмность</span>
              <span className="text-right text-ink-900">{drone.payloadCapacityKg} кг</span>
              <span>Дальность</span>
              <span className="text-right text-ink-900">{drone.maxRangeKm} км</span>
              <span>Скорость</span>
              <span className="text-right text-ink-900">{drone.speedKmh} км/ч</span>
              <span>Время полёта</span>
              <span className="text-right text-ink-900">{drone.maxFlightTimeMin} мин</span>
            </div>
            <div className="flex gap-2 border-t border-black/5 pt-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  updateDrone.mutate({ id: drone.id, status: drone.status === 'maintenance' ? 'idle' : 'maintenance' })
                }
              >
                {drone.status === 'maintenance' ? 'Вернуть в строй' : 'На обслуживание'}
              </Button>
              <Button size="sm" variant="danger" onClick={() => deleteDrone.mutate(drone.id)}>
                Удалить
              </Button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
