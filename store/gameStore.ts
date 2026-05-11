'use client';

import { create } from 'zustand';
import { BANKS } from '@/game/constants';
import { calculateCategoryMargin, clamp, totalStock, withMargins } from '@/game/calculations';
import { approvalChance, calculateCreditScore, createLoanContract } from '@/game/banking';
import { buildSessionState, initialState } from '@/game/initialState';
import { runWeeklyCycle } from '@/game/simulationEngine';
import { BusinessStrategy, GameState, LoanType, StoreType } from '@/game/types';

interface GameStore extends GameState {
  startSession: (storeType: StoreType) => void;
  updateRetailPrice: (categoryId: string, price: number) => void;
  orderStock: (categoryId: string, quantity: number) => void;
  toggleMarketingActivity: (activityId: string) => void;
  hireEmployee: () => void;
  fireEmployee: () => void;
  setSalary: (salary: number) => void;
  investInTraining: () => void;
  setPlayerStrategy: (strategy: BusinessStrategy) => void;
  applyForLoan: (bankId: string, loanType: LoanType, amount: number, termWeeks: number) => void;
  nextWeek: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,
  startSession: (storeType) => set(() => buildSessionState(storeType)),
  updateRetailPrice: (categoryId, price) => {
    set((state) => {
      if (!state.player) return state;

      const categories = withMargins(
        state.player.categories.map((category) => {
          if (category.id !== categoryId) return category;

          const minPrice = Math.round(category.purchasePrice * 1.05);
          const nextPrice = Math.max(minPrice, Math.round(price));
          return { ...category, retailPrice: nextPrice, margin: calculateCategoryMargin({ ...category, retailPrice: nextPrice }) };
        })
      );

      return {
        player: {
          ...state.player,
          categories,
          lastWeekStats: {
            ...state.player.lastWeekStats,
            totalStock: totalStock(categories)
          }
        }
      };
    });
  },
  orderStock: (categoryId, quantity) => {
    set((state) => {
      if (!state.player) return state;

      const safeQuantity = Math.max(0, Math.round(quantity));
      if (safeQuantity === 0) return state;

      const target = state.player.categories.find((item) => item.id === categoryId);
      if (!target) return state;

      const cost = target.purchasePrice * safeQuantity;
      if (cost > state.player.cash && state.player.financialHealth !== 'healthy') {
        return {
          eventLog: [`Неделя ${state.week}: не хватает денег на дозаказ. Рассмотрите кредит.`, ...state.eventLog].slice(0, 24)
        };
      }
      if (cost > state.player.cash) return state;

      const categories = state.player.categories.map((item) =>
        item.id === categoryId ? { ...item, stock: item.stock + safeQuantity } : item
      );

      return {
        player: {
          ...state.player,
          cash: state.player.cash - cost,
          categories,
          lastWeekStats: {
            ...state.player.lastWeekStats,
            totalStock: totalStock(categories)
          }
        }
      };
    });
  },
  toggleMarketingActivity: (activityId) => {
    set((state) => {
      if (!state.player) return state;

      const existing = state.player.activeMarketingActivities.find((activity) => activity.activityId === activityId);
      const activeMarketingActivities = existing
        ? state.player.activeMarketingActivities.map((activity) =>
            activity.activityId === activityId ? { ...activity, enabled: !activity.enabled, weeksActive: activity.enabled ? 0 : activity.weeksActive } : activity
          )
        : [...state.player.activeMarketingActivities, { activityId, weeksActive: 0, enabled: true }];

      return {
        player: {
          ...state.player,
          activeMarketingActivities
        }
      };
    });
  },
  hireEmployee: () => {
    set((state) => {
      if (!state.player) return state;
      return {
        player: {
          ...state.player,
          staff: {
            ...state.player.staff,
            headcount: state.player.staff.headcount + 1,
            workload: clamp(state.player.staff.workload * 0.96, 0.35, 1.4)
          }
        }
      };
    });
  },
  fireEmployee: () => {
    set((state) => {
      if (!state.player) return state;
      return {
        player: {
          ...state.player,
          staff: {
            ...state.player.staff,
            headcount: Math.max(1, state.player.staff.headcount - 1),
            workload: clamp(state.player.staff.workload * 1.06, 0.35, 1.4)
          }
        }
      };
    });
  },
  setSalary: (salary) => {
    set((state) => {
      if (!state.player) return state;
      return {
        player: {
          ...state.player,
          staff: {
            ...state.player.staff,
            averageSalary: clamp(Math.round(salary), 28_000, 120_000)
          }
        }
      };
    });
  },
  investInTraining: () => {
    set((state) => {
      if (!state.player) return state;
      const cost = 60_000;
      if (state.player.cash < cost) return state;

      return {
        player: {
          ...state.player,
          cash: state.player.cash - cost,
          staff: {
            ...state.player.staff,
            trainingLevel: clamp(state.player.staff.trainingLevel + 0.08, 0, 1)
          }
        },
        eventLog: [`Неделя ${state.week}: проведено обучение персонала (-60 000 ₽).`, ...state.eventLog].slice(0, 24)
      };
    });
  },
  setPlayerStrategy: (strategy) => {
    set((state) => {
      if (!state.player) return state;
      return {
        player: {
          ...state.player,
          playerStrategy: strategy
        }
      };
    });
  },
  applyForLoan: (bankId, loanType, amount, termWeeks) => {
    set((state) => {
      if (!state.player) return state;

      const bank = BANKS.find((item) => item.id === bankId);
      if (!bank) return state;

      const safeAmount = Math.min(bank.maxLoanAmount, Math.max(10_000, Math.round(amount)));
      const safeTerm = Math.min(bank.maxTermWeeks, Math.max(bank.minTermWeeks, Math.round(termWeeks)));
      const chance = approvalChance(state.player, bank, state.market.financialMarket, safeAmount);
      const approved = chance >= 0.48 || Math.random() < chance;

      if (!approved) {
        return {
          player: {
            ...state.player,
            creditScore: Math.max(0, calculateCreditScore(state.player) - 2)
          },
          lastLoanDecision: {
            approved: false,
            message: `Банк «${bank.name}» отказал. Оценочная вероятность одобрения: ${Math.round(chance * 100)}%.`
          },
          eventLog: [`Неделя ${state.week}: отказ по кредитной заявке в «${bank.name}».`, ...state.eventLog].slice(0, 24)
        };
      }

      const contract = createLoanContract(bank, state.player, state.market.financialMarket, loanType, safeAmount, safeTerm, state.week);
      const player = {
        ...state.player,
        cash: state.player.cash + safeAmount,
        activeLoans: [...state.player.activeLoans, contract]
      };

      return {
        player: {
          ...player,
          creditScore: calculateCreditScore(player)
        },
        lastLoanDecision: {
          approved: true,
          message: `Кредит одобрен банком «${bank.name}»: ${safeAmount.toLocaleString('ru-RU')} ₽.`,
          contract
        },
        eventLog: [`Неделя ${state.week}: получен кредит в «${bank.name}» на ${safeAmount.toLocaleString('ru-RU')} ₽.`, ...state.eventLog].slice(0, 24)
      };
    });
  },
  nextWeek: () => {
    set((state) => runWeeklyCycle(state));
  },
  resetGame: () => {
    set(initialState);
  }
}));
