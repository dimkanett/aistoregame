'use client';

import { GameTab } from '@/game/types';

const tabs: { id: GameTab; label: string }[] = [
  { id: 'dashboard', label: 'Дашборд' },
  { id: 'store', label: 'Магазин' },
  { id: 'assortment', label: 'Ассортимент / товары' },
  { id: 'marketing', label: 'Маркетинг' },
  { id: 'staff', label: 'Персонал' },
  { id: 'competitors', label: 'Конкуренты' },
  { id: 'banks', label: 'Банки и кредиты' },
  { id: 'suppliers', label: 'Поставщики' },
  { id: 'market', label: 'Рынок' },
  { id: 'events', label: 'События / государство' },
  { id: 'analytics', label: 'Аналитика / отчёты' }
];

export function GameTabs({ activeTab, onChange }: { activeTab: GameTab; onChange: (tab: GameTab) => void }) {
  return (
    <nav className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
              activeTab === tab.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
