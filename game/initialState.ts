import { MARKET_SEGMENTS, MARKETING_EFFECTS, STORE_PROFILES } from './constants';
import { cloneBaseCategories, totalStock } from './calculations';
import { createCompetitors } from './competitors';
import { GameState, StoreEntity, StoreType } from './types';

const createPlayerStore = (type: StoreType): StoreEntity => {
  const profile = STORE_PROFILES[type];
  const categories = cloneBaseCategories();

  return {
    id: 'player',
    name: 'Ваш магазин',
    type,
    cash: profile.startCash,
    categories,
    marketingMode: 'Без рекламы',
    profile,
    staff: {
      headcount: profile.defaultStaff,
      averageSalary: 52_000,
      serviceLevel: profile.serviceLevel,
      workload: 0.85,
      churn: 0.08,
      trainingLevel: 0.15
    },
    reputation: profile.reputation,
    serviceLevel: profile.serviceLevel,
    expenses: {
      rent: profile.rent,
      operating: profile.operatingCosts,
      marketing: MARKETING_EFFECTS['Без рекламы'].cost,
      payroll: profile.defaultStaff * 52_000,
      penalties: 0
    },
    lastWeekStats: {
      weeklyRevenue: 0,
      weeklyProfit: 0,
      marginPercent: 0,
      traffic: profile.baseTraffic,
      conversion: 0,
      averageCheck: 0,
      totalStock: totalStock(categories),
      lostSales: 0,
      reputation: profile.reputation
    }
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
    marketPriceIndex: {}
  },
  eventLog: []
};

export const buildSessionState = (type: StoreType): GameState => ({
  ...initialState,
  sessionStarted: true,
  selectedStoreType: type,
  player: createPlayerStore(type),
  competitors: createCompetitors(),
  eventLog: [`Старт сессии: выбран формат «${type}».`]
});
