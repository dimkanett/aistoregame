'use client';

import { KpiCards } from '@/components/KpiCards';
import { MetricChart } from '@/components/MetricChart';
import { useGameStore } from '@/store/gameStore';

export function DashboardTab() {
  const player = useGameStore((state) => state.player);

  if (!player) return null;

  const history = player.weeklyHistory;
  const risks = [
    player.financialHealth !== 'healthy' ? `Финансовое здоровье: ${player.financialHealth}` : null,
    player.lastWeekStats.lostSales > 20 ? 'Есть потерянные продажи из-за остатков' : null,
    player.lastWeekStats.netProfit < 0 ? 'Неделя закрыта с убытком' : null,
    player.customerLoyalty < 40 ? 'Лояльность клиентов ниже комфортного уровня' : null,
    player.lastWeekStats.debtTotal > player.cash ? 'Долг выше текущего остатка денег' : null
  ].filter((risk): risk is string => Boolean(risk));

  return (
    <div className="space-y-6">
      <KpiCards />

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold">Сводка бизнеса</h2>
          <p className="mt-2 text-sm text-slate-600">
            Формат: {player.type}. Стратегия: {player.playerStrategy}. Финансовое здоровье: {player.financialHealth}. Кредитный рейтинг:{' '}
            {player.creditScore}/100.
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Повторная аудитория: {player.loyalCustomerBase} клиентов, ожидаемая частота повторных покупок:{' '}
            {(player.repeatPurchaseRate * 100).toFixed(1)}%.
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-amber-900">Предупреждения</h2>
          <div className="mt-2 space-y-1 text-sm text-amber-800">
            {risks.length === 0 && <p>Критичных рисков нет.</p>}
            {risks.map((risk) => (
              <p key={risk}>{risk}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <MetricChart title="Деньги на счёте" dataKey="cash" data={history} />
        <MetricChart title="Выручка" dataKey="revenue" data={history} color="#0891b2" />
        <MetricChart title="Чистая прибыль" dataKey="netProfit" data={history} color="#16a34a" />
        <MetricChart title="Маржа" dataKey="marginPercent" data={history} color="#9333ea" />
        <MetricChart title="Трафик" dataKey="traffic" data={history} color="#ea580c" />
        <MetricChart title="Конверсия" dataKey="conversion" data={history} color="#2563eb" />
        <MetricChart title="Средний чек" dataKey="averageCheck" data={history} color="#0f766e" />
        <MetricChart title="Остатки" dataKey="totalStock" data={history} color="#64748b" />
        <MetricChart title="Потерянные продажи" dataKey="lostSales" data={history} color="#dc2626" />
        <MetricChart title="Расходы" dataKey="expenses" data={history} color="#b45309" />
        <MetricChart title="Долг" dataKey="debtTotal" data={history} color="#be123c" />
        <MetricChart title="Репутация" dataKey="reputation" data={history} color="#7c3aed" />
        <MetricChart title="Лояльность" dataKey="customerLoyalty" data={history} color="#059669" />
        <MetricChart title="Доля рынка" dataKey="marketShare" data={history} color="#0284c7" />
      </section>
    </div>
  );
}
