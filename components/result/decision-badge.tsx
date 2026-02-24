'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import type { Decision, RiskTier } from '@/lib/types';

interface Props {
  decision: Decision;
  riskTier: RiskTier;
}

const CONFIG = {
  approve: {
    label: 'Auto Approved',
    Icon: CheckCircle2,
    bg: 'bg-[#10b981]/10',
    border: 'border-[#10b981]/30',
    text: 'text-[#10b981]',
  },
  manual_review: {
    label: 'Manual Review',
    Icon: AlertTriangle,
    bg: 'bg-[#f59e0b]/10',
    border: 'border-[#f59e0b]/30',
    text: 'text-[#f59e0b]',
  },
  decline: {
    label: 'Declined',
    Icon: XCircle,
    bg: 'bg-[#f43f5e]/10',
    border: 'border-[#f43f5e]/30',
    text: 'text-[#f43f5e]',
  },
};

export default function DecisionBadge({ decision, riskTier }: Props) {
  const c = CONFIG[decision];

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.3 }}
      className={`inline-flex items-center gap-3 rounded-2xl border px-5 py-3 ${c.bg} ${c.border}`}
    >
      <c.Icon className={`h-6 w-6 ${c.text}`} />
      <div>
        <p className={`text-lg font-bold ${c.text}`}>{c.label}</p>
        <p className="text-xs text-muted-foreground">Risk Tier: {riskTier}</p>
      </div>
    </motion.div>
  );
}
