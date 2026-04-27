import {
  CategoryState,
  MarketingEffect,
  MarketingMode,
  SegmentState,
  StoreProfile,
  StoreType
} from './types';

export const STORE_PROFILES: Record<StoreType, StoreProfile> = {
  'Бутик в центре': {
    type: 'Бутик в центре',
    startCash: 1_100_000,
    rent: 230_000,
    baseTraffic: 1700,
    priceSensitivity: 0.8,
    marketingDependency: 0.9,
    serviceLevel: 1.25,
    locationPower: 1.3,
    reputation: 62,
    operatingCosts: 95_000,
    defaultStaff: 8
  },
  'Хард-дискаунтер на окраине': {
    type: 'Хард-дискаунтер на окраине',
    startCash: 900_000,
    rent: 120_000,
    baseTraffic: 2100,
    priceSensitivity: 1.35,
    marketingDependency: 0.75,
    serviceLevel: 0.85,
    locationPower: 0.95,
    reputation: 50,
    operatingCosts: 110_000,
    defaultStaff: 10
  },
  'Магазин среднего ценового сегмента': {
    type: 'Магазин среднего ценового сегмента',
    startCash: 1_000_000,
    rent: 170_000,
    baseTraffic: 1900,
    priceSensitivity: 1.0,
    marketingDependency: 1.0,
    serviceLevel: 1.05,
    locationPower: 1.1,
    reputation: 56,
    operatingCosts: 100_000,
    defaultStaff: 9
  },
  'Интернет-магазин с точками выдачи': {
    type: 'Интернет-магазин с точками выдачи',
    startCash: 950_000,
    rent: 90_000,
    baseTraffic: 2300,
    priceSensitivity: 1.1,
    marketingDependency: 1.35,
    serviceLevel: 0.95,
    locationPower: 1.15,
    reputation: 54,
    operatingCosts: 120_000,
    defaultStaff: 7
  }
};

export const BASE_CATEGORIES: CategoryState[] = [
  {
    id: 'tableware',
    name: 'Посуда',
    stock: 120,
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
    stock: 95,
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
    stock: 140,
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
    stock: 160,
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
    stock: 130,
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
    stock: 85,
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

export const MARKETING_EFFECTS: Record<MarketingMode, MarketingEffect> = {
  'Без рекламы': {
    cost: 0,
    trafficBoost: 1,
    reputationImpact: 0,
    priceTolerance: 1,
    byStoreTypeMultiplier: {}
  },
  'Локальная реклама': {
    cost: 40_000,
    trafficBoost: 1.12,
    reputationImpact: 0.4,
    priceTolerance: 1.03,
    byStoreTypeMultiplier: {
      'Бутик в центре': 1.15,
      'Хард-дискаунтер на окраине': 1.1,
      'Магазин среднего ценового сегмента': 1.1,
      'Интернет-магазин с точками выдачи': 0.9
    }
  },
  'Скидочная кампания': {
    cost: 55_000,
    trafficBoost: 1.2,
    reputationImpact: -0.3,
    priceTolerance: 1.2,
    byStoreTypeMultiplier: {
      'Бутик в центре': 0.8,
      'Хард-дискаунтер на окраине': 1.25,
      'Магазин среднего ценового сегмента': 1.15,
      'Интернет-магазин с точками выдачи': 1.05
    }
  },
  'Онлайн-реклама': {
    cost: 60_000,
    trafficBoost: 1.22,
    reputationImpact: 0.2,
    priceTolerance: 1.07,
    byStoreTypeMultiplier: {
      'Бутик в центре': 0.9,
      'Хард-дискаунтер на окраине': 0.95,
      'Магазин среднего ценового сегмента': 1,
      'Интернет-магазин с точками выдачи': 1.3
    }
  },
  'Имиджевая кампания': {
    cost: 75_000,
    trafficBoost: 1.08,
    reputationImpact: 1.2,
    priceTolerance: 1.12,
    byStoreTypeMultiplier: {
      'Бутик в центре': 1.3,
      'Хард-дискаунтер на окраине': 0.85,
      'Магазин среднего ценового сегмента': 1,
      'Интернет-магазин с точками выдачи': 1.05
    }
  }
};
