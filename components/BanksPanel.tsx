'use client';

import { useMemo, useState } from 'react';
import { evaluateLoanApplication, loanTypeLabels } from '@/game/banking';
import { LoanType } from '@/game/types';
import { useGameStore } from '@/store/gameStore';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value);

const loanTypes = Object.keys(loanTypeLabels) as LoanType[];

export function BanksPanel() {
  const banks = useGameStore((state) => state.banks);
  const player = useGameStore((state) => state.player);
  const market = useGameStore((state) => state.market.financialMarket);
  const lastLoanDecision = useGameStore((state) => state.lastLoanDecision);
  const applyForLoan = useGameStore((state) => state.applyForLoan);
  const acceptAlternativeLoan = useGameStore((state) => state.acceptAlternativeLoan);
  const week = useGameStore((state) => state.week);

  const [bankId, setBankId] = useState(banks[0]?.id ?? '');
  const [loanType, setLoanType] = useState<LoanType>('working_capital');
  const [amount, setAmount] = useState(250000);
  const [term, setTerm] = useState(24);

  const selectedBank = banks.find((bank) => bank.id === bankId) ?? banks[0];
  const preview = useMemo(() => {
    if (!player || !selectedBank) return null;
    return evaluateLoanApplication(player, selectedBank, market, loanType, amount, term, week);
  }, [amount, loanType, market, player, selectedBank, term, week]);

  if (!player) return null;

  return (
    <section className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Банки</h2>
          <div className="mt-3 grid gap-3">
            {banks.map((bank) => (
              <div key={bank.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{bank.name}</p>
                  <p>{(bank.baseInterestRate * 100).toFixed(1)}% базовая</p>
                </div>
                <p className="mt-1 text-slate-600">{bank.description}</p>
                <p className="mt-1 text-slate-500">Лимит: {formatCurrency(bank.maxLoanAmount)} · срок {bank.minTermWeeks}-{bank.maxTermWeeks} недель</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Заявка на кредит</h2>
          <div className="mt-3 grid gap-3 text-sm">
            <label className="grid gap-1">
              Банк
              <select className="rounded-md border border-slate-300 px-2 py-2" value={bankId} onChange={(event) => setBankId(event.target.value)}>
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>{bank.name}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              Тип кредита
              <select className="rounded-md border border-slate-300 px-2 py-2" value={loanType} onChange={(event) => setLoanType(event.target.value as LoanType)}>
                {loanTypes.map((type) => (
                  <option key={type} value={type}>{loanTypeLabels[type]}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              Сумма
              <input className="rounded-md border border-slate-300 px-2 py-2" type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
            </label>
            <label className="grid gap-1">
              Срок, недель
              <input className="rounded-md border border-slate-300 px-2 py-2" type="number" value={term} onChange={(event) => setTerm(Number(event.target.value))} />
            </label>
            {preview && (
              <div className="rounded-lg bg-slate-50 p-3">
                <p>Предварительная оценка: {preview.status}</p>
                <p>Ставка: {(preview.proposedRate * 100).toFixed(2)}% годовых</p>
                <p>Недельный платёж: {formatCurrency(preview.proposedWeeklyPayment)}</p>
                <p>DSCR: {preview.calculatedDSCR.toFixed(2)}</p>
                <p>Долг / выручка: {preview.calculatedDebtLoad.toFixed(2)}</p>
                <p>Runway: {preview.calculatedCashRunway.toFixed(1)} нед.</p>
                <p>Кредитный рейтинг: {preview.calculatedCreditScore}/100</p>
                {preview.reasons.length > 0 && <p>Причины: {preview.reasons.join(' ')}</p>}
                {preview.cooldownUntilWeek > week && <p>Повторная заявка доступна с недели {preview.cooldownUntilWeek}.</p>}
                {preview.alternativeOffer && <p>Альтернатива: {formatCurrency(preview.alternativeOffer.amount)} на {preview.alternativeOffer.termWeeks} недель, платёж {formatCurrency(preview.alternativeOffer.weeklyPayment)}.</p>}
              </div>
            )}
            <button type="button" className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white" onClick={() => applyForLoan(bankId, loanType, amount, term)}>
              Подать заявку
            </button>
            {lastLoanDecision && <div className={lastLoanDecision.approved ? 'text-green-700' : 'text-red-700'}><p>{lastLoanDecision.message}</p>{lastLoanDecision.application?.alternativeOffer && <button type="button" className="mt-2 rounded-md bg-emerald-600 px-3 py-1 text-white" onClick={acceptAlternativeLoan}>Принять альтернативу</button>}</div>}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Активные кредитные договоры</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left">Банк</th>
                <th className="px-3 py-2 text-left">Тип</th>
                <th className="px-3 py-2 text-left">Сумма</th>
                <th className="px-3 py-2 text-left">Остаток</th>
                <th className="px-3 py-2 text-left">Ставка</th>
                <th className="px-3 py-2 text-left">Платёж</th>
                <th className="px-3 py-2 text-left">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {player.activeLoans.map((loan) => (
                <tr key={loan.id}>
                  <td className="px-3 py-2">{banks.find((bank) => bank.id === loan.bankId)?.name ?? loan.bankId}</td>
                  <td className="px-3 py-2">{loanTypeLabels[loan.loanType]}</td>
                  <td className="px-3 py-2">{formatCurrency(loan.principal)}</td>
                  <td className="px-3 py-2">{formatCurrency(loan.remainingPrincipal)}</td>
                  <td className="px-3 py-2">{(loan.annualInterestRate * 100).toFixed(2)}%</td>
                  <td className="px-3 py-2">{formatCurrency(loan.weeklyPayment)}</td>
                  <td className="px-3 py-2">{loan.status}</td>
                </tr>
              ))}
              {player.activeLoans.length === 0 && <tr><td className="px-3 py-3 text-slate-500" colSpan={7}>Кредитов пока нет.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>


      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">История заявок</h2>
        <div className="mt-3 space-y-2 text-sm">
          {player.loanApplications.map((application) => (
            <div key={application.id} className="rounded-lg bg-slate-50 p-3">
              <p className="font-medium">Неделя {application.week}: {banks.find((bank) => bank.id === application.bankId)?.name} — {application.status}</p>
              <p className="text-slate-600">DSCR {application.calculatedDSCR.toFixed(2)} · runway {application.calculatedCashRunway.toFixed(1)} · рейтинг {application.calculatedCreditScore}/100</p>
              {application.reasons.length > 0 && <p className="text-slate-600">Причины: {application.reasons.join(' ')}</p>}
            </div>
          ))}
          {player.loanApplications.length === 0 && <p className="text-slate-500">Заявок пока нет.</p>}
        </div>
      </div>
    </section>
  );
}
