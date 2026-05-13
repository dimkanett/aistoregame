'use client';

import { useGameStore } from '@/store/gameStore';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value);

const formatPercent = (value: number): string => `${value.toFixed(2)}%`;

export function KpiCards() {
  const player = useGameStore((state) => state.player);

  if (!player) return null;

  const stats = player.lastWeekStats;
  const debtLoad = player.cash === 0 ? stats.debtTotal : (stats.debtTotal / Math.max(1, player.cash)) * 100;
  const cashGapRisk = player.financialHealth === 'healthy' ? 'Низкий' : player.financialHealth === 'strained' ? 'Средний' : 'Высокий';

  const cards = [
    { label: 'Деньги на счёте', value: formatCurrency(player.cash) },
    { label: 'Выручка недели', value: formatCurrency(stats.weeklyRevenue) },
    { label: 'Валовая прибыль', value: formatCurrency(stats.grossProfit) },
    { label: 'Чистая прибыль', value: formatCurrency(stats.netProfit) },
    { label: 'Маржа', value: formatPercent(stats.marginPercent) },
    { label: 'Трафик', value: `${stats.traffic} чел.` },
    { label: 'Конверсия', value: formatPercent(stats.conversion) },
    { label: 'Средний чек', value: formatCurrency(stats.averageCheck) },
    { label: 'Остатки', value: `${stats.totalStock} шт.` },
    { label: 'Потерянные продажи', value: `${stats.lostSales} шт.` },
    { label: 'Расходы', value: formatCurrency(stats.expenses) },
    { label: 'Маркетинг', value: formatCurrency(stats.marketingExpenses) },
    { label: 'Персонал', value: formatCurrency(stats.payrollExpenses) },
    { label: 'Кредиты / неделя', value: formatCurrency(stats.loanPayments) },
    { label: 'Долговая нагрузка', value: formatPercent(debtLoad) },
    { label: 'Репутация', value: `${stats.reputation.toFixed(1)} / 100` },
    { label: 'Лояльность', value: `${stats.customerLoyalty.toFixed(1)} / 100` },
    { label: 'Доля рынка', value: formatPercent(stats.marketShare) },
    { label: 'Риск кассового разрыва', value: cashGapRisk }
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">{card.label}</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{card.value}</p>
        </div>
      ))}
    </section>
  );
}
