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
  | 'suppliers'
  | 'market'
  | 'events'
  | 'analytics';

export type GamePhase = 'setup' | 'running' | 'bankrupt';
export type MarketingActivityCategory = 'traffic' | 'conversion' | 'loyalty' | 'brand' | 'clearance' | 'online';
export type SegmentName = 'Центр' | 'Спальные районы' | 'Онлайн-аудитория' | 'Эконом-сегмент';
export type CategoryName = 'Посуда' | 'Текстиль' | 'Декор' | 'Бытовая химия' | 'Товары для кухни' | 'Подарки';
export type ProductSegment = 'cheap' | 'mid' | 'premium';
export type ProductStatus = 'active' | 'blocked' | 'slow' | 'dead' | 'out_of_stock';
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
export type LoanApplicationStatus = 'approved' | 'conditional' | 'rejected';
export type MarketPhase = 'рост' | 'стабильность' | 'стагнация' | 'кризис' | 'инфляционный рынок';
export type WorkerRole = 'seller' | 'marketer';
export type WorkerStatus = 'available' | 'employed' | 'unavailable';
export type WorkerAgeGroup = 'young' | 'middle' | 'senior';
export type JobRequestStatus = 'open' | 'processed' | 'cancelled';
export type PaymentTerms = 'prepayment' | 'on_delivery' | 'deferred_14' | 'deferred_30';
export type SupplierPriceLevel = 'low' | 'medium' | 'high';
export type PurchasePaymentStatus = 'unpaid' | 'paid' | 'overdue';
export type PurchaseDeliveryStatus = 'pending' | 'delivered' | 'delayed' | 'cancelled';

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

export interface ProductSku {
  id: string;
  categoryId: string;
  name: string;
  segment: ProductSegment;
  purchasePrice: number;
  baseMarketPrice: number;
  retailPrice: number;
  stock: number;
  baseDemandWeight: number;
  elasticity: number;
  quality: number;
  brandPower: number;
  seasonality: number;
  supplierId?: string;
  minStock: number;
  targetStock: number;
  ageWeeks: number;
  status: ProductStatus;
  imageUrl?: string;
  autoReorderEnabled: boolean;
  preferredSupplierId?: string;
  reorderMinStock: number;
  reorderTargetStock: number;
  maxAutoOrderValue?: number;
}

export interface StoreProfile {
  type: StoreType;
  startCash: number;
  rent: number;
  baseTraffic: number;
  basketSize: number;
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

export interface Worker {
  id: string;
  name: string;
  role: WorkerRole;
  ageGroup: WorkerAgeGroup;
  expectedSalary: number;
  minAcceptableSalary: number;
  experienceLevel: number;
  loyalty: number;
  training: number;
  stressResistance: number;
  salesSkill: number;
  discipline: number;
  status: WorkerStatus;
  avatarUrl?: string;
  employedBy?: string;
  salaryCurrent?: number;
  weeksEmployed: number;
  preferences: string[];
  unavailableUntilWeek?: number;
}

export interface JobRequest {
  id: string;
  storeId: string;
  role: WorkerRole;
  offeredSalary: number;
  createdWeek: number;
  status: JobRequestStatus;
  candidates: string[];
  selectedWorkerId?: string;
  expiresWeek: number;
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
  requiresMarketer?: boolean;
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
  supplierPayments: number;
  payrollAccruedExpense: number;
  payrollCashPaid: number;
  salaryDebt: number;
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
  activeSkuCount: number;
  blockedSkuCount: number;
  outOfStockActiveSkuCount: number;
  payrollAccrued: number;
  payrollCashPaid: number;
  salaryDebt: number;
  sellerCount: number;
  marketerCount: number;
  autoOrdersCreated: number;
  autoOrdersFailed: number;
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
  logoUrl?: string;
  minCreditScore: number;
  minDSCR: number;
  maxDebtToRevenue: number;
  maxDebtToGrossProfit: number;
  minCashRunwayWeeks: number;
  collateralRequired: boolean;
  allowedLoanTypes: LoanType[];
  cooldownWeeksAfterRejection: number;
  requiresPositiveProfitTrend: boolean;
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

export interface AlternativeLoanOffer {
  amount: number;
  termWeeks: number;
  annualInterestRate: number;
  weeklyPayment: number;
  loanType: LoanType;
  conditions: string[];
}

export interface LoanApplication {
  id: string;
  week: number;
  bankId: string;
  loanType: LoanType;
  amount: number;
  termWeeks: number;
  status: LoanApplicationStatus;
  reasons: string[];
  calculatedDSCR: number;
  calculatedDebtLoad: number;
  calculatedCashRunway: number;
  calculatedCreditScore: number;
  proposedRate: number;
  proposedWeeklyPayment: number;
  cooldownUntilWeek: number;
  alternativeOffer?: AlternativeLoanOffer;
}

export interface Supplier {
  id: string;
  name: string;
  categories: string[];
  skuIds?: string[];
  priceLevel: SupplierPriceLevel;
  qualityLevel: number;
  paymentTerms: PaymentTerms;
  deliverySLAWeeks: number;
  deliveryReliability: number;
  minOrderValue: number;
  minOrderQty: number;
  logisticsCost: number;
  bonusTerms: {
    threshold: number;
    discount: number;
  };
  returnPolicy: string;
  exclusivityPotential: number;
  reputationRequirement?: number;
  logoUrl?: string;
}

export interface SupplierAgreement {
  supplierId: string;
  storeId: string;
  startedWeek: number;
  paymentTerms: PaymentTerms;
  deliverySLAWeeks: number;
  priceModifier: number;
  bonusTerms: Supplier['bonusTerms'];
  active: boolean;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  skuId: string;
  quantity: number;
  unitPurchasePrice: number;
  totalCost: number;
  createdWeek: number;
  expectedDeliveryWeek: number;
  actualDeliveryWeek?: number;
  paymentDueWeek: number;
  paymentStatus: PurchasePaymentStatus;
  deliveryStatus: PurchaseDeliveryStatus;
}

export interface StoreEntity {
  id: string;
  name: string;
  type: StoreType;
  cash: number;
  categories: CategoryState[];
  productSkus: ProductSku[];
  activeMarketingActivities: MarketingActivityState[];
  profile: StoreProfile;
  staff: StaffState;
  employees: Worker[];
  jobRequests: JobRequest[];
  supplierAgreements: SupplierAgreement[];
  purchaseOrders: PurchaseOrder[];
  reputation: number;
  customerLoyalty: number;
  repeatPurchaseRate: number;
  loyalCustomerBase: number;
  serviceLevel: number;
  expenses: ExpenseState;
  lastWeekStats: WeeklyStats;
  activeLoans: LoanContract[];
  loanApplications: LoanApplication[];
  creditScore: number;
  financialHealth: FinancialHealth;
  lossStreak: number;
  playerStrategy?: BusinessStrategy;
  competitorStrategy?: BusinessStrategy;
  categorySalesLastWeek: Record<string, number>;
  categoryLostSalesLastWeek: Record<string, number>;
  skuSalesLastWeek: Record<string, number>;
  skuLostSalesLastWeek: Record<string, number>;
  weeklyHistory: WeeklyHistoryEntry[];
  marketShare: number;
  payrollAccrued: number;
  salaryDebt: number;
  nextPayrollWeek: number;
  payrollCycleWeeks: number;
  imageUrl?: string;
  iconType?: string;
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
  skuMarketPriceIndex: Record<string, number>;
  marketingNoise: number;
  phase: MarketPhase;
  financialMarket: FinancialMarket;
}

export interface LoanApplicationResult {
  approved: boolean;
  message: string;
  contract?: LoanContract;
  application?: LoanApplication;
}

export interface GameState {
  week: number;
  gamePhase: GamePhase;
  sessionStarted: boolean;
  selectedStoreType: StoreType | null;
  player: StoreEntity | null;
  competitors: StoreEntity[];
  market: MarketState;
  banks: Bank[];
  suppliers: Supplier[];
  cityWorkers: Worker[];
  eventLog: string[];
  lastLoanDecision: LoanApplicationResult | null;
}
