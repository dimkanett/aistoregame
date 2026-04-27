'use client';

import { MARKETING_EFFECTS } from '@/game/constants';
import { MarketingMode } from '@/game/types';
import { useGameStore } from '@/store/gameStore';

const modes = Object.keys(MARKETING_EFFECTS) as MarketingMode[];

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value);

export function MarketingPanel() {
  const player = useGameStore((state) => state.player);
  const setMarketingMode = useGameStore((state) => state.setMarketingMode);

  if (!player) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Маркетинг</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {modes.map((mode) => {
          const effect = MARKETING_EFFECTS[mode];
          const active = player.marketingMode === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setMarketingMode(mode)}
              className={`rounded-lg border p-3 text-left ${
                active ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <p className="font-medium">{mode}</p>
              <p className="text-sm text-slate-600">Бюджет: {formatCurrency(effect.cost)}</p>
              <p className="text-sm text-slate-600">Трафик: x{effect.trafficBoost.toFixed(2)}</p>
              <p className="text-sm text-slate-600">Репутация: {effect.reputationImpact >= 0 ? '+' : ''}{effect.reputationImpact.toFixed(1)}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
