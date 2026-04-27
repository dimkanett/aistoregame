'use client';

import { useGameStore } from '@/store/gameStore';

export function MarketEventsPanel() {
  const events = useGameStore((state) => state.market.currentEvents);
  const eventLog = useGameStore((state) => state.eventLog);

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Активные события</h2>
        <div className="mt-3 space-y-2 text-sm">
          {events.length === 0 && <p className="text-slate-500">Пока нет активных ограничений и гос. событий.</p>}
          {events.map((event) => (
            <div key={event.id} className="rounded-md bg-slate-50 p-3">
              <p className="font-medium">{event.title}</p>
              <p className="text-slate-600">{event.description}</p>
              <p className="text-xs text-slate-500">Осталось недель: {event.durationWeeks}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Лента событий</h2>
        <div className="mt-3 space-y-2 text-sm">
          {eventLog.length === 0 && <p className="text-slate-500">События появятся после запуска симуляции.</p>}
          {eventLog.map((entry, index) => (
            <p key={`${entry}-${index}`} className="rounded-md bg-slate-50 p-2">
              {entry}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
