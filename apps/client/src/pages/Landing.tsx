import { Link } from 'react-router-dom';
import { GlassCard } from '../design-system/GlassPanel';
import { Button } from '../design-system/Button';

const FEATURES = [
  {
    title: 'Мгновенный подбор исполнителя',
    description: 'Алгоритм учитывает расстояние, грузоподъёмность дрона, рейтинг и стоимость — заявка находит исполнителя за секунды.',
  },
  {
    title: 'Живой трекинг на карте',
    description: 'Координаты дрона обновляются в реальном времени — вы видите точное местоположение груза и ETA.',
  },
  {
    title: 'Прозрачная комиссия',
    description: 'Стоимость и комиссия платформы рассчитываются автоматически ещё до подтверждения заказа.',
  },
];

const STEPS = [
  'Укажите точки отправления и получения',
  'Получите расчёт стоимости и список исполнителей',
  'Оплатите онлайн и следите за доставкой на карте',
];

export function Landing() {
  return (
    <div className="flex flex-col gap-24 pb-24">
      <section className="flex flex-col items-center gap-6 pt-16 text-center">
        <span className="rounded-full bg-brand-100 px-4 py-1.5 text-sm font-medium text-brand-700">
          Агрегатор доставки дронами
        </span>
        <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-ink-900 sm:text-6xl">
          Доставка грузов дронами <span className="text-brand-600">за минуты</span>
        </h1>
        <p className="max-w-xl text-lg text-ink-500">
          SkyDrop соединяет заказчиков с проверенными операторами дронов. Оформите доставку, отслеживайте её на карте
          в реальном времени и платите онлайн — без владения собственным парком дронов.
        </p>
        <div className="flex gap-3">
          <Link to="/register?role=customer">
            <Button size="lg">Отправить груз</Button>
          </Link>
          <Link to="/register?role=executor">
            <Button size="lg" variant="secondary">
              Стать исполнителем
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <GlassCard key={f.title} className="flex flex-col gap-2">
            <h3 className="text-base font-semibold text-ink-900">{f.title}</h3>
            <p className="text-sm text-ink-500">{f.description}</p>
          </GlassCard>
        ))}
      </section>

      <section className="glass-panel flex flex-col gap-6 p-10">
        <h2 className="text-2xl font-semibold text-ink-900">Как это работает</h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step} className="flex flex-col gap-2 rounded-xl2 bg-white/60 p-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                {i + 1}
              </span>
              <p className="text-sm font-medium text-ink-700">{step}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
