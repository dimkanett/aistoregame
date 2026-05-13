'use client';

import { paymentTermLabel } from '@/game/suppliers';
import { useGameStore } from '@/store/gameStore';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value);

export function SuppliersPanel() {
  const suppliers = useGameStore((state) => state.suppliers);
  const player = useGameStore((state) => state.player);
  const signSupplierAgreement = useGameStore((state) => state.signSupplierAgreement);

  if (!player) return null;

  const activeSupplierIds = new Set(player.supplierAgreements.filter((agreement) => agreement.active).map((agreement) => agreement.supplierId));

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Поставщики</h2>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {suppliers.map((supplier) => {
            const active = activeSupplierIds.has(supplier.id);
            return (
              <div key={supplier.id} className="rounded-lg border border-slate-200 p-4 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-indigo-100 text-xl font-black text-indigo-700" title={supplier.logoUrl ? supplier.name : 'Placeholder логотипа'}>
                      {supplier.logoUrl ? <span role="img" aria-label={supplier.name} className="h-full w-full rounded-xl bg-cover bg-center" style={{ backgroundImage: `url(${supplier.logoUrl})` }} /> : supplier.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{supplier.name}</p>
                      <p className="text-slate-600">Категории: {supplier.categories.join(', ')}</p>
                    </div>
                  </div>
                  <span className={active ? 'text-green-700' : 'text-slate-500'}>{active ? 'договор активен' : 'нет договора'}</span>
                </div>
                <div className="mt-3 grid gap-1 text-slate-600 sm:grid-cols-2">
                  <span>Цены: {supplier.priceLevel}</span>
                  <span>Качество: {(supplier.qualityLevel * 100).toFixed(0)}%</span>
                  <span>Оплата: {paymentTermLabel[supplier.paymentTerms]}</span>
                  <span>SLA: {supplier.deliverySLAWeeks} нед.</span>
                  <span>Надёжность: {(supplier.deliveryReliability * 100).toFixed(0)}%</span>
                  <span>Мин. заказ: {formatCurrency(supplier.minOrderValue)}</span>
                  <span>Логистика: {formatCurrency(supplier.logisticsCost)}</span>
                  <span>Бонус: -{(supplier.bonusTerms.discount * 100).toFixed(0)}% от {formatCurrency(supplier.bonusTerms.threshold)}</span>
                </div>
                <button
                  type="button"
                  className="mt-3 rounded-md bg-slate-900 px-3 py-1 text-white disabled:bg-slate-300"
                  disabled={active}
                  onClick={() => signSupplierAgreement(supplier.id)}
                >
                  Заключить договор
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="font-semibold">Заказы в пути и будущие платежи</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left">Поставщик</th>
                <th className="px-3 py-2 text-left">SKU</th>
                <th className="px-3 py-2 text-left">Кол-во</th>
                <th className="px-3 py-2 text-left">Сумма</th>
                <th className="px-3 py-2 text-left">Поставка</th>
                <th className="px-3 py-2 text-left">Оплата</th>
                <th className="px-3 py-2 text-left">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {player.purchaseOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-3 py-2">{suppliers.find((supplier) => supplier.id === order.supplierId)?.name}</td>
                  <td className="px-3 py-2">{player.productSkus.find((sku) => sku.id === order.skuId)?.name}</td>
                  <td className="px-3 py-2">{order.quantity}</td>
                  <td className="px-3 py-2">{formatCurrency(order.totalCost)}</td>
                  <td className="px-3 py-2">{order.expectedDeliveryWeek}</td>
                  <td className="px-3 py-2">{order.paymentDueWeek}</td>
                  <td className="px-3 py-2">{order.deliveryStatus} / {order.paymentStatus}</td>
                </tr>
              ))}
              {player.purchaseOrders.length === 0 && <tr><td className="px-3 py-3 text-slate-500" colSpan={7}>Заказов пока нет.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
