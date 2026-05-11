import { Bank, CategoryState, MarketingActivity, SegmentState, StoreProfile, StoreType } from './types';

export const STORE_PROFILES: Record<StoreType, StoreProfile> = {
  'Бутик в центре': {
    type: 'Бутик в центре',
    startCash: 1_250_000,
    rent: 180_000,
    baseTraffic: 1700,
    priceSensitivity: 0.78,
    marketingDependency: 0.9,
    serviceLevel: 1.25,
    locationPower: 1.3,
    reputation: 62,
    operatingCosts: 70_000,
    defaultStaff: 7
  },
  'Хард-дискаунтер на окраине': {
    type: 'Хард-дискаунтер на окраине',
    startCash: 1_000_000,
    rent: 95_000,
    baseTraffic: 2300,
    priceSensitivity: 1.35,
    marketingDependency: 0.75,
    serviceLevel: 0.85,
    locationPower: 0.95,
    reputation: 50,
    operatingCosts: 75_000,
    defaultStaff: 9
  },
  'Магазин среднего ценового сегмента': {
    type: 'Магазин среднего ценового сегмента',
    startCash: 1_150_000,
    rent: 135_000,
    baseTraffic: 2050,
    priceSensitivity: 1,
    marketingDependency: 1,
    serviceLevel: 1.05,
    locationPower: 1.1,
    reputation: 56,
    operatingCosts: 72_000,
    defaultStaff: 8
  },
  'Интернет-магазин с точками выдачи': {
    type: 'Интернет-магазин с точками выдачи',
    startCash: 1_050_000,
    rent: 75_000,
    baseTraffic: 2400,
    priceSensitivity: 1.1,
    marketingDependency: 1.35,
    serviceLevel: 0.95,
    locationPower: 1.15,
    reputation: 54,
    operatingCosts: 85_000,
    defaultStaff: 7
  }
};

export const BASE_CATEGORIES: CategoryState[] = [
  {
    id: 'tableware',
    name: 'Посуда',
    stock: 150,
    purchasePrice: 520,
    retailPrice: 980,
    baseMarketPrice: 960,
    baseDemand: 0.18,
    elasticity: 1.2,
    seasonalFactor: 1,
    margin: 46.94
  },
  {
    id: 'textile',
    name: 'Текстиль',
    stock: 125,
    purchasePrice: 690,
    retailPrice: 1240,
    baseMarketPrice: 1200,
    baseDemand: 0.14,
    elasticity: 0.95,
    seasonalFactor: 1,
    margin: 44.35
  },
  {
    id: 'decor',
    name: 'Декор',
    stock: 165,
    purchasePrice: 380,
    retailPrice: 790,
    baseMarketPrice: 760,
    baseDemand: 0.16,
    elasticity: 1,
    seasonalFactor: 1,
    margin: 51.9
  },
  {
    id: 'household',
    name: 'Бытовая химия',
    stock: 210,
    purchasePrice: 180,
    retailPrice: 360,
    baseMarketPrice: 350,
    baseDemand: 0.2,
    elasticity: 1.45,
    seasonalFactor: 1,
    margin: 50
  },
  {
    id: 'kitchen',
    name: 'Товары для кухни',
    stock: 155,
    purchasePrice: 290,
    retailPrice: 610,
    baseMarketPrice: 600,
    baseDemand: 0.17,
    elasticity: 1.1,
    seasonalFactor: 1,
    margin: 52.46
  },
  {
    id: 'gifts',
    name: 'Подарки',
    stock: 105,
    purchasePrice: 350,
    retailPrice: 820,
    baseMarketPrice: 800,
    baseDemand: 0.15,
    elasticity: 1.3,
    seasonalFactor: 1,
    margin: 57.32
  }
];

export const MARKET_SEGMENTS: SegmentState[] = [
  {
    name: 'Центр',
    size: 2400,
    priceSensitivity: 0.8,
    serviceSensitivity: 1.35,
    reputationSensitivity: 1.25,
    onlineAffinity: 0.6
  },
  {
    name: 'Спальные районы',
    size: 3200,
    priceSensitivity: 1.25,
    serviceSensitivity: 0.9,
    reputationSensitivity: 0.9,
    onlineAffinity: 0.8
  },
  {
    name: 'Онлайн-аудитория',
    size: 2300,
    priceSensitivity: 1.15,
    serviceSensitivity: 0.85,
    reputationSensitivity: 1,
    onlineAffinity: 1.45
  },
  {
    name: 'Эконом-сегмент',
    size: 2100,
    priceSensitivity: 1.55,
    serviceSensitivity: 0.65,
    reputationSensitivity: 0.7,
    onlineAffinity: 0.75
  }
];

const allTypesMultiplier = (value: number): Record<StoreType, number> => ({
  'Бутик в центре': value,
  'Хард-дискаунтер на окраине': value,
  'Магазин среднего ценового сегмента': value,
  'Интернет-магазин с точками выдачи': value
});

export const MARKETING_ACTIVITIES: MarketingActivity[] = [
  {
    id: 'local_ads',
    name: 'Локальная реклама',
    description: 'Оффлайн-реклама в районе магазина и наружные носители.',
    category: 'traffic',
    weeklyCost: 35_000,
    trafficModifier: 1.1,
    conversionModifier: 1.01,
    reputationModifier: 0.2,
    loyaltyModifier: 0.05,
    priceSensitivityModifier: 0.99,
    marginImpact: 0,
    effectivenessByStoreType: {
      'Бутик в центре': 1.15,
      'Хард-дискаунтер на окраине': 1.1,
      'Магазин среднего ценового сегмента': 1.12,
      'Интернет-магазин с точками выдачи': 0.85
    },
    fatigueRate: 0.04
  },
  {
    id: 'online_ads',
    name: 'Онлайн-реклама',
    description: 'Контекстная и таргетированная реклама для онлайн-аудитории.',
    category: 'online',
    weeklyCost: 48_000,
    trafficModifier: 1.14,
    conversionModifier: 1.02,
    reputationModifier: 0.1,
    loyaltyModifier: 0.05,
    priceSensitivityModifier: 0.98,
    marginImpact: 0,
    effectivenessByStoreType: {
      'Бутик в центре': 0.9,
      'Хард-дискаунтер на окраине': 0.95,
      'Магазин среднего ценового сегмента': 1,
      'Интернет-магазин с точками выдачи': 1.35
    },
    fatigueRate: 0.06
  },
  {
    id: 'discount_campaign',
    name: 'Скидочная кампания',
    description: 'Акции и скидки для роста трафика и конверсии.',
    category: 'conversion',
    weeklyCost: 30_000,
    trafficModifier: 1.12,
    conversionModifier: 1.11,
    reputationModifier: -0.15,
    loyaltyModifier: -0.15,
    priceSensitivityModifier: 1.08,
    marginImpact: -0.05,
    effectivenessByStoreType: {
      'Бутик в центре': 0.75,
      'Хард-дискаунтер на окраине': 1.25,
      'Магазин среднего ценового сегмента': 1.15,
      'Интернет-магазин с точками выдачи': 1.05
    },
    fatigueRate: 0.14,
    maxDurationWeeks: 4
  },
  {
    id: 'loyalty_program',
    name: 'Программа лояльности',
    description: 'Бонусы и персональные предложения для повторных покупок.',
    category: 'loyalty',
    weeklyCost: 28_000,
    trafficModifier: 1.03,
    conversionModifier: 1.05,
    reputationModifier: 0.15,
    loyaltyModifier: 0.75,
    priceSensitivityModifier: 0.93,
    marginImpact: -0.025,
    effectivenessByStoreType: allTypesMultiplier(1),
    fatigueRate: 0.02
  },
  {
    id: 'newsletter',
    name: 'Рассылка по базе',
    description: 'Работает лучше при высокой лояльности клиентов.',
    category: 'loyalty',
    weeklyCost: 12_000,
    trafficModifier: 1.04,
    conversionModifier: 1.03,
    reputationModifier: 0,
    loyaltyModifier: 0.25,
    priceSensitivityModifier: 0.97,
    marginImpact: 0,
    effectivenessByStoreType: allTypesMultiplier(1),
    fatigueRate: 0.05
  },
  {
    id: 'brand_campaign',
    name: 'Имиджевая кампания',
    description: 'Повышает доверие и репутацию бренда.',
    category: 'brand',
    weeklyCost: 65_000,
    trafficModifier: 1.04,
    conversionModifier: 1.01,
    reputationModifier: 0.9,
    loyaltyModifier: 0.2,
    priceSensitivityModifier: 0.94,
    marginImpact: 0,
    effectivenessByStoreType: {
      'Бутик в центре': 1.3,
      'Хард-дискаунтер на окраине': 0.8,
      'Магазин среднего ценового сегмента': 1,
      'Интернет-магазин с точками выдачи': 1.05
    },
    fatigueRate: 0.03
  },
  {
    id: 'mall_promo',
    name: 'Промо в торговом центре',
    description: 'Временный офлайн-трафик и узнаваемость.',
    category: 'traffic',
    weeklyCost: 42_000,
    trafficModifier: 1.11,
    conversionModifier: 1.02,
    reputationModifier: 0.15,
    loyaltyModifier: 0.05,
    priceSensitivityModifier: 1,
    marginImpact: 0,
    effectivenessByStoreType: {
      'Бутик в центре': 1.2,
      'Хард-дискаунтер на окраине': 1.05,
      'Магазин среднего ценового сегмента': 1.18,
      'Интернет-магазин с точками выдачи': 0.75
    },
    fatigueRate: 0.08,
    maxDurationWeeks: 3
  },
  {
    id: 'clearance_sale',
    name: 'Распродажа залежалого товара',
    description: 'Освобождает деньги из остатков, но снижает маржу.',
    category: 'clearance',
    weeklyCost: 15_000,
    trafficModifier: 1.08,
    conversionModifier: 1.08,
    reputationModifier: -0.25,
    loyaltyModifier: -0.05,
    priceSensitivityModifier: 1.05,
    marginImpact: -0.08,
    effectivenessByStoreType: {
      'Бутик в центре': 0.65,
      'Хард-дискаунтер на окраине': 1.2,
      'Магазин среднего ценового сегмента': 1.05,
      'Интернет-магазин с точками выдачи': 1.1
    },
    fatigueRate: 0.11,
    maxDurationWeeks: 3
  },
  {
    id: 'influencers',
    name: 'Блогеры / инфлюенсеры',
    description: 'Нестабильный эффект: возможен всплеск или слабая отдача.',
    category: 'online',
    weeklyCost: 55_000,
    trafficModifier: 1.13,
    conversionModifier: 1.02,
    reputationModifier: 0.25,
    loyaltyModifier: 0.1,
    priceSensitivityModifier: 0.98,
    marginImpact: 0,
    effectivenessByStoreType: {
      'Бутик в центре': 1.1,
      'Хард-дискаунтер на окраине': 0.9,
      'Магазин среднего ценового сегмента': 1,
      'Интернет-магазин с точками выдачи': 1.2
    },
    fatigueRate: 0.1,
    maxDurationWeeks: 4
  }
];

export const BANKS: Bank[] = [
  {
    id: 'conservative',
    name: 'Консервативный банк',
    baseInterestRate: 0.08,
    riskTolerance: 0.82,
    maxLoanAmount: 900_000,
    minTermWeeks: 12,
    maxTermWeeks: 72,
    approvalStrictness: 1.15,
    description: 'Низкая ставка, но строгая проверка прибыльности и долговой нагрузки.'
  },
  {
    id: 'aggressive',
    name: 'Агрессивный банк',
    baseInterestRate: 0.15,
    riskTolerance: 1.08,
    maxLoanAmount: 600_000,
    minTermWeeks: 8,
    maxTermWeeks: 48,
    approvalStrictness: 0.85,
    description: 'Одобряет проще, но ставка выше и лимит меньше.'
  },
  {
    id: 'development',
    name: 'Банк развития',
    baseInterestRate: 0.1,
    riskTolerance: 0.95,
    maxLoanAmount: 1_400_000,
    minTermWeeks: 24,
    maxTermWeeks: 104,
    approvalStrictness: 1.05,
    description: 'Долгие инвестиционные кредиты для стабильного бизнеса.'
  },
  {
    id: 'microfinance',
    name: 'Микрофинансовый кредитор',
    baseInterestRate: 0.34,
    riskTolerance: 1.35,
    maxLoanAmount: 300_000,
    minTermWeeks: 4,
    maxTermWeeks: 24,
    approvalStrictness: 0.65,
    description: 'Быстрые дорогие деньги для кассового разрыва.'
  }
];
