import { clamp, fixedWeeklyCosts, inventoryPurchaseValue, totalDebt } from './calculations';
import {
  AlternativeLoanOffer,
  Bank,
  FinancialHealth,
  FinancialMarket,
  LoanApplication,
  LoanContract,
  LoanPayment,
  LoanType,
  StoreEntity
} from './types';

const typeRatePremium: Record<LoanType, number> = {
  working_capital: 0.025,
  overdraft: 0.07,
  investment: 0.015,
  crisis: 0.095,
  credit_line: 0.04
};

export const loanTypeLabels: Record<LoanType, string> = {
  working_capital: 'Оборотный кредит',
  overdraft: 'Овердрафт',
  investment: 'Инвестиционный кредит',
  crisis: 'Антикризисный кредит',
  credit_line: 'Кредитная линия'
};

export const calculateCreditScore = (store: StoreEntity): number => {
  const revenueStability = store.weeklyHistory.slice(-4).filter((week) => week.netProfit >= -50_000).length * 4;
  const recentRejections = store.loanApplications.filter((application) => application.status === 'rejected').slice(-4).length;
  const debtPenalty = Math.min(28, totalDebt(store) / 60_000);
  const healthPenalty: Record<FinancialHealth, number> = { healthy: 0, strained: 8, cash_gap: 18, pre_bankruptcy: 32, bankrupt: 55 };

  return Math.round(
    clamp(
      44 + store.reputation * 0.15 + store.customerLoyalty * 0.12 + Math.min(18, store.cash / 80_000) + revenueStability - debtPenalty - store.lossStreak * 5 - healthPenalty[store.financialHealth] - recentRejections * 3,
      0,
      100
    )
  );
};

export const estimateLoanRate = (store: StoreEntity, bank: Bank, market: FinancialMarket, loanType: LoanType): number => {
  const score = calculateCreditScore(store);
  const riskPremium = (100 - score) / 1000;
  const trustBonus = (store.reputation + store.customerLoyalty) / 5000;

  return clamp(bank.baseInterestRate + market.refinancingRate + typeRatePremium[loanType] + riskPremium - trustBonus, 0.06, 0.55);
};

export const estimateWeeklyPayment = (amount: number, annualRate: number, termWeeks: number): number => {
  const weeklyRate = annualRate / 52;
  if (weeklyRate === 0) return Math.round(amount / termWeeks);
  return Math.round((amount * weeklyRate) / (1 - Math.pow(1 + weeklyRate, -termWeeks)));
};

export const bankingMetrics = (store: StoreEntity, proposedPayment: number) => {
  const last4 = store.weeklyHistory.slice(-4);
  const avgRevenue = last4.length > 0 ? last4.reduce((sum, week) => sum + week.revenue, 0) / last4.length : Math.max(1, store.lastWeekStats.weeklyRevenue || 180_000);
  const avgGrossProfit = last4.length > 0 ? last4.reduce((sum, week) => sum + week.grossProfit, 0) / last4.length : Math.max(1, store.lastWeekStats.grossProfit || 65_000);
  const avgOperatingCashflow = last4.length > 0 ? last4.reduce((sum, week) => sum + week.netProfit + week.loanPayments, 0) / last4.length : Math.max(1, store.lastWeekStats.netProfit + store.lastWeekStats.loanPayments || 45_000);
  const weeklyCosts = fixedWeeklyCosts(store);
  const debt = totalDebt(store);

  return {
    cashRunwayWeeks: store.cash / Math.max(1, weeklyCosts),
    averageRevenueLast4Weeks: avgRevenue,
    averageGrossProfitLast4Weeks: avgGrossProfit,
    averageOperatingCashflowLast4Weeks: avgOperatingCashflow,
    dscr: avgOperatingCashflow / Math.max(1, proposedPayment),
    debtToRevenue: debt / Math.max(1, avgRevenue),
    debtToGrossProfit: debt / Math.max(1, avgGrossProfit),
    collateralValue: inventoryPurchaseValue(store.productSkus) * 0.42,
    debt
  };
};

const hasOverduePayments = (store: StoreEntity): boolean =>
  store.activeLoans.some((loan) => loan.paymentSchedule.some((payment) => payment.overdue && !payment.paid));

export const evaluateLoanApplication = (
  store: StoreEntity,
  bank: Bank,
  market: FinancialMarket,
  loanType: LoanType,
  amount: number,
  termWeeks: number,
  week: number
): LoanApplication => {
  const safeAmount = Math.min(bank.maxLoanAmount, Math.max(10_000, Math.round(amount)));
  const safeTerm = Math.min(bank.maxTermWeeks, Math.max(bank.minTermWeeks, Math.round(termWeeks)));
  const rate = estimateLoanRate(store, bank, market, loanType);
  const weeklyPayment = estimateWeeklyPayment(safeAmount, rate, safeTerm);
  const metrics = bankingMetrics(store, weeklyPayment);
  const score = calculateCreditScore(store);
  const reasons: string[] = [];
  const rejectedApplications = store.loanApplications.filter((application) => application.bankId === bank.id && application.status === 'rejected');
  const lastApplication = rejectedApplications[rejectedApplications.length - 1];

  if (lastApplication && week < lastApplication.cooldownUntilWeek) reasons.push(`Повторная заявка доступна с недели ${lastApplication.cooldownUntilWeek}.`);
  if (!bank.allowedLoanTypes.includes(loanType)) reasons.push('Этот банк не выдаёт выбранный тип кредита.');
  if (store.financialHealth === 'bankrupt' && loanType !== 'crisis') reasons.push('Магазин в банкротном состоянии: доступен только кризисный кредитор.');
  if (hasOverduePayments(store) && bank.id !== 'microfinance') reasons.push('Есть просроченные платежи по действующим кредитам.');
  if (score < bank.minCreditScore) reasons.push(`Кредитный рейтинг ${score}, требуется минимум ${bank.minCreditScore}.`);
  if (metrics.dscr < bank.minDSCR) reasons.push(`DSCR ${metrics.dscr.toFixed(2)}, требуется минимум ${bank.minDSCR}.`);
  if (metrics.debtToRevenue > bank.maxDebtToRevenue) reasons.push(`Долг/выручка ${metrics.debtToRevenue.toFixed(2)} выше лимита ${bank.maxDebtToRevenue}.`);
  if (metrics.debtToGrossProfit > bank.maxDebtToGrossProfit) reasons.push(`Долг/валовая прибыль ${metrics.debtToGrossProfit.toFixed(2)} выше лимита ${bank.maxDebtToGrossProfit}.`);
  if (metrics.cashRunwayWeeks < bank.minCashRunwayWeeks) reasons.push(`Runway ${metrics.cashRunwayWeeks.toFixed(1)} недели, требуется ${bank.minCashRunwayWeeks}.`);
  if (bank.requiresPositiveProfitTrend && store.weeklyHistory.slice(-3).some((item) => item.netProfit < 0)) reasons.push('Банк требует положительный тренд прибыли.');
  if (bank.collateralRequired && metrics.collateralValue < safeAmount * 0.35) reasons.push('Недостаточно товарного обеспечения для суммы кредита.');

  let alternativeOffer: AlternativeLoanOffer | undefined;
  const severeReasons = reasons.filter((reason) => reason.includes('просроч') || reason.includes('Повторная') || reason.includes('банкрот'));
  const status = reasons.length === 0 ? 'approved' : severeReasons.length === 0 && score >= bank.minCreditScore - 8 ? 'conditional' : 'rejected';

  if (status === 'conditional') {
    const alternativeAmount = Math.max(50_000, Math.min(safeAmount * 0.65, bank.maxLoanAmount * 0.65));
    const alternativeTerm = Math.min(bank.maxTermWeeks, Math.max(safeTerm + 8, bank.minTermWeeks));
    const alternativeRate = clamp(rate + 0.025, 0.06, 0.58);
    alternativeOffer = {
      amount: Math.round(alternativeAmount),
      termWeeks: alternativeTerm,
      annualInterestRate: alternativeRate,
      weeklyPayment: estimateWeeklyPayment(alternativeAmount, alternativeRate, alternativeTerm),
      loanType: loanType === 'investment' && !bank.allowedLoanTypes.includes('investment') ? 'working_capital' : loanType,
      conditions: ['Сократить маркетинговые расходы с плохим ROI', 'Не брать новый кредит 4 недели', 'Направить деньги на оборотный товар']
    };
  }

  return {
    id: `application-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    week,
    bankId: bank.id,
    loanType,
    amount: safeAmount,
    termWeeks: safeTerm,
    status,
    reasons,
    calculatedDSCR: metrics.dscr,
    calculatedDebtLoad: metrics.debtToRevenue,
    calculatedCashRunway: metrics.cashRunwayWeeks,
    calculatedCreditScore: score,
    proposedRate: rate,
    proposedWeeklyPayment: weeklyPayment,
    cooldownUntilWeek: status === 'rejected' ? week + bank.cooldownWeeksAfterRejection : week,
    alternativeOffer
  };
};

export const createLoanContract = (
  bank: Bank,
  store: StoreEntity,
  market: FinancialMarket,
  loanType: LoanType,
  amount: number,
  termWeeks: number,
  startWeek: number,
  lockedRate?: number
): LoanContract => {
  const annualInterestRate = lockedRate ?? estimateLoanRate(store, bank, market, loanType);
  const weeklyPayment = estimateWeeklyPayment(amount, annualInterestRate, termWeeks);
  const paymentSchedule: LoanPayment[] = Array.from({ length: termWeeks }).map((_, index) => ({
    week: startWeek + index + 1,
    principalPart: Math.round(amount / termWeeks),
    interestPart: Math.max(0, weeklyPayment - Math.round(amount / termWeeks)),
    totalPayment: weeklyPayment,
    paid: false,
    overdue: false
  }));

  return {
    id: `loan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    bankId: bank.id,
    loanType,
    principal: amount,
    remainingPrincipal: amount,
    annualInterestRate,
    weeklyPayment,
    termWeeks,
    weeksRemaining: termWeeks,
    startWeek,
    paymentSchedule,
    status: 'active'
  };
};

export const processLoanPayments = (store: StoreEntity, week: number): { store: StoreEntity; paidTotal: number; overdueTotal: number } => {
  let cash = store.cash;
  let paidTotal = 0;
  let overdueTotal = 0;

  const activeLoans = store.activeLoans.map((loan) => {
    if (loan.status !== 'active') return loan;

    const nextPaymentIndex = loan.paymentSchedule.findIndex((payment) => payment.week <= week && !payment.paid && !payment.overdue);
    if (nextPaymentIndex === -1) return loan;

    const payment = loan.paymentSchedule[nextPaymentIndex];
    const canPay = cash >= payment.totalPayment;
    const updatedPayment: LoanPayment = { ...payment, paid: canPay, overdue: !canPay };
    const paymentSchedule = loan.paymentSchedule.map((item, index) => (index === nextPaymentIndex ? updatedPayment : item));

    if (canPay) {
      cash -= payment.totalPayment;
      paidTotal += payment.totalPayment;
      const remainingPrincipal = Math.max(0, loan.remainingPrincipal - payment.principalPart);
      return { ...loan, remainingPrincipal, weeksRemaining: Math.max(0, loan.weeksRemaining - 1), paymentSchedule, status: remainingPrincipal === 0 ? 'paid' : loan.status } satisfies LoanContract;
    }

    overdueTotal += payment.totalPayment;
    return { ...loan, paymentSchedule, status: loan.weeksRemaining <= 1 ? 'defaulted' : loan.status } satisfies LoanContract;
  });

  return { store: { ...store, cash, activeLoans }, paidTotal, overdueTotal };
};
