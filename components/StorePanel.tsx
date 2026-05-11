'use client';

import { BusinessStrategy } from '@/game/types';
import { useGameStore } from '@/store/gameStore';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value);

const strategies: { id: BusinessStrategy; label: string }[] = [
  { id: 'balanced', label: 'Сбалансированная' },
  { id: 'premium_margin', label: 'Премиальная маржа' },
  { id: 'discount_volume', label: 'Оборот и низкая цена' },
  { id: 'category_killer', label: 'Фокус на категории' },
  { id: 'loyalty_focus', label: 'Лояльность' },
  { id: 'survival', label: 'Выживание' }
];

export function StorePanel() {
  const player = useGameStore((state) => state.player);
  const setPlayerStrategy = useGameStore((state) => state.setPlayerStrategy);

  if (!player) return null;

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Магазин</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg bg-slate-50 p-3">Формат: {player.type}</div>
          <div className="rounded-lg bg-slate-50 p-3">Деньги: {formatCurrency(player.cash)}</div>
          <div className="rounded-lg bg-slate-50 p-3">Финансовое здоровье: {player.financialHealth}</div>
          <div className="rounded-lg bg-slate-50 p-3">Кредитный рейтинг: {player.creditScore}/100</div>
          <div className="rounded-lg bg-slate-50 p-3">Репутация: {player.reputation.toFixed(1)}/100</div>
          <div className="rounded-lg bg-slate-50 p-3">Лояльность: {player.customerLoyalty.toFixed(1)}/100</div>
          <div className="rounded-lg bg-slate-50 p-3">Аренда: {formatCurrency(player.profile.rent)}</div>
          <div className="rounded-lg bg-slate-50 p-3">Операционные расходы: {formatCurrency(player.profile.operatingCosts)}</div>
          <div className="rounded-lg bg-slate-50 p-3">Доля рынка: {player.marketShare.toFixed(2)}%</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-semibold">Стратегический фокус</h3>
          <select
            className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2"
            value={player.playerStrategy}
            onChange={(event) => setPlayerStrategy(event.target.value as BusinessStrategy)}
          >
            {strategies.map((strategy) => (
              <option key={strategy.id} value={strategy.id}>{strategy.label}</option>
            ))}
          </select>
          <p className="mt-2 text-sm text-slate-600">Стратегия не управляет магазином автоматически, но подсвечивает риски и помогает анализировать решения.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-semibold">Сильные и слабые стороны формата</h3>
          <ul className="mt-2 list-inside list-disc text-sm text-slate-600">
            <li>Чувствительность к цене: x{player.profile.priceSensitivity.toFixed(2)}</li>
            <li>Зависимость от маркетинга: x{player.profile.marketingDependency.toFixed(2)}</li>
            <li>Сила локации: x{player.profile.locationPower.toFixed(2)}</li>
            <li>Базовый сервис: x{player.profile.serviceLevel.toFixed(2)}</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
