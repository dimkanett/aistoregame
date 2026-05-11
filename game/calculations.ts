import { BASE_CATEGORIES } from './constants';
import { CategoryState, FinancialHealth, StoreEntity } from './types';

const round = (value: number): number => Math.round(value * 100) / 100;
const safeDivision = (num: number, den: number): number => (den === 0 ? 0 : num / den);

export const calculateCategoryMargin = (category: CategoryState): number =>
  round(safeDivision(category.retailPrice - category.purchasePrice, category.retailPrice) * 100);

export const withMargins = (categories: CategoryState[]): CategoryState[] =>
  categories.map((category) => ({ ...category, margin: calculateCategoryMargin(category) }));

export const cloneBaseCategories = (): CategoryState[] => withMargins(BASE_CATEGORIES.map((item) => ({ ...item })));

export const totalStock = (categories: CategoryState[]): number =>
  categories.reduce((sum, category) => sum + category.stock, 0);

export const averageMargin = (categories: CategoryState[]): number => {
  if (categories.length === 0) return 0;
  return round(categories.reduce((sum, category) => sum + category.margin, 0) / categories.length);
};

export const averagePriceIndex = (store: StoreEntity, marketPriceIndex: Record<string, number>): number => {
  if (store.categories.length === 0) return 1;

  const total = store.categories.reduce((acc, category) => {
    const market = marketPriceIndex[category.id] ?? category.baseMarketPrice;
    return acc + safeDivision(category.retailPrice, market);
  }, 0);

  return safeDivision(total, store.categories.length);
};

export const totalDebt = (store: StoreEntity): number =>
  store.activeLoans
    .filter((loan) => loan.status === 'active')
    .reduce((sum, loan) => sum + loan.remainingPrincipal, 0);

export const fixedWeeklyCosts = (store: StoreEntity): number =>
  store.profile.rent + store.profile.operatingCosts + store.staff.headcount * store.staff.averageSalary;

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

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
