import { BANKS, MARKET_SEGMENTS, STORE_PROFILES } from './constants';
import { cloneBaseCategories, totalStock } from './calculations';
import { createCompetitors } from './competitors';
import { GameState, StoreEntity, StoreType, WeeklyStats } from './types';

const createEmptyStats = (profile: StoreEntity['profile'], categories: StoreEntity['categories']): WeeklyStats => ({
  weeklyRevenue: 0,
  grossProfit: 0,
  netProfit: 0,
  weeklyProfit: 0,
  marginPercent: 0,
  traffic: profile.baseTraffic,
  conversion: 0,
  averageCheck: 0,
  totalStock: totalStock(categories),
  lostSales: 0,
  expenses: 0,
  marketingExpenses: 0,
  payrollExpenses: profile.defaultStaff * 38_000,
  rentExpenses: profile.rent,
  loanPayments: 0,
  debtTotal: 0,
  reputation: profile.reputation,
  customerLoyalty: 50,
  marketShare: 0,
  cogs: 0
});

export const createStoreEntity = (id: string, name: string, type: StoreType, isPlayer = false): StoreEntity => {
  const profile = STORE_PROFILES[type];
  const categories = cloneBaseCategories();
  const salary = isPlayer ? 38_000 : 36_000 + Math.floor(Math.random() * 8_000);
  const stats = createEmptyStats(profile, categories);

  return {
    id,
    name,
    type,
    cash: profile.startCash,
    categories,
    activeMarketingActivities: isPlayer ? [] : [{ activityId: 'local_ads', weeksActive: 0, enabled: true }],
    profile,
    staff: {
      headcount: profile.defaultStaff,
      averageSalary: salary,
      serviceLevel: profile.serviceLevel,
      workload: 0.75,
      churn: 0.06,
      trainingLevel: 0.15
    },
    reputation: profile.reputation,
    customerLoyalty: isPlayer ? 52 : 45 + Math.floor(Math.random() * 16),
    repeatPurchaseRate: 0.18,
    loyalCustomerBase: Math.round(profile.baseTraffic * 0.18),
    serviceLevel: profile.serviceLevel,
    expenses: {
      rent: profile.rent,
      operating: profile.operatingCosts,
      marketing: 0,
      payroll: profile.defaultStaff * salary,
      penalties: 0,
      loanPayments: 0,
      writeOffs: 0,
      returnsCost: 0
    },
    lastWeekStats: stats,
    activeLoans: [],
    creditScore: isPlayer ? 68 : 56 + Math.floor(Math.random() * 18),
    financialHealth: 'healthy',
    lossStreak: 0,
    playerStrategy: isPlayer ? 'balanced' : undefined,
    competitorStrategy: isPlayer ? undefined : 'balanced',
    categorySalesLastWeek: {},
    categoryLostSalesLastWeek: {},
    weeklyHistory: [],
    marketShare: 0
  };
};

export const initialState: GameState = {
  week: 1,
  sessionStarted: false,
  selectedStoreType: null,
  player: null,
  competitors: [],
  market: {
    weeklyCustomerPool: 10_000,
    segments: MARKET_SEGMENTS,
    currentEvents: [],
    marketPriceIndex: {},
    marketingNoise: 0,
    phase: 'стабильность',
    financialMarket: {
      refinancingRate: 0.075,
      inflationRate: 0.055,
      consumerConfidence: 0.72,
      creditAvailability: 0.78
    }
  },
  banks: BANKS,
  eventLog: [],
  lastLoanDecision: null
};

export const buildSessionState = (type: StoreType): GameState => ({
  ...initialState,
  sessionStarted: true,
  selectedStoreType: type,
  player: createStoreEntity('player', 'Ваш магазин', type, true),
  competitors: createCompetitors(),
  eventLog: [`Старт сессии: выбран формат «${type}».`]
});
