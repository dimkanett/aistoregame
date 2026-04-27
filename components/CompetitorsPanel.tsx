'use client';

import { useMemo, useState } from 'react';
import { averageMargin } from '@/game/calculations';
import { useGameStore } from '@/store/gameStore';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value);

type CompetitorTab = 'Ценообразование' | 'Маркетинг' | 'Операционные показатели' | 'Персонал';

const tabs: CompetitorTab[] = ['Ценообразование', 'Маркетинг', 'Операционные показатели', 'Персонал'];

export function CompetitorsPanel() {
  const competitors = useGameStore((state) => state.competitors);
  const marketIndex = useGameStore((state) => state.market.marketPriceIndex);

  const [activeCompetitor, setActiveCompetitor] = useState<string | null>(competitors[0]?.id ?? null);
  const [activeTab, setActiveTab] = useState<CompetitorTab>('Ценообразование');

  const competitor = useMemo(
    () => competitors.find((item) => item.id === activeCompetitor) ?? competitors[0],
    [competitors, activeCompetitor]
  );

  if (!competitor) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Конкуренты</h2>

      <div className="mt-3 flex flex-wrap gap-2">
        {competitors.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`rounded-md px-3 py-1 text-sm ${
              item.id === competitor.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
            }`}
            onClick={() => setActiveCompetitor(item.id)}
          >
            {item.name}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`rounded-md px-3 py-1 text-sm ${
              tab === activeTab ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Ценообразование' && (
        <div className="mt-4 space-y-2 text-sm">
          <p className="text-slate-600">
            Оценочная маржа: <span className="font-medium text-slate-900">{averageMargin(competitor.categories).toFixed(2)}%</span>
          </p>
          {competitor.categories.map((category) => {
            const market = marketIndex[category.id] ?? category.baseMarketPrice;
            const position = ((category.retailPrice / market - 1) * 100).toFixed(1);
            return (
              <div key={category.id} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                <span>{category.name}</span>
                <span>{formatCurrency(category.retailPrice)} ({position}%)</span>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'Маркетинг' && (
        <div className="mt-4 space-y-2 text-sm">
          <p>Текущая стратегия: <span className="font-medium">{competitor.marketingMode}</span></p>
          <p>Расходы: <span className="font-medium">{formatCurrency(competitor.expenses.marketing)}</span></p>
          <p className="text-slate-600">Видимая активность: {competitor.lastWeekStats.traffic > 2200 ? 'Высокая' : 'Умеренная'}</p>
        </div>
      )}

      {activeTab === 'Операционные показатели' && (
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-md bg-slate-50 p-3">Примерная выручка: {formatCurrency(competitor.lastWeekStats.weeklyRevenue)}</div>
          <div className="rounded-md bg-slate-50 p-3">Примерная прибыль: {formatCurrency(competitor.lastWeekStats.weeklyProfit)}</div>
          <div className="rounded-md bg-slate-50 p-3">Трафик: {competitor.lastWeekStats.traffic} чел.</div>
          <div className="rounded-md bg-slate-50 p-3">Конверсия: {competitor.lastWeekStats.conversion.toFixed(2)}%</div>
          <div className="rounded-md bg-slate-50 p-3">Средний чек: {formatCurrency(competitor.lastWeekStats.averageCheck)}</div>
          <div className="rounded-md bg-slate-50 p-3">Остатки: {competitor.lastWeekStats.totalStock} шт.</div>
        </div>
      )}

      {activeTab === 'Персонал' && (
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-md bg-slate-50 p-3">Сотрудники: {competitor.staff.headcount}</div>
          <div className="rounded-md bg-slate-50 p-3">Сервис: {(competitor.staff.serviceLevel * 100).toFixed(0)}%</div>
          <div className="rounded-md bg-slate-50 p-3">ФОТ: {formatCurrency(competitor.expenses.payroll)}</div>
          <div className="rounded-md bg-slate-50 p-3">Нагрузка: {(competitor.staff.workload * 100).toFixed(0)}%</div>
        </div>
      )}
    </section>
  );
}
