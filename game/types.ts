export type CategoryName = // Объявляем тип названий категорий товара.
  | 'Посуда' // Разрешаем значение «Посуда».
  | 'Текстиль' // Разрешаем значение «Текстиль».
  | 'Декор' // Разрешаем значение «Декор».
  | 'Бытовая химия' // Разрешаем значение «Бытовая химия».
  | 'Сезонные товары'; // Разрешаем значение «Сезонные товары».

export interface CategoryState { // Описываем структуру состояния одной категории.
  id: string; // Уникальный технический идентификатор категории.
  name: CategoryName; // Человеко-читаемое имя категории.
  stock: number; // Текущий остаток товара на складе.
  purchasePrice: number; // Закупочная цена за единицу товара.
  retailPrice: number; // Розничная цена продажи за единицу товара.
  demand: number; // Базовый индекс спроса категории.
  margin: number; // Текущая маржа категории в процентах.
} // Завершаем интерфейс CategoryState.

export interface WeeklyStats { // Описываем набор KPI-метрик за неделю.
  weeklyRevenue: number; // Выручка за неделю.
  weeklyProfit: number; // Прибыль за неделю.
  marginPercent: number; // Валовая маржа в процентах.
  traffic: number; // Трафик посетителей за неделю.
  conversion: number; // Конверсия посетителей в покупки.
  averageCheck: number; // Средний чек за неделю.
  totalStock: number; // Общий остаток всех товаров.
} // Завершаем интерфейс WeeklyStats.

export interface ExpenseState { // Описываем постоянные еженедельные расходы.
  rent: number; // Расходы на аренду.
  salary: number; // Расходы на зарплаты.
  marketing: number; // Расходы на маркетинг.
} // Завершаем интерфейс ExpenseState.

export interface GameState { // Описываем полное состояние игры.
  week: number; // Текущий номер игровой недели.
  cash: number; // Деньги на счёте.
  categories: CategoryState[]; // Список всех товарных категорий.
  expenses: ExpenseState; // Блок постоянных расходов.
  stats: WeeklyStats; // Блок KPI-метрик за последнюю неделю.
} // Завершаем интерфейс GameState.
