'use client';

import { UseFormReturn } from 'react-hook-form';
import type { ScoreFormData } from './score-form';

interface Props {
  form: UseFormReturn<ScoreFormData>;
}

const FIELD_CLS = 'w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm outline-none transition focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20';
const LABEL_CLS = 'mb-1.5 block text-sm font-medium text-foreground';
const HINT_CLS = 'mt-0.5 text-xs text-muted-foreground';
const ERROR_CLS = 'mt-1 text-xs text-[#f43f5e]';

export default function StepFinancial({ form }: Props) {
  const { register, formState: { errors } } = form;

  return (
    <div className="grid gap-5">
      <div>
        <label className={LABEL_CLS}>Monthly Income Estimate</label>
        <input
          {...register('monthly_income_est', { valueAsNumber: true })}
          type="number"
          min={1000}
          placeholder="e.g. 42000"
          className={FIELD_CLS}
        />
        <p className={HINT_CLS}>Estimated monthly farm income in local currency</p>
        {errors.monthly_income_est && <p className={ERROR_CLS}>{errors.monthly_income_est.message}</p>}
      </div>

      <div>
        <label className={LABEL_CLS}>Recent Cash Inflows (3-month total)</label>
        <input
          {...register('recent_cash_inflows', { valueAsNumber: true })}
          type="number"
          min={0}
          placeholder="e.g. 115000"
          className={FIELD_CLS}
        />
        {errors.recent_cash_inflows && <p className={ERROR_CLS}>{errors.recent_cash_inflows.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLS}>Device Trust Score</label>
          <input
            {...register('device_trust_score', { valueAsNumber: true })}
            type="number"
            min={0}
            max={100}
            step={0.1}
            placeholder="0–100"
            className={FIELD_CLS}
          />
          {errors.device_trust_score && <p className={ERROR_CLS}>{errors.device_trust_score.message}</p>}
        </div>
        <div>
          <label className={LABEL_CLS}>Identity Consistency</label>
          <input
            {...register('identity_consistency', { valueAsNumber: true })}
            type="number"
            min={0}
            max={100}
            step={0.1}
            placeholder="0–100"
            className={FIELD_CLS}
          />
          {errors.identity_consistency && <p className={ERROR_CLS}>{errors.identity_consistency.message}</p>}
        </div>
      </div>
    </div>
  );
}
