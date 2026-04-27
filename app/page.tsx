'use client';

import { AssortmentTable } from '@/components/AssortmentTable';
import { CompetitorsPanel } from '@/components/CompetitorsPanel';
import { DashboardCards } from '@/components/DashboardCards';
import { MarketingPanel } from '@/components/MarketingPanel';
import { MarketEventsPanel } from '@/components/MarketEventsPanel';
import { StaffPanel } from '@/components/StaffPanel';
import { StartScreen } from '@/components/StartScreen';
import { useGameStore } from '@/store/gameStore';

export default function HomePage() {
  const week = useGameStore((state) => state.week);
  const sessionStarted = useGameStore((state) => state.sessionStarted);
  const player = useGameStore((state) => state.player);
  const nextWeek = useGameStore((state) => state.nextWeek);
  const resetGame = useGameStore((state) => state.resetGame);

  if (!sessionStarted || !player) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 md:px-8">
        <StartScreen />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8">
      <header className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Store Manager Simulator</h1>
          <p className="text-sm text-slate-500">Неделя #{week} · Формат: {player.type}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={resetGame}
          >
            Сброс
          </button>
          <button
            type="button"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            onClick={nextWeek}
          >
            Следующая неделя
          </button>
        </div>
      </header>

      <DashboardCards />
      <MarketingPanel />
      <StaffPanel />
      <AssortmentTable />
      <MarketEventsPanel />
      <CompetitorsPanel />
    </main>
  );
}
