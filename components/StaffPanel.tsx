'use client';

import { useState } from 'react';
import { roleLabel } from '@/game/labor';
import { WorkerRole } from '@/game/types';
import { useGameStore } from '@/store/gameStore';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value);

const leaveRisk = (salary: number, expected: number, workload: number): string => {
  const score = (salary < expected * 0.9 ? 20 : 0) + (workload > 1.1 ? 18 : 0);
  if (score > 25) return 'высокий';
  if (score > 10) return 'средний';
  return 'низкий';
};

export function StaffPanel() {
  const player = useGameStore((state) => state.player);
  const createJobRequest = useGameStore((state) => state.createJobRequest);
  const hireCandidate = useGameStore((state) => state.hireCandidate);
  const fireEmployee = useGameStore((state) => state.fireEmployee);
  const investInTraining = useGameStore((state) => state.investInTraining);
  const cityWorkers = useGameStore((state) => state.cityWorkers);

  const [role, setRole] = useState<WorkerRole>('seller');
  const [salary, setSalary] = useState(45_000);

  if (!player) return null;

  const processedRequests = player.jobRequests.filter((request) => request.status === 'processed' && request.candidates.length > 0);

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Персонал</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-slate-50 p-3 text-sm">Продавцы: {player.employees.filter((worker) => worker.role === 'seller').length}</div>
          <div className="rounded-lg bg-slate-50 p-3 text-sm">Маркетологи: {player.employees.filter((worker) => worker.role === 'marketer').length}</div>
          <div className="rounded-lg bg-slate-50 p-3 text-sm">Сервис: {(player.staff.serviceLevel * 100).toFixed(0)}%</div>
          <div className="rounded-lg bg-slate-50 p-3 text-sm">Нагрузка: {(player.staff.workload * 100).toFixed(0)}%</div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="font-semibold">Текущие сотрудники</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50"><tr><th className="px-3 py-2 text-left">Имя</th><th className="px-3 py-2 text-left">Роль</th><th className="px-3 py-2 text-left">Зарплата</th><th className="px-3 py-2 text-left">Опыт</th><th className="px-3 py-2 text-left">Лояльность</th><th className="px-3 py-2 text-left">Обученность</th><th className="px-3 py-2 text-left">Стресс</th><th className="px-3 py-2 text-left">Продажи</th><th className="px-3 py-2 text-left">Дисциплина</th><th className="px-3 py-2 text-left">Риск ухода</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {player.employees.map((worker) => (
                <tr key={worker.id}>
                  <td className="px-3 py-2">{worker.name}</td><td className="px-3 py-2">{roleLabel[worker.role]}</td><td className="px-3 py-2">{formatCurrency(worker.salaryCurrent ?? worker.expectedSalary)}</td><td className="px-3 py-2">{worker.experienceLevel}</td><td className="px-3 py-2">{worker.loyalty}</td><td className="px-3 py-2">{worker.training}</td><td className="px-3 py-2">{worker.stressResistance}</td><td className="px-3 py-2">{worker.salesSkill}</td><td className="px-3 py-2">{worker.discipline}</td><td className="px-3 py-2">{leaveRisk(worker.salaryCurrent ?? worker.expectedSalary, worker.expectedSalary, player.staff.workload)}</td>
                </tr>
              ))}
              {player.employees.length === 0 && <tr><td className="px-3 py-3 text-slate-500" colSpan={10}>Сотрудников пока нет.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex gap-2"><button type="button" className="rounded-md border border-slate-300 px-3 py-1" onClick={fireEmployee}>Уволить последнего</button><button type="button" className="rounded-md bg-indigo-600 px-3 py-1 text-white" onClick={investInTraining}>Обучение (-{formatCurrency(60000)})</button></div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="font-semibold">Заявка на найм</h3>
        <p className="mt-1 text-sm text-slate-600">Кандидаты появятся на следующей неделе, если их устроят условия.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <select className="rounded-md border border-slate-300 px-2 py-2" value={role} onChange={(event) => setRole(event.target.value as WorkerRole)}><option value="seller">Продавец</option><option value="marketer">Маркетолог</option></select>
          <input className="rounded-md border border-slate-300 px-2 py-2" type="number" value={salary} onChange={(event) => setSalary(Number(event.target.value))} />
          <button type="button" className="rounded-md bg-slate-900 px-3 py-2 text-white" onClick={() => createJobRequest(role, salary)}>Разместить заявку</button>
        </div>
        <p className="mt-2 text-xs text-slate-500">Подсказка: начинающие продавцы ждут ~38 000 ₽, середняки ~52 000 ₽, профессионалы от 70 000 ₽. Маркетологи обычно дороже.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="font-semibold">Кандидаты</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {processedRequests.flatMap((request) =>
            request.candidates.map((candidateId) => ({ request, candidate: candidateId }))
          ).map(({ request, candidate }) => {
            const worker = cityWorkers.find((item) => item.id === candidate);
            if (!worker) return null;
            return (
              <div key={`${request.id}-${candidate}`} className="rounded-lg border border-slate-200 p-3 text-sm">
                <p className="font-semibold">{worker.name}</p>
                <p>{roleLabel[worker.role]} · ожидает {formatCurrency(worker.expectedSalary)}</p>
                <p className="text-slate-600">Опыт {worker.experienceLevel}, продажи {worker.salesSkill}, дисциплина {worker.discipline}, лояльность {worker.loyalty}</p>
                <p className="mt-1 text-slate-500">Интерес: зарплата {formatCurrency(request.offeredSalary)}, магазин {player.reputation.toFixed(0)}/100 репутации.</p>
                <button type="button" className="mt-2 rounded-md bg-emerald-600 px-3 py-1 text-white" onClick={() => hireCandidate(request.id, worker.id)}>Нанять</button>
              </div>
            );
          })}
          {processedRequests.length === 0 && <p className="text-sm text-slate-500">Кандидатов пока нет. Разместите заявку и перейдите на следующую неделю.</p>}
        </div>
      </div>
    </section>
  );
}
