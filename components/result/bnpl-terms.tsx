'use client';

import { motion } from 'framer-motion';
import { CreditCard, Clock } from 'lucide-react';
import type { BnplTerms } from '@/lib/types';

interface Props {
  terms: BnplTerms;
}

export default function BnplTermsCard({ terms }: Props) {
  const { limit_breakdown: lb, tenor_breakdown: tb } = terms;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="space-y-4"
    >
      {/* Credit limit */}
      <div className="rounded-2xl border border-[#10b981]/30 bg-[#10b981]/5 p-5">
        <div className="mb-3 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-[#10b981]" />
          <span className="font-semibold">Credit Limit</span>
        </div>
        <p className="text-3xl font-extrabold text-[#10b981]">
          {terms.credit_limit > 0 ? terms.credit_limit.toLocaleString() : 'N/A'}
        </p>
        {terms.credit_limit > 0 && (
          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Base Limit</span>
              <span>{lb.base_limit.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Risk Multiplier</span>
              <span>{lb.risk_multiplier.toFixed(2)}×</span>
            </div>
            <div className="flex justify-between">
              <span>Income Multiplier</span>
              <span>{lb.income_multiplier.toFixed(2)}×</span>
            </div>
            <div className="flex justify-between">
              <span>Tenure Multiplier</span>
              <span>{lb.tenure_multiplier.toFixed(2)}×</span>
            </div>
            {lb.tenure_factors[0] !== 'no tenure boosts' && (
              <p className="pt-1 text-[#10b981]/70">{lb.tenure_factors.join(', ')}</p>
            )}
          </div>
        )}
      </div>

      {/* Repayment tenor */}
      <div className="rounded-2xl border border-[#6366f1]/30 bg-[#6366f1]/5 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#6366f1]" />
          <span className="font-semibold">Repayment Tenor</span>
        </div>
        <p className="text-3xl font-extrabold text-[#6366f1]">
          {terms.tenor_months > 0 ? `${terms.tenor_months} months` : 'N/A'}
        </p>
        {terms.tenor_months > 0 && (
          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Base Tenor</span>
              <span>{tb.base_tenor} months</span>
            </div>
            <p className="pt-0.5">{tb.risk_adjustment}</p>
            <p>{tb.crop_cycle_impact}</p>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{terms.decision_rationale}</p>
    </motion.div>
  );
}
