import { MARKETING_EFFECTS } from './constants';
import { averagePriceIndex, calculateCategoryMargin, clamp, totalStock, withMargins } from './calculations';
import { makeCompetitorDecisions } from './competitors';
import { progressEvents, rollNewEvent } from './events';
import {
  CategoryState,
  GameState,
  MarketingMode,
  MarketEvent,
  SegmentState,
  StoreEntity,
  StoreType,
  WeeklyStats
} from './types';

interface PerformanceResult {
  store: StoreEntity;
  traffic: number;
  conversion: number;
  revenue: number;
  cogs: number;
  soldByCategory: Record<string, number>;
  lostSales: number;
  expensesTotal: number;
  penalties: number;
  reputationDelta: number;
}

const safeDiv = (num: number, den: number): number => (den === 0 ? 0 : num / den);

const locationFitBySegment = (storeType: StoreType, segment: SegmentState): number => {
  if (segment.name === 'Центр') {
    if (storeType === 'Бутик в центре') return 1.3;
    if (storeType === 'Магазин среднего ценового сегмента') return 1.15;
  }

  if (segment.name === 'Спальные районы') {
    if (storeType === 'Хард-дискаунтер на окраине') return 1.2;
    if (storeType === 'Магазин среднего ценового сегмента') return 1.05;
  }

  if (segment.name === 'Онлайн-аудитория') {
    if (storeType === 'Интернет-магазин с точками выдачи') return 1.35;
  }

  if (segment.name === 'Эконом-сегмент' && storeType === 'Хард-дискаунтер на окраине') {
    return 1.3;
  }

  return 0.9;
};

const aggregateEventEffects = (events: MarketEvent[]) =>
  events.reduce(
    (acc, event) => {
      if (event.effects.maxMarginCap !== undefined) {
        acc.maxMarginCap = Math.min(acc.maxMarginCap, event.effects.maxMarginCap);
      }
      if (event.effects.taxMultiplier !== undefined) {
        acc.taxMultiplier *= event.effects.taxMultiplier;
      }
      if (event.effects.discountAdPenalty !== undefined) {
        acc.discountPenalty *= event.effects.discountAdPenalty;
      }
      if (event.effects.importCostMultiplier !== undefined) {
        acc.importCostMultiplier *= event.effects.importCostMultiplier;
      }
      if (event.effects.complianceCost !== undefined) {
        acc.complianceCost += event.effects.complianceCost;
      }
      return acc;
    },
    {
      maxMarginCap: Number.POSITIVE_INFINITY,
      taxMultiplier: 1,
      discountPenalty: 1,
      importCostMultiplier: 1,
      complianceCost: 0
    }
  );

const computeAttractiveness = (
  store: StoreEntity,
  segment: SegmentState,
  marketPriceIndex: Record<string, number>,
  events: MarketEvent[]
): number => {
  const eventState = aggregateEventEffects(events);
  const marketing = MARKETING_EFFECTS[store.marketingMode];
  const marketingMultiplier = marketing.byStoreTypeMultiplier[store.type] ?? 1;
  const effectiveMarketing = marketing.trafficBoost * marketingMultiplier;
  const discountPenalty = store.marketingMode === 'Скидочная кампания' ? eventState.discountPenalty : 1;
  const priceIndex = averagePriceIndex(store, marketPriceIndex);
  const priceScore = clamp(Math.pow(1 / priceIndex, segment.priceSensitivity * store.profile.priceSensitivity), 0.55, 1.45);
  const stockAvailability = clamp(totalStock(store.categories) / 550, 0.45, 1.25);
  const serviceScore = clamp(
    (store.staff.serviceLevel * (1 - store.staff.workload * 0.25)) * segment.serviceSensitivity,
    0.55,
    1.6
  );
  const reputationScore = clamp((store.reputation / 100) * segment.reputationSensitivity + 0.35, 0.4, 1.5);
  const locationFit = locationFitBySegment(store.type, segment) * (segment.onlineAffinity > 1 ? store.profile.locationPower : 1);

  return (
    locationFit *
    priceScore *
    (effectiveMarketing * discountPenalty) *
    stockAvailability *
    serviceScore *
    reputationScore
  );
};

const applyPriceDiscipline = (
  categories: CategoryState[],
  events: MarketEvent[],
  storeType: StoreType
): { categories: CategoryState[]; reputationPenalty: number } => {
  const { maxMarginCap } = aggregateEventEffects(events);
  if (!Number.isFinite(maxMarginCap)) return { categories, reputationPenalty: 0 };

  let reputationPenalty = 0;
  const adjusted = categories.map((category) => {
    const margin = calculateCategoryMargin(category);
    if (margin <= maxMarginCap) return { ...category, margin };

    const maxRetail = Math.round(category.purchasePrice / (1 - maxMarginCap / 100));
    reputationPenalty += 0.4;

    return {
      ...category,
      retailPrice: maxRetail,
      margin: calculateCategoryMargin({ ...category, retailPrice: maxRetail })
    };
  });

  if (storeType === 'Бутик в центре' || storeType === 'Магазин среднего ценового сегмента') {
    reputationPenalty += 0.3;
  }

  return { categories: adjusted, reputationPenalty };
};

const runStoreWeek = (
  store: StoreEntity,
  allocatedCustomers: number,
  marketPriceIndex: Record<string, number>,
  events: MarketEvent[]
): PerformanceResult => {
  const eventState = aggregateEventEffects(events);
  const marketing = MARKETING_EFFECTS[store.marketingMode];
  const marketingMultiplier = marketing.byStoreTypeMultiplier[store.type] ?? 1;
  const traffic = Math.round(allocatedCustomers * marketing.trafficBoost * marketingMultiplier);

  const salaryPressure = safeDiv(store.staff.averageSalary, 55_000);
  const churn = clamp(0.07 + (salaryPressure < 0.85 ? 0.08 : 0) + store.staff.workload * 0.08, 0.05, 0.32);
  const serviceFromStaff = clamp(
    store.profile.serviceLevel + store.staff.trainingLevel * 0.18 + store.staff.headcount / 40 - store.staff.workload * 0.3,
    0.6,
    1.7
  );

  let conversion = clamp(
    0.18 + serviceFromStaff * 0.12 + store.reputation / 600 - averagePriceIndex(store, marketPriceIndex) * 0.09,
    0.05,
    0.52
  );

  if (store.marketingMode === 'Скидочная кампания') {
    conversion += 0.03 * (eventState.discountPenalty || 1);
  }

  conversion = clamp(conversion, 0.05, 0.58);
  const targetOrders = Math.round(traffic * conversion);

  let revenue = 0;
  let cogs = 0;
  let soldUnits = 0;
  let lostSales = 0;

  const soldByCategory: Record<string, number> = {};

  const nextCategories = withMargins(
    store.categories.map((category) => {
      const marketAvg = marketPriceIndex[category.id] ?? category.baseMarketPrice;
      const priceIndex = category.retailPrice / marketAvg;
      const priceEffect =
        priceIndex > 1
          ? clamp(1 - (priceIndex - 1) * category.elasticity, 0.35, 1)
          : clamp(1 + (1 - priceIndex) * category.elasticity * 0.7, 1, 1.45);

      const categoryOrders = Math.round(targetOrders * category.baseDemand * category.seasonalFactor * priceEffect);
      const sold = Math.min(category.stock, Math.max(0, categoryOrders));
      const missed = Math.max(0, categoryOrders - sold);

      soldUnits += sold;
      lostSales += missed;
      revenue += sold * category.retailPrice;
      cogs += sold * category.purchasePrice * eventState.importCostMultiplier;
      soldByCategory[category.id] = sold;

      return {
        ...category,
        stock: category.stock - sold
      };
    })
  );

  const payroll = Math.round(store.staff.headcount * store.staff.averageSalary);
  const marketingCost = MARKETING_EFFECTS[store.marketingMode].cost;
  const taxAdjustedOperating = Math.round((store.profile.operatingCosts + store.expenses.operating) * eventState.taxMultiplier);

  let penalties = 0;
  if (churn > 0.24) penalties += 20_000;
  if (lostSales > soldUnits * 0.45) penalties += 15_000;
  penalties += eventState.complianceCost > 0 && store.reputation < 52 ? Math.round(eventState.complianceCost * 0.6) : 0;

  const expensesTotal = store.profile.rent + payroll + marketingCost + taxAdjustedOperating + penalties;

  const grossMargin = revenue - cogs;
  const weeklyProfit = grossMargin - expensesTotal;
  const avgCheck = safeDiv(revenue, soldUnits);

  const underpricingPenalty =
    (store.type === 'Бутик в центре' || store.type === 'Магазин среднего ценового сегмента') &&
    averagePriceIndex(store, marketPriceIndex) < 0.86
      ? 0.8
      : 0;

  const stockPenalty = lostSales > soldUnits * 0.35 ? 0.7 : 0;
  const reputationDelta =
    MARKETING_EFFECTS[store.marketingMode].reputationImpact - churn * 4 - stockPenalty - underpricingPenalty + (weeklyProfit > 0 ? 0.4 : -0.4);

  const stats: WeeklyStats = {
    weeklyRevenue: Math.round(revenue),
    weeklyProfit: Math.round(weeklyProfit),
    marginPercent: Math.round(safeDiv(grossMargin, revenue) * 10000) / 100,
    traffic,
    conversion: Math.round(conversion * 10000) / 100,
    averageCheck: Math.round(avgCheck),
    totalStock: totalStock(nextCategories),
    lostSales,
    reputation: clamp(store.reputation + reputationDelta, 10, 100)
  };

  const afterDiscipline = applyPriceDiscipline(nextCategories, events, store.type);

  return {
    store: {
      ...store,
      cash: Math.round(store.cash + weeklyProfit),
      categories: afterDiscipline.categories,
      staff: {
        ...store.staff,
        serviceLevel: serviceFromStaff,
        workload: clamp(safeDiv(targetOrders, store.staff.headcount * 65), 0.35, 1.4),
        churn
      },
      serviceLevel: serviceFromStaff,
      reputation: clamp(stats.reputation - afterDiscipline.reputationPenalty, 10, 100),
      expenses: {
        rent: store.profile.rent,
        operating: taxAdjustedOperating,
        marketing: marketingCost,
        payroll,
        penalties
      },
      lastWeekStats: {
        ...stats,
        reputation: clamp(stats.reputation - afterDiscipline.reputationPenalty, 10, 100)
      }
    },
    traffic,
    conversion,
    revenue,
    cogs,
    soldByCategory,
    lostSales,
    expensesTotal,
    penalties,
    reputationDelta
  };
};

const createMarketPriceIndex = (stores: StoreEntity[]): Record<string, number> => {
  const priceMap: Record<string, number[]> = {};

  stores.forEach((store) => {
    store.categories.forEach((category) => {
      priceMap[category.id] = [...(priceMap[category.id] ?? []), category.retailPrice];
    });
  });

  return Object.entries(priceMap).reduce<Record<string, number>>((acc, [key, values]) => {
    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
    acc[key] = Math.round(avg);
    return acc;
  }, {});
};

export const runWeeklyCycle = (state: GameState): GameState => {
  if (!state.player) return state;

  const progressedEvents = progressEvents(state.market.currentEvents);
  const competitorPlanned = state.competitors.map(makeCompetitorDecisions);
  const allStoresBefore = [state.player, ...competitorPlanned];
  const marketPriceIndex = createMarketPriceIndex(allStoresBefore);

  const attractivenessByStore = new Map<string, number>();

  state.market.segments.forEach((segment) => {
    const scores = allStoresBefore.map((store) => ({
      id: store.id,
      score: computeAttractiveness(store, segment, marketPriceIndex, progressedEvents)
    }));

    const sumScores = scores.reduce((sum, item) => sum + item.score, 0);
    scores.forEach((item) => {
      const customers = Math.round(segment.size * safeDiv(item.score, sumScores));
      attractivenessByStore.set(item.id, (attractivenessByStore.get(item.id) ?? 0) + customers);
    });
  });

  const playerResult = runStoreWeek(
    state.player,
    attractivenessByStore.get(state.player.id) ?? state.player.profile.baseTraffic,
    marketPriceIndex,
    progressedEvents
  );

  const competitorResults = competitorPlanned.map((competitor) =>
    runStoreWeek(
      competitor,
      attractivenessByStore.get(competitor.id) ?? competitor.profile.baseTraffic,
      marketPriceIndex,
      progressedEvents
    ).store
  );

  const nextEvent = rollNewEvent(state.week + 1);
  const nextEvents = nextEvent ? [...progressedEvents, nextEvent] : progressedEvents;

  const nextLog = [...state.eventLog];
  if (nextEvent) {
    nextLog.unshift(`Неделя ${state.week + 1}: ${nextEvent.title}. ${nextEvent.description}`);
  }
  if (playerResult.store.lastWeekStats.lostSales > playerResult.store.lastWeekStats.weeklyRevenue / 1000) {
    nextLog.unshift(`Неделя ${state.week}: у вас выросли потерянные продажи из-за нехватки остатков.`);
  }

  return {
    ...state,
    week: state.week + 1,
    player: playerResult.store,
    competitors: competitorResults,
    market: {
      ...state.market,
      currentEvents: nextEvents,
      marketPriceIndex
    },
    eventLog: nextLog.slice(0, 20)
  };
};
