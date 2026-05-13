'use client';

import { useGameStore } from '@/store/gameStore';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value);

export function MarketPanel() {
  const market = useGameStore((state) => state.market);
  const player = useGameStore((state) => state.player);
  const competitors = useGameStore((state) => state.competitors);

  if (!player) return null;

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Рынок</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg bg-slate-50 p-3">Размер рынка: {market.weeklyCustomerPool} покупателей</div>
          <div className="rounded-lg bg-slate-50 p-3">Фаза: {market.phase}</div>
          <div className="rounded-lg bg-slate-50 p-3">Доля игрока: {player.marketShare.toFixed(2)}%</div>
          <div className="rounded-lg bg-slate-50 p-3">Маркетинговый шум: {(market.marketingNoise * 100).toFixed(1)}%</div>
          <div className="rounded-lg bg-slate-50 p-3">Настроение: {(market.financialMarket.consumerConfidence * 100).toFixed(0)}%</div>
          <div className="rounded-lg bg-slate-50 p-3">Ставка рефинансирования: {(market.financialMarket.refinancingRate * 100).toFixed(2)}%</div>
          <div className="rounded-lg bg-slate-50 p-3">Инфляция: {(market.financialMarket.inflationRate * 100).toFixed(2)}%</div>
          <div className="rounded-lg bg-slate-50 p-3">Доступность кредитов: {(market.financialMarket.creditAvailability * 100).toFixed(0)}%</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-semibold">Сегменты покупателей</h3>
          <div className="mt-3 space-y-2 text-sm">
            {market.segments.map((segment) => (
              <div key={segment.name} className="rounded-lg bg-slate-50 p-3">
                <p className="font-medium">{segment.name}: {segment.size} покупателей</p>
                <p className="text-slate-600">Цена x{segment.priceSensitivity.toFixed(2)} · сервис x{segment.serviceSensitivity.toFixed(2)} · репутация x{segment.reputationSensitivity.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-semibold">Средние цены и доли рынка</h3>
          <div className="mt-3 space-y-2 text-sm">
            {Object.entries(market.marketPriceIndex).map(([categoryId, price]) => (
              <div key={categoryId} className="flex justify-between rounded-lg bg-slate-50 p-2">
                <span>{categoryId}</span>
                <span>{formatCurrency(price)}</span>
              </div>
            ))}
            {competitors.map((competitor) => (
              <div key={competitor.id} className="flex justify-between rounded-lg bg-slate-50 p-2">
                <span>{competitor.name}</span>
                <span>{competitor.marketShare.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
