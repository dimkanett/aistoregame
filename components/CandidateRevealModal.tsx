'use client';

import { useEffect, useRef, useState } from 'react';
import { roleLabel } from '@/game/labor';
import { JobRequest, Worker } from '@/game/types';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value);

const initials = (name: string): string =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export type CandidateRarity = 'ordinary' | 'good' | 'strong' | 'professional' | 'star';

export const candidatePower = (worker: Worker): number =>
  worker.experienceLevel + worker.loyalty + worker.training + worker.stressResistance + worker.salesSkill + worker.discipline;

export const candidateRarity = (worker: Worker): CandidateRarity => {
  const power = candidatePower(worker);
  if (power >= 500) return 'star';
  if (power >= 440) return 'professional';
  if (power >= 375) return 'strong';
  if (power >= 310) return 'good';
  return 'ordinary';
};

export const candidateRarityLabel: Record<CandidateRarity, string> = {
  ordinary: 'Обычный',
  good: 'Хороший',
  strong: 'Сильный',
  professional: 'Профессионал',
  star: 'Звезда'
};

const rarityClass: Record<CandidateRarity, string> = {
  ordinary: 'from-slate-200 to-slate-100 text-slate-700',
  good: 'from-emerald-200 to-lime-100 text-emerald-800',
  strong: 'from-sky-200 to-cyan-100 text-sky-800',
  professional: 'from-violet-200 to-fuchsia-100 text-violet-800',
  star: 'from-amber-200 to-orange-100 text-amber-900'
};

const statRows = [
  ['Опыт', 'experienceLevel'],
  ['Лояльность', 'loyalty'],
  ['Обученность', 'training'],
  ['Стрессоустойчивость', 'stressResistance'],
  ['Навык продаж', 'salesSkill'],
  ['Дисциплина', 'discipline']
] as const;

interface CandidateRevealModalProps {
  worker: Worker;
  request: JobRequest;
  onHire: () => void;
  onSkip: () => void;
  onRevealed?: () => void;
}

export function CandidateRevealModal({ worker, request, onHire, onSkip, onRevealed }: CandidateRevealModalProps) {
  const [revealed, setRevealed] = useState(false);
  const onRevealedRef = useRef(onRevealed);
  const rarity = candidateRarity(worker);

  useEffect(() => {
    onRevealedRef.current = onRevealed;
  }, [onRevealed]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setRevealed(true);
      onRevealedRef.current?.();
    }, 900);

    return () => window.clearTimeout(timer);
  }, [worker.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className={`candidate-card-pop w-full max-w-lg overflow-hidden rounded-3xl border border-white/40 bg-white shadow-2xl ${revealed ? 'is-revealed' : ''}`}>
        <div className={`bg-gradient-to-br ${rarityClass[rarity]} p-5 text-center`}>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] opacity-70">Раскрытие кандидата</p>
          <div className="mx-auto mt-4 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white/70 shadow-lg">
            {worker.avatarUrl ? <span role="img" aria-label={worker.name} className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${worker.avatarUrl})` }} /> : <span className="text-4xl font-black">{revealed ? initials(worker.name) : '?'}</span>}
          </div>
          {!revealed ? (
            <div className="mt-5 space-y-2">
              <div className="mx-auto h-3 w-48 animate-pulse rounded-full bg-white/60" />
              <p className="text-sm font-medium">Силуэт проявляется…</p>
            </div>
          ) : (
            <div className="mt-5">
              <h3 className="text-2xl font-black text-slate-950">{worker.name}</h3>
              <p className="text-sm font-semibold">{roleLabel[worker.role]} · {candidateRarityLabel[rarity]}</p>
            </div>
          )}
        </div>

        {revealed && (
          <div className="space-y-4 p-5">
            <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
              <p><span className="text-slate-500">Ожидаемая зарплата:</span><br /><b>{formatCurrency(worker.expectedSalary)}</b></p>
              <p><span className="text-slate-500">Предложение заявки:</span><br /><b>{formatCurrency(request.offeredSalary)}</b></p>
            </div>

            <div className="grid gap-2">
              {statRows.map(([label, key]) => (
                <div key={key} className="grid grid-cols-[140px_1fr_36px] items-center gap-2 text-sm">
                  <span className="text-slate-600">{label}</span>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${worker[key]}%` }} /></div>
                  <b className="text-right">{worker[key]}</b>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button type="button" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={onSkip}>Пропустить</button>
              <button type="button" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-emerald-500" onClick={onHire}>Нанять</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
