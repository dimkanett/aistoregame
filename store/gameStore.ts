'use client'; // Помечаем модуль как клиентский для Next.js App Router.

import { create } from 'zustand'; // Импортируем функцию создания Zustand-store.
import { runWeeklySimulation, recalculateMargins } from '@/game/calculations'; // Импортируем функции бизнес-логики.
import { initialState } from '@/game/initialState'; // Импортируем стартовое состояние игры.
import { CategoryState, GameState } from '@/game/types'; // Импортируем типы состояния.

interface GameStore extends GameState { // Описываем полный интерфейс Zustand-store.
  updateRetailPrice: (categoryId: string, price: number) => void; // Метод изменения розничной цены.
  orderStock: (categoryId: string, quantity: number) => void; // Метод дозаказа товара.
  nextWeek: () => void; // Метод перехода на следующую неделю.
  resetGame: () => void; // Метод сброса игры к начальному состоянию.
} // Завершаем интерфейс GameStore.

export const useGameStore = create<GameStore>((set) => ({ // Создаём Zustand-hook для доступа к состоянию.
  ...initialState, // Инициализируем store стартовыми данными.
  updateRetailPrice: (categoryId, price) => { // Реализуем обновление розничной цены.
    set((state) => { // Обновляем состояние через функцию-производитель.
      const categories = recalculateMargins( // Получаем новый список категорий с пересчётом маржи.
        state.categories.map((category) => // Проходим по каждой категории.
          category.id === categoryId // Проверяем нужную категорию.
            ? { // Если категория совпала, создаём её обновлённую версию.
                ...category, // Копируем старые поля категории.
                retailPrice: Math.max(1, Math.round(price)) // Сохраняем новую цену не ниже 1.
              } // Завершаем обновлённый объект категории.
            : category // Иначе возвращаем категорию без изменений.
        ) // Завершаем map.
      ); // Завершаем пересчёт маржи.

      return { categories }; // Возвращаем частичное обновление state.
    }); // Завершаем вызов set.
  }, // Завершаем метод updateRetailPrice.
  orderStock: (categoryId, quantity) => { // Реализуем дозаказ товара.
    set((state) => { // Обновляем состояние через функцию-производитель.
      const safeQuantity = Math.max(0, Math.round(quantity)); // Нормализуем количество заказа.
      if (safeQuantity === 0) { // Проверяем, что заказ не пустой.
        return state; // Если пустой — ничего не меняем.
      } // Завершаем проверку пустого заказа.

      const category = state.categories.find((item) => item.id === categoryId); // Находим нужную категорию.
      if (!category) { // Проверяем, что категория существует.
        return state; // Если нет — ничего не меняем.
      } // Завершаем проверку категории.

      const cost = category.purchasePrice * safeQuantity; // Считаем стоимость дозаказа.
      if (cost > state.cash) { // Проверяем, хватает ли денег.
        return state; // Если денег не хватает — не выполняем заказ.
      } // Завершаем проверку бюджета.

      const categories: CategoryState[] = state.categories.map((item) => // Формируем обновлённый список категорий.
        item.id === categoryId ? { ...item, stock: item.stock + safeQuantity } : item // Увеличиваем stock только у нужной категории.
      ); // Завершаем map категорий.
      const totalStock = categories.reduce((sum, item) => sum + item.stock, 0); // Пересчитываем общий остаток.

      return { // Возвращаем обновлённые поля состояния.
        cash: state.cash - cost, // Уменьшаем деньги на стоимость дозаказа.
        categories, // Обновляем категории.
        stats: { // Частично обновляем блок статистики.
          ...state.stats, // Копируем предыдущие KPI.
          totalStock // Записываем новый общий остаток.
        } // Завершаем объект stats.
      }; // Завершаем возвращаемый объект.
    }); // Завершаем вызов set.
  }, // Завершаем метод orderStock.
  nextWeek: () => { // Реализуем переход на следующую неделю.
    set((state) => runWeeklySimulation(state)); // Вызываем недельную симуляцию и сохраняем результат.
  }, // Завершаем метод nextWeek.
  resetGame: () => { // Реализуем полный сброс игры.
    set(initialState); // Возвращаем store к начальному состоянию.
  } // Завершаем метод resetGame.
})); // Завершаем создание Zustand-store.
