'use client';

import { useGameStore } from '@/store/gameStore';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value);

export function StaffPanel() {
  const player = useGameStore((state) => state.player);
  const hireEmployee = useGameStore((state) => state.hireEmployee);
  const fireEmployee = useGameStore((state) => state.fireEmployee);
  const setSalary = useGameStore((state) => state.setSalary);
  const investInTraining = useGameStore((state) => state.investInTraining);

  if (!player) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Персонал</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <p className="text-slate-500">Сотрудники</p>
          <p className="text-xl font-semibold">{player.staff.headcount}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <p className="text-slate-500">Сервис</p>
          <p className="text-xl font-semibold">{(player.staff.serviceLevel * 100).toFixed(0)}%</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <p className="text-slate-500">Нагрузка</p>
          <p className="text-xl font-semibold">{(player.staff.workload * 100).toFixed(0)}%</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <p className="text-slate-500">Текучесть</p>
          <p className="text-xl font-semibold">{(player.staff.churn * 100).toFixed(1)}%</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" className="rounded-md bg-slate-900 px-3 py-1 text-white" onClick={hireEmployee}>
          Нанять
        </button>
        <button type="button" className="rounded-md border border-slate-300 px-3 py-1" onClick={fireEmployee}>
          Уволить
        </button>
        <label className="flex items-center gap-2 text-sm">
          Зарплата
          <input
            type="number"
            min={30000}
            max={120000}
            className="w-32 rounded-md border border-slate-300 px-2 py-1"
            value={player.staff.averageSalary}
            onChange={(event) => setSalary(Number(event.target.value))}
          />
        </label>
        <button type="button" className="rounded-md bg-indigo-600 px-3 py-1 text-white" onClick={investInTraining}>
          Обучение (-{formatCurrency(60000)})
        </button>
      </div>
    </section>
  );
}
