export type StoreType =
  | 'Бутик в центре'
  | 'Хард-дискаунтер на окраине'
  | 'Магазин среднего ценового сегмента'
  | 'Интернет-магазин с точками выдачи';

export type MarketingMode =
  | 'Без рекламы'
  | 'Локальная реклама'
  | 'Скидочная кампания'
  | 'Онлайн-реклама'
  | 'Имиджевая кампания';

export type SegmentName = 'Центр' | 'Спальные районы' | 'Онлайн-аудитория' | 'Эконом-сегмент';

export type CategoryName =
  | 'Посуда'
  | 'Текстиль'
  | 'Декор'
  | 'Бытовая химия'
  | 'Товары для кухни'
  | 'Подарки';

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

export interface MarketingEffect {
  cost: number;
  trafficBoost: number;
  reputationImpact: number;
  priceTolerance: number;
  byStoreTypeMultiplier: Partial<Record<StoreType, number>>;
}

export interface ExpenseState {
  rent: number;
  operating: number;
  marketing: number;
  payroll: number;
  penalties: number;
}

export interface WeeklyStats {
  weeklyRevenue: number;
  weeklyProfit: number;
  marginPercent: number;
  traffic: number;
  conversion: number;
  averageCheck: number;
  totalStock: number;
  lostSales: number;
  reputation: number;
}

export interface SegmentState {
  name: SegmentName;
  size: number;
  priceSensitivity: number;
  serviceSensitivity: number;
  reputationSensitivity: number;
  onlineAffinity: number;
}

export interface StoreEntity {
  id: string;
  name: string;
  type: StoreType;
  cash: number;
  categories: CategoryState[];
  marketingMode: MarketingMode;
  profile: StoreProfile;
  staff: StaffState;
  reputation: number;
  serviceLevel: number;
  expenses: ExpenseState;
  lastWeekStats: WeeklyStats;
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
  };
}

export interface MarketState {
  weeklyCustomerPool: number;
  segments: SegmentState[];
  currentEvents: MarketEvent[];
  marketPriceIndex: Record<string, number>;
}

export interface GameState {
  week: number;
  sessionStarted: boolean;
  selectedStoreType: StoreType | null;
  player: StoreEntity | null;
  competitors: StoreEntity[];
  market: MarketState;
  eventLog: string[];
}
