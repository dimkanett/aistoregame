'use client'; // Помечаем компонент как клиентский, потому что он читает Zustand-store.

import { useGameStore } from '@/store/gameStore'; // Импортируем хук доступа к состоянию игры.

const formatCurrency = (value: number): string => // Создаём функцию форматирования денег.
  new Intl.NumberFormat('ru-RU', { // Используем русскую локаль форматирования чисел.
    style: 'currency', // Указываем формат как денежный.
    currency: 'RUB', // Указываем валюту рубли.
    maximumFractionDigits: 0 // Убираем копейки для компактного интерфейса.
  }).format(value); // Форматируем входное число.

const formatPercent = (value: number): string => `${value.toFixed(2)}%`; // Форматируем число как процент с двумя знаками.

export function DashboardCards() { // Создаём компонент с карточками KPI.
  const { cash, stats } = useGameStore(); // Получаем деньги и недельные метрики из store.

  const cards = [ // Формируем список карточек для отображения.
    { label: 'Деньги на счёте', value: formatCurrency(cash) }, // Карточка текущего баланса.
    { label: 'Выручка недели', value: formatCurrency(stats.weeklyRevenue) }, // Карточка выручки.
    { label: 'Прибыль недели', value: formatCurrency(stats.weeklyProfit) }, // Карточка прибыли.
    { label: 'Маржа', value: formatPercent(stats.marginPercent) }, // Карточка маржи.
    { label: 'Трафик', value: `${stats.traffic} чел.` }, // Карточка трафика.
    { label: 'Конверсия', value: formatPercent(stats.conversion) }, // Карточка конверсии.
    { label: 'Средний чек', value: formatCurrency(stats.averageCheck) }, // Карточка среднего чека.
    { label: 'Остатки', value: `${stats.totalStock} шт.` } // Карточка суммарного остатка.
  ]; // Завершаем массив карточек.

  return ( // Возвращаем JSX-разметку.
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"> {/* Создаём адаптивную сетку карточек. */}
      {cards.map((card) => ( // Проходим по массиву карточек и рендерим каждую.
        <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"> {/* Оформляем карточку KPI. */}
          <p className="text-sm text-slate-500">{card.label}</p> {/* Выводим подпись метрики. */}
          <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p> {/* Выводим значение метрики. */}
        </div> // Закрываем карточку.
      ))} {/* Завершаем map карточек. */}
    </section> // Закрываем секцию KPI.
  ); // Завершаем return.
} // Завершаем компонент DashboardCards.
