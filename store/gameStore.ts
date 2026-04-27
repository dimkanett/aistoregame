'use client';

import { create } from 'zustand';
import { MARKETING_EFFECTS } from '@/game/constants';
import { calculateCategoryMargin, clamp, totalStock, withMargins } from '@/game/calculations';
import { buildSessionState, initialState } from '@/game/initialState';
import { runWeeklyCycle } from '@/game/simulationEngine';
import { GameState, MarketingMode, StoreType } from '@/game/types';

interface GameStore extends GameState {
  startSession: (storeType: StoreType) => void;
  updateRetailPrice: (categoryId: string, price: number) => void;
  orderStock: (categoryId: string, quantity: number) => void;
  setMarketingMode: (mode: MarketingMode) => void;
  hireEmployee: () => void;
  fireEmployee: () => void;
  setSalary: (salary: number) => void;
  investInTraining: () => void;
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
  setMarketingMode: (mode) => {
    set((state) => {
      if (!state.player) return state;

      return {
        player: {
          ...state.player,
          marketingMode: mode,
          expenses: {
            ...state.player.expenses,
            marketing: MARKETING_EFFECTS[mode].cost
          }
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
            averageSalary: clamp(Math.round(salary), 30_000, 120_000)
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
        eventLog: [`Неделя ${state.week}: проведено обучение персонала (-60 000 ₽).`, ...state.eventLog].slice(0, 20)
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
