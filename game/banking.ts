import { clamp, totalDebt } from './calculations';
import { Bank, FinancialMarket, FinancialHealth, LoanContract, LoanPayment, LoanType, StoreEntity } from './types';

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
  const debtPenalty = Math.min(28, totalDebt(store) / 60_000);
  const healthPenalty: Record<FinancialHealth, number> = {
    healthy: 0,
    strained: 8,
    cash_gap: 18,
    pre_bankruptcy: 32,
    bankrupt: 55
  };

  return Math.round(
    clamp(
      44 +
        store.reputation * 0.15 +
        store.customerLoyalty * 0.12 +
        Math.min(18, store.cash / 80_000) +
        revenueStability -
        debtPenalty -
        store.lossStreak * 5 -
        healthPenalty[store.financialHealth],
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
  const payment = (amount * weeklyRate) / (1 - Math.pow(1 + weeklyRate, -termWeeks));
  return Math.round(payment);
};

export const approvalChance = (store: StoreEntity, bank: Bank, market: FinancialMarket, amount: number): number => {
  const debtLoadPenalty = totalDebt(store) / Math.max(1, amount + store.cash + 200_000);
  const chance =
    (calculateCreditScore(store) / 100) * bank.riskTolerance * market.creditAvailability - debtLoadPenalty * 0.45 - store.lossStreak * 0.04;

  return clamp(chance / bank.approvalStrictness, 0.03, 0.95);
};

export const createLoanContract = (
  bank: Bank,
  store: StoreEntity,
  market: FinancialMarket,
  loanType: LoanType,
  amount: number,
  termWeeks: number,
  startWeek: number
): LoanContract => {
  const annualInterestRate = estimateLoanRate(store, bank, market, loanType);
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
      return {
        ...loan,
        remainingPrincipal,
        weeksRemaining: Math.max(0, loan.weeksRemaining - 1),
        paymentSchedule,
        status: remainingPrincipal === 0 ? 'paid' : loan.status
      } satisfies LoanContract;
    }

    overdueTotal += payment.totalPayment;
    return {
      ...loan,
      paymentSchedule,
      status: loan.weeksRemaining <= 1 ? 'defaulted' : loan.status
    } satisfies LoanContract;
  });

  return {
    store: {
      ...store,
      cash,
      activeLoans
    },
    paidTotal,
    overdueTotal
  };
};
