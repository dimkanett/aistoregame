'use client';

import { useMemo } from 'react';
import { roleLabel } from '@/game/labor';
import { ProductSku, VisualEvent, Worker } from '@/game/types';
import { useGameStore } from '@/store/gameStore';

const initials = (name: string): string =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const formatPercent = (value: number): string => `${value.toFixed(1)}%`;

const workerTone = (worker: Worker): string => {
  const score = worker.experienceLevel + worker.training + worker.salesSkill + worker.discipline;
  if (score >= 310) return 'bg-amber-400 text-amber-950 ring-amber-200';
  if (score >= 250) return 'bg-emerald-400 text-emerald-950 ring-emerald-200';
  if (score >= 190) return 'bg-sky-400 text-sky-950 ring-sky-200';
  return 'bg-slate-300 text-slate-800 ring-slate-200';
};

const shelfFill = (skus: ProductSku[]): { label: string; className: string; percent: number } => {
  const listed = skus.filter((sku) => sku.status !== 'blocked');
  if (listed.length === 0) return { label: 'Пустые полки', className: 'bg-rose-200 text-rose-800', percent: 0 };
  const stock = listed.reduce((sum, sku) => sum + sku.stock, 0);
  const target = listed.reduce((sum, sku) => sum + sku.targetStock, 0) || 1;
  const percent = Math.min(100, Math.round((stock / target) * 100));
  if (percent < 25) return { label: 'Пустые полки', className: 'bg-rose-200 text-rose-800', percent };
  if (percent < 65) return { label: 'Риск OOS', className: 'bg-amber-200 text-amber-800', percent };
  return { label: 'Остатки норм', className: 'bg-emerald-200 text-emerald-800', percent };
};

const severityClass: Record<VisualEvent['severity'], string> = {
  info: 'border-sky-200 bg-sky-50 text-sky-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  danger: 'border-rose-200 bg-rose-50 text-rose-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800'
};

export function StoreScene() {
  const player = useGameStore((state) => state.player);
  const visualEvents = useGameStore((state) => state.visualEvents);
  const week = useGameStore((state) => state.week);

  const customers = useMemo(() => {
    if (!player) return [];
    const traffic = player.lastWeekStats.traffic;
    const count = Math.min(12, Math.max(3, Math.round(traffic / 120)));
    const highConversion = player.lastWeekStats.conversion >= 18;
    const highLostSales = player.lastWeekStats.lostSales > Math.max(10, player.lastWeekStats.weeklyRevenue / 1200);
    const lowService = player.staff.serviceLevel < 0.85;
    return Array.from({ length: count }, (_, index) => ({
      id: `customer-${index}`,
      delay: `${index * 0.45}s`,
      lane: 34 + (index % 4) * 10,
      bubble: highLostSales && index % 4 === 1 ? 'Нет товара' : lowService && index % 5 === 2 ? 'Очередь' : !highConversion && index % 6 === 3 ? 'Думаю…' : ''
    }));
  }, [player]);

  if (!player) return null;

  const sellers = player.employees.filter((worker) => worker.role === 'seller');
  const marketer = player.employees.find((worker) => worker.role === 'marketer');
  const activeSkuCount = player.productSkus.filter((sku) => sku.status !== 'blocked').length;
  const oosCount = player.productSkus.filter((sku) => sku.status === 'out_of_stock').length;
  const pendingOrders = player.purchaseOrders.filter((order) => order.deliveryStatus === 'pending' || order.deliveryStatus === 'delayed').length;
  const recentEvents = visualEvents.slice(0, 6);
  const deliveryArrived = recentEvents.some((event) => event.type === 'delivery_arrived');
  const showTruck = recentEvents.some((event) => event.type === 'delivery_arrived' || event.type === 'delivery_delayed');
  const delayedDelivery = recentEvents.some((event) => event.type === 'delivery_delayed');
  const shelves = player.categories.slice(0, 6).map((category) => ({
    category,
    fill: shelfFill(player.productSkus.filter((sku) => sku.categoryId === category.id))
  }));

  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Сцена магазина</h2>
            <p className="text-sm text-slate-500">Живой слой поверх текущей экономической модели: сотрудники, покупатели, полки и поставки.</p>
          </div>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">Неделя #{week}</span>
        </div>

        <div className="store-scene relative m-4 min-h-[560px] overflow-hidden rounded-3xl border-4 border-amber-100 bg-gradient-to-b from-amber-50 to-orange-100 p-4">
          <div className="absolute left-6 top-8 rounded-2xl border-2 border-sky-200 bg-sky-100 px-5 py-8 text-center shadow-inner">
            <div className="text-3xl">🚪</div>
            <p className="text-xs font-bold text-sky-800">Вход</p>
          </div>

          <div className="absolute left-6 top-48 rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50 px-5 py-8 text-center">
            <div className="text-3xl">📦</div>
            <p className="text-xs font-bold text-orange-800">Склад</p>
            {showTruck && <div className={`delivery-truck mt-3 text-4xl ${delayedDelivery ? 'grayscale' : ''}`}>🚚</div>}
            {showTruck && !delayedDelivery && <div className="box-pop mt-2 flex justify-center gap-1"><span>📦</span><span>📦</span><span>📦</span></div>}
            {delayedDelivery && <p className="mt-2 rounded-full bg-amber-200 px-2 py-1 text-xs font-bold text-amber-900">Задержка</p>}
            {deliveryArrived && <span className="sr-only">Поставка приехала</span>}
          </div>

          <div className="absolute bottom-8 left-8 rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-4 py-5 text-center shadow-sm">
            <div className="text-2xl">💻</div>
            <p className="text-xs font-bold text-emerald-800">Маркетинг</p>
            {marketer ? (
              <div className={`mt-2 inline-flex h-10 w-10 items-center justify-center rounded-full ring-4 ${workerTone(marketer)}`} title={`${marketer.name} · ${roleLabel[marketer.role]}`}>
                {marketer.avatarUrl ? <span role="img" aria-label={marketer.name} className="h-full w-full rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${marketer.avatarUrl})` }} /> : initials(marketer.name)}
              </div>
            ) : (
              <p className="mt-2 max-w-36 rounded-lg bg-white/80 px-2 py-1 text-xs font-semibold text-amber-700">Нет маркетолога — маркетинг ограничен</p>
            )}
          </div>

          <div className="absolute right-8 top-10 rounded-2xl border-2 border-slate-300 bg-slate-100 px-8 py-6 text-center shadow-lg">
            <div className="text-4xl">🧾</div>
            <p className="font-bold text-slate-800">Касса</p>
            {sellers.length === 0 && <p className="mt-2 max-w-48 rounded-lg bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700">Нет продавцов — продажи почти остановлены</p>}
            <div className="mt-3 flex justify-center gap-2">
              {sellers.slice(0, 3).map((seller) => (
                <div key={seller.id} className={`mini-worker h-11 w-11 rounded-full ring-4 ${workerTone(seller)}`} title={`${seller.name}: продажи ${seller.salesSkill}`}>
                  {seller.avatarUrl ? <span role="img" aria-label={seller.name} className="h-full w-full rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${seller.avatarUrl})` }} /> : initials(seller.name)}
                </div>
              ))}
            </div>
          </div>

          <div className="absolute inset-x-40 top-20 rounded-[2rem] border-2 border-dashed border-amber-200 bg-white/30 p-4 text-center text-xs font-bold uppercase tracking-[0.3em] text-amber-700">
            Торговый зал
          </div>

          <div className="absolute left-44 right-56 top-36 grid grid-cols-2 gap-4 lg:grid-cols-3">
            {shelves.map(({ category, fill }, index) => (
              <div key={category.id} className="shelf rounded-2xl border-2 border-yellow-800/20 bg-yellow-700/20 p-3 shadow-sm" style={{ animationDelay: `${index * 0.12}s` }}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-bold text-yellow-950">{category.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${fill.className}`}>{fill.label}</span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {Array.from({ length: 15 }, (_, itemIndex) => (
                    <div key={itemIndex} className={`h-5 rounded ${itemIndex < Math.round(fill.percent / 7) ? 'bg-indigo-400' : 'bg-white/50'}`} title={itemIndex === 0 ? `Заполненность ${fill.percent}%` : undefined} />
                  ))}
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-white/70"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${fill.percent}%` }} /></div>
              </div>
            ))}
          </div>

          {sellers.slice(3, 6).map((seller, index) => (
            <div key={seller.id} className="absolute text-center" style={{ left: `${42 + index * 12}%`, top: `${66 - (index % 2) * 12}%` }}>
              <div className={`mini-worker mx-auto h-10 w-10 rounded-full ring-4 ${workerTone(seller)}`}>{seller.avatarUrl ? <span role="img" aria-label={seller.name} className="h-full w-full rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${seller.avatarUrl})` }} /> : initials(seller.name)}</div>
              <p className="mt-1 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold text-slate-700">{initials(seller.name)}</p>
            </div>
          ))}

          {customers.map((customer) => (
            <div key={customer.id} className="customer absolute left-12 text-center" style={{ top: `${customer.lane}%`, animationDelay: customer.delay }}>
              {customer.bubble && <div className="bubble mb-1 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-slate-700 shadow">{customer.bubble}</div>}
              <div className="text-2xl">🧍</div>
            </div>
          ))}
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-bold text-slate-900">Сводка сцены</h3>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-slate-50 p-3"><dt className="text-slate-500">Продавцы</dt><dd className="text-lg font-bold">{sellers.length}</dd></div>
            <div className="rounded-xl bg-slate-50 p-3"><dt className="text-slate-500">Маркетолог</dt><dd className="text-lg font-bold">{marketer ? 'есть' : 'нет'}</dd></div>
            <div className="rounded-xl bg-slate-50 p-3"><dt className="text-slate-500">Активные SKU</dt><dd className="text-lg font-bold">{activeSkuCount}</dd></div>
            <div className="rounded-xl bg-slate-50 p-3"><dt className="text-slate-500">OOS</dt><dd className="text-lg font-bold">{oosCount}</dd></div>
            <div className="rounded-xl bg-slate-50 p-3"><dt className="text-slate-500">Трафик</dt><dd className="text-lg font-bold">{player.lastWeekStats.traffic}</dd></div>
            <div className="rounded-xl bg-slate-50 p-3"><dt className="text-slate-500">Конверсия</dt><dd className="text-lg font-bold">{formatPercent(player.lastWeekStats.conversion)}</dd></div>
            <div className="col-span-2 rounded-xl bg-slate-50 p-3"><dt className="text-slate-500">Поставки в пути</dt><dd className="text-lg font-bold">{pendingOrders}</dd></div>
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-bold text-slate-900">Последние visualEvents</h3>
          <div className="mt-3 space-y-2">
            {recentEvents.map((event) => (
              <div key={event.id} className={`visual-event-pulse rounded-xl border p-3 text-sm ${severityClass[event.severity]}`}>
                <p className="font-bold">{event.title}</p>
                <p className="mt-1 text-xs opacity-80">Неделя {event.week}: {event.description}</p>
              </div>
            ))}
            {recentEvents.length === 0 && <p className="text-sm text-slate-500">Визуальные события появятся после действий игрока или недельного цикла.</p>}
          </div>
        </div>
      </aside>
    </section>
  );
}
