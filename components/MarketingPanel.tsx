'use client';

import { MARKETING_ACTIVITIES } from '@/game/constants';
import { useGameStore } from '@/store/gameStore';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value);

export function MarketingPanel() {
  const player = useGameStore((state) => state.player);
  const marketingNoise = useGameStore((state) => state.market.marketingNoise);
  const toggleMarketingActivity = useGameStore((state) => state.toggleMarketingActivity);

  if (!player) return null;

  const activeIds = new Set(player.activeMarketingActivities.filter((activity) => activity.enabled).map((activity) => activity.activityId));
  const budget = MARKETING_ACTIVITIES.filter((activity) => activeIds.has(activity.id)).reduce((sum, activity) => sum + activity.weeklyCost, 0);
  const activeCount = activeIds.size;

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Маркетинг</h2>
        <div className="mt-3 grid gap-3 text-sm md:grid-cols-4">
          <div className="rounded-lg bg-slate-50 p-3">Бюджет: {formatCurrency(budget)}</div>
          <div className="rounded-lg bg-slate-50 p-3">Активностей: {activeCount}</div>
          <div className="rounded-lg bg-slate-50 p-3">Маркетинговый шум: {(marketingNoise * 100).toFixed(1)}%</div>
          <div className="rounded-lg bg-slate-50 p-3">Лояльность: {player.customerLoyalty.toFixed(1)} / 100</div>
        </div>
        {activeCount > 4 && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Слишком много активностей: ROI может стать отрицательным из-за шума и усталости аудитории.</p>}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {MARKETING_ACTIVITIES.map((activity) => {
          const activeState = player.activeMarketingActivities.find((item) => item.activityId === activity.id);
          const active = Boolean(activeState?.enabled);
          const storeFit = activity.effectivenessByStoreType[player.type] ?? 1;
          return (
            <label
              key={activity.id}
              className={`cursor-pointer rounded-xl border p-4 shadow-sm ${active ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
            >
              <div className="flex items-start gap-3">
                <input type="checkbox" className="mt-1" checked={active} onChange={() => toggleMarketingActivity(activity.id)} />
                <div>
                  <p className="font-semibold">{activity.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{activity.description}</p>
                  <div className="mt-3 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
                    <span>Стоимость: {formatCurrency(activity.weeklyCost)}</span>
                    <span>Трафик: x{activity.trafficModifier.toFixed(2)}</span>
                    <span>Конверсия: x{activity.conversionModifier.toFixed(2)}</span>
                    <span>Репутация: {activity.reputationModifier >= 0 ? '+' : ''}{activity.reputationModifier.toFixed(2)}</span>
                    <span>Лояльность: {activity.loyaltyModifier >= 0 ? '+' : ''}{activity.loyaltyModifier.toFixed(2)}</span>
                    <span>Усталость: {(activity.fatigueRate * 100).toFixed(0)}%</span>
                    <span>Фит формата: x{storeFit.toFixed(2)}</span>
                    <span>Маржа: {(activity.marginImpact * 100).toFixed(1)} п.п.</span>
                  </div>
                  {activeState && <p className="mt-2 text-xs text-slate-500">Активно недель: {activeState.weeksActive}</p>}
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </section>
  );
}
