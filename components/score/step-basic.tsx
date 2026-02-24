'use client';

import { UseFormReturn } from 'react-hook-form';
import type { ScoreFormData } from './score-form';

interface Props {
  form: UseFormReturn<ScoreFormData>;
}

const FIELD_CLS = 'w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm outline-none transition focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20';
const LABEL_CLS = 'mb-1.5 block text-sm font-medium text-foreground';
const ERROR_CLS = 'mt-1 text-xs text-[#f43f5e]';

export default function StepBasic({ form }: Props) {
  const { register, formState: { errors } } = form;

  return (
    <div className="grid gap-5">
      <div>
        <label className={LABEL_CLS}>Farmer ID</label>
        <input
          {...register('user_id')}
          placeholder="e.g. FARM_001"
          className={FIELD_CLS}
        />
        {errors.user_id && <p className={ERROR_CLS}>{errors.user_id.message}</p>}
      </div>

      <div>
        <label className={LABEL_CLS}>Region</label>
        <select {...register('region')} className={FIELD_CLS}>
          <option value="">Select region</option>
          {['North', 'South', 'East', 'West', 'Central'].map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        {errors.region && <p className={ERROR_CLS}>{errors.region.message}</p>}
      </div>

      <div>
        <label className={LABEL_CLS}>Farm Type</label>
        <select {...register('farm_type')} className={FIELD_CLS}>
          <option value="">Select type</option>
          <option value="smallholder">Smallholder</option>
          <option value="commercial">Commercial</option>
          <option value="cooperative">Cooperative</option>
        </select>
        {errors.farm_type && <p className={ERROR_CLS}>{errors.farm_type.message}</p>}
      </div>

      <div>
        <label className={LABEL_CLS}>Prior Defaults</label>
        <input
          {...register('prior_defaults', { valueAsNumber: true })}
          type="number"
          min={0}
          max={10}
          placeholder="0"
          className={FIELD_CLS}
        />
        {errors.prior_defaults && <p className={ERROR_CLS}>{errors.prior_defaults.message}</p>}
      </div>
    </div>
  );
}
