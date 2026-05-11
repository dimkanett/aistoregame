import { MARKETING_ACTIVITIES } from './constants';
import { averagePriceIndex, calculateCategoryMargin, clamp, determineFinancialHealth, totalDebt, totalStock, withMargins } from './calculations';
import { calculateCreditScore, processLoanPayments } from './banking';
import { makeCompetitorDecisions } from './competitors';
import { applyFinancialEventEffects, progressEvents, rollNewEvent } from './events';
import {
  CategoryState,
  FinancialMarket,
  GameState,
  MarketEvent,
  SegmentState,
  StoreEntity,
  StoreType,
  WeeklyHistoryEntry,
  WeeklyStats
} from './types';

interface MarketingSummary {
  cost: number;
  trafficModifier: number;
  conversionModifier: number;
  reputationDelta: number;
  loyaltyDelta: number;
  priceSensitivityModifier: number;
  marginImpact: number;
}

interface PerformanceResult {
  store: StoreEntity;
  traffic: number;
  allocatedCustomers: number;
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

  if (segment.name === 'Онлайн-аудитория' && storeType === 'Интернет-магазин с точками выдачи') return 1.35;
  if (segment.name === 'Эконом-сегмент' && storeType === 'Хард-дискаунтер на окраине') return 1.3;

  return 0.9;
};

const aggregateEventEffects = (events: MarketEvent[]) =>
  events.reduce(
    (acc, event) => {
      if (event.effects.maxMarginCap !== undefined) acc.maxMarginCap = Math.min(acc.maxMarginCap, event.effects.maxMarginCap);
      if (event.effects.taxMultiplier !== undefined) acc.taxMultiplier *= event.effects.taxMultiplier;
      if (event.effects.discountAdPenalty !== undefined) acc.discountPenalty *= event.effects.discountAdPenalty;
      if (event.effects.importCostMultiplier !== undefined) acc.importCostMultiplier *= event.effects.importCostMultiplier;
      if (event.effects.complianceCost !== undefined) acc.complianceCost += event.effects.complianceCost;
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

const marketingSummary = (store: StoreEntity, marketingNoise: number): MarketingSummary => {
  return store.activeMarketingActivities
    .filter((activity) => activity.enabled)
    .reduce<MarketingSummary>(
      (summary, state) => {
        const activity = MARKETING_ACTIVITIES.find((item) => item.id === state.activityId);
        if (!activity) return summary;

        const storeFit = activity.effectivenessByStoreType[store.type] ?? 1;
        const fatigue = clamp(1 - state.weeksActive * activity.fatigueRate, 0.45, 1);
        const noisePenalty = clamp(1 - marketingNoise * 0.22, 0.65, 1);
        const effect = storeFit * fatigue * noisePenalty;

        return {
          cost: summary.cost + activity.weeklyCost,
          trafficModifier: summary.trafficModifier * (1 + (activity.trafficModifier - 1) * effect),
          conversionModifier: summary.conversionModifier * (1 + (activity.conversionModifier - 1) * effect),
          reputationDelta: summary.reputationDelta + activity.reputationModifier * effect,
          loyaltyDelta: summary.loyaltyDelta + activity.loyaltyModifier * effect - (fatigue < 0.7 ? activity.fatigueRate * 1.5 : 0),
          priceSensitivityModifier: summary.priceSensitivityModifier * activity.priceSensitivityModifier,
          marginImpact: summary.marginImpact + activity.marginImpact * effect
        };
      },
      {
        cost: 0,
        trafficModifier: 1,
        conversionModifier: 1,
        reputationDelta: 0,
        loyaltyDelta: 0,
        priceSensitivityModifier: 1,
        marginImpact: 0
      }
    );
};

const calculateMarketingNoise = (stores: StoreEntity[], marketPotential: number): number => {
  const spend = stores.reduce((sum, store) => sum + marketingSummary(store, 0).cost, 0);
  return clamp(spend / Math.max(1, marketPotential * 55), 0, 1.4);
};

const computeAttractiveness = (
  store: StoreEntity,
  segment: SegmentState,
  marketPriceIndex: Record<string, number>,
  events: MarketEvent[],
  marketingNoise: number
): number => {
  if (store.isClosed) return 0;

  const eventState = aggregateEventEffects(events);
  const marketing = marketingSummary(store, marketingNoise);
  const priceIndex = averagePriceIndex(store, marketPriceIndex);
  const loyaltySensitivityDiscount = 1 - store.customerLoyalty / 250;
  const effectivePriceSensitivity = segment.priceSensitivity * store.profile.priceSensitivity * loyaltySensitivityDiscount * marketing.priceSensitivityModifier;
  const priceScore = clamp(Math.pow(1 / priceIndex, effectivePriceSensitivity), 0.55, 1.45);
  const stockAvailability = clamp(totalStock(store.categories) / 700, 0.45, 1.25);
  const serviceScore = clamp((store.staff.serviceLevel * (1 - store.staff.workload * 0.22)) * segment.serviceSensitivity, 0.55, 1.65);
  const reputationScore = clamp((store.reputation / 100) * segment.reputationSensitivity + 0.35, 0.4, 1.55);
  const loyaltyScore = clamp(0.8 + store.customerLoyalty / 230, 0.75, 1.25);
  const locationFit = locationFitBySegment(store.type, segment) * (segment.onlineAffinity > 1 ? store.profile.locationPower : 1);
  const discountPenalty = store.activeMarketingActivities.some((activity) => activity.activityId === 'discount_campaign' && activity.enabled)
    ? eventState.discountPenalty
    : 1;

  return locationFit * priceScore * marketing.trafficModifier * discountPenalty * stockAvailability * serviceScore * reputationScore * loyaltyScore;
};

const applyPriceDiscipline = (categories: CategoryState[], events: MarketEvent[]): { categories: CategoryState[]; reputationPenalty: number } => {
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

  return { categories: adjusted, reputationPenalty };
};

const updateMarketingActivities = (store: StoreEntity): StoreEntity => ({
  ...store,
  activeMarketingActivities: store.activeMarketingActivities.map((activity) => ({
    ...activity,
    weeksActive: activity.enabled ? activity.weeksActive + 1 : 0
  }))
});

const runStoreWeek = (
  inputStore: StoreEntity,
  allocatedCustomers: number,
  marketPriceIndex: Record<string, number>,
  events: MarketEvent[],
  marketingNoise: number,
  week: number,
  market: FinancialMarket,
  totalCustomers: number
): PerformanceResult => {
  if (inputStore.isClosed) return { store: inputStore, traffic: 0, allocatedCustomers: 0 };

  const store = updateMarketingActivities(inputStore);
  const eventState = aggregateEventEffects(events);
  const marketing = marketingSummary(store, marketingNoise);
  const loyaltyTraffic = Math.round(store.loyalCustomerBase * store.repeatPurchaseRate * (1 + store.customerLoyalty / 200));
  const traffic = Math.round((allocatedCustomers + loyaltyTraffic) * marketing.trafficModifier * market.consumerConfidence);

  const salaryPressure = safeDiv(store.staff.averageSalary, 42_000);
  const churn = clamp(0.05 + (salaryPressure < 0.85 ? 0.08 : 0) + store.staff.workload * 0.06 + (store.financialHealth === 'cash_gap' ? 0.08 : 0), 0.04, 0.34);
  const serviceFromStaff = clamp(
    store.profile.serviceLevel + store.staff.trainingLevel * 0.18 + store.staff.headcount / 42 - store.staff.workload * 0.28,
    0.55,
    1.7
  );

  let conversion = clamp(
    (0.16 + serviceFromStaff * 0.11 + store.reputation / 700 + store.customerLoyalty / 600 - averagePriceIndex(store, marketPriceIndex) * 0.08) *
      marketing.conversionModifier,
    0.04,
    0.58
  );

  const targetOrders = Math.round(traffic * conversion);
  let revenue = 0;
  let cogs = 0;
  let soldUnits = 0;
  let lostSales = 0;
  const soldByCategory: Record<string, number> = {};
  const lostByCategory: Record<string, number> = {};

  const nextCategories = withMargins(
    store.categories.map((category) => {
      const marketAvg = marketPriceIndex[category.id] ?? category.baseMarketPrice;
      const priceIndex = category.retailPrice / marketAvg;
      const loyaltyPriceProtection = 1 - store.customerLoyalty / 300;
      const priceEffect =
        priceIndex > 1
          ? clamp(1 - (priceIndex - 1) * category.elasticity * loyaltyPriceProtection, 0.35, 1)
          : clamp(1 + (1 - priceIndex) * category.elasticity * 0.65, 1, 1.42);
      const categoryOrders = Math.round(targetOrders * category.baseDemand * category.seasonalFactor * priceEffect);
      const sold = Math.min(category.stock, Math.max(0, categoryOrders));
      const missed = Math.max(0, categoryOrders - sold);
      const effectiveRetail = Math.max(category.purchasePrice * 1.03, category.retailPrice * (1 + marketing.marginImpact));

      soldUnits += sold;
      lostSales += missed;
      revenue += sold * effectiveRetail;
      cogs += sold * category.purchasePrice * eventState.importCostMultiplier;
      soldByCategory[category.id] = sold;
      lostByCategory[category.id] = missed;

      return {
        ...category,
        stock: category.stock - sold
      };
    })
  );

  conversion = traffic === 0 ? 0 : clamp(soldUnits / traffic, 0, 0.75);
  const payroll = Math.round(store.staff.headcount * store.staff.averageSalary);
  const taxAdjustedOperating = Math.round(store.profile.operatingCosts * eventState.taxMultiplier * (1 + market.inflationRate * 0.25));
  let penalties = 0;
  if (churn > 0.24) penalties += 12_000;
  if (lostSales > soldUnits * 0.45) penalties += 10_000;
  penalties += eventState.complianceCost > 0 && store.reputation < 52 ? Math.round(eventState.complianceCost * 0.5) : 0;

  const grossProfit = Math.round(revenue - cogs);
  const paymentResult = processLoanPayments({ ...store, cash: store.cash + grossProfit }, week + 1);
  const loanPayments = paymentResult.paidTotal;
  const overdueLoanPayments = paymentResult.overdueTotal;
  const expensesWithoutDebt = store.profile.rent + payroll + marketing.cost + taxAdjustedOperating + penalties;
  const netProfit = Math.round(grossProfit - expensesWithoutDebt - loanPayments - overdueLoanPayments * 0.08);
  const cash = Math.round(paymentResult.store.cash - expensesWithoutDebt - overdueLoanPayments * 0.08);
  const lossStreak = netProfit < 0 ? store.lossStreak + 1 : 0;
  const financialHealth = determineFinancialHealth(store, cash, lossStreak);

  const stockPenalty = lostSales > soldUnits * 0.35 ? 1.1 : 0;
  const servicePenalty = serviceFromStaff < 0.85 ? 0.7 : 0;
  const underpricingPenalty = (store.type === 'Бутик в центре' || store.type === 'Магазин среднего ценового сегмента') && averagePriceIndex(store, marketPriceIndex) < 0.86 ? 0.8 : 0;
  const loyaltyDelta = marketing.loyaltyDelta + (lostSales === 0 ? 0.5 : -stockPenalty) + (serviceFromStaff > 1 ? 0.35 : -servicePenalty) + (netProfit > 0 ? 0.1 : -0.1);
  const reputationDelta = marketing.reputationDelta - churn * 3 - stockPenalty - underpricingPenalty + (netProfit > 0 ? 0.25 : -0.2) - (overdueLoanPayments > 0 ? 1.2 : 0);
  const nextLoyalty = clamp(store.customerLoyalty + loyaltyDelta, 0, 100);
  const nextReputation = clamp(store.reputation + reputationDelta, 5, 100);
  const nextLoyalBase = Math.round(clamp(store.loyalCustomerBase + soldUnits * (nextLoyalty / 100) - lostSales * 0.08, 0, 5000));
  const repeatPurchaseRate = clamp(0.12 + nextLoyalty / 400, 0.1, 0.42);
  const debt = totalDebt(paymentResult.store);
  const marketShare = safeDiv(allocatedCustomers, totalCustomers) * 100;

  const stats: WeeklyStats = {
    weeklyRevenue: Math.round(revenue),
    grossProfit,
    netProfit,
    weeklyProfit: netProfit,
    marginPercent: Math.round(safeDiv(grossProfit, revenue) * 10000) / 100,
    traffic,
    conversion: Math.round(conversion * 10000) / 100,
    averageCheck: Math.round(safeDiv(revenue, soldUnits)),
    totalStock: totalStock(nextCategories),
    lostSales,
    expenses: expensesWithoutDebt + loanPayments,
    marketingExpenses: marketing.cost,
    payrollExpenses: payroll,
    rentExpenses: store.profile.rent,
    loanPayments,
    debtTotal: debt,
    reputation: nextReputation,
    customerLoyalty: nextLoyalty,
    marketShare,
    cogs: Math.round(cogs)
  };

  const afterDiscipline = applyPriceDiscipline(nextCategories, events);
  const nextStoreBase: StoreEntity = {
    ...paymentResult.store,
    cash,
    categories: afterDiscipline.categories,
    staff: {
      ...store.staff,
      serviceLevel: serviceFromStaff,
      workload: clamp(safeDiv(targetOrders, store.staff.headcount * 75), 0.3, 1.45),
      churn
    },
    serviceLevel: serviceFromStaff,
    reputation: clamp(nextReputation - afterDiscipline.reputationPenalty, 5, 100),
    customerLoyalty: nextLoyalty,
    repeatPurchaseRate,
    loyalCustomerBase: nextLoyalBase,
    expenses: {
      rent: store.profile.rent,
      operating: taxAdjustedOperating,
      marketing: marketing.cost,
      payroll,
      penalties,
      loanPayments,
      writeOffs: 0,
      returnsCost: 0
    },
    lastWeekStats: stats,
    lossStreak,
    financialHealth,
    categorySalesLastWeek: soldByCategory,
    categoryLostSalesLastWeek: lostByCategory,
    marketShare,
    activeMarketingActivities: store.activeMarketingActivities,
    weeklyHistory: [
      ...store.weeklyHistory,
      {
        week,
        cash,
        revenue: stats.weeklyRevenue,
        grossProfit: stats.grossProfit,
        netProfit: stats.netProfit,
        marginPercent: stats.marginPercent,
        traffic: stats.traffic,
        conversion: stats.conversion,
        averageCheck: stats.averageCheck,
        totalStock: stats.totalStock,
        lostSales: stats.lostSales,
        expenses: stats.expenses,
        marketingExpenses: stats.marketingExpenses,
        payrollExpenses: stats.payrollExpenses,
        rentExpenses: stats.rentExpenses,
        loanPayments: stats.loanPayments,
        debtTotal: stats.debtTotal,
        reputation: stats.reputation,
        customerLoyalty: stats.customerLoyalty,
        marketShare: stats.marketShare
      } satisfies WeeklyHistoryEntry
    ],
    isClosed: financialHealth === 'bankrupt'
  };

  return {
    store: {
      ...nextStoreBase,
      creditScore: calculateCreditScore(nextStoreBase)
    },
    traffic,
    allocatedCustomers
  };
};

const createMarketPriceIndex = (stores: StoreEntity[]): Record<string, number> => {
  const priceMap: Record<string, number[]> = {};

  stores
    .filter((store) => !store.isClosed)
    .forEach((store) => {
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

const marketPhaseFromFinancials = (market: FinancialMarket): GameState['market']['phase'] => {
  if (market.consumerConfidence < 0.45) return 'кризис';
  if (market.inflationRate > 0.12) return 'инфляционный рынок';
  if (market.consumerConfidence < 0.62) return 'стагнация';
  if (market.consumerConfidence > 0.9) return 'рост';
  return 'стабильность';
};

export const runWeeklyCycle = (state: GameState): GameState => {
  if (!state.player) return state;

  const progressedEvents = progressEvents(state.market.currentEvents);
  const nextFinancialMarket = applyFinancialEventEffects(state.market.financialMarket, progressedEvents);
  const competitorPlanned = state.competitors.map(makeCompetitorDecisions).filter((store) => !store.isClosed);
  const allStoresBefore = [state.player, ...competitorPlanned];
  const marketPriceIndex = createMarketPriceIndex(allStoresBefore);
  const totalCustomers = Math.round(state.market.weeklyCustomerPool * nextFinancialMarket.consumerConfidence);
  const marketingNoise = calculateMarketingNoise(allStoresBefore, Math.max(totalCustomers, 1));

  const attractivenessByStore = new Map<string, number>();

  state.market.segments.forEach((segment) => {
    const segmentSize = Math.round(segment.size * nextFinancialMarket.consumerConfidence);
    const scores = allStoresBefore.map((store) => ({
      id: store.id,
      score: computeAttractiveness(store, segment, marketPriceIndex, progressedEvents, marketingNoise)
    }));
    const sumScores = scores.reduce((sum, item) => sum + item.score, 0);

    scores.forEach((item) => {
      const customers = Math.round(segmentSize * safeDiv(item.score, sumScores || 1));
      attractivenessByStore.set(item.id, (attractivenessByStore.get(item.id) ?? 0) + customers);
    });
  });

  const playerResult = runStoreWeek(
    state.player,
    attractivenessByStore.get(state.player.id) ?? state.player.profile.baseTraffic,
    marketPriceIndex,
    progressedEvents,
    marketingNoise,
    state.week,
    nextFinancialMarket,
    totalCustomers
  );

  const competitorResults = competitorPlanned.map((competitor) =>
    runStoreWeek(
      competitor,
      attractivenessByStore.get(competitor.id) ?? competitor.profile.baseTraffic,
      marketPriceIndex,
      progressedEvents,
      marketingNoise,
      state.week,
      nextFinancialMarket,
      totalCustomers
    ).store
  );

  const nextEvent = rollNewEvent(state.week + 1);
  const nextEvents = nextEvent ? [...progressedEvents, nextEvent] : progressedEvents;
  const nextLog = [...state.eventLog];

  if (nextEvent) nextLog.unshift(`Неделя ${state.week + 1}: ${nextEvent.title}. ${nextEvent.description}`);
  if (playerResult.store.lastWeekStats.lostSales > playerResult.store.lastWeekStats.weeklyRevenue / 1000) {
    nextLog.unshift(`Неделя ${state.week}: выросли потерянные продажи из-за нехватки остатков.`);
  }
  if (playerResult.store.financialHealth !== state.player.financialHealth) {
    nextLog.unshift(`Неделя ${state.week}: финансовое здоровье изменилось на «${playerResult.store.financialHealth}».`);
  }

  return {
    ...state,
    week: state.week + 1,
    player: playerResult.store,
    competitors: competitorResults,
    market: {
      ...state.market,
      currentEvents: nextEvents,
      marketPriceIndex,
      marketingNoise,
      financialMarket: nextFinancialMarket,
      phase: marketPhaseFromFinancials(nextFinancialMarket)
    },
    eventLog: nextLog.slice(0, 24)
  };
};
