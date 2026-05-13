'use client';

import { STORE_PROFILES } from '@/game/constants';
import { StoreType } from '@/game/types';
import { useGameStore } from '@/store/gameStore';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value);

const storeTypes = Object.keys(STORE_PROFILES) as StoreType[];

export function StartScreen() {
  const startSession = useGameStore((state) => state.startSession);

  return (
    <section className="mx-auto mt-10 w-full max-w-5xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold">Выберите тип магазина</h1>
      <p className="mt-2 text-sm text-slate-600">
        От выбора формата зависит стартовый капитал, чувствительность аудитории к цене и сила маркетинга.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {storeTypes.map((type) => {
          const profile = STORE_PROFILES[type];
          return (
            <div key={type} className="rounded-lg border border-slate-200 p-4">
              <h2 className="text-lg font-semibold">{type}</h2>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                <li>Стартовый капитал: {formatCurrency(profile.startCash)}</li>
                <li>Аренда: {formatCurrency(profile.rent)}</li>
                <li>Базовая проходимость: {profile.baseTraffic} чел.</li>
                <li>Сервис: {(profile.serviceLevel * 100).toFixed(0)}%</li>
                <li>Репутация: {profile.reputation}/100</li>
              </ul>
              <button
                type="button"
                className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                onClick={() => startSession(type)}
              >
                Начать сессию
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
