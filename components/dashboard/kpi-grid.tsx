'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Users, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { DashboardStats } from '@/lib/synthetic-data';

interface Props {
  stats: DashboardStats;
}

export default function KpiGrid({ stats }: Props) {
  const kpis = [
    {
      label: 'Total Profiles',
      value: stats.total.toLocaleString(),
      icon: Users,
      color: '#6366f1',
      sub: 'Scored applicants',
    },
    {
      label: 'Mean Late-Payment PD',
      value: `${(stats.meanPd * 100).toFixed(1)}%`,
      icon: TrendingUp,
      color: '#f59e0b',
      sub: 'Average probability',
    },
    {
      label: 'Auto-Approve Rate',
      value: `${(stats.autoApproveRate * 100).toFixed(1)}%`,
      icon: CheckCircle2,
      color: '#10b981',
      sub: 'PD < 15%',
    },
    {
      label: 'Overall Approval',
      value: `${(stats.approvalRate * 100).toFixed(1)}%`,
      icon: AlertTriangle,
      color: '#6366f1',
      sub: 'Auto + manual review',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.4 }}
          className="rounded-2xl border border-border/60 bg-card p-5"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{kpi.label}</span>
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: `${kpi.color}18` }}
            >
              <kpi.icon className="h-4 w-4" style={{ color: kpi.color }} />
            </div>
          </div>
          <p className="text-2xl font-extrabold" style={{ color: kpi.color }}>{kpi.value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{kpi.sub}</p>
        </motion.div>
      ))}
    </div>
  );
}
