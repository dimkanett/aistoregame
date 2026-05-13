import { BASE_CATEGORIES, BASE_SKUS, WEEKS_PER_MONTH } from './constants';
import { CategoryState, FinancialHealth, ProductSku, StoreEntity, Worker } from './types';

const round = (value: number): number => Math.round(value * 100) / 100;
const safeDivision = (num: number, den: number): number => (den === 0 ? 0 : num / den);

export const calculateCategoryMargin = (category: CategoryState): number =>
  round(safeDivision(category.retailPrice - category.purchasePrice, category.retailPrice) * 100);

export const calculateSkuMargin = (sku: ProductSku): number =>
  round(safeDivision(sku.retailPrice - sku.purchasePrice, sku.retailPrice) * 100);

export const withMargins = (categories: CategoryState[]): CategoryState[] =>
  categories.map((category) => ({ ...category, margin: calculateCategoryMargin(category) }));

export const cloneBaseCategories = (): CategoryState[] => withMargins(BASE_CATEGORIES.map((item) => ({ ...item })));

export const cloneBaseSkus = (withStarterStock = false): ProductSku[] =>
  BASE_SKUS.map((item) => ({
    ...item,
    stock: withStarterStock ? item.targetStock : 0,
    status: withStarterStock ? 'active' : 'out_of_stock'
  }));

export const totalStock = (categories: CategoryState[]): number => categories.reduce((sum, category) => sum + category.stock, 0);

export const totalSkuStock = (skus: ProductSku[]): number => skus.reduce((sum, sku) => sum + sku.stock, 0);

export const inventoryPurchaseValue = (skus: ProductSku[]): number =>
  skus.reduce((sum, sku) => sum + sku.stock * sku.purchasePrice, 0);

export const syncCategoriesFromSkus = (categories: CategoryState[], skus: ProductSku[]): CategoryState[] =>
  categories.map((category) => {
    const categorySkus = skus.filter((sku) => sku.categoryId === category.id);
    const stock = categorySkus.reduce((sum, sku) => sum + sku.stock, 0);
    const purchasePrice = Math.round(
      safeDivision(categorySkus.reduce((sum, sku) => sum + sku.purchasePrice, 0), Math.max(1, categorySkus.length))
    );
    const retailPrice = Math.round(safeDivision(categorySkus.reduce((sum, sku) => sum + sku.retailPrice, 0), Math.max(1, categorySkus.length)));
    const baseMarketPrice = Math.round(
      safeDivision(categorySkus.reduce((sum, sku) => sum + sku.baseMarketPrice, 0), Math.max(1, categorySkus.length))
    );

    return {
      ...category,
      stock,
      purchasePrice,
      retailPrice,
      baseMarketPrice,
      margin: calculateCategoryMargin({ ...category, purchasePrice, retailPrice })
    };
  });

export const averageMargin = (categories: CategoryState[]): number => {
  if (categories.length === 0) return 0;
  return round(categories.reduce((sum, category) => sum + category.margin, 0) / categories.length);
};

export const averagePriceIndex = (store: StoreEntity, marketPriceIndex: Record<string, number>): number => {
  const source = store.productSkus.length > 0 ? store.productSkus : [];
  if (source.length > 0) {
    const total = source.reduce((acc, sku) => {
      const market = marketPriceIndex[sku.id] ?? sku.baseMarketPrice;
      return acc + safeDivision(sku.retailPrice, market);
    }, 0);
    return safeDivision(total, source.length);
  }

  if (store.categories.length === 0) return 1;
  const total = store.categories.reduce((acc, category) => {
    const market = marketPriceIndex[category.id] ?? category.baseMarketPrice;
    return acc + safeDivision(category.retailPrice, market);
  }, 0);

  return safeDivision(total, store.categories.length);
};

export const totalDebt = (store: StoreEntity): number =>
  store.activeLoans.filter((loan) => loan.status === 'active').reduce((sum, loan) => sum + loan.remainingPrincipal, 0);

export const monthlyPayroll = (store: StoreEntity): number =>
  store.employees.length > 0
    ? store.employees.reduce((sum, worker) => sum + (worker.salaryCurrent ?? worker.expectedSalary), 0)
    : store.staff.headcount * store.staff.averageSalary;

export const fixedWeeklyCosts = (store: StoreEntity): number =>
  store.profile.rent / WEEKS_PER_MONTH + store.profile.operatingCosts / WEEKS_PER_MONTH + monthlyPayroll(store) / WEEKS_PER_MONTH;

export const determineFinancialHealth = (store: StoreEntity, nextCash = store.cash, nextLossStreak = store.lossStreak): FinancialHealth => {
  const fixedCosts = fixedWeeklyCosts(store);
  const debt = totalDebt(store);
  const debtLoad = safeDivision(debt, Math.max(1, nextCash + fixedCosts * 4));

  if (nextCash < -fixedCosts * 3 || (nextLossStreak >= 4 && debtLoad > 0.8)) return 'bankrupt';
  if (nextCash < -fixedCosts || nextLossStreak >= 3) return 'pre_bankruptcy';
  if (nextCash < 0) return 'cash_gap';
  if (nextCash < fixedCosts * 2 || nextLossStreak >= 2) return 'strained';

  return 'healthy';
};

export const deriveStaffFromEmployees = (employees: Worker[], fallbackAverageSalary: number): StoreEntity['staff'] => {
  const sellers = employees.filter((worker) => worker.role === 'seller');
  const salaryTotal = sellers.reduce((sum, worker) => sum + (worker.salaryCurrent ?? worker.expectedSalary), 0);
  const averageSalary = sellers.length > 0 ? Math.round(salaryTotal / sellers.length) : fallbackAverageSalary;
  const serviceBase = sellers.length > 0
    ? sellers.reduce((sum, worker) => sum + worker.training * 0.25 + worker.salesSkill * 0.35 + worker.discipline * 0.2 + worker.stressResistance * 0.2, 0) /
      sellers.length /
      100
    : 0.45;

  return {
    headcount: sellers.length,
    averageSalary,
    serviceLevel: Math.min(1.55, Math.max(0.45, serviceBase + 0.35)),
    workload: 0.75,
    churn: 0.06,
    trainingLevel: sellers.length > 0 ? sellers.reduce((sum, worker) => sum + worker.training, 0) / sellers.length / 100 : 0.1
  };
};

export const marketerEffectiveness = (employees: Worker[]): number => {
  const marketers = employees.filter((worker) => worker.role === 'marketer');
  if (marketers.length === 0) return 0;
  const best = Math.max(
    ...marketers.map((worker) => 0.75 + worker.training * 0.0015 + worker.salesSkill * 0.002 + worker.discipline * 0.001 + worker.experienceLevel * 0.001)
  );
  return Math.min(1.25, Math.max(0.65, best));
};

export const hasMarketer = (store: StoreEntity): boolean => store.employees.some((worker) => worker.role === 'marketer');

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
