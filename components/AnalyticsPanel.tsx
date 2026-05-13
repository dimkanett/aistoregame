'use client';

import { useGameStore } from '@/store/gameStore';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value);

export function AnalyticsPanel() {
  const player = useGameStore((state) => state.player);

  if (!player) return null;

  const stats = player.lastWeekStats;
  const previous = player.weeklyHistory[player.weeklyHistory.length - 2];
  const trafficGain = previous ? stats.traffic - previous.traffic : stats.traffic;
  const revenueGain = previous ? stats.weeklyRevenue - previous.revenue : stats.weeklyRevenue;
  const nearPayments = player.activeLoans.flatMap((loan) => loan.paymentSchedule.filter((payment) => !payment.paid && !payment.overdue).slice(0, 2));
  const risks = [
    player.financialHealth !== 'healthy' ? 'Кассовый разрыв / финансовое напряжение' : null,
    stats.lostSales > 0 ? 'Out-of-stock и потерянные продажи' : null,
    player.customerLoyalty < 45 ? 'Падение лояльности' : null,
    player.reputation < 50 ? 'Падение репутации' : null,
    player.lossStreak >= 2 ? 'Убыточная стратегия несколько недель подряд' : null,
    player.activeMarketingActivities.some((activity) => activity.activityId === 'discount_campaign' && activity.weeksActive > 4) ? 'Высокая зависимость от скидок' : null
  ].filter((risk): risk is string => Boolean(risk));

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">P&L недели</h2>
        <div className="mt-3 space-y-2 text-sm">
          <p>Выручка: {formatCurrency(stats.weeklyRevenue)}</p>
          <p>Себестоимость: {formatCurrency(stats.cogs)}</p>
          <p>Валовая прибыль: {formatCurrency(stats.grossProfit)}</p>
          <p>Расходы: {formatCurrency(stats.expenses)}</p>
          <p>Чистая прибыль: {formatCurrency(stats.netProfit)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Cashflow</h2>
        <div className="mt-3 space-y-2 text-sm">
          <p>Деньги на конец недели: {formatCurrency(player.cash)}</p>
          <p>Поступления: {formatCurrency(stats.weeklyRevenue)}</p>
          <p>Расходы: {formatCurrency(stats.expenses)}</p>
          <p>Кредитные платежи: {formatCurrency(stats.loanPayments)}</p>
          <p>Общий долг: {formatCurrency(stats.debtTotal)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Маркетинг ROI</h2>
        <div className="mt-3 space-y-2 text-sm">
          <p>Расходы: {formatCurrency(stats.marketingExpenses)}</p>
          <p>Прирост трафика к прошлой неделе: {trafficGain} чел.</p>
          <p>Прирост выручки к прошлой неделе: {formatCurrency(revenueGain)}</p>
          <p>Оценочная окупаемость: {stats.marketingExpenses > 0 ? (revenueGain / stats.marketingExpenses).toFixed(2) : '—'}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Долговая нагрузка</h2>
        <div className="mt-3 space-y-2 text-sm">
          <p>Общий долг: {formatCurrency(stats.debtTotal)}</p>
          <p>Платежи ближайших недель: {formatCurrency(nearPayments.reduce((sum, payment) => sum + payment.totalPayment, 0))}</p>
          <p>Риск просрочки: {player.cash < stats.loanPayments * 2 ? 'повышенный' : 'контролируемый'}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
        <h2 className="text-lg font-semibold">Риски</h2>
        <div className="mt-3 space-y-2 text-sm">
          {risks.length === 0 && <p className="text-slate-600">Критичных рисков нет.</p>}
          {risks.map((risk) => (
            <p key={risk} className="rounded-lg bg-amber-50 p-2 text-amber-800">{risk}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
