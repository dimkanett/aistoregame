'use client';

import { create } from 'zustand';
import { BANKS } from '@/game/constants';
import { calculateCreditScore, createLoanContract, evaluateLoanApplication } from '@/game/banking';
import { calculateSkuMargin, clamp, deriveStaffFromEmployees, syncCategoriesFromSkus, totalSkuStock } from '@/game/calculations';
import { buildSessionState, initialState } from '@/game/initialState';
import { hireWorker } from '@/game/labor';
import { canStartSales, runWeeklyCycle } from '@/game/simulationEngine';
import { createPurchaseOrder } from '@/game/suppliers';
import { BusinessStrategy, GameState, LoanType, StoreType, SupplierAgreement, WorkerRole } from '@/game/types';

interface GameStore extends GameState {
  startSession: (storeType: StoreType) => void;
  updateRetailPrice: (skuId: string, price: number) => void;
  orderStock: (skuId: string, quantity: number, supplierId?: string) => void;
  setSkuListed: (skuId: string, listed: boolean) => void;
  updateSkuAutoReorder: (skuId: string, enabled: boolean, minStock?: number, targetStock?: number, supplierId?: string, maxValue?: number) => void;
  createJobRequest: (role: WorkerRole, offeredSalary: number) => void;
  hireCandidate: (requestId: string, workerId: string) => void;
  signSupplierAgreement: (supplierId: string) => void;
  toggleMarketingActivity: (activityId: string) => void;
  hireEmployee: () => void;
  fireEmployee: () => void;
  setSalary: (salary: number) => void;
  investInTraining: () => void;
  setPlayerStrategy: (strategy: BusinessStrategy) => void;
  applyForLoan: (bankId: string, loanType: LoanType, amount: number, termWeeks: number) => void;
  acceptAlternativeLoan: () => void;
  startSales: () => void;
  nextWeek: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,
  startSession: (storeType) => set(() => buildSessionState(storeType)),
  updateRetailPrice: (skuId, price) => {
    set((state) => {
      if (!state.player) return state;
      const productSkus = state.player.productSkus.map((sku) => {
        if (sku.id !== skuId) return sku;
        const nextPrice = Math.max(Math.round(sku.purchasePrice * 1.05), Math.round(price));
        return { ...sku, retailPrice: nextPrice };
      });
      const categories = syncCategoriesFromSkus(state.player.categories, productSkus);
      return { player: { ...state.player, productSkus, categories, lastWeekStats: { ...state.player.lastWeekStats, totalStock: totalSkuStock(productSkus) } } };
    });
  },
  orderStock: (skuId, quantity, supplierId) => {
    set((state) => {
      if (!state.player) return state;
      const sku = state.player.productSkus.find((item) => item.id === skuId);
      const supplier = state.suppliers.find((item) => item.id === (supplierId ?? sku?.supplierId));
      if (!sku || !supplier) return state;
      if (!state.player.supplierAgreements.some((agreement) => agreement.supplierId === supplier.id && agreement.active)) {
        return { eventLog: [`Неделя ${state.week}: сначала заключите договор с поставщиком «${supplier.name}».`, ...state.eventLog].slice(0, 30) };
      }
      const playerForOrder = { ...state.player, productSkus: state.player.productSkus.map((item) => item.id === skuId ? { ...item, status: 'active' as const } : item) };
      const result = createPurchaseOrder(playerForOrder, supplier, skuId, Math.max(0, Math.round(quantity)), state.week);
      return { player: result.store, eventLog: [`Неделя ${state.week}: ${result.message}`, ...state.eventLog].slice(0, 30) };
    });
  },

  setSkuListed: (skuId, listed) => {
    set((state) => {
      if (!state.player) return state;
      const productSkus = state.player.productSkus.map((sku) =>
        sku.id === skuId ? { ...sku, status: listed ? (sku.stock > 0 ? 'active' as const : 'out_of_stock' as const) : 'blocked' as const } : sku
      );
      return { player: { ...state.player, productSkus, categories: syncCategoriesFromSkus(state.player.categories, productSkus) } };
    });
  },
  updateSkuAutoReorder: (skuId, enabled, minStock, targetStock, supplierId, maxValue) => {
    set((state) => {
      if (!state.player) return state;
      const productSkus = state.player.productSkus.map((sku) =>
        sku.id === skuId
          ? {
              ...sku,
              autoReorderEnabled: enabled,
              reorderMinStock: minStock ?? sku.reorderMinStock,
              reorderTargetStock: targetStock ?? sku.reorderTargetStock,
              preferredSupplierId: supplierId ?? sku.preferredSupplierId,
              maxAutoOrderValue: maxValue ?? sku.maxAutoOrderValue
            }
          : sku
      );
      return { player: { ...state.player, productSkus } };
    });
  },
  createJobRequest: (role, offeredSalary) => {
    set((state) => {
      if (!state.player) return state;
      return {
        player: {
          ...state.player,
          jobRequests: [
            ...state.player.jobRequests,
            {
              id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              storeId: state.player.id,
              role,
              offeredSalary: Math.round(offeredSalary),
              createdWeek: state.week,
              status: 'open',
              candidates: [],
              expiresWeek: state.week + 3
            }
          ]
        },
        eventLog: [`Неделя ${state.week}: размещена заявка на роль ${role === 'seller' ? 'продавец' : 'маркетолог'}.`, ...state.eventLog].slice(0, 30)
      };
    });
  },
  hireCandidate: (requestId, workerId) => {
    set((state) => {
      if (!state.player) return state;
      const result = hireWorker(state.player, state.cityWorkers, requestId, workerId);
      return {
        player: result.store,
        cityWorkers: result.cityWorkers,
        eventLog: [`Неделя ${state.week}: кандидат принят на работу.`, ...state.eventLog].slice(0, 30)
      };
    });
  },
  signSupplierAgreement: (supplierId) => {
    set((state) => {
      if (!state.player) return state;
      const supplier = state.suppliers.find((item) => item.id === supplierId);
      if (!supplier || state.player.supplierAgreements.some((agreement) => agreement.supplierId === supplierId && agreement.active)) return state;
      const agreement: SupplierAgreement = {
        supplierId,
        storeId: state.player.id,
        startedWeek: state.week,
        paymentTerms: supplier.paymentTerms,
        deliverySLAWeeks: supplier.deliverySLAWeeks,
        priceModifier: 1,
        bonusTerms: supplier.bonusTerms,
        active: true
      };
      return {
        player: { ...state.player, supplierAgreements: [...state.player.supplierAgreements, agreement] },
        eventLog: [`Неделя ${state.week}: заключён договор с поставщиком «${supplier.name}».`, ...state.eventLog].slice(0, 30)
      };
    });
  },
  toggleMarketingActivity: (activityId) => {
    set((state) => {
      if (!state.player) return state;
      const activityRequiresMarketer = state.player.activeMarketingActivities.find((activity) => activity.activityId === activityId)?.enabled === false;
      const existing = state.player.activeMarketingActivities.find((activity) => activity.activityId === activityId);
      const activeMarketingActivities = existing
        ? state.player.activeMarketingActivities.map((activity) => (activity.activityId === activityId ? { ...activity, enabled: !activity.enabled, weeksActive: activity.enabled ? 0 : activity.weeksActive } : activity))
        : [...state.player.activeMarketingActivities, { activityId, weeksActive: 0, enabled: true }];

      return { player: { ...state.player, activeMarketingActivities }, eventLog: activityRequiresMarketer ? state.eventLog : state.eventLog };
    });
  },
  hireEmployee: () => {
    set((state) => {
      if (!state.player) return state;
      return { eventLog: ['Используйте заявку на найм: сотрудники приходят кандидатами на следующей неделе.', ...state.eventLog].slice(0, 30) };
    });
  },
  fireEmployee: () => {
    set((state) => {
      if (!state.player || state.player.employees.length === 0) return state;
      const fired = state.player.employees[state.player.employees.length - 1];
      const employees = state.player.employees.slice(0, -1);
      const staff = deriveStaffFromEmployees(employees, state.player.staff.averageSalary);
      const cityWorkers = state.cityWorkers.map((worker) =>
        worker.id === fired.id ? { ...worker, status: 'available' as const, employedBy: undefined, salaryCurrent: undefined } : worker
      );
      return { player: { ...state.player, employees, staff, serviceLevel: staff.serviceLevel }, cityWorkers };
    });
  },
  setSalary: (salary) => {
    set((state) => {
      if (!state.player) return state;
      return { player: { ...state.player, staff: { ...state.player.staff, averageSalary: clamp(Math.round(salary), 28_000, 120_000) } } };
    });
  },
  investInTraining: () => {
    set((state) => {
      if (!state.player) return state;
      const cost = 60_000;
      if (state.player.cash < cost) return state;
      const employees = state.player.employees.map((worker) => ({ ...worker, training: clamp(worker.training + 5, 0, 100) }));
      const staff = deriveStaffFromEmployees(employees, state.player.staff.averageSalary);
      return { player: { ...state.player, cash: state.player.cash - cost, employees, staff }, eventLog: [`Неделя ${state.week}: проведено обучение персонала (-60 000 ₽).`, ...state.eventLog].slice(0, 30) };
    });
  },
  setPlayerStrategy: (strategy) => {
    set((state) => (state.player ? { player: { ...state.player, playerStrategy: strategy } } : state));
  },
  applyForLoan: (bankId, loanType, amount, termWeeks) => {
    set((state) => {
      if (!state.player) return state;
      const bank = BANKS.find((item) => item.id === bankId);
      if (!bank) return state;
      const application = evaluateLoanApplication(state.player, bank, state.market.financialMarket, loanType, amount, termWeeks, state.week);
      const playerWithApplication = { ...state.player, loanApplications: [...state.player.loanApplications, application] };
      if (application.status !== 'approved') {
        return {
          player: { ...playerWithApplication, creditScore: Math.max(0, calculateCreditScore(playerWithApplication) - (application.status === 'rejected' ? 2 : 0)) },
          lastLoanDecision: { approved: false, message: application.status === 'conditional' ? 'Банк готов рассмотреть альтернативное предложение.' : 'Банк отказал по заявке.', application },
          eventLog: [`Неделя ${state.week}: решение банка «${bank.name}» — ${application.status}.`, ...state.eventLog].slice(0, 30)
        };
      }
      const contract = createLoanContract(bank, state.player, state.market.financialMarket, loanType, application.amount, application.termWeeks, state.week, application.proposedRate);
      const player = { ...playerWithApplication, cash: state.player.cash + application.amount, activeLoans: [...state.player.activeLoans, contract] };
      return {
        player: { ...player, creditScore: calculateCreditScore(player) },
        lastLoanDecision: { approved: true, message: `Кредит одобрен: ${application.amount.toLocaleString('ru-RU')} ₽.`, contract, application },
        eventLog: [`Неделя ${state.week}: получен кредит в «${bank.name}» на ${application.amount.toLocaleString('ru-RU')} ₽.`, ...state.eventLog].slice(0, 30)
      };
    });
  },
  acceptAlternativeLoan: () => {
    set((state) => {
      if (!state.player || !state.lastLoanDecision?.application?.alternativeOffer) return state;
      const application = state.lastLoanDecision.application;
      const offer = application.alternativeOffer;
      if (!offer) return state;
      const bank = BANKS.find((item) => item.id === application.bankId);
      if (!bank) return state;
      const contract = createLoanContract(bank, state.player, state.market.financialMarket, offer.loanType, offer.amount, offer.termWeeks, state.week, offer.annualInterestRate);
      const player = { ...state.player, cash: state.player.cash + offer.amount, activeLoans: [...state.player.activeLoans, contract] };
      return { player: { ...player, creditScore: calculateCreditScore(player) }, lastLoanDecision: { approved: true, message: 'Альтернативное предложение принято.', contract, application }, eventLog: [`Неделя ${state.week}: принято альтернативное кредитное предложение.`, ...state.eventLog].slice(0, 30) };
    });
  },
  startSales: () => {
    set((state) => {
      if (!state.player) return state;
      const check = canStartSales(state.player);
      if (!check.ok) return { eventLog: [`Нельзя начать продажи: ${check.reasons.join(' ')}`, ...state.eventLog].slice(0, 30) };
      return { gamePhase: 'running', eventLog: [`Неделя ${state.week}: продажи запущены.`, ...state.eventLog].slice(0, 30) };
    });
  },
  nextWeek: () => set((state) => runWeeklyCycle(state)),
  resetGame: () => set(initialState)
}));
