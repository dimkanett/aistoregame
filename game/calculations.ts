import { BASE_CATEGORIES } from './constants';
import { CategoryState, StoreEntity } from './types';

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

export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
