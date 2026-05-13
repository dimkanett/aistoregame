import { clamp, syncCategoriesFromSkus } from './calculations';
import { PurchaseOrder, StoreEntity, Supplier } from './types';

export const paymentTermLabel = {
  prepayment: 'Предоплата',
  on_delivery: 'Оплата при поставке',
  deferred_14: 'Отсрочка 14 дней',
  deferred_30: 'Отсрочка 30 дней'
};

export const createPurchaseOrder = (
  store: StoreEntity,
  supplier: Supplier,
  skuId: string,
  quantity: number,
  week: number
): { store: StoreEntity; order?: PurchaseOrder; message: string } => {
  const sku = store.productSkus.find((item) => item.id === skuId);
  if (!sku) return { store, message: 'SKU не найден.' };
  if (!supplier.categories.includes(sku.categoryId)) return { store, message: 'Поставщик не работает с этой категорией.' };
  if (quantity < supplier.minOrderQty) return { store, message: `Минимальный заказ: ${supplier.minOrderQty} шт.` };

  const rawCost = sku.purchasePrice * quantity;
  const discount = rawCost >= supplier.bonusTerms.threshold ? supplier.bonusTerms.discount : 0;
  const totalCost = Math.round(rawCost * (1 - discount) + supplier.logisticsCost);
  if (totalCost < supplier.minOrderValue) return { store, message: `Минимальная сумма заказа: ${supplier.minOrderValue.toLocaleString('ru-RU')} ₽.` };
  if (supplier.paymentTerms === 'prepayment' && store.cash < totalCost) return { store, message: 'Недостаточно денег для предоплаты.' };

  const expectedDeliveryWeek = week + supplier.deliverySLAWeeks;
  const paymentDueWeek = supplier.paymentTerms === 'prepayment' ? week : supplier.paymentTerms === 'on_delivery' ? expectedDeliveryWeek : week + (supplier.paymentTerms === 'deferred_14' ? 2 : 4);
  const order: PurchaseOrder = {
    id: `po-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    supplierId: supplier.id,
    skuId,
    quantity,
    unitPurchasePrice: Math.round(sku.purchasePrice * (1 - discount)),
    totalCost,
    createdWeek: week,
    expectedDeliveryWeek,
    paymentDueWeek,
    paymentStatus: supplier.paymentTerms === 'prepayment' ? 'paid' : 'unpaid',
    deliveryStatus: 'pending'
  };

  return {
    store: {
      ...store,
      cash: supplier.paymentTerms === 'prepayment' ? store.cash - totalCost : store.cash,
      purchaseOrders: [...store.purchaseOrders, order]
    },
    order,
    message: 'Заказ поставщику создан.'
  };
};

export const processPurchaseOrders = (
  store: StoreEntity,
  suppliers: Supplier[],
  week: number
): { store: StoreEntity; supplierPayments: number; overduePayments: number; events: string[] } => {
  let cash = store.cash;
  let supplierPayments = 0;
  let overduePayments = 0;
  const events: string[] = [];
  let productSkus = store.productSkus.map((sku) => ({ ...sku }));

  const purchaseOrders = store.purchaseOrders.map((order) => {
    const supplier = suppliers.find((item) => item.id === order.supplierId);
    let nextOrder = { ...order };

    if (supplier && (order.deliveryStatus === 'pending' || order.deliveryStatus === 'delayed') && order.expectedDeliveryWeek <= week) {
      const deterministicReliability = ((order.id.charCodeAt(order.id.length - 1) % 10) + 1) / 10;
      if (deterministicReliability <= supplier.deliveryReliability || order.expectedDeliveryWeek < week) {
        productSkus = productSkus.map((sku) =>
          sku.id === order.skuId ? { ...sku, stock: sku.stock + order.quantity, ageWeeks: 0, status: 'active' } : sku
        );
        nextOrder = { ...nextOrder, deliveryStatus: 'delivered', actualDeliveryWeek: week };
        events.push(`Неделя ${week}: поставлен товар по заказу ${order.id}.`);
      } else {
        nextOrder = { ...nextOrder, deliveryStatus: 'delayed', expectedDeliveryWeek: week + 1 };
        events.push(`Неделя ${week}: поставка ${order.id} задержана.`);
      }
    }

    if (nextOrder.paymentStatus === 'unpaid' && nextOrder.paymentDueWeek <= week) {
      if (cash >= nextOrder.totalCost) {
        cash -= nextOrder.totalCost;
        supplierPayments += nextOrder.totalCost;
        nextOrder = { ...nextOrder, paymentStatus: 'paid' };
      } else {
        overduePayments += nextOrder.totalCost;
        nextOrder = { ...nextOrder, paymentStatus: 'overdue' };
      }
    }

    return nextOrder;
  });

  const categories = syncCategoriesFromSkus(store.categories, productSkus);
  return {
    store: { ...store, cash: Math.round(cash), productSkus, categories, purchaseOrders },
    supplierPayments,
    overduePayments,
    events
  };
};

export const skuStatus = (stock: number, minStock: number, targetStock: number, ageWeeks: number): StoreEntity['productSkus'][number]['status'] => {
  if (stock <= 0) return 'out_of_stock';
  if (ageWeeks > 10 && stock > targetStock * 0.8) return 'dead';
  if (stock > targetStock * 1.5) return 'slow';
  if (stock < minStock) return 'slow';
  return 'active';
};
