'use client';

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { WeeklyHistoryEntry } from '@/game/types';

export function MetricChart({
  title,
  dataKey,
  data,
  color = '#4f46e5'
}: {
  title: string;
  dataKey: keyof WeeklyHistoryEntry;
  data: WeeklyHistoryEntry[];
  color?: string;
}) {
  const chartData = data.length > 0 ? data : [{ week: 0, [dataKey]: 0 } as unknown as WeeklyHistoryEntry];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      <div className="mt-3 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <XAxis dataKey="week" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} width={52} />
            <Tooltip />
            <Line type="monotone" dataKey={dataKey as string} stroke={color} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
