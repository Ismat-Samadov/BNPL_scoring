// Pre-computed synthetic dataset — 1000 scored profiles for dashboard

import type { SyntheticProfile } from './types';
import { computeLinearRiskScore, sigmoidPdMapping, getRiskTier, getDecision } from './scoring-engine';
import { matchProduct } from './product-matcher';
import { computeBnplLimit, computeBnplTenor } from './bnpl-policy';

type Region = 'North' | 'South' | 'East' | 'West' | 'Central';
type FarmType = 'smallholder' | 'commercial' | 'cooperative';
type CropType = 'maize' | 'rice' | 'vegetables' | 'horticulture' | 'mixed' | 'livestock';

// Seeded pseudo-random for reproducibility
function seededRandom(seed: number) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateProfiles(): SyntheticProfile[] {
  const rand = seededRandom(42);

  const regions: Region[] = ['North', 'South', 'East', 'West', 'Central'];
  const farmTypes: FarmType[] = ['smallholder', 'commercial', 'cooperative'];
  const cropTypes: CropType[] = ['maize', 'rice', 'vegetables', 'horticulture', 'mixed', 'livestock'];

  const farmTypeWeights = [0.55, 0.25, 0.20]; // smallholder dominant
  const cropWeights = [0.25, 0.15, 0.20, 0.10, 0.15, 0.15];

  function weighted<T>(items: T[], weights: number[]): T {
    const r = rand();
    let cum = 0;
    for (let i = 0; i < items.length; i++) {
      cum += weights[i];
      if (r < cum) return items[i];
    }
    return items[items.length - 1];
  }

  function randBetween(min: number, max: number): number {
    return min + rand() * (max - min);
  }

  function randInt(min: number, max: number): number {
    return Math.floor(randBetween(min, max + 1));
  }

  const profiles: SyntheticProfile[] = [];

  for (let i = 0; i < 1000; i++) {
    const farmType = weighted(farmTypes, farmTypeWeights);
    const cropType = weighted(cropTypes, cropWeights);
    const region = regions[randInt(0, 4)];

    const yearsExp = farmType === 'commercial' ? randInt(5, 35) : randInt(0, 25);
    const farmSize =
      farmType === 'commercial' ? randBetween(50, 500) :
      farmType === 'cooperative' ? randBetween(10, 150) :
      randBetween(0.5, 15);

    const monthlyIncome =
      farmType === 'commercial' ? randBetween(80000, 400000) :
      farmType === 'cooperative' ? randBetween(30000, 120000) :
      randBetween(10000, 70000);

    const recentCashInflows = monthlyIncome * randBetween(0.5, 4.0);
    const liquidityRatio = recentCashInflows / monthlyIncome;

    const avgOrderValue =
      farmType === 'commercial' ? randBetween(40000, 200000) :
      randBetween(5000, 60000);

    const deviceTrust = Math.min(100, Math.max(10, randBetween(40, 100)));
    const identityConsistency = Math.min(100, Math.max(10, randBetween(45, 100)));

    // Prior defaults: most have 0, some have 1-2, rare 3+
    const defaultR = rand();
    const priorDefaults = defaultR < 0.60 ? 0 : defaultR < 0.80 ? 1 : defaultR < 0.93 ? 2 : randInt(3, 5);

    const profile = {
      user_id: `SYN_${String(i + 1).padStart(4, '0')}`,
      region,
      farm_type: farmType,
      crop_type: cropType,
      farm_size_ha: Math.round(farmSize * 10) / 10,
      years_experience: yearsExp,
      monthly_income_est: Math.round(monthlyIncome),
      recent_cash_inflows: Math.round(recentCashInflows),
      avg_order_value: Math.round(avgOrderValue),
      device_trust_score: Math.round(deviceTrust * 10) / 10,
      identity_consistency: Math.round(identityConsistency * 10) / 10,
      prior_defaults: priorDefaults,
      liquidity_ratio: Math.round(liquidityRatio * 100) / 100,
    };

    const linearScore = computeLinearRiskScore(profile);
    const pd = sigmoidPdMapping(linearScore);
    const riskTier = getRiskTier(pd);
    const decision = getDecision(pd);
    const { top_1: recommendedProduct } = matchProduct(profile);
    const bnplLimit = computeBnplLimit(profile, recommendedProduct, pd);
    const bnplTenor = computeBnplTenor(profile, recommendedProduct, pd);

    profiles.push({
      ...profile,
      late_payment_prob: Math.round(pd * 10000) / 10000,
      risk_tier: riskTier,
      decision,
      recommended_product: recommendedProduct,
      bnpl_limit: bnplLimit,
      bnpl_tenor: bnplTenor,
    });
  }

  return profiles;
}

// Pre-compute once at module load
export const syntheticData: SyntheticProfile[] = generateProfiles();

// Dashboard aggregates
export interface DashboardStats {
  total: number;
  meanPd: number;
  autoApproveRate: number;
  approvalRate: number;
  declineRate: number;
  tierCounts: Record<string, number>;
  productCounts: Record<string, number>;
  farmTypeCounts: Record<string, number>;
  regionCounts: Record<string, number>;
  pdHistogram: { bucket: string; count: number; color: string }[];
  scatterData: { farmSize: number; pd: number; farmType: string }[];
}

export function getDashboardStats(): DashboardStats {
  const data = syntheticData;
  const total = data.length;

  const meanPd = data.reduce((s, r) => s + r.late_payment_prob, 0) / total;
  const approved = data.filter(r => r.decision === 'approve').length;
  const manual = data.filter(r => r.decision === 'manual_review').length;
  const declined = data.filter(r => r.decision === 'decline').length;

  const tierCounts = data.reduce((acc, r) => {
    acc[r.risk_tier] = (acc[r.risk_tier] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const productCounts = data.reduce((acc, r) => {
    acc[r.recommended_product] = (acc[r.recommended_product] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const farmTypeCounts = data.reduce((acc, r) => {
    acc[r.farm_type] = (acc[r.farm_type] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const regionCounts = data.reduce((acc, r) => {
    acc[r.region] = (acc[r.region] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // PD histogram: 10 buckets [0, 0.1), [0.1, 0.2), ...
  const buckets = Array.from({ length: 10 }, (_, i) => ({
    bucket: `${(i * 10).toFixed(0)}–${((i + 1) * 10).toFixed(0)}%`,
    count: 0,
    color: i < 2 ? '#10b981' : i < 4 ? '#6366f1' : i < 6 ? '#f59e0b' : '#f43f5e',
  }));
  data.forEach(r => {
    const idx = Math.min(Math.floor(r.late_payment_prob * 10), 9);
    buckets[idx].count++;
  });

  // Scatter: sample 200 points for performance
  const step = Math.floor(total / 200);
  const scatterData = data
    .filter((_, i) => i % step === 0)
    .map(r => ({
      farmSize: r.farm_size_ha,
      pd: r.late_payment_prob,
      farmType: r.farm_type,
    }));

  return {
    total,
    meanPd,
    autoApproveRate: approved / total,
    approvalRate: (approved + manual) / total,
    declineRate: declined / total,
    tierCounts,
    productCounts,
    farmTypeCounts,
    regionCounts,
    pdHistogram: buckets,
    scatterData,
  };
}
