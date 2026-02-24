// Port of bnpl_policy.py — BNPL credit limit and tenor calculation

import type { ApplicantProfile, BnplTerms, LimitBreakdown, TenorBreakdown } from './types';

const BASE_LIMITS: Record<string, number> = {
  Seeds_BNPL: 20000,
  Fertilizer_BNPL: 35000,
  Equipment_Lease: 150000,
  Input_Bundle: 50000,
  Cash_Advance: 10000,
  Premium_BNPL: 75000,
};

const BASE_TENORS: Record<string, number> = {
  Seeds_BNPL: 4,
  Fertilizer_BNPL: 3,
  Equipment_Lease: 12,
  Input_Bundle: 6,
  Cash_Advance: 2,
  Premium_BNPL: 6,
};

export function computeBnplLimit(row: ApplicantProfile, product: string, pd: number): number {
  if (pd >= 0.50) return 0;

  const baseLimit = BASE_LIMITS[product] ?? 50000;
  const riskMultiplier = Math.max(0.2, 1 - pd * 2.5);
  const incomeMultiplier = Math.min(2.5, row.monthly_income_est / 50000);

  let tenureMultiplier = 1.0;
  if (row.farm_type === 'commercial') tenureMultiplier *= 1.3;
  if (row.years_experience > 15) tenureMultiplier *= 1.2;
  if (row.device_trust_score > 85) tenureMultiplier *= 1.1;

  const raw = baseLimit * riskMultiplier * incomeMultiplier * tenureMultiplier;
  return Math.round(raw / 1000) * 1000;
}

export function computeBnplTenor(row: ApplicantProfile, product: string, pd: number): number {
  if (pd >= 0.50) return 0;

  const baseTenor = BASE_TENORS[product] ?? 6;

  let tenor: number;
  if (pd < 0.15) {
    tenor = baseTenor;
  } else if (pd < 0.30) {
    tenor = Math.max(2, baseTenor - 1);
  } else {
    tenor = Math.max(2, baseTenor - 2);
  }

  if (['maize', 'rice'].includes(row.crop_type)) tenor = Math.min(tenor, 4);
  else if (row.crop_type === 'horticulture') tenor = Math.min(tenor, 3);

  return tenor;
}

export function computeBnplTerms(row: ApplicantProfile, product: string, pd: number): BnplTerms {
  const creditLimit = computeBnplLimit(row, product, pd);
  const tenorMonths = computeBnplTenor(row, product, pd);

  const riskMultiplier = Math.max(0.2, 1 - pd * 2.5);
  const incomeMultiplier = Math.min(2.5, row.monthly_income_est / 50000);

  let tenureMultiplier = 1.0;
  const tenureFactors: string[] = [];
  if (row.farm_type === 'commercial') { tenureMultiplier *= 1.3; tenureFactors.push('commercial farm (+30%)'); }
  if (row.years_experience > 15) { tenureMultiplier *= 1.2; tenureFactors.push('experienced farmer (+20%)'); }
  if (row.device_trust_score > 85) { tenureMultiplier *= 1.1; tenureFactors.push('high device trust (+10%)'); }
  if (tenureFactors.length === 0) tenureFactors.push('no tenure boosts');

  const baseLimitVal = BASE_LIMITS[product] ?? 50000;

  const limitBreakdown: LimitBreakdown = {
    base_limit: baseLimitVal,
    risk_multiplier: riskMultiplier,
    income_multiplier: incomeMultiplier,
    tenure_multiplier: tenureMultiplier,
    tenure_factors: tenureFactors,
    final_limit: creditLimit,
  };

  let riskAdjustment: string;
  if (pd < 0.15) riskAdjustment = 'Low risk: full base tenor';
  else if (pd < 0.30) riskAdjustment = 'Medium risk: shortened by 1 month';
  else riskAdjustment = 'High risk: shortened by 2 months for manual review';

  let cropCycleImpact = 'No crop cycle override';
  if (['maize', 'rice'].includes(row.crop_type)) cropCycleImpact = 'Capped at 4mo for grain harvest cycle';
  else if (row.crop_type === 'horticulture') cropCycleImpact = 'Capped at 3mo for short-season crops';

  const tenorBreakdown: TenorBreakdown = {
    base_tenor: BASE_TENORS[product] ?? 6,
    risk_adjustment: riskAdjustment,
    crop_cycle_impact: cropCycleImpact,
    final_tenor: tenorMonths,
  };

  return {
    credit_limit: creditLimit,
    tenor_months: tenorMonths,
    limit_breakdown: limitBreakdown,
    tenor_breakdown: tenorBreakdown,
    decision_rationale: `Limit based on ${(pd * 100).toFixed(1)}% PD, ${row.monthly_income_est.toLocaleString()} income. Tenor aligned with ${row.crop_type} crop cycle.`,
  };
}
