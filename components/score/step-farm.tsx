'use client';

import { UseFormReturn } from 'react-hook-form';
import type { ScoreFormData } from './score-form';

interface Props {
  form: UseFormReturn<ScoreFormData>;
}

const FIELD_CLS = 'w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm outline-none transition focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20';
const LABEL_CLS = 'mb-1.5 block text-sm font-medium text-foreground';
const ERROR_CLS = 'mt-1 text-xs text-[#f43f5e]';

export default function StepFarm({ form }: Props) {
  const { register, formState: { errors } } = form;

  return (
    <div className="grid gap-5">
      <div>
        <label className={LABEL_CLS}>Crop Type</label>
        <select {...register('crop_type')} className={FIELD_CLS}>
          <option value="">Select crop</option>
          <option value="maize">Maize</option>
          <option value="rice">Rice</option>
          <option value="vegetables">Vegetables</option>
          <option value="horticulture">Horticulture</option>
          <option value="mixed">Mixed</option>
          <option value="livestock">Livestock</option>
        </select>
        {errors.crop_type && <p className={ERROR_CLS}>{errors.crop_type.message}</p>}
      </div>

      <div>
        <label className={LABEL_CLS}>Farm Size (ha)</label>
        <input
          {...register('farm_size_ha', { valueAsNumber: true })}
          type="number"
          step="0.1"
          min={0.1}
          placeholder="e.g. 3.5"
          className={FIELD_CLS}
        />
        {errors.farm_size_ha && <p className={ERROR_CLS}>{errors.farm_size_ha.message}</p>}
      </div>

      <div>
        <label className={LABEL_CLS}>Years of Farming Experience</label>
        <input
          {...register('years_experience', { valueAsNumber: true })}
          type="number"
          min={0}
          max={60}
          placeholder="e.g. 8"
          className={FIELD_CLS}
        />
        {errors.years_experience && <p className={ERROR_CLS}>{errors.years_experience.message}</p>}
      </div>

      <div>
        <label className={LABEL_CLS}>Average Order Value (local currency)</label>
        <input
          {...register('avg_order_value', { valueAsNumber: true })}
          type="number"
          min={1000}
          placeholder="e.g. 18500"
          className={FIELD_CLS}
        />
        {errors.avg_order_value && <p className={ERROR_CLS}>{errors.avg_order_value.message}</p>}
      </div>
    </div>
  );
}
