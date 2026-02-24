'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { DashboardStats } from '@/lib/synthetic-data';

interface Props {
  data: DashboardStats['pdHistogram'];
}

export default function RiskHistogram({ data }: Props) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6">
      <h2 className="mb-1 font-semibold">PD Distribution</h2>
      <p className="mb-5 text-xs text-muted-foreground">Late payment probability across 1,000 profiles</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barSize={26}>
          <XAxis
            dataKey="bucket"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }}
            labelStyle={{ fontWeight: 600 }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
