'use client';

import { useGameStore } from '@/store/gameStore';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0
  }).format(value);

const formatPercent = (value: number): string => `${value.toFixed(2)}%`;

export function DashboardCards() {
  const player = useGameStore((state) => state.player);

  if (!player) {
    return null;
  }

  const stats = player.lastWeekStats;
  const cards = [
    { label: 'Деньги на счёте', value: formatCurrency(player.cash) },
    { label: 'Выручка недели', value: formatCurrency(stats.weeklyRevenue) },
    { label: 'Прибыль недели', value: formatCurrency(stats.weeklyProfit) },
    { label: 'Маржа', value: formatPercent(stats.marginPercent) },
    { label: 'Трафик', value: `${stats.traffic} чел.` },
    { label: 'Конверсия', value: formatPercent(stats.conversion) },
    { label: 'Средний чек', value: formatCurrency(stats.averageCheck) },
    { label: 'Остатки', value: `${stats.totalStock} шт.` },
    { label: 'Потерянные продажи', value: `${stats.lostSales} шт.` },
    { label: 'Репутация', value: `${stats.reputation.toFixed(1)} / 100` }
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">{card.label}</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{card.value}</p>
        </div>
      ))}
    </section>
  );
}
