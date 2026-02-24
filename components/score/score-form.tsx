'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowLeft, ArrowRight, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StepIndicator from './step-indicator';
import StepBasic from './step-basic';
import StepFarm from './step-farm';
import StepFinancial from './step-financial';

const schema = z.object({
  user_id: z.string().min(1, 'Required'),
  region: z.enum(['North', 'South', 'East', 'West', 'Central'] as const, { error: 'Select a region' }),
  farm_type: z.enum(['smallholder', 'commercial', 'cooperative'] as const, { error: 'Select farm type' }),
  prior_defaults: z.number({ error: 'Required' }).min(0).max(10),
  crop_type: z.enum(['maize', 'rice', 'vegetables', 'horticulture', 'mixed', 'livestock'] as const, { error: 'Select crop type' }),
  farm_size_ha: z.number({ error: 'Required' }).min(0.1, 'Min 0.1 ha'),
  years_experience: z.number({ error: 'Required' }).min(0).max(60),
  avg_order_value: z.number({ error: 'Required' }).min(1000, 'Min 1,000'),
  monthly_income_est: z.number({ error: 'Required' }).min(1000, 'Min 1,000'),
  recent_cash_inflows: z.number({ error: 'Required' }).min(0),
  device_trust_score: z.number({ error: 'Required' }).min(0).max(100),
  identity_consistency: z.number({ error: 'Required' }).min(0).max(100),
});

export type ScoreFormData = z.infer<typeof schema>;

const STEP_FIELDS: (keyof ScoreFormData)[][] = [
  ['user_id', 'region', 'farm_type', 'prior_defaults'],
  ['crop_type', 'farm_size_ha', 'years_experience', 'avg_order_value'],
  ['monthly_income_est', 'recent_cash_inflows', 'device_trust_score', 'identity_consistency'],
];

const STEP_TITLES = ['Identity & Region', 'Farm Details', 'Financial Signals'];

export default function ScoreForm() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<ScoreFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      user_id: 'FARM_001',
      region: 'North',
      farm_type: 'smallholder',
      prior_defaults: 0,
      crop_type: 'maize',
      farm_size_ha: 3.5,
      years_experience: 8,
      avg_order_value: 18500,
      monthly_income_est: 42000,
      recent_cash_inflows: 115000,
      device_trust_score: 76.3,
      identity_consistency: 83.2,
    },
  });

  const validateStep = async () => {
    const fields = STEP_FIELDS[step];
    const valid = await form.trigger(fields);
    return valid;
  };

  const handleNext = async () => {
    const valid = await validateStep();
    if (valid) setStep(s => s + 1);
  };

  const handleBack = () => setStep(s => s - 1);

  const onSubmit = async (data: ScoreFormData) => {
    setLoading(true);
    setError(null);
    try {
      // Compute liquidity_ratio from inputs
      const profile = {
        ...data,
        liquidity_ratio: data.recent_cash_inflows / data.monthly_income_est,
      };

      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (!res.ok) throw new Error('Scoring failed');
      const result = await res.json();

      // Encode result in URL search params (small enough)
      const encoded = encodeURIComponent(JSON.stringify(result));
      router.push(`/result?data=${encoded}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred');
      setLoading(false);
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  const [direction, setDirection] = useState(1);

  const goNext = () => { setDirection(1); handleNext(); };
  const goBack = () => { setDirection(-1); handleBack(); };

  return (
    <div className="w-full max-w-xl">
      <StepIndicator current={step} />

      <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
        <h2 className="mb-1 text-lg font-semibold">{STEP_TITLES[step]}</h2>
        <p className="mb-6 text-sm text-muted-foreground">Step {step + 1} of 3</p>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {step === 0 && <StepBasic form={form} />}
            {step === 1 && <StepFarm form={form} />}
            {step === 2 && (
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <StepFinancial form={form} />
              </form>
            )}
          </motion.div>
        </AnimatePresence>

        {error && (
          <p className="mt-4 rounded-lg bg-[#f43f5e]/10 p-3 text-sm text-[#f43f5e]">{error}</p>
        )}

        <div className="mt-8 flex justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            disabled={step === 0}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {step < 2 ? (
            <Button
              type="button"
              onClick={goNext}
              className="gap-2 bg-[#6366f1] text-white hover:bg-[#4f46e5]"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={loading}
              className="gap-2 bg-[#10b981] text-white hover:bg-[#059669]"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Scoring…</>
              ) : (
                <><Send className="h-4 w-4" /> Submit</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
