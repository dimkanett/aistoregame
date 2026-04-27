import { CategoryState, GameState, WeeklyStats } from './types'; // Импортируем типы для расчётов.

const round = (value: number): number => Math.round(value * 100) / 100; // Округляем значение до двух знаков после запятой.

const safeDivision = (numerator: number, denominator: number): number => { // Создаём безопасное деление с защитой от нуля.
  if (denominator === 0) { // Проверяем деление на ноль.
    return 0; // Возвращаем 0, чтобы избежать Infinity/NaN.
  } // Закрываем условие проверки на ноль.

  return numerator / denominator; // Выполняем обычное деление, если знаменатель не ноль.
}; // Завершаем функцию safeDivision.

const priceDemandFactor = (category: CategoryState): number => { // Вычисляем коэффициент влияния цены на спрос.
  const baseline = category.purchasePrice * 1.9; // Берём базовую «нормальную» цену от закупки.
  const ratio = safeDivision(category.retailPrice, baseline); // Сравниваем текущую цену с базовой.

  if (ratio <= 0.95) return 1.15; // Если цена низкая — спрос растёт.
  if (ratio <= 1.1) return 1; // Если цена близка к базовой — спрос нейтральный.
  if (ratio <= 1.25) return 0.87; // Если цена выше — спрос падает умеренно.

  return 0.72; // Если цена сильно высокая — спрос падает заметнее.
}; // Завершаем функцию priceDemandFactor.

export const calculateCategoryMargin = (category: CategoryState): number => { // Вычисляем маржу для категории.
  return round(safeDivision(category.retailPrice - category.purchasePrice, category.retailPrice) * 100); // Формула маржи в процентах.
}; // Завершаем функцию calculateCategoryMargin.

export const recalculateMargins = (categories: CategoryState[]): CategoryState[] => { // Пересчитываем маржу у всех категорий.
  return categories.map((category) => ({ // Пробегаем по каждой категории и возвращаем новую.
    ...category, // Копируем существующие поля категории.
    margin: calculateCategoryMargin(category) // Обновляем только маржу.
  })); // Завершаем map.
}; // Завершаем функцию recalculateMargins.

export const runWeeklySimulation = (state: GameState): GameState => { // Запускаем расчёт следующей игровой недели.
  const traffic = 900 + Math.floor(Math.random() * 800); // Генерируем недельный трафик в диапазоне 900-1699.

  let unitsSoldTotal = 0; // Создаём счётчик проданных единиц.
  let revenue = 0; // Создаём накопитель выручки.
  let cogs = 0; // Создаём накопитель себестоимости проданного товара.

  const updatedCategories = state.categories.map((category) => { // Пересчитываем каждую категорию.
    const demandBase = category.demand * priceDemandFactor(category); // Корректируем спрос с учётом цены.
    const demandNoise = 0.85 + Math.random() * 0.3; // Добавляем небольшой случайный шум спроса.
    const expectedSales = Math.floor((demandBase * traffic * demandNoise) / 1000); // Оцениваем ожидаемые продажи.
    const sold = Math.min(category.stock, Math.max(0, expectedSales)); // Ограничиваем продажи доступным остатком.

    unitsSoldTotal += sold; // Увеличиваем общий счётчик проданных единиц.
    revenue += sold * category.retailPrice; // Добавляем выручку от категории.
    cogs += sold * category.purchasePrice; // Добавляем себестоимость проданных товаров.

    return { // Возвращаем обновлённую категорию.
      ...category, // Копируем поля категории.
      stock: category.stock - sold, // Уменьшаем остаток на проданное количество.
      margin: calculateCategoryMargin(category) // Обновляем маржу категории.
    }; // Завершаем объект категории.
  }); // Завершаем map категорий.

  const conversion = round(safeDivision(unitsSoldTotal, traffic) * 100); // Считаем конверсию посетителей в покупки.
  const averageCheck = round(safeDivision(revenue, unitsSoldTotal)); // Считаем средний чек.
  const totalExpenses = state.expenses.rent + state.expenses.salary + state.expenses.marketing; // Суммируем все фиксированные расходы.
  const weeklyProfit = round(revenue - cogs - totalExpenses); // Считаем недельную прибыль.
  const marginPercent = round(safeDivision(revenue - cogs, revenue) * 100); // Считаем валовую маржу в процентах.
  const cash = round(state.cash + weeklyProfit); // Обновляем деньги на счёте.
  const totalStock = updatedCategories.reduce((acc, category) => acc + category.stock, 0); // Считаем общий остаток после продаж.

  const stats: WeeklyStats = { // Формируем обновлённый блок KPI.
    weeklyRevenue: round(revenue), // Записываем выручку недели.
    weeklyProfit, // Записываем прибыль недели.
    marginPercent, // Записываем маржу в процентах.
    traffic, // Записываем трафик.
    conversion, // Записываем конверсию.
    averageCheck, // Записываем средний чек.
    totalStock // Записываем общий остаток.
  }; // Завершаем объект stats.

  return { // Возвращаем новое состояние игры.
    ...state, // Копируем прежнее состояние.
    week: state.week + 1, // Увеличиваем номер недели.
    cash, // Обновляем деньги на счёте.
    categories: updatedCategories, // Подставляем обновлённые категории.
    stats // Подставляем обновлённые KPI.
  }; // Завершаем возвращаемый объект состояния.
}; // Завершаем функцию runWeeklySimulation.
