'use client'; // Помечаем страницу как клиентскую для работы с Zustand и событиями.

import { AssortmentTable } from '@/components/AssortmentTable'; // Импортируем компонент таблицы ассортимента.
import { DashboardCards } from '@/components/DashboardCards'; // Импортируем компонент KPI-карточек.
import { useGameStore } from '@/store/gameStore'; // Импортируем хук доступа к состоянию игры.

export default function HomePage() { // Создаём основной компонент главной страницы.
  const week = useGameStore((state) => state.week); // Берём текущий номер недели.
  const nextWeek = useGameStore((state) => state.nextWeek); // Берём экшен перехода к следующей неделе.
  const resetGame = useGameStore((state) => state.resetGame); // Берём экшен полного сброса.

  return ( // Возвращаем JSX-разметку страницы.
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8"> {/* Создаём основной контейнер дашборда. */}
      <header className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between"> {/* Создаём верхнюю панель с управлением. */}
        <div> {/* Контейнер заголовка и текущей недели. */}
          <h1 className="text-2xl font-bold text-slate-900">Store Manager Simulator</h1> {/* Заголовок приложения. */}
          <p className="text-sm text-slate-500">Неделя #{week}</p> {/* Отображение номера текущей недели. */}
        </div> {/* Закрываем блок заголовка. */}
        <div className="flex gap-2"> {/* Контейнер управляющих кнопок. */}
          <button // Кнопка сброса игры.
            type="button" // Указываем тип кнопки.
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" // Применяем стили кнопки сброса.
            onClick={resetGame} // Привязываем обработчик сброса игры.
          > {/* Открываем текст кнопки сброса. */}
            Сброс {/* Текст кнопки сброса. */}
          </button> {/* Закрываем кнопку сброса. */}
          <button // Кнопка перехода на следующую неделю.
            type="button" // Указываем тип кнопки.
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500" // Применяем стили основной кнопки.
            onClick={nextWeek} // Привязываем обработчик симуляции недели.
          > {/* Открываем текст кнопки перехода. */}
            Следующая неделя {/* Текст кнопки перехода. */}
          </button> {/* Закрываем кнопку перехода. */}
        </div> {/* Закрываем контейнер кнопок. */}
      </header> {/* Закрываем верхнюю панель. */}

      <DashboardCards /> {/* Отображаем блок ключевых показателей. */}
      <AssortmentTable /> {/* Отображаем таблицу ассортимента и управление ценами/закупками. */}
    </main> // Закрываем основной контейнер.
  ); // Завершаем return.
} // Завершаем компонент HomePage.
