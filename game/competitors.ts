import { MARKETING_EFFECTS, STORE_PROFILES } from './constants';
import { cloneBaseCategories, withMargins } from './calculations';
import { MarketingMode, StoreEntity, StoreType } from './types';

const COMPETITOR_NAMES = [
  'Retail Nova',
  'City Choice',
  'Дом&Стиль',
  'СмартМаркет',
  'Лайм Ритейл',
  'Urban Basket',
  'StockHub',
  'Белый Кит'
];

const STORE_TYPES = Object.keys(STORE_PROFILES) as StoreType[];
const MARKETING_OPTIONS: MarketingMode[] = Object.keys(MARKETING_EFFECTS) as MarketingMode[];

const randomItem = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

export const createCompetitors = (): StoreEntity[] => {
  const total = 6 + Math.floor(Math.random() * 3);

  return Array.from({ length: total }).map((_, index) => {
    const type = randomItem(STORE_TYPES);
    const profile = STORE_PROFILES[type];
    const categories = withMargins(
      cloneBaseCategories().map((category) => ({
        ...category,
        retailPrice: Math.round(category.baseMarketPrice * (0.92 + Math.random() * 0.22)),
        stock: Math.floor(category.stock * (0.8 + Math.random() * 0.7))
      }))
    );

    const marketingMode = MARKETING_OPTIONS[1 + Math.floor(Math.random() * 4)] ?? 'Без рекламы';

    return {
      id: `competitor-${index + 1}`,
      name: COMPETITOR_NAMES[index] ?? `Конкурент ${index + 1}`,
      type,
      cash: Math.round(profile.startCash * (0.8 + Math.random() * 0.45)),
      categories,
      marketingMode,
      profile,
      staff: {
        headcount: profile.defaultStaff + Math.floor(Math.random() * 3),
        averageSalary: 45_000 + Math.floor(Math.random() * 15_000),
        serviceLevel: profile.serviceLevel,
        workload: 0.85,
        churn: 0.08,
        trainingLevel: 0.15
      },
      reputation: profile.reputation + Math.floor(Math.random() * 8 - 3),
      serviceLevel: profile.serviceLevel,
      expenses: {
        rent: profile.rent,
        operating: profile.operatingCosts,
        marketing: MARKETING_EFFECTS[marketingMode].cost,
        payroll: profile.defaultStaff * 48_000,
        penalties: 0
      },
      lastWeekStats: {
        weeklyRevenue: 0,
        weeklyProfit: 0,
        marginPercent: 0,
        traffic: 0,
        conversion: 0,
        averageCheck: 0,
        totalStock: categories.reduce((sum, category) => sum + category.stock, 0),
        lostSales: 0,
        reputation: profile.reputation
      }
    };
  });
};

export const makeCompetitorDecisions = (competitor: StoreEntity): StoreEntity => {
  const revenue = competitor.lastWeekStats.weeklyRevenue;
  const lowSales = revenue > 0 && competitor.lastWeekStats.weeklyProfit < 0;
  const lowStock = competitor.categories.some((category) => category.stock < 20);

  const nextMarketing: MarketingMode = lowSales
    ? 'Скидочная кампания'
    : lowStock
      ? 'Онлайн-реклама'
      : randomItem(MARKETING_OPTIONS);

  const categories = withMargins(
    competitor.categories.map((category) => {
      const priceShift = lowSales ? 0.96 : lowStock ? 1.05 : 0.98 + Math.random() * 0.06;
      const order = category.stock < 25 ? 60 : category.stock < 50 ? 30 : 0;

      return {
        ...category,
        retailPrice: Math.max(category.purchasePrice + 20, Math.round(category.retailPrice * priceShift)),
        stock: category.stock + order
      };
    })
  );

  const marketingCost = MARKETING_EFFECTS[nextMarketing].cost;

  return {
    ...competitor,
    marketingMode: nextMarketing,
    categories,
    expenses: {
      ...competitor.expenses,
      marketing: marketingCost
    }
  };
};
