import { CITY_WORKERS, MARKETING_ACTIVITIES, STORE_PROFILES } from './constants';
import { cloneBaseCategories, cloneBaseSkus, deriveStaffFromEmployees, determineFinancialHealth, syncCategoriesFromSkus, totalDebt, totalSkuStock } from './calculations';
import { BusinessStrategy, MarketingActivityState, StoreEntity, StoreType, Worker } from './types';

const COMPETITOR_NAMES = ['Retail Nova', 'City Choice', 'Дом&Стиль', 'СмартМаркет', 'Лайм Ритейл', 'Urban Basket', 'StockHub', 'Белый Кит'];
const STORE_TYPES = Object.keys(STORE_PROFILES) as StoreType[];
const STRATEGIES: BusinessStrategy[] = ['premium_margin', 'discount_volume', 'category_killer', 'loyalty_focus', 'operational_efficiency', 'fast_turnover', 'seasonal_capture'];
const randomItem = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const defaultActivitiesByStrategy = (strategy: BusinessStrategy, cash: number): MarketingActivityState[] => {
  const roll = Math.random();
  if (roll < 0.6 || cash < 250_000) return [];
  if (roll < 0.85) return [{ activityId: strategy === 'fast_turnover' ? 'clearance_sale' : 'local_ads', weeksActive: 0, enabled: true }];
  if (strategy === 'premium_margin') return [{ activityId: 'brand_campaign', weeksActive: 0, enabled: true }];
  if (strategy === 'discount_volume') return [{ activityId: 'discount_campaign', weeksActive: 0, enabled: true }];
  if (strategy === 'loyalty_focus') return [{ activityId: 'loyalty_program', weeksActive: 0, enabled: true }];
  return [{ activityId: 'local_ads', weeksActive: 0, enabled: true }];
};

const createCompetitorEmployees = (storeId: string, offset: number): Worker[] => {
  const sellers = CITY_WORKERS.filter((worker) => worker.role === 'seller').slice(offset, offset + 3);
  const marketer = CITY_WORKERS.filter((worker) => worker.role === 'marketer')[offset % 15];
  return [...sellers, marketer].filter(Boolean).map((worker) => ({
    ...worker,
    id: `${storeId}-${worker.id}`,
    status: 'employed',
    employedBy: storeId,
    salaryCurrent: Math.round(worker.expectedSalary * 0.95),
    weeksEmployed: 1
  }));
};

export const createCompetitors = (): StoreEntity[] => {
  const total = 6 + Math.floor(Math.random() * 3);

  return Array.from({ length: total }).map((_, index) => {
    const type = randomItem(STORE_TYPES);
    const profile = STORE_PROFILES[type];
    const strategy = randomItem(STRATEGIES);
    const storeId = `competitor-${index + 1}`;
    const employees = createCompetitorEmployees(storeId, index * 3);
    const staff = deriveStaffFromEmployees(employees, 38_000);
    const productSkus = cloneBaseSkus(true).map((sku) => {
      const strategyPrice = strategy === 'premium_margin' ? 1.1 : strategy === 'discount_volume' ? 0.94 : 0.98 + Math.random() * 0.08;
      return {
        ...sku,
        retailPrice: Math.max(sku.purchasePrice * 1.08, Math.round(sku.baseMarketPrice * strategyPrice)),
        stock: Math.floor(sku.targetStock * (0.7 + Math.random() * 0.5)),
        status: 'active' as const
      };
    });
    const categories = syncCategoriesFromSkus(cloneBaseCategories(), productSkus);
    const cash = Math.round(profile.startCash * (0.8 + Math.random() * 0.35));
    const payroll = employees.reduce((sum, worker) => sum + (worker.salaryCurrent ?? worker.expectedSalary), 0) / 4.33;

    return {
      id: storeId,
      name: COMPETITOR_NAMES[index] ?? `Конкурент ${index + 1}`,
      type,
      cash,
      categories,
      productSkus,
      activeMarketingActivities: defaultActivitiesByStrategy(strategy, cash),
      profile,
      staff,
      employees,
      jobRequests: [],
      supplierAgreements: [{ supplierId: 'balanced_trade', storeId, startedWeek: 1, paymentTerms: 'on_delivery', deliverySLAWeeks: 1, priceModifier: 1, bonusTerms: { threshold: 220_000, discount: 0.04 }, active: true }],
      purchaseOrders: [],
      reputation: profile.reputation + Math.floor(Math.random() * 8 - 3),
      customerLoyalty: 45 + Math.floor(Math.random() * 18),
      repeatPurchaseRate: 0.16,
      loyalCustomerBase: Math.round(profile.baseTraffic * 0.16),
      serviceLevel: profile.serviceLevel,
      expenses: { rent: profile.rent / 4.33, operating: profile.operatingCosts / 4.33, marketing: 0, payroll, penalties: 0, loanPayments: 0, writeOffs: 0, returnsCost: 0, supplierPayments: 0 },
      lastWeekStats: { weeklyRevenue: 0, grossProfit: 0, netProfit: 0, weeklyProfit: 0, marginPercent: 0, traffic: 0, conversion: 0, averageCheck: 0, totalStock: totalSkuStock(productSkus), lostSales: 0, expenses: 0, marketingExpenses: 0, payrollExpenses: payroll, rentExpenses: profile.rent / 4.33, loanPayments: 0, debtTotal: 0, reputation: profile.reputation, customerLoyalty: 50, marketShare: 0, cogs: 0 },
      activeLoans: [],
      loanApplications: [],
      creditScore: 56 + Math.floor(Math.random() * 18),
      financialHealth: 'healthy',
      lossStreak: 0,
      competitorStrategy: strategy,
      categorySalesLastWeek: {},
      categoryLostSalesLastWeek: {},
      skuSalesLastWeek: {},
      skuLostSalesLastWeek: {},
      weeklyHistory: [],
      marketShare: 0
    };
  });
};

const nextActivitiesForStrategy = (store: StoreEntity, strategy: BusinessStrategy): MarketingActivityState[] => {
  const runwayGood = store.cash > store.profile.rent / 4.33 + store.profile.operatingCosts / 4.33 + 120_000;
  const previousWeek = store.weeklyHistory[store.weeklyHistory.length - 2];
  const trafficFell = Boolean(previousWeek) && store.lastWeekStats.traffic < previousWeek.traffic * 0.9;
  const lowStock = store.productSkus.some((sku) => sku.stock < sku.minStock);

  if (!runwayGood || lowStock) return [];
  if (store.lossStreak >= 5 || store.financialHealth === 'pre_bankruptcy' || store.financialHealth === 'cash_gap') return [{ activityId: 'clearance_sale', weeksActive: 0, enabled: true }];
  if (trafficFell || strategy === 'discount_volume') return [{ activityId: 'local_ads', weeksActive: 0, enabled: true }];
  if (strategy === 'premium_margin') return [{ activityId: 'brand_campaign', weeksActive: 0, enabled: true }];
  if (strategy === 'loyalty_focus') return [{ activityId: 'loyalty_program', weeksActive: 0, enabled: true }];
  return store.activeMarketingActivities.map((activity) => ({ ...activity, weeksActive: activity.enabled ? activity.weeksActive + 1 : 0 }));
};

export const makeCompetitorDecisions = (competitor: StoreEntity): StoreEntity => {
  if (competitor.isClosed) return competitor;

  const strategy = competitor.lossStreak >= 5 ? 'survival' : competitor.competitorStrategy ?? 'balanced';
  const losing = competitor.lossStreak >= 3;
  const priceShift = strategy === 'premium_margin' ? 1.02 : strategy === 'discount_volume' ? 0.985 : losing ? 1.025 : 1;
  const productSkus = competitor.productSkus.map((sku) => ({
    ...sku,
    retailPrice: Math.max(sku.purchasePrice * 1.08, Math.round(sku.retailPrice * priceShift))
  }));
  const categories = syncCategoriesFromSkus(competitor.categories, productSkus);
  const activeMarketingActivities = nextActivitiesForStrategy(competitor, strategy).filter((state) => {
    const meta = MARKETING_ACTIVITIES.find((activity) => activity.id === state.activityId);
    return Boolean(meta) && competitor.cash > (meta?.weeklyCost ?? 0) * 3;
  });
  const staffCut = losing && competitor.employees.filter((worker) => worker.role === 'seller').length > 2 ? 1 : 0;
  const employees = staffCut > 0 ? competitor.employees.slice(0, -staffCut) : competitor.employees;
  const staff = deriveStaffFromEmployees(employees, competitor.staff.averageSalary);
  const nextLossStreak = competitor.lastWeekStats.netProfit < 0 ? competitor.lossStreak + 1 : 0;

  return {
    ...competitor,
    categories,
    productSkus,
    activeMarketingActivities,
    employees,
    staff,
    competitorStrategy: strategy,
    financialHealth: determineFinancialHealth(competitor, competitor.cash, nextLossStreak),
    isClosed: competitor.financialHealth === 'bankrupt' && totalDebt(competitor) > competitor.cash + 50_000
  };
};
