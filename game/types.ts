export type StoreType =
  | 'Бутик в центре'
  | 'Хард-дискаунтер на окраине'
  | 'Магазин среднего ценового сегмента'
  | 'Интернет-магазин с точками выдачи';

export type GameTab =
  | 'dashboard'
  | 'store'
  | 'assortment'
  | 'marketing'
  | 'staff'
  | 'competitors'
  | 'banks'
  | 'market'
  | 'events'
  | 'analytics';

export type MarketingActivityCategory = 'traffic' | 'conversion' | 'loyalty' | 'brand' | 'clearance' | 'online';

export type SegmentName = 'Центр' | 'Спальные районы' | 'Онлайн-аудитория' | 'Эконом-сегмент';

export type CategoryName =
  | 'Посуда'
  | 'Текстиль'
  | 'Декор'
  | 'Бытовая химия'
  | 'Товары для кухни'
  | 'Подарки';

export type FinancialHealth = 'healthy' | 'strained' | 'cash_gap' | 'pre_bankruptcy' | 'bankrupt';

export type BusinessStrategy =
  | 'premium_margin'
  | 'discount_volume'
  | 'category_killer'
  | 'loss_leader'
  | 'loyalty_focus'
  | 'operational_efficiency'
  | 'assortment_uniqueness'
  | 'fast_turnover'
  | 'seasonal_capture'
  | 'survival'
  | 'balanced';

export type LoanType = 'working_capital' | 'overdraft' | 'investment' | 'crisis' | 'credit_line';
export type LoanStatus = 'active' | 'paid' | 'defaulted';
export type MarketPhase = 'рост' | 'стабильность' | 'стагнация' | 'кризис' | 'инфляционный рынок';

export interface CategoryState {
  id: string;
  name: CategoryName;
  stock: number;
  purchasePrice: number;
  retailPrice: number;
  baseMarketPrice: number;
  baseDemand: number;
  elasticity: number;
  seasonalFactor: number;
  margin: number;
}

export interface StoreProfile {
  type: StoreType;
  startCash: number;
  rent: number;
  baseTraffic: number;
  priceSensitivity: number;
  marketingDependency: number;
  serviceLevel: number;
  locationPower: number;
  reputation: number;
  operatingCosts: number;
  defaultStaff: number;
}

export interface StaffState {
  headcount: number;
  averageSalary: number;
  serviceLevel: number;
  workload: number;
  churn: number;
  trainingLevel: number;
}

export interface MarketingActivity {
  id: string;
  name: string;
  description: string;
  category: MarketingActivityCategory;
  weeklyCost: number;
  trafficModifier: number;
  conversionModifier: number;
  reputationModifier: number;
  loyaltyModifier: number;
  priceSensitivityModifier: number;
  marginImpact: number;
  effectivenessByStoreType: Record<StoreType, number>;
  fatigueRate: number;
  maxDurationWeeks?: number;
}

export interface MarketingActivityState {
  activityId: string;
  weeksActive: number;
  enabled: boolean;
}

export interface ExpenseState {
  rent: number;
  operating: number;
  marketing: number;
  payroll: number;
  penalties: number;
  loanPayments: number;
  writeOffs: number;
  returnsCost: number;
}

export interface WeeklyStats {
  weeklyRevenue: number;
  grossProfit: number;
  netProfit: number;
  weeklyProfit: number;
  marginPercent: number;
  traffic: number;
  conversion: number;
  averageCheck: number;
  totalStock: number;
  lostSales: number;
  expenses: number;
  marketingExpenses: number;
  payrollExpenses: number;
  rentExpenses: number;
  loanPayments: number;
  debtTotal: number;
  reputation: number;
  customerLoyalty: number;
  marketShare: number;
  cogs: number;
}

export interface WeeklyHistoryEntry {
  week: number;
  cash: number;
  revenue: number;
  grossProfit: number;
  netProfit: number;
  marginPercent: number;
  traffic: number;
  conversion: number;
  averageCheck: number;
  totalStock: number;
  lostSales: number;
  expenses: number;
  marketingExpenses: number;
  payrollExpenses: number;
  rentExpenses: number;
  loanPayments: number;
  debtTotal: number;
  reputation: number;
  customerLoyalty: number;
  marketShare: number;
}

export interface SegmentState {
  name: SegmentName;
  size: number;
  priceSensitivity: number;
  serviceSensitivity: number;
  reputationSensitivity: number;
  onlineAffinity: number;
}

export interface Bank {
  id: string;
  name: string;
  baseInterestRate: number;
  riskTolerance: number;
  maxLoanAmount: number;
  minTermWeeks: number;
  maxTermWeeks: number;
  approvalStrictness: number;
  description: string;
}

export interface LoanPayment {
  week: number;
  principalPart: number;
  interestPart: number;
  totalPayment: number;
  paid: boolean;
  overdue: boolean;
}

export interface LoanContract {
  id: string;
  bankId: string;
  loanType: LoanType;
  principal: number;
  remainingPrincipal: number;
  annualInterestRate: number;
  weeklyPayment: number;
  termWeeks: number;
  weeksRemaining: number;
  startWeek: number;
  paymentSchedule: LoanPayment[];
  status: LoanStatus;
}

export interface StoreEntity {
  id: string;
  name: string;
  type: StoreType;
  cash: number;
  categories: CategoryState[];
  activeMarketingActivities: MarketingActivityState[];
  profile: StoreProfile;
  staff: StaffState;
  reputation: number;
  customerLoyalty: number;
  repeatPurchaseRate: number;
  loyalCustomerBase: number;
  serviceLevel: number;
  expenses: ExpenseState;
  lastWeekStats: WeeklyStats;
  activeLoans: LoanContract[];
  creditScore: number;
  financialHealth: FinancialHealth;
  lossStreak: number;
  playerStrategy?: BusinessStrategy;
  competitorStrategy?: BusinessStrategy;
  categorySalesLastWeek: Record<string, number>;
  categoryLostSalesLastWeek: Record<string, number>;
  weeklyHistory: WeeklyHistoryEntry[];
  marketShare: number;
  isClosed?: boolean;
}

export interface MarketEvent {
  id: string;
  title: string;
  description: string;
  durationWeeks: number;
  effects: {
    maxMarginCap?: number;
    taxMultiplier?: number;
    discountAdPenalty?: number;
    importCostMultiplier?: number;
    complianceCost?: number;
    refinancingRateDelta?: number;
    inflationDelta?: number;
    consumerConfidenceDelta?: number;
    creditAvailabilityDelta?: number;
  };
}

export interface FinancialMarket {
  refinancingRate: number;
  inflationRate: number;
  consumerConfidence: number;
  creditAvailability: number;
}

export interface MarketState {
  weeklyCustomerPool: number;
  segments: SegmentState[];
  currentEvents: MarketEvent[];
  marketPriceIndex: Record<string, number>;
  marketingNoise: number;
  phase: MarketPhase;
  financialMarket: FinancialMarket;
}

export interface LoanApplicationResult {
  approved: boolean;
  message: string;
  contract?: LoanContract;
}

export interface GameState {
  week: number;
  sessionStarted: boolean;
  selectedStoreType: StoreType | null;
  player: StoreEntity | null;
  competitors: StoreEntity[];
  market: MarketState;
  banks: Bank[];
  eventLog: string[];
  lastLoanDecision: LoanApplicationResult | null;
}
