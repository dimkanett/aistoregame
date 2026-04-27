'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0
  }).format(value);

export function AssortmentTable() {
  const player = useGameStore((state) => state.player);
  const updateRetailPrice = useGameStore((state) => state.updateRetailPrice);
  const orderStock = useGameStore((state) => state.orderStock);

  const [orderInputs, setOrderInputs] = useState<Record<string, number>>({});

  if (!player) {
    return null;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-lg font-semibold">Ассортимент</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Категория</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Остаток</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Закупка</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Розница</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Рынок</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Эластичность</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Маржа</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Дозаказ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {player.categories.map((category) => (
              <tr key={category.id}>
                <td className="px-3 py-3 font-medium">{category.name}</td>
                <td className="px-3 py-3">{category.stock} шт.</td>
                <td className="px-3 py-3">{formatCurrency(category.purchasePrice)}</td>
                <td className="px-3 py-3">
                  <input
                    type="number"
                    className="w-28 rounded-md border border-slate-300 px-2 py-1"
                    min={Math.round(category.purchasePrice * 1.05)}
                    placeholder="Цена продажи"
                    value={category.retailPrice}
                    onChange={(event) => updateRetailPrice(category.id, Number(event.target.value))}
                  />
                </td>
                <td className="px-3 py-3">{formatCurrency(category.baseMarketPrice)}</td>
                <td className="px-3 py-3">{category.elasticity.toFixed(2)}</td>
                <td className="px-3 py-3">{category.margin.toFixed(2)}%</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      className="w-24 rounded-md border border-slate-300 px-2 py-1"
                      min={0}
                      placeholder="Кол-во"
                      value={orderInputs[category.id] ?? 0}
                      onChange={(event) =>
                        setOrderInputs((prev) => ({
                          ...prev,
                          [category.id]: Math.max(0, Number(event.target.value))
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="rounded-md bg-slate-900 px-3 py-1 text-white hover:bg-slate-700"
                      onClick={() => {
                        orderStock(category.id, orderInputs[category.id] ?? 0);
                        setOrderInputs((prev) => ({ ...prev, [category.id]: 0 }));
                      }}
                    >
                      Заказать
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
