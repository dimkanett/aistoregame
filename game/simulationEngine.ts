import { MARKETING_ACTIVITIES, WEEKS_PER_MONTH } from './constants';
import {
  averagePriceIndex,
  calculateSkuMargin,
  clamp,
  determineFinancialHealth,
  deriveStaffFromEmployees,
  hasMarketer,
  marketerEffectiveness,
  syncCategoriesFromSkus,
  totalDebt,
  totalSkuStock
} from './calculations';
import { calculateCreditScore, processLoanPayments } from './banking';
import { makeCompetitorDecisions } from './competitors';
import { applyFinancialEventEffects, progressEvents, rollNewEvent } from './events';
import { processJobRequests, updateEmployeeRetention } from './labor';
import { processPurchaseOrders, skuStatus } from './suppliers';
import { FinancialMarket, GameState, MarketEvent, ProductSegment, SegmentState, StoreEntity, StoreType, WeeklyHistoryEntry, WeeklyStats, Worker } from './types';

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

export const canStartSales = (store: StoreEntity): { ok: boolean; reasons: string[] } => {
  const reasons: string[] = [];
  if (store.employees.filter((worker) => worker.role === 'seller').length < 1) reasons.push('Нужен хотя бы 1 продавец.');
  if (store.supplierAgreements.filter((agreement) => agreement.active).length < 1) reasons.push('Нужен хотя бы 1 договор с поставщиком.');
  if (totalSkuStock(store.productSkus) < 120) reasons.push('Нужно получить стартовый ассортимент минимум 120 единиц.');
  if (store.productSkus.some((sku) => sku.retailPrice <= sku.purchasePrice)) reasons.push('Розничные цены должны быть выше закупочных.');
  return { ok: reasons.length === 0, reasons };
};

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

const segmentFit = (storeType: StoreType, segment: ProductSegment): number => {
  if (storeType === 'Хард-дискаунтер на окраине') return segment === 'cheap' ? 1.35 : segment === 'mid' ? 0.95 : 0.55;
  if (storeType === 'Бутик в центре') return segment === 'premium' ? 1.4 : segment === 'mid' ? 1 : 0.55;
  if (storeType === 'Интернет-магазин с точками выдачи') return segment === 'mid' ? 1.15 : 1;
  return segment === 'mid' ? 1.2 : 0.9;
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
    { maxMarginCap: Number.POSITIVE_INFINITY, taxMultiplier: 1, discountPenalty: 1, importCostMultiplier: 1, complianceCost: 0 }
  );

const marketingSummary = (store: StoreEntity, marketingNoise: number): MarketingSummary => {
  const marketerPower = marketerEffectiveness(store.employees);
  return store.activeMarketingActivities
    .filter((activity) => activity.enabled)
    .reduce<MarketingSummary>(
      (summary, state) => {
        const activity = MARKETING_ACTIVITIES.find((item) => item.id === state.activityId);
        if (!activity) return summary;
        if (activity.requiresMarketer && marketerPower <= 0) return summary;

        const storeFit = activity.effectivenessByStoreType[store.type] ?? 1;
        const professionalEffect = activity.requiresMarketer ? marketerPower : 0.85 + marketerPower * 0.15;
        const fatigue = clamp(1 - state.weeksActive * activity.fatigueRate * (1.2 - professionalEffect * 0.25), 0.45, 1);
        const noisePenalty = clamp(1 - marketingNoise * (0.24 - Math.min(0.08, professionalEffect * 0.04)), 0.65, 1);
        const effect = storeFit * fatigue * noisePenalty * professionalEffect;

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
      { cost: 0, trafficModifier: 1, conversionModifier: 1, reputationDelta: 0, loyaltyDelta: 0, priceSensitivityModifier: 1, marginImpact: 0 }
    );
};

const calculateMarketingNoise = (stores: StoreEntity[], marketPotential: number): number => {
  const spend = stores.reduce((sum, store) => sum + marketingSummary(store, 0).cost, 0);
  return clamp(spend / Math.max(1, marketPotential * 55), 0, 1.4);
};

const computeAttractiveness = (store: StoreEntity, segment: SegmentState, marketPriceIndex: Record<string, number>, events: MarketEvent[], marketingNoise: number): number => {
  if (store.isClosed) return 0;
  const eventState = aggregateEventEffects(events);
  const marketing = marketingSummary(store, marketingNoise);
  const priceIndex = averagePriceIndex(store, marketPriceIndex);
  const loyaltySensitivityDiscount = 1 - store.customerLoyalty / 250;
  const effectivePriceSensitivity = segment.priceSensitivity * store.profile.priceSensitivity * loyaltySensitivityDiscount * marketing.priceSensitivityModifier;
  const priceScore = clamp(Math.pow(1 / priceIndex, effectivePriceSensitivity), 0.55, 1.45);
  const stockAvailability = clamp(totalSkuStock(store.productSkus) / 1400, 0.45, 1.25);
  const serviceScore = clamp((store.staff.serviceLevel * (1 - store.staff.workload * 0.22)) * segment.serviceSensitivity, 0.45, 1.65);
  const reputationScore = clamp((store.reputation / 100) * segment.reputationSensitivity + 0.35, 0.4, 1.55);
  const loyaltyScore = clamp(0.8 + store.customerLoyalty / 230, 0.75, 1.25);
  const locationFit = locationFitBySegment(store.type, segment) * (segment.onlineAffinity > 1 ? store.profile.locationPower : 1);
  const discountPenalty = store.activeMarketingActivities.some((activity) => activity.activityId === 'discount_campaign' && activity.enabled) ? eventState.discountPenalty : 1;
  return locationFit * priceScore * marketing.trafficModifier * discountPenalty * stockAvailability * serviceScore * reputationScore * loyaltyScore;
};

const updateMarketingActivities = (store: StoreEntity): StoreEntity => ({
  ...store,
  activeMarketingActivities: store.activeMarketingActivities.map((activity) => ({ ...activity, weeksActive: activity.enabled ? activity.weeksActive + 1 : 0 }))
});

const createSkuMarketPriceIndex = (stores: StoreEntity[]): Record<string, number> => {
  const priceMap: Record<string, number[]> = {};
  stores
    .filter((store) => !store.isClosed)
    .forEach((store) => {
      store.productSkus.forEach((sku) => {
        priceMap[sku.id] = [...(priceMap[sku.id] ?? []), sku.retailPrice];
      });
    });
  return Object.entries(priceMap).reduce<Record<string, number>>((acc, [key, values]) => {
    acc[key] = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
    return acc;
  }, {});
};

const processSetupWeek = (state: GameState): GameState => {
  if (!state.player) return state;
  const hiring = processJobRequests(state.player, state.cityWorkers, state.week);
  const supply = processPurchaseOrders(hiring.store, state.suppliers, state.week);
  return {
    ...state,
    week: state.week + 1,
    player: supply.store,
    cityWorkers: hiring.cityWorkers,
    eventLog: [...supply.events, ...hiring.events, `Неделя ${state.week}: подготовка магазина продолжается, продажи ещё не запущены.`, ...state.eventLog].slice(0, 30)
  };
};

const runStoreWeek = (
  inputStore: StoreEntity,
  allocatedCustomers: number,
  skuMarketPriceIndex: Record<string, number>,
  events: MarketEvent[],
  marketingNoise: number,
  week: number,
  market: FinancialMarket,
  totalCustomers: number,
  suppliers = [] as GameState['suppliers']
): PerformanceResult => {
  if (inputStore.isClosed) return { store: inputStore, traffic: 0, allocatedCustomers: 0 };

  const supplied = processPurchaseOrders(inputStore, suppliers, week);
  const retained = updateEmployeeRetention(supplied.store, [], week);
  let store = updateMarketingActivities(retained.store);
  const staffFromEmployees = deriveStaffFromEmployees(store.employees, store.staff.averageSalary);
  store = { ...store, staff: { ...staffFromEmployees, workload: store.staff.workload, churn: store.staff.churn }, serviceLevel: staffFromEmployees.serviceLevel };

  const eventState = aggregateEventEffects(events);
  const marketing = marketingSummary(store, marketingNoise);
  const loyaltyTraffic = Math.round(store.loyalCustomerBase * store.repeatPurchaseRate * (1 + store.customerLoyalty / 200));
  const sellerCount = store.employees.filter((worker) => worker.role === 'seller').length;
  const staffCapacity = sellerCount > 0 ? clamp(sellerCount / Math.max(1, store.profile.basketSize), 0.35, 1.25) : 0.15;
  const traffic = Math.round((allocatedCustomers + loyaltyTraffic) * marketing.trafficModifier * market.consumerConfidence * staffCapacity);
  const salaryPressure = safeDiv(store.staff.averageSalary, 42_000);
  const churn = clamp(0.05 + (salaryPressure < 0.85 ? 0.08 : 0) + store.staff.workload * 0.06 + (store.financialHealth === 'cash_gap' ? 0.08 : 0), 0.04, 0.34);
  const serviceFromStaff = clamp(store.profile.serviceLevel + store.staff.trainingLevel * 0.18 + sellerCount / 24 - store.staff.workload * 0.22, 0.35, 1.7);
  const conversion = clamp((0.16 + serviceFromStaff * 0.11 + store.reputation / 700 + store.customerLoyalty / 600 - averagePriceIndex(store, skuMarketPriceIndex) * 0.08) * marketing.conversionModifier, 0.02, 0.58);
  const targetOrders = Math.round(traffic * conversion);
  const targetUnits = Math.round(targetOrders * store.profile.basketSize);

  let revenue = 0;
  let cogs = 0;
  let soldUnits = 0;
  let lostSales = 0;
  const skuSales: Record<string, number> = {};
  const skuLost: Record<string, number> = {};
  const categorySales: Record<string, number> = {};
  const categoryLost: Record<string, number> = {};
  const demandWeights = store.productSkus.map((sku) => {
    if (sku.status === 'blocked') return 0;
    const marketAvg = skuMarketPriceIndex[sku.id] ?? sku.baseMarketPrice;
    const priceIndex = sku.retailPrice / marketAvg;
    const priceEffect = priceIndex > 1 ? clamp(1 - (priceIndex - 1) * sku.elasticity * (1 - store.customerLoyalty / 300), 0.3, 1) : clamp(1 + (1 - priceIndex) * sku.elasticity * 0.65, 1, 1.45);
    return sku.baseDemandWeight * priceEffect * segmentFit(store.type, sku.segment) * (0.7 + sku.quality * 0.2 + sku.brandPower * 0.1) * sku.seasonality;
  });
  const totalWeight = demandWeights.reduce((sum, weight) => sum + weight, 0) || 1;

  const productSkus = store.productSkus.map((sku, index) => {
    const listed = sku.status !== 'blocked';
    const desired = listed ? Math.round(targetUnits * (demandWeights[index] / totalWeight)) : 0;
    const sold = Math.min(sku.stock, Math.max(0, desired));
    const missed = listed ? Math.max(0, desired - sold) : 0;
    const effectiveRetail = Math.max(sku.purchasePrice * 1.03, sku.retailPrice * (1 + marketing.marginImpact));
    soldUnits += sold;
    lostSales += missed;
    revenue += sold * effectiveRetail;
    cogs += sold * sku.purchasePrice * eventState.importCostMultiplier;
    skuSales[sku.id] = sold;
    skuLost[sku.id] = missed;
    categorySales[sku.categoryId] = (categorySales[sku.categoryId] ?? 0) + sold;
    categoryLost[sku.categoryId] = (categoryLost[sku.categoryId] ?? 0) + missed;
    const stock = sku.stock - sold;
    return {
      ...sku,
      stock,
      ageWeeks: stock > 0 ? sku.ageWeeks + 1 : 0,
      status: listed ? skuStatus(stock, sku.minStock, sku.targetStock, sku.ageWeeks + 1) : 'blocked'
    };
  });

  const activeSkuCount = productSkus.filter((sku) => sku.status !== 'blocked').length;
  const blockedSkuCount = productSkus.filter((sku) => sku.status === 'blocked').length;
  const outOfStockActiveSkuCount = productSkus.filter((sku) => sku.status === 'out_of_stock').length;
  const marketerCount = store.employees.filter((worker) => worker.role === 'marketer').length;
  const salaryDebt = store.salaryDebt ?? 0;
  const categories = syncCategoriesFromSkus(store.categories, productSkus);
  const weeklyRent = store.profile.rent / WEEKS_PER_MONTH;
  const weeklyPayroll = store.employees.reduce((sum, worker) => sum + (worker.salaryCurrent ?? worker.expectedSalary), 0) / WEEKS_PER_MONTH;
  const payrollCashPaid = Math.round(weeklyPayroll);
  const weeklyOperating = (store.profile.operatingCosts / WEEKS_PER_MONTH) * eventState.taxMultiplier * (1 + market.inflationRate * 0.25);
  const penalties = (churn > 0.24 ? 8_000 : 0) + (lostSales > soldUnits * 0.45 ? 7_000 : 0) + (eventState.complianceCost > 0 && store.reputation < 52 ? Math.round(eventState.complianceCost * 0.35) : 0);
  const grossProfit = Math.round(revenue - cogs);
  const paymentResult = processLoanPayments({ ...store, cash: store.cash + grossProfit }, week + 1);
  const loanPayments = paymentResult.paidTotal;
  const overdueLoanPayments = paymentResult.overdueTotal;
  const supplierPayments = supplied.supplierPayments;
  const expensesWithoutDebt = Math.round(weeklyRent + weeklyPayroll + marketing.cost + weeklyOperating + penalties);
  const netProfit = Math.round(grossProfit - expensesWithoutDebt - loanPayments - overdueLoanPayments * 0.08);
  const cash = Math.round(paymentResult.store.cash - expensesWithoutDebt - overdueLoanPayments * 0.08);
  const lossStreak = netProfit < 0 ? store.lossStreak + 1 : 0;
  const financialHealth = determineFinancialHealth(store, cash, lossStreak);
  const stockPenalty = lostSales > soldUnits * 0.35 ? 1.1 : 0;
  const servicePenalty = serviceFromStaff < 0.85 ? 0.7 : 0;
  const loyaltyDelta = marketing.loyaltyDelta + (lostSales === 0 ? 0.5 : -stockPenalty) + (serviceFromStaff > 1 ? 0.35 : -servicePenalty) + (netProfit > 0 ? 0.1 : -0.1);
  const reputationDelta = marketing.reputationDelta - churn * 3 - stockPenalty + (netProfit > 0 ? 0.25 : -0.2) - (overdueLoanPayments > 0 ? 1.2 : 0);
  const nextLoyalty = clamp(store.customerLoyalty + loyaltyDelta, 0, 100);
  const nextReputation = clamp(store.reputation + reputationDelta, 5, 100);
  const debt = totalDebt(paymentResult.store);
  const marketShare = safeDiv(allocatedCustomers, totalCustomers) * 100;
  const stats: WeeklyStats = {
    weeklyRevenue: Math.round(revenue),
    grossProfit,
    netProfit,
    weeklyProfit: netProfit,
    marginPercent: Math.round(safeDiv(grossProfit, revenue) * 10000) / 100,
    traffic,
    conversion: Math.round(safeDiv(soldUnits / store.profile.basketSize, Math.max(1, traffic)) * 10000) / 100,
    averageCheck: Math.round(safeDiv(revenue, Math.max(1, targetOrders))),
    totalStock: totalSkuStock(productSkus),
    lostSales,
    expenses: expensesWithoutDebt + loanPayments,
    marketingExpenses: marketing.cost,
    payrollExpenses: Math.round(weeklyPayroll),
    rentExpenses: Math.round(weeklyRent),
    loanPayments,
    debtTotal: debt,
    reputation: nextReputation,
    customerLoyalty: nextLoyalty,
    marketShare,
    cogs: Math.round(cogs),
    activeSkuCount,
    blockedSkuCount,
    outOfStockActiveSkuCount,
    payrollAccrued: Math.round(weeklyPayroll),
    payrollCashPaid,
    salaryDebt,
    sellerCount,
    marketerCount,
    autoOrdersCreated: 0,
    autoOrdersFailed: 0
  };
  const historyEntry: WeeklyHistoryEntry = { week, cash, revenue: stats.weeklyRevenue, grossProfit: stats.grossProfit, netProfit: stats.netProfit, marginPercent: stats.marginPercent, traffic: stats.traffic, conversion: stats.conversion, averageCheck: stats.averageCheck, totalStock: stats.totalStock, lostSales: stats.lostSales, expenses: stats.expenses, marketingExpenses: stats.marketingExpenses, payrollExpenses: stats.payrollExpenses, rentExpenses: stats.rentExpenses, loanPayments: stats.loanPayments, debtTotal: stats.debtTotal, reputation: stats.reputation, customerLoyalty: stats.customerLoyalty, marketShare: stats.marketShare };
  const nextStoreBase: StoreEntity = {
    ...paymentResult.store,
    cash,
    categories,
    productSkus,
    staff: { ...store.staff, serviceLevel: serviceFromStaff, workload: clamp(safeDiv(targetOrders, Math.max(1, sellerCount) * 90), 0.25, 1.55), churn },
    serviceLevel: serviceFromStaff,
    reputation: nextReputation,
    customerLoyalty: nextLoyalty,
    repeatPurchaseRate: clamp(0.12 + nextLoyalty / 400, 0.1, 0.42),
    loyalCustomerBase: Math.round(clamp(store.loyalCustomerBase + soldUnits * (nextLoyalty / 100) - lostSales * 0.08, 0, 7000)),
    expenses: { rent: Math.round(weeklyRent), operating: Math.round(weeklyOperating), marketing: marketing.cost, payroll: Math.round(weeklyPayroll), penalties, loanPayments, writeOffs: 0, returnsCost: 0, supplierPayments, payrollAccruedExpense: Math.round(weeklyPayroll), payrollCashPaid, salaryDebt },
    lastWeekStats: stats,
    lossStreak,
    financialHealth,
    categorySalesLastWeek: categorySales,
    categoryLostSalesLastWeek: categoryLost,
    skuSalesLastWeek: skuSales,
    skuLostSalesLastWeek: skuLost,
    marketShare,
    payrollAccrued: Math.round(weeklyPayroll),
    salaryDebt,
    activeMarketingActivities: store.activeMarketingActivities,
    weeklyHistory: [...store.weeklyHistory, historyEntry],
    isClosed: financialHealth === 'bankrupt'
  };

  return { store: { ...nextStoreBase, creditScore: calculateCreditScore(nextStoreBase) }, traffic, allocatedCustomers };
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
  if (state.gamePhase === 'setup') return processSetupWeek(state);

  const progressedEvents = progressEvents(state.market.currentEvents);
  const nextFinancialMarket = applyFinancialEventEffects(state.market.financialMarket, progressedEvents);
  const hiring = processJobRequests(state.player, state.cityWorkers, state.week);
  const playerForWeek = hiring.store;
  const competitorPlanned = state.competitors.map(makeCompetitorDecisions).filter((store) => !store.isClosed);
  const allStoresBefore = [playerForWeek, ...competitorPlanned];
  const skuMarketPriceIndex = createSkuMarketPriceIndex(allStoresBefore);
  const totalCustomers = Math.round(state.market.weeklyCustomerPool * nextFinancialMarket.consumerConfidence);
  const marketingNoise = calculateMarketingNoise(allStoresBefore, Math.max(totalCustomers, 1));
  const attractivenessByStore = new Map<string, number>();

  state.market.segments.forEach((segment) => {
    const segmentSize = Math.round(segment.size * nextFinancialMarket.consumerConfidence);
    const scores = allStoresBefore.map((store) => ({ id: store.id, score: computeAttractiveness(store, segment, skuMarketPriceIndex, progressedEvents, marketingNoise) }));
    const sumScores = scores.reduce((sum, item) => sum + item.score, 0);
    scores.forEach((item) => {
      const customers = Math.round(segmentSize * safeDiv(item.score, sumScores || 1));
      attractivenessByStore.set(item.id, (attractivenessByStore.get(item.id) ?? 0) + customers);
    });
  });

  const playerResult = runStoreWeek(playerForWeek, attractivenessByStore.get(playerForWeek.id) ?? playerForWeek.profile.baseTraffic, skuMarketPriceIndex, progressedEvents, marketingNoise, state.week, nextFinancialMarket, totalCustomers, state.suppliers);
  const competitorResults = competitorPlanned.map((competitor) => runStoreWeek(competitor, attractivenessByStore.get(competitor.id) ?? competitor.profile.baseTraffic, skuMarketPriceIndex, progressedEvents, marketingNoise, state.week, nextFinancialMarket, totalCustomers, state.suppliers).store);
  const nextEvent = rollNewEvent(state.week + 1);
  const nextEvents = nextEvent ? [...progressedEvents, nextEvent] : progressedEvents;
  const nextLog = [...hiring.events, ...state.eventLog];

  if (nextEvent) nextLog.unshift(`Неделя ${state.week + 1}: ${nextEvent.title}. ${nextEvent.description}`);
  if (playerResult.store.lastWeekStats.lostSales > playerResult.store.lastWeekStats.weeklyRevenue / 1000) nextLog.unshift(`Неделя ${state.week}: выросли потерянные продажи из-за нехватки остатков.`);
  if (playerResult.store.financialHealth !== state.player.financialHealth) nextLog.unshift(`Неделя ${state.week}: финансовое здоровье изменилось на «${playerResult.store.financialHealth}».`);

  return {
    ...state,
    week: state.week + 1,
    gamePhase: playerResult.store.financialHealth === 'bankrupt' ? 'bankrupt' : state.gamePhase,
    player: playerResult.store,
    cityWorkers: hiring.cityWorkers,
    competitors: competitorResults,
    market: { ...state.market, currentEvents: nextEvents, marketPriceIndex: skuMarketPriceIndex, skuMarketPriceIndex, marketingNoise, financialMarket: nextFinancialMarket, phase: marketPhaseFromFinancials(nextFinancialMarket) },
    eventLog: nextLog.slice(0, 30)
  };
};
