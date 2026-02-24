'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, BarChart2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RiskGauge from '@/components/result/risk-gauge';
import DecisionBadge from '@/components/result/decision-badge';
import ContributorsChart from '@/components/result/contributors-chart';
import ProductCard from '@/components/result/product-card';
import BnplTermsCard from '@/components/result/bnpl-terms';
import type { FullRecommendation } from '@/lib/types';

function ResultContent() {
  const params = useSearchParams();
  const router = useRouter();
  const raw = params.get('data');

  if (!raw) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-muted-foreground">No result data found.</p>
        <Link href="/score">
          <Button className="bg-[#6366f1] text-white hover:bg-[#4f46e5]">Score a Farmer</Button>
        </Link>
      </div>
    );
  }

  let result: FullRecommendation;
  try {
    result = JSON.parse(decodeURIComponent(raw));
  } catch {
    return (
      <div className="py-20 text-center text-muted-foreground">Invalid result data.</div>
    );
  }

  const { score, product, bnpl_terms } = result;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto max-w-5xl px-4 py-12 sm:px-6"
    >
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Applicant</p>
          <h1 className="text-2xl font-bold">{score.user_id}</h1>
        </div>
        <DecisionBadge decision={score.decision} riskTier={score.risk_tier} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          {/* Gauge */}
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Risk Score</h2>
            <div className="flex justify-center">
              <RiskGauge pd={score.late_payment_prob} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Linear Score</p>
                <p className="font-semibold">{(score.linear_risk_score * 100).toFixed(1)}%</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Risk Tier</p>
                <p className="font-semibold">{score.risk_tier}</p>
              </div>
            </div>
          </div>

          {/* Risk factors */}
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Risk Factor Breakdown
            </h2>
            <ContributorsChart components={score.explanation.all_components} />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Product */}
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Recommended Product
            </h2>
            <ProductCard product={product} />
          </div>

          {/* BNPL Terms */}
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              BNPL Terms
            </h2>
            <BnplTermsCard terms={bnpl_terms} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button variant="outline" onClick={() => router.push('/score')} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Score Another
        </Button>
        <Link href="/dashboard">
          <Button className="gap-2 bg-[#6366f1] text-white hover:bg-[#4f46e5]">
            <BarChart2 className="h-4 w-4" />
            View Dashboard
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Loading result…</div>}>
      <ResultContent />
    </Suspense>
  );
}
