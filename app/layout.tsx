import './globals.css'; // Подключаем глобальные стили для всего приложения.
import type { Metadata } from 'next'; // Импортируем тип метаданных Next.js.
import { ReactNode } from 'react'; // Импортируем тип ReactNode для типизации children.

export const metadata: Metadata = { // Экспортируем SEO-метаданные страницы.
  title: 'Store Manager Simulator', // Указываем заголовок вкладки браузера.
  description: 'Экономическая игра-симулятор управления розничным магазином.' // Указываем описание приложения.
}; // Завершаем объект метаданных.

export default function RootLayout({ children }: { children: ReactNode }) { // Создаём корневой layout-компонент.
  return ( // Возвращаем JSX-разметку.
    <html lang="ru"> {/* Устанавливаем русский язык документа. */}
      <body>{children}</body> {/* Отрисовываем вложенные страницы внутри body. */}
    </html> // Закрываем html.
  ); // Завершаем return.
} // Завершаем компонент RootLayout.
