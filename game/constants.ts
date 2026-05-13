import {
  Bank,
  CategoryState,
  MarketingActivity,
  ProductSegment,
  ProductSku,
  SegmentState,
  StoreProfile,
  StoreType,
  Supplier,
  Worker,
  WorkerAgeGroup,
  WorkerRole
} from './types';

export const WEEKS_PER_MONTH = 4.33;

export const STORE_PROFILES: Record<StoreType, StoreProfile> = {
  'Бутик в центре': {
    type: 'Бутик в центре',
    startCash: 1_250_000,
    rent: 180_000,
    baseTraffic: 1700,
    basketSize: 1.4,
    priceSensitivity: 0.78,
    marketingDependency: 0.9,
    serviceLevel: 1.25,
    locationPower: 1.3,
    reputation: 62,
    operatingCosts: 70_000,
    defaultStaff: 0
  },
  'Хард-дискаунтер на окраине': {
    type: 'Хард-дискаунтер на окраине',
    startCash: 1_000_000,
    rent: 95_000,
    baseTraffic: 2300,
    basketSize: 2.4,
    priceSensitivity: 1.35,
    marketingDependency: 0.75,
    serviceLevel: 0.85,
    locationPower: 0.95,
    reputation: 50,
    operatingCosts: 75_000,
    defaultStaff: 0
  },
  'Магазин среднего ценового сегмента': {
    type: 'Магазин среднего ценового сегмента',
    startCash: 1_150_000,
    rent: 135_000,
    baseTraffic: 2050,
    basketSize: 1.9,
    priceSensitivity: 1,
    marketingDependency: 1,
    serviceLevel: 1.05,
    locationPower: 1.1,
    reputation: 56,
    operatingCosts: 72_000,
    defaultStaff: 0
  },
  'Интернет-магазин с точками выдачи': {
    type: 'Интернет-магазин с точками выдачи',
    startCash: 1_050_000,
    rent: 75_000,
    baseTraffic: 2400,
    basketSize: 1.7,
    priceSensitivity: 1.1,
    marketingDependency: 1.35,
    serviceLevel: 0.95,
    locationPower: 1.15,
    reputation: 54,
    operatingCosts: 85_000,
    defaultStaff: 0
  }
};

export const BASE_CATEGORIES: CategoryState[] = [
  { id: 'tableware', name: 'Посуда', stock: 0, purchasePrice: 520, retailPrice: 980, baseMarketPrice: 960, baseDemand: 0.18, elasticity: 1.2, seasonalFactor: 1, margin: 46.94 },
  { id: 'textile', name: 'Текстиль', stock: 0, purchasePrice: 690, retailPrice: 1240, baseMarketPrice: 1200, baseDemand: 0.14, elasticity: 0.95, seasonalFactor: 1, margin: 44.35 },
  { id: 'decor', name: 'Декор', stock: 0, purchasePrice: 380, retailPrice: 790, baseMarketPrice: 760, baseDemand: 0.16, elasticity: 1, seasonalFactor: 1, margin: 51.9 },
  { id: 'household', name: 'Бытовая химия', stock: 0, purchasePrice: 180, retailPrice: 360, baseMarketPrice: 350, baseDemand: 0.2, elasticity: 1.45, seasonalFactor: 1, margin: 50 },
  { id: 'kitchen', name: 'Товары для кухни', stock: 0, purchasePrice: 290, retailPrice: 610, baseMarketPrice: 600, baseDemand: 0.17, elasticity: 1.1, seasonalFactor: 1, margin: 52.46 },
  { id: 'gifts', name: 'Подарки', stock: 0, purchasePrice: 350, retailPrice: 820, baseMarketPrice: 800, baseDemand: 0.15, elasticity: 1.3, seasonalFactor: 1, margin: 57.32 }
];

const skuNames: Record<string, string[]> = {
  tableware: ['Тарелка базовая белая 20 см', 'Кружка стеклокерамическая базовая', 'Набор тарелок modern 6 предметов', 'Салатник керамический цветной', 'Фарфоровый сервиз premium 12 предметов', 'Авторская керамическая чаша'],
  textile: ['Полотенце хлопковое базовое', 'Наволочка однотонная', 'Комплект полотенец comfort', 'Плед вафельный домашний', 'Постельное бельё premium', 'Плед дизайнерский шерстяной'],
  decor: ['Свеча интерьерная малая', 'Рамка настольная базовая', 'Ваза стеклянная modern', 'Панно декоративное', 'Скульптура интерьерная premium', 'Ваза авторская керамическая'],
  household: ['Средство для мытья посуды', 'Губки хозяйственные набор', 'Капсулы для стирки family', 'Спрей универсальный eco', 'Премиальный ароматизатор дома', 'Набор ухода premium'],
  kitchen: ['Лопатка кухонная базовая', 'Контейнер пищевой 1 л', 'Сковорода антипригарная', 'Набор ножей everyday', 'Кастрюля premium steel', 'Кофемолка дизайнерская'],
  gifts: ['Открытка дизайнерская', 'Подарочный пакет kraft', 'Набор свечей gift', 'Подарочный набор tea', 'Корзина premium gourmet', 'Авторский подарочный бокс']
};

const segmentByIndex = (index: number): ProductSegment => (index < 2 ? 'cheap' : index < 4 ? 'mid' : 'premium');
const segmentPriceFactor: Record<ProductSegment, number> = { cheap: 0.48, mid: 1, premium: 2.15 };
const segmentPurchaseFactor: Record<ProductSegment, number> = { cheap: 0.5, mid: 1, premium: 1.95 };
const segmentElasticity: Record<ProductSegment, number> = { cheap: 1.55, mid: 1.05, premium: 0.7 };
const segmentDemand: Record<ProductSegment, number> = { cheap: 1.22, mid: 1, premium: 0.6 };

export const BASE_SKUS: ProductSku[] = BASE_CATEGORIES.flatMap((category) =>
  skuNames[category.id].map((name, index) => {
    const segment = segmentByIndex(index);
    const baseMarketPrice = Math.round(category.baseMarketPrice * segmentPriceFactor[segment] * (index % 2 === 0 ? 0.92 : 1.08));
    const purchasePrice = Math.round(category.purchasePrice * segmentPurchaseFactor[segment] * (index % 2 === 0 ? 0.94 : 1.06));
    return {
      id: `${category.id}-${segment}-${(index % 2) + 1}`,
      categoryId: category.id,
      name,
      segment,
      purchasePrice,
      baseMarketPrice,
      retailPrice: baseMarketPrice,
      stock: 0,
      baseDemandWeight: category.baseDemand * segmentDemand[segment] * (index % 2 === 0 ? 1.05 : 0.95),
      elasticity: segmentElasticity[segment],
      quality: segment === 'cheap' ? 0.55 : segment === 'mid' ? 0.75 : 0.92,
      brandPower: segment === 'cheap' ? 0.35 : segment === 'mid' ? 0.58 : 0.9,
      seasonality: 1,
      supplierId: segment === 'cheap' ? 'value_supply' : segment === 'mid' ? 'balanced_trade' : 'premium_house',
      minStock: segment === 'cheap' ? 35 : segment === 'mid' ? 25 : 10,
      targetStock: segment === 'cheap' ? 110 : segment === 'mid' ? 80 : 35,
      ageWeeks: 0,
      status: 'blocked',
      autoReorderEnabled: false,
      preferredSupplierId: segment === 'cheap' ? 'value_supply' : segment === 'mid' ? 'balanced_trade' : 'premium_house',
      reorderMinStock: segment === 'cheap' ? 30 : segment === 'mid' ? 20 : 8,
      reorderTargetStock: segment === 'cheap' ? 100 : segment === 'mid' ? 70 : 30,
      maxAutoOrderValue: segment === 'premium' ? 120_000 : 180_000
    } satisfies ProductSku;
  })
);

export const MARKET_SEGMENTS: SegmentState[] = [
  { name: 'Центр', size: 6000, priceSensitivity: 0.8, serviceSensitivity: 1.35, reputationSensitivity: 1.25, onlineAffinity: 0.6 },
  { name: 'Спальные районы', size: 8000, priceSensitivity: 1.25, serviceSensitivity: 0.9, reputationSensitivity: 0.9, onlineAffinity: 0.8 },
  { name: 'Онлайн-аудитория', size: 6000, priceSensitivity: 1.15, serviceSensitivity: 0.85, reputationSensitivity: 1, onlineAffinity: 1.45 },
  { name: 'Эконом-сегмент', size: 5000, priceSensitivity: 1.55, serviceSensitivity: 0.65, reputationSensitivity: 0.7, onlineAffinity: 0.75 }
];

const allTypesMultiplier = (value: number): Record<StoreType, number> => ({
  'Бутик в центре': value,
  'Хард-дискаунтер на окраине': value,
  'Магазин среднего ценового сегмента': value,
  'Интернет-магазин с точками выдачи': value
});

export const MARKETING_ACTIVITIES: MarketingActivity[] = [
  { id: 'local_ads', name: 'Локальная реклама', description: 'Оффлайн-реклама в районе магазина и наружные носители.', category: 'traffic', weeklyCost: 35_000, trafficModifier: 1.1, conversionModifier: 1.01, reputationModifier: 0.2, loyaltyModifier: 0.05, priceSensitivityModifier: 0.99, marginImpact: 0, effectivenessByStoreType: { 'Бутик в центре': 1.15, 'Хард-дискаунтер на окраине': 1.1, 'Магазин среднего ценового сегмента': 1.12, 'Интернет-магазин с точками выдачи': 0.85 }, fatigueRate: 0.04, requiresMarketer: false },
  { id: 'online_ads', name: 'Онлайн-реклама', description: 'Контекстная и таргетированная реклама для онлайн-аудитории.', category: 'online', weeklyCost: 48_000, trafficModifier: 1.14, conversionModifier: 1.02, reputationModifier: 0.1, loyaltyModifier: 0.05, priceSensitivityModifier: 0.98, marginImpact: 0, effectivenessByStoreType: { 'Бутик в центре': 0.9, 'Хард-дискаунтер на окраине': 0.95, 'Магазин среднего ценового сегмента': 1, 'Интернет-магазин с точками выдачи': 1.35 }, fatigueRate: 0.06, requiresMarketer: true },
  { id: 'discount_campaign', name: 'Скидочная кампания', description: 'Акции и скидки для роста трафика и конверсии.', category: 'conversion', weeklyCost: 30_000, trafficModifier: 1.12, conversionModifier: 1.11, reputationModifier: -0.15, loyaltyModifier: -0.15, priceSensitivityModifier: 1.08, marginImpact: -0.05, effectivenessByStoreType: { 'Бутик в центре': 0.75, 'Хард-дискаунтер на окраине': 1.25, 'Магазин среднего ценового сегмента': 1.15, 'Интернет-магазин с точками выдачи': 1.05 }, fatigueRate: 0.14, requiresMarketer: true, maxDurationWeeks: 4 },
  { id: 'loyalty_program', name: 'Программа лояльности', description: 'Бонусы и персональные предложения для повторных покупок.', category: 'loyalty', weeklyCost: 28_000, trafficModifier: 1.03, conversionModifier: 1.05, reputationModifier: 0.15, loyaltyModifier: 0.75, priceSensitivityModifier: 0.93, marginImpact: -0.025, effectivenessByStoreType: allTypesMultiplier(1), fatigueRate: 0.02, requiresMarketer: true },
  { id: 'newsletter', name: 'Рассылка по базе', description: 'Работает лучше при высокой лояльности клиентов.', category: 'loyalty', weeklyCost: 12_000, trafficModifier: 1.04, conversionModifier: 1.03, reputationModifier: 0, loyaltyModifier: 0.25, priceSensitivityModifier: 0.97, marginImpact: 0, effectivenessByStoreType: allTypesMultiplier(1), fatigueRate: 0.05, requiresMarketer: true },
  { id: 'brand_campaign', name: 'Имиджевая кампания', description: 'Повышает доверие и репутацию бренда.', category: 'brand', weeklyCost: 65_000, trafficModifier: 1.04, conversionModifier: 1.01, reputationModifier: 0.9, loyaltyModifier: 0.2, priceSensitivityModifier: 0.94, marginImpact: 0, effectivenessByStoreType: { 'Бутик в центре': 1.3, 'Хард-дискаунтер на окраине': 0.8, 'Магазин среднего ценового сегмента': 1, 'Интернет-магазин с точками выдачи': 1.05 }, fatigueRate: 0.03, requiresMarketer: true },
  { id: 'mall_promo', name: 'Промо в торговом центре', description: 'Временный офлайн-трафик и узнаваемость.', category: 'traffic', weeklyCost: 42_000, trafficModifier: 1.11, conversionModifier: 1.02, reputationModifier: 0.15, loyaltyModifier: 0.05, priceSensitivityModifier: 1, marginImpact: 0, effectivenessByStoreType: { 'Бутик в центре': 1.2, 'Хард-дискаунтер на окраине': 1.05, 'Магазин среднего ценового сегмента': 1.18, 'Интернет-магазин с точками выдачи': 0.75 }, fatigueRate: 0.08, requiresMarketer: true, maxDurationWeeks: 3 },
  { id: 'clearance_sale', name: 'Распродажа залежалого товара', description: 'Освобождает деньги из остатков, но снижает маржу.', category: 'clearance', weeklyCost: 15_000, trafficModifier: 1.08, conversionModifier: 1.08, reputationModifier: -0.25, loyaltyModifier: -0.05, priceSensitivityModifier: 1.05, marginImpact: -0.08, effectivenessByStoreType: { 'Бутик в центре': 0.65, 'Хард-дискаунтер на окраине': 1.2, 'Магазин среднего ценового сегмента': 1.05, 'Интернет-магазин с точками выдачи': 1.1 }, fatigueRate: 0.11, requiresMarketer: false, maxDurationWeeks: 3 },
  { id: 'influencers', name: 'Блогеры / инфлюенсеры', description: 'Нестабильный эффект: возможен всплеск или слабая отдача.', category: 'online', weeklyCost: 55_000, trafficModifier: 1.13, conversionModifier: 1.02, reputationModifier: 0.25, loyaltyModifier: 0.1, priceSensitivityModifier: 0.98, marginImpact: 0, effectivenessByStoreType: { 'Бутик в центре': 1.1, 'Хард-дискаунтер на окраине': 0.9, 'Магазин среднего ценового сегмента': 1, 'Интернет-магазин с точками выдачи': 1.2 }, fatigueRate: 0.1, requiresMarketer: true, maxDurationWeeks: 4 }
];

export const BANKS: Bank[] = [
  { id: 'conservative', name: 'Консервативный банк', baseInterestRate: 0.08, riskTolerance: 0.82, maxLoanAmount: 900_000, minTermWeeks: 12, maxTermWeeks: 72, approvalStrictness: 1.15, description: 'Низкая ставка, но строгая проверка прибыльности и долговой нагрузки.', minCreditScore: 68, minDSCR: 1.35, maxDebtToRevenue: 0.45, maxDebtToGrossProfit: 1.4, minCashRunwayWeeks: 4, collateralRequired: true, allowedLoanTypes: ['working_capital', 'investment'], cooldownWeeksAfterRejection: 4, requiresPositiveProfitTrend: true },
  { id: 'aggressive', name: 'Агрессивный банк', baseInterestRate: 0.15, riskTolerance: 1.08, maxLoanAmount: 600_000, minTermWeeks: 8, maxTermWeeks: 48, approvalStrictness: 0.85, description: 'Одобряет проще, но ставка выше и лимит меньше.', minCreditScore: 50, minDSCR: 1.05, maxDebtToRevenue: 0.75, maxDebtToGrossProfit: 2.2, minCashRunwayWeeks: 2, collateralRequired: false, allowedLoanTypes: ['working_capital', 'overdraft', 'credit_line'], cooldownWeeksAfterRejection: 3, requiresPositiveProfitTrend: false },
  { id: 'development', name: 'Банк развития', baseInterestRate: 0.1, riskTolerance: 0.95, maxLoanAmount: 1_400_000, minTermWeeks: 24, maxTermWeeks: 104, approvalStrictness: 1.05, description: 'Долгие инвестиционные кредиты для стабильного бизнеса.', minCreditScore: 62, minDSCR: 1.2, maxDebtToRevenue: 0.65, maxDebtToGrossProfit: 1.8, minCashRunwayWeeks: 3, collateralRequired: true, allowedLoanTypes: ['investment', 'working_capital'], cooldownWeeksAfterRejection: 4, requiresPositiveProfitTrend: true },
  { id: 'microfinance', name: 'Микрофинансовый кредитор', baseInterestRate: 0.34, riskTolerance: 1.35, maxLoanAmount: 300_000, minTermWeeks: 4, maxTermWeeks: 24, approvalStrictness: 0.65, description: 'Быстрые дорогие деньги для кассового разрыва.', minCreditScore: 35, minDSCR: 0.85, maxDebtToRevenue: 1.1, maxDebtToGrossProfit: 3.5, minCashRunwayWeeks: 0, collateralRequired: false, allowedLoanTypes: ['overdraft', 'crisis', 'working_capital'], cooldownWeeksAfterRejection: 2, requiresPositiveProfitTrend: false }
];

export const SUPPLIERS: Supplier[] = [
  { id: 'value_supply', name: 'Value Supply', categories: BASE_CATEGORIES.map((item) => item.id), priceLevel: 'low', qualityLevel: 0.58, paymentTerms: 'prepayment', deliverySLAWeeks: 2, deliveryReliability: 0.78, minOrderValue: 40_000, minOrderQty: 40, logisticsCost: 8_000, bonusTerms: { threshold: 180_000, discount: 0.05 }, returnPolicy: 'Возврат только брака', exclusivityPotential: 0.1 },
  { id: 'balanced_trade', name: 'Balanced Trade', categories: BASE_CATEGORIES.map((item) => item.id), priceLevel: 'medium', qualityLevel: 0.76, paymentTerms: 'on_delivery', deliverySLAWeeks: 1, deliveryReliability: 0.9, minOrderValue: 55_000, minOrderQty: 30, logisticsCost: 6_000, bonusTerms: { threshold: 220_000, discount: 0.04 }, returnPolicy: 'Возврат медленных SKU до 10%', exclusivityPotential: 0.25 },
  { id: 'premium_house', name: 'Premium House', categories: ['tableware', 'textile', 'decor', 'kitchen', 'gifts'], priceLevel: 'high', qualityLevel: 0.92, paymentTerms: 'deferred_14', deliverySLAWeeks: 2, deliveryReliability: 0.93, minOrderValue: 80_000, minOrderQty: 12, logisticsCost: 10_000, bonusTerms: { threshold: 300_000, discount: 0.03 }, returnPolicy: 'Гибкий возврат при сохранении упаковки', exclusivityPotential: 0.65, reputationRequirement: 55 },
  { id: 'regional_stock', name: 'Региональный склад', categories: ['household', 'kitchen', 'textile'], priceLevel: 'low', qualityLevel: 0.66, paymentTerms: 'deferred_30', deliverySLAWeeks: 3, deliveryReliability: 0.72, minOrderValue: 90_000, minOrderQty: 80, logisticsCost: 12_000, bonusTerms: { threshold: 260_000, discount: 0.06 }, returnPolicy: 'Без возврата неликвида', exclusivityPotential: 0.05 }
];

const firstNames = ['Анна', 'Иван', 'Мария', 'Сергей', 'Елена', 'Павел', 'Ольга', 'Дмитрий', 'Наталья', 'Алексей'];
const lastNames = ['Иванова', 'Петров', 'Смирнова', 'Кузнецов', 'Попова', 'Соколов', 'Лебедева', 'Новиков', 'Морозова', 'Волков'];

const workerSegment = (index: number): { ageGroup: WorkerAgeGroup; expected: number; min: number; base: number; preferences: string[] } => {
  if (index % 10 < 2) return { ageGroup: 'young', expected: 38_000, min: 31_000, base: 45, preferences: ['обучение', 'рост'] };
  if (index % 10 < 6) return { ageGroup: 'middle', expected: 52_000, min: 43_000, base: 62, preferences: ['стабильность', 'понятная нагрузка'] };
  if (index % 10 < 8) return { ageGroup: 'senior', expected: 72_000, min: 60_000, base: 78, preferences: ['репутация', 'стабильность'] };
  return { ageGroup: 'middle', expected: 34_000, min: 28_000, base: 35, preferences: ['низкий порог входа'] };
};

export const CITY_WORKERS: Worker[] = Array.from({ length: 50 }).map((_, index) => {
  const role: WorkerRole = index < 35 ? 'seller' : 'marketer';
  const segment = workerSegment(index);
  const variance = (index * 7) % 16;
  return {
    id: `worker-${index + 1}`,
    name: `${firstNames[index % firstNames.length]} ${lastNames[(index * 3) % lastNames.length]}`,
    role,
    ageGroup: segment.ageGroup,
    expectedSalary: segment.expected + variance * 1000 + (role === 'marketer' ? 8_000 : 0),
    minAcceptableSalary: segment.min + Math.floor(variance / 2) * 1000 + (role === 'marketer' ? 5_000 : 0),
    experienceLevel: Math.min(95, segment.base + variance),
    loyalty: Math.min(95, segment.base - 5 + ((index * 5) % 20)),
    training: Math.min(95, segment.base + ((index * 3) % 18)),
    stressResistance: Math.min(95, segment.base - 8 + ((index * 11) % 25)),
    salesSkill: Math.min(95, segment.base + ((index * 13) % 22)),
    discipline: Math.min(95, segment.base + ((index * 17) % 16)),
    status: 'available',
    weeksEmployed: 0,
    preferences: segment.preferences
  };
});
