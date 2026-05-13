'use client';

import { useMemo, useState } from 'react';
import { ProductSegment, ProductStatus } from '@/game/types';
import { calculateSkuMargin } from '@/game/calculations';
import { useGameStore } from '@/store/gameStore';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value);

const demandByPrice = (retailPrice: number, marketPrice: number, elasticity: number): number => {
  const priceIndex = retailPrice / marketPrice;
  if (priceIndex > 1) return Math.max(35, Math.round(100 - (priceIndex - 1) * elasticity * 100));
  return Math.min(145, Math.round(100 + (1 - priceIndex) * elasticity * 70));
};

const all = 'all';

export function AssortmentTable() {
  const player = useGameStore((state) => state.player);
  const suppliers = useGameStore((state) => state.suppliers);
  const skuMarketIndex = useGameStore((state) => state.market.skuMarketPriceIndex);
  const updateRetailPrice = useGameStore((state) => state.updateRetailPrice);
  const orderStock = useGameStore((state) => state.orderStock);

  const [orderInputs, setOrderInputs] = useState<Record<string, number>>({});
  const [categoryFilter, setCategoryFilter] = useState(all);
  const [segmentFilter, setSegmentFilter] = useState<ProductSegment | typeof all>(all);
  const [supplierFilter, setSupplierFilter] = useState(all);
  const [statusFilter, setStatusFilter] = useState<ProductStatus | typeof all>(all);

  const demandSnapshot = useMemo(() => {
    if (!player) return {};
    return player.productSkus.reduce<Record<string, number>>((acc, sku) => {
      const market = skuMarketIndex[sku.id] ?? sku.baseMarketPrice;
      acc[sku.id] = demandByPrice(sku.retailPrice, market, sku.elasticity);
      return acc;
    }, {});
  }, [player, skuMarketIndex]);

  if (!player) return null;

  const categories = Array.from(new Set(player.productSkus.map((sku) => sku.categoryId)));
  const filteredSkus = player.productSkus.filter((sku) => {
    if (categoryFilter !== all && sku.categoryId !== categoryFilter) return false;
    if (segmentFilter !== all && sku.segment !== segmentFilter) return false;
    if (supplierFilter !== all && sku.supplierId !== supplierFilter) return false;
    if (statusFilter !== all && sku.status !== statusFilter) return false;
    return true;
  });

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-lg font-semibold">Ассортимент / товары</h2>
        <div className="mt-3 grid gap-2 text-sm md:grid-cols-4">
          <select className="rounded-md border border-slate-300 px-2 py-2" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value={all}>Все категории</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <select className="rounded-md border border-slate-300 px-2 py-2" value={segmentFilter} onChange={(event) => setSegmentFilter(event.target.value as ProductSegment | typeof all)}>
            <option value={all}>Все сегменты</option>
            <option value="cheap">cheap</option>
            <option value="mid">mid</option>
            <option value="premium">premium</option>
          </select>
          <select className="rounded-md border border-slate-300 px-2 py-2" value={supplierFilter} onChange={(event) => setSupplierFilter(event.target.value)}>
            <option value={all}>Все поставщики</option>
            {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
          </select>
          <select className="rounded-md border border-slate-300 px-2 py-2" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ProductStatus | typeof all)}>
            <option value={all}>Все статусы</option>
            <option value="active">active</option>
            <option value="slow">slow</option>
            <option value="dead">dead</option>
            <option value="out_of_stock">out_of_stock</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-slate-600">SKU</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Категория</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Сегмент</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Поставщик</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Остаток</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Закупка</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Розница</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Рынок</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Индекс</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Маржа</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Спрос</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Продажи</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Потери</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Возраст</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Статус</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Дозаказ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSkus.map((sku) => {
              const market = skuMarketIndex[sku.id] ?? sku.baseMarketPrice;
              const sales = player.skuSalesLastWeek[sku.id] ?? 0;
              const lost = player.skuLostSalesLastWeek[sku.id] ?? 0;
              const supplier = suppliers.find((item) => item.id === sku.supplierId);
              return (
                <tr key={sku.id}>
                  <td className="px-3 py-3 font-medium">{sku.name}</td>
                  <td className="px-3 py-3">{sku.categoryId}</td>
                  <td className="px-3 py-3">{sku.segment}</td>
                  <td className="px-3 py-3">{supplier?.name ?? '—'}</td>
                  <td className="px-3 py-3">{sku.stock} шт.</td>
                  <td className="px-3 py-3">{formatCurrency(sku.purchasePrice)}</td>
                  <td className="px-3 py-3">
                    <input type="number" className="w-28 rounded-md border border-slate-300 px-2 py-1" min={Math.round(sku.purchasePrice * 1.05)} value={sku.retailPrice} onChange={(event) => updateRetailPrice(sku.id, Number(event.target.value))} />
                  </td>
                  <td className="px-3 py-3">{formatCurrency(market)}</td>
                  <td className="px-3 py-3">{(sku.retailPrice / market).toFixed(2)}</td>
                  <td className="px-3 py-3">{calculateSkuMargin(sku).toFixed(2)}%</td>
                  <td className="px-3 py-3">{demandSnapshot[sku.id] ?? 100}</td>
                  <td className="px-3 py-3">{sales}</td>
                  <td className="px-3 py-3">{lost}</td>
                  <td className="px-3 py-3">{sku.ageWeeks}</td>
                  <td className="px-3 py-3">{sku.status}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <input type="number" className="w-24 rounded-md border border-slate-300 px-2 py-1" min={0} placeholder="Кол-во" value={orderInputs[sku.id] ?? 0} onChange={(event) => setOrderInputs((prev) => ({ ...prev, [sku.id]: Math.max(0, Number(event.target.value)) }))} />
                      <button type="button" className="rounded-md bg-slate-900 px-3 py-1 text-white hover:bg-slate-700" onClick={() => { orderStock(sku.id, orderInputs[sku.id] ?? 0, sku.supplierId); setOrderInputs((prev) => ({ ...prev, [sku.id]: 0 })); }}>
                        Заказать
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
