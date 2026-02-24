'use client';

import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';
import type { DashboardStats } from '@/lib/synthetic-data';

interface Props {
  data: DashboardStats['scatterData'];
}

const FARM_COLORS: Record<string, string> = {
  smallholder: '#6366f1',
  commercial: '#10b981',
  cooperative: '#f59e0b',
};

export default function FarmScatter({ data }: Props) {
  // Group by farm type
  const grouped = data.reduce((acc, d) => {
    if (!acc[d.farmType]) acc[d.farmType] = [];
    acc[d.farmType].push({ x: d.farmSize, y: d.pd });
    return acc;
  }, {} as Record<string, { x: number; y: number }[]>);

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6">
      <h2 className="mb-1 font-semibold">Farm Size vs. PD</h2>
      <p className="mb-4 text-xs text-muted-foreground">Each point = a farm profile (sample of 200)</p>
      <div className="mb-3 flex flex-wrap gap-3 text-xs">
        {Object.entries(FARM_COLORS).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: v }} />
            {k}
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <ScatterChart>
          <XAxis
            dataKey="x"
            name="Farm Size (ha)"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            label={{ value: 'Farm Size (ha)', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#9ca3af' }}
          />
          <YAxis
            dataKey="y"
            name="PD"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `${(v * 100).toFixed(0)}%`}
            width={36}
          />
          <ZAxis range={[18, 18]} />
          <Tooltip
            contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(val: any, name: any) => {
              if (val === undefined) return '';
              return name === 'PD' ? `${(val * 100).toFixed(1)}%` : String(val.toFixed(1));
            }}
          />
          {Object.entries(grouped).map(([type, pts]) => (
            <Scatter
              key={type}
              name={type}
              data={pts}
              fill={FARM_COLORS[type] ?? '#6366f1'}
              opacity={0.65}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
