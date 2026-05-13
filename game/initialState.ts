import { BANKS, CITY_WORKERS, MARKET_SEGMENTS, STORE_PROFILES, SUPPLIERS } from './constants';
import { cloneBaseCategories, cloneBaseSkus, deriveStaffFromEmployees, syncCategoriesFromSkus, totalSkuStock } from './calculations';
import { createCompetitors } from './competitors';
import { GameState, StoreEntity, StoreType, WeeklyStats, Worker } from './types';

const createEmptyStats = (profile: StoreEntity['profile'], stock: number): WeeklyStats => ({
  weeklyRevenue: 0,
  grossProfit: 0,
  netProfit: 0,
  weeklyProfit: 0,
  marginPercent: 0,
  traffic: profile.baseTraffic,
  conversion: 0,
  averageCheck: 0,
  totalStock: stock,
  lostSales: 0,
  expenses: 0,
  marketingExpenses: 0,
  payrollExpenses: 0,
  rentExpenses: profile.rent / 4.33,
  loanPayments: 0,
  debtTotal: 0,
  reputation: profile.reputation,
  customerLoyalty: 50,
  marketShare: 0,
  cogs: 0
});

export const createStoreEntity = (id: string, name: string, type: StoreType, isPlayer = false, employees: Worker[] = []): StoreEntity => {
  const profile = STORE_PROFILES[type];
  const productSkus = cloneBaseSkus(!isPlayer);
  const categories = syncCategoriesFromSkus(cloneBaseCategories(), productSkus);
  const staff = deriveStaffFromEmployees(employees, 40_000);
  const stock = totalSkuStock(productSkus);
  const stats = createEmptyStats(profile, stock);

  return {
    id,
    name,
    type,
    cash: profile.startCash,
    categories,
    productSkus,
    activeMarketingActivities: [],
    profile,
    staff,
    employees,
    jobRequests: [],
    supplierAgreements: isPlayer
      ? []
      : [
          {
            supplierId: 'balanced_trade',
            storeId: id,
            startedWeek: 1,
            paymentTerms: 'on_delivery',
            deliverySLAWeeks: 1,
            priceModifier: 1,
            bonusTerms: { threshold: 220_000, discount: 0.04 },
            active: true
          }
        ],
    purchaseOrders: [],
    reputation: profile.reputation,
    customerLoyalty: isPlayer ? 52 : 45 + Math.floor(Math.random() * 16),
    repeatPurchaseRate: 0.18,
    loyalCustomerBase: Math.round(profile.baseTraffic * 0.18),
    serviceLevel: profile.serviceLevel,
    expenses: {
      rent: profile.rent / 4.33,
      operating: profile.operatingCosts / 4.33,
      marketing: 0,
      payroll: 0,
      penalties: 0,
      loanPayments: 0,
      writeOffs: 0,
      returnsCost: 0,
      supplierPayments: 0
    },
    lastWeekStats: stats,
    activeLoans: [],
    loanApplications: [],
    creditScore: isPlayer ? 68 : 56 + Math.floor(Math.random() * 18),
    financialHealth: 'healthy',
    lossStreak: 0,
    playerStrategy: isPlayer ? 'balanced' : undefined,
    competitorStrategy: isPlayer ? undefined : 'balanced',
    categorySalesLastWeek: {},
    categoryLostSalesLastWeek: {},
    skuSalesLastWeek: {},
    skuLostSalesLastWeek: {},
    weeklyHistory: [],
    marketShare: 0
  };
};

export const initialState: GameState = {
  week: 1,
  gamePhase: 'setup',
  sessionStarted: false,
  selectedStoreType: null,
  player: null,
  competitors: [],
  market: {
    weeklyCustomerPool: 25_000,
    segments: MARKET_SEGMENTS,
    currentEvents: [],
    marketPriceIndex: {},
    skuMarketPriceIndex: {},
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
  suppliers: SUPPLIERS,
  cityWorkers: CITY_WORKERS,
  eventLog: [],
  lastLoanDecision: null
};

export const buildSessionState = (type: StoreType): GameState => {
  const player = createStoreEntity('player', 'Ваш магазин', type, true);
  return {
    ...initialState,
    gamePhase: 'setup',
    sessionStarted: true,
    selectedStoreType: type,
    player,
    competitors: createCompetitors(),
    cityWorkers: CITY_WORKERS.map((worker) => ({ ...worker })),
    eventLog: [`Старт подготовки: выбран формат «${type}». Наймите персонал, выберите поставщиков и закупите стартовый товар.`]
  };
};
