import { MARKETING_ACTIVITIES, STORE_PROFILES } from './constants';
import { cloneBaseCategories, determineFinancialHealth, totalDebt, totalStock, withMargins } from './calculations';
import { BusinessStrategy, MarketingActivityState, StoreEntity, StoreType } from './types';

const COMPETITOR_NAMES = ['Retail Nova', 'City Choice', 'Дом&Стиль', 'СмартМаркет', 'Лайм Ритейл', 'Urban Basket', 'StockHub', 'Белый Кит'];
const STORE_TYPES = Object.keys(STORE_PROFILES) as StoreType[];
const STRATEGIES: BusinessStrategy[] = [
  'premium_margin',
  'discount_volume',
  'category_killer',
  'loyalty_focus',
  'operational_efficiency',
  'fast_turnover',
  'seasonal_capture'
];

const randomItem = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const defaultActivitiesByStrategy = (strategy: BusinessStrategy): MarketingActivityState[] => {
  if (strategy === 'premium_margin') return [{ activityId: 'brand_campaign', weeksActive: 0, enabled: true }];
  if (strategy === 'discount_volume') return [{ activityId: 'discount_campaign', weeksActive: 0, enabled: true }];
  if (strategy === 'loyalty_focus') return [{ activityId: 'loyalty_program', weeksActive: 0, enabled: true }];
  if (strategy === 'fast_turnover') return [{ activityId: 'clearance_sale', weeksActive: 0, enabled: true }];
  return [{ activityId: 'local_ads', weeksActive: 0, enabled: true }];
};

export const createCompetitors = (): StoreEntity[] => {
  const total = 6 + Math.floor(Math.random() * 3);

  return Array.from({ length: total }).map((_, index) => {
    const type = randomItem(STORE_TYPES);
    const profile = STORE_PROFILES[type];
    const strategy = randomItem(STRATEGIES);
    const categories = withMargins(
      cloneBaseCategories().map((category) => {
        const strategyPrice = strategy === 'premium_margin' ? 1.12 : strategy === 'discount_volume' ? 0.93 : 0.98 + Math.random() * 0.08;
        return {
          ...category,
          retailPrice: Math.max(category.purchasePrice * 1.08, Math.round(category.baseMarketPrice * strategyPrice)),
          stock: Math.floor(category.stock * (0.85 + Math.random() * 0.55))
        };
      })
    );
    const salary = 35_000 + Math.floor(Math.random() * 9_000);
    const payroll = profile.defaultStaff * salary;

    return {
      id: `competitor-${index + 1}`,
      name: COMPETITOR_NAMES[index] ?? `Конкурент ${index + 1}`,
      type,
      cash: Math.round(profile.startCash * (0.8 + Math.random() * 0.35)),
      categories,
      activeMarketingActivities: defaultActivitiesByStrategy(strategy),
      profile,
      staff: {
        headcount: profile.defaultStaff + Math.floor(Math.random() * 3),
        averageSalary: salary,
        serviceLevel: profile.serviceLevel,
        workload: 0.8,
        churn: 0.07,
        trainingLevel: 0.12
      },
      reputation: profile.reputation + Math.floor(Math.random() * 8 - 3),
      customerLoyalty: 45 + Math.floor(Math.random() * 18),
      repeatPurchaseRate: 0.16,
      loyalCustomerBase: Math.round(profile.baseTraffic * 0.16),
      serviceLevel: profile.serviceLevel,
      expenses: {
        rent: profile.rent,
        operating: profile.operatingCosts,
        marketing: 0,
        payroll,
        penalties: 0,
        loanPayments: 0,
        writeOffs: 0,
        returnsCost: 0
      },
      lastWeekStats: {
        weeklyRevenue: 0,
        grossProfit: 0,
        netProfit: 0,
        weeklyProfit: 0,
        marginPercent: 0,
        traffic: 0,
        conversion: 0,
        averageCheck: 0,
        totalStock: totalStock(categories),
        lostSales: 0,
        expenses: 0,
        marketingExpenses: 0,
        payrollExpenses: payroll,
        rentExpenses: profile.rent,
        loanPayments: 0,
        debtTotal: 0,
        reputation: profile.reputation,
        customerLoyalty: 50,
        marketShare: 0,
        cogs: 0
      },
      activeLoans: [],
      creditScore: 56 + Math.floor(Math.random() * 18),
      financialHealth: 'healthy',
      lossStreak: 0,
      competitorStrategy: strategy,
      categorySalesLastWeek: {},
      categoryLostSalesLastWeek: {},
      weeklyHistory: [],
      marketShare: 0
    };
  });
};

const nextActivitiesForStrategy = (store: StoreEntity, strategy: BusinessStrategy): MarketingActivityState[] => {
  const losing = store.lossStreak >= 2;
  const survival = store.lossStreak >= 5 || store.financialHealth === 'pre_bankruptcy' || store.financialHealth === 'cash_gap';
  const current = store.activeMarketingActivities.map((activity) => ({ ...activity, weeksActive: activity.enabled ? activity.weeksActive + 1 : 0 }));

  if (survival) return [{ activityId: 'clearance_sale', weeksActive: 0, enabled: true }];
  if (losing) return [{ activityId: 'local_ads', weeksActive: 0, enabled: true }];

  const desired = defaultActivitiesByStrategy(strategy);
  return desired.map((activity) => current.find((item) => item.activityId === activity.activityId) ?? activity);
};

export const makeCompetitorDecisions = (competitor: StoreEntity): StoreEntity => {
  if (competitor.isClosed) return competitor;

  const strategy = competitor.lossStreak >= 5 ? 'survival' : competitor.competitorStrategy ?? 'balanced';
  const lowStock = competitor.categories.some((category) => category.stock < 25);
  const losing = competitor.lossStreak >= 3;
  const priceShift = strategy === 'premium_margin' ? 1.03 : strategy === 'discount_volume' ? 0.98 : losing ? 1.04 : 1;

  const categories = withMargins(
    competitor.categories.map((category) => {
      const order = lowStock && competitor.cash > 0 ? (category.stock < 30 ? 50 : 15) : 0;
      const restockCost = order * category.purchasePrice;
      return {
        ...category,
        retailPrice: Math.max(category.purchasePrice * 1.08, Math.round(category.retailPrice * priceShift)),
        stock: category.stock + (competitor.cash > restockCost ? order : 0)
      };
    })
  );

  const activityCost = nextActivitiesForStrategy(competitor, strategy).reduce((sum, activity) => {
    const meta = MARKETING_ACTIVITIES.find((item) => item.id === activity.activityId);
    return sum + (meta?.weeklyCost ?? 0);
  }, 0);

  const staffCut = losing && competitor.staff.headcount > 3 ? 1 : 0;
  const cashAfterRestock = categories.reduce((cash, category, index) => {
    const previous = competitor.categories[index];
    return cash - Math.max(0, category.stock - previous.stock) * category.purchasePrice;
  }, competitor.cash);

  const nextLossStreak = competitor.lastWeekStats.netProfit < 0 ? competitor.lossStreak + 1 : 0;

  return {
    ...competitor,
    cash: cashAfterRestock,
    categories,
    activeMarketingActivities: nextActivitiesForStrategy(competitor, strategy),
    staff: {
      ...competitor.staff,
      headcount: Math.max(2, competitor.staff.headcount - staffCut)
    },
    expenses: {
      ...competitor.expenses,
      marketing: activityCost
    },
    competitorStrategy: strategy,
    financialHealth: determineFinancialHealth(competitor, competitor.cash, nextLossStreak),
    isClosed: competitor.financialHealth === 'bankrupt' && totalDebt(competitor) > competitor.cash + 50_000
  };
};
