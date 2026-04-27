'use client'; // Помечаем компонент как клиентский из-за интерактивных полей и Zustand.

import { useState } from 'react'; // Импортируем useState для локального ввода количества дозаказа.
import { useGameStore } from '@/store/gameStore'; // Импортируем хук доступа к игровому store.

const formatCurrency = (value: number): string => // Создаём функцию форматирования денег.
  new Intl.NumberFormat('ru-RU', { // Используем русскую локаль отображения валюты.
    style: 'currency', // Указываем денежный формат.
    currency: 'RUB', // Выбираем валюту рубли.
    maximumFractionDigits: 0 // Убираем дробную часть для компактности.
  }).format(value); // Возвращаем отформатированное значение.

export function AssortmentTable() { // Создаём компонент таблицы ассортимента.
  const categories = useGameStore((state) => state.categories); // Получаем список категорий из store.
  const updateRetailPrice = useGameStore((state) => state.updateRetailPrice); // Получаем экшен изменения цены.
  const orderStock = useGameStore((state) => state.orderStock); // Получаем экшен дозаказа товара.

  const [orderInputs, setOrderInputs] = useState<Record<string, number>>({}); // Храним введённые количества дозаказа по категориям.

  return ( // Возвращаем JSX-разметку.
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm"> {/* Создаём контейнер таблицы. */}
      <div className="border-b border-slate-200 px-4 py-3"> {/* Создаём шапку секции. */}
        <h2 className="text-lg font-semibold">Ассортимент</h2> {/* Заголовок блока ассортимента. */}
      </div> {/* Закрываем шапку. */}
      <div className="overflow-x-auto"> {/* Добавляем горизонтальный скролл для узких экранов. */}
        <table className="min-w-full divide-y divide-slate-200 text-sm"> {/* Создаём таблицу категорий. */}
          <thead className="bg-slate-50"> {/* Рисуем заголовок таблицы. */}
            <tr> {/* Строка заголовков колонок. */}
              <th className="px-3 py-2 text-left font-medium text-slate-600">Категория</th> {/* Колонка названия категории. */}
              <th className="px-3 py-2 text-left font-medium text-slate-600">Остаток</th> {/* Колонка остатка. */}
              <th className="px-3 py-2 text-left font-medium text-slate-600">Закупка</th> {/* Колонка закупочной цены. */}
              <th className="px-3 py-2 text-left font-medium text-slate-600">Розница</th> {/* Колонка розничной цены. */}
              <th className="px-3 py-2 text-left font-medium text-slate-600">Спрос</th> {/* Колонка индекса спроса. */}
              <th className="px-3 py-2 text-left font-medium text-slate-600">Маржа</th> {/* Колонка маржи. */}
              <th className="px-3 py-2 text-left font-medium text-slate-600">Дозаказ</th> {/* Колонка действий дозаказа. */}
            </tr> {/* Закрываем строку заголовков. */}
          </thead> {/* Закрываем заголовок таблицы. */}
          <tbody className="divide-y divide-slate-100"> {/* Тело таблицы с данными категорий. */}
            {categories.map((category) => ( // Итерируемся по категориям и строим строки.
              <tr key={category.id}> {/* Строка конкретной категории. */}
                <td className="px-3 py-3 font-medium">{category.name}</td> {/* Отображаем название категории. */}
                <td className="px-3 py-3">{category.stock} шт.</td> {/* Отображаем остаток товара. */}
                <td className="px-3 py-3">{formatCurrency(category.purchasePrice)}</td> {/* Отображаем закупочную цену. */}
                <td className="px-3 py-3"> {/* Ячейка редактирования розничной цены. */}
                  <input // Поле ввода розничной цены.
                    type="number" // Разрешаем только числовой ввод.
                    className="w-28 rounded-md border border-slate-300 px-2 py-1" // Применяем стили к полю.
                    min={1} // Минимальная цена не ниже 1.
                    value={category.retailPrice} // Подставляем текущее значение цены.
                    onChange={(event) => updateRetailPrice(category.id, Number(event.target.value))} // Обновляем цену в store при вводе.
                  /> // Закрываем поле цены.
                </td> {/* Закрываем ячейку цены. */}
                <td className="px-3 py-3">{category.demand}</td> {/* Отображаем индекс спроса. */}
                <td className="px-3 py-3">{category.margin.toFixed(2)}%</td> {/* Отображаем маржу в процентах. */}
                <td className="px-3 py-3"> {/* Ячейка управления дозаказом. */}
                  <div className="flex items-center gap-2"> {/* Группируем поле и кнопку в одну строку. */}
                    <input // Поле ввода количества дозаказа.
                      type="number" // Разрешаем числовой ввод.
                      className="w-24 rounded-md border border-slate-300 px-2 py-1" // Применяем стили к полю количества.
                      min={0} // Минимальное количество 0.
                      value={orderInputs[category.id] ?? 0} // Показываем текущее введённое количество.
                      onChange={(event) => // Обрабатываем изменение количества.
                        setOrderInputs((prev) => ({ // Обновляем локальный объект введённых значений.
                          ...prev, // Копируем прошлые значения.
                          [category.id]: Math.max(0, Number(event.target.value)) // Записываем новое значение для текущей категории.
                        })) // Завершаем обновление локального состояния.
                      } // Завершаем обработчик onChange.
                    /> // Закрываем поле количества.
                    <button // Кнопка подтверждения дозаказа.
                      type="button" // Указываем тип кнопки, чтобы не отправлять форму.
                      className="rounded-md bg-slate-900 px-3 py-1 text-white hover:bg-slate-700" // Применяем стили кнопки.
                      onClick={() => { // Обрабатываем нажатие кнопки.
                        orderStock(category.id, orderInputs[category.id] ?? 0); // Вызываем экшен дозаказа в store.
                        setOrderInputs((prev) => ({ ...prev, [category.id]: 0 })); // Сбрасываем поле ввода после заказа.
                      }} // Завершаем обработчик клика.
                    > {/* Открываем текст кнопки. */}
                      Заказать {/* Текст кнопки. */}
                    </button> {/* Закрываем кнопку. */}
                  </div> {/* Закрываем контейнер поля и кнопки. */}
                </td> {/* Закрываем ячейку дозаказа. */}
              </tr> // Закрываем строку категории.
            ))} // Завершаем map по категориям.
          </tbody> {/* Закрываем тело таблицы. */}
        </table> {/* Закрываем таблицу. */}
      </div> {/* Закрываем контейнер прокрутки. */}
    </section> // Закрываем секцию ассортимента.
  ); // Завершаем return.
} // Завершаем компонент AssortmentTable.
