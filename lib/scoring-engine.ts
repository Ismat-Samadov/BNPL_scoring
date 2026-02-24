// Port of scoring_engine.py — Rule-based risk scoring for Agrarian BNPL

import type { ApplicantProfile, RiskTier, Decision, RiskComponent, ScoreExplanation, ScoreResult } from './types';

const REGION_MAP: Record<string, number> = {
  North: 0.15,
  South: 0.25,
  East: 0.15,
  West: 0.30,
  Central: 0.20,
};

const FARM_TYPE_MAP: Record<string, number> = {
  smallholder: 0.35,
  commercial: 0.10,
  cooperative: 0.20,
};

function getExperienceRisk(exp: number): number {
  if (exp <= 2) return 0.40;
  if (exp <= 10) return 0.25;
  if (exp <= 20) return 0.15;
  return 0.10;
}

function getFarmSizeRisk(size: number): number {
  if (size < 1) return 0.30;
  if (size < 10) return 0.10;
  if (size < 100) return 0.05;
  return 0.15;
}

export function computeLinearRiskScore(row: ApplicantProfile): number {
  const regionRisk = REGION_MAP[row.region] ?? 0.20;
  const farmTypeRisk = FARM_TYPE_MAP[row.farm_type] ?? 0.25;
  const experienceRisk = getExperienceRisk(row.years_experience);
  const priorDefaultsRisk = Math.min(row.prior_defaults * 0.15, 0.75);
  const liquidityNorm = Math.min(row.liquidity_ratio / 3.0, 1.0);
  const liquidityRisk = 1 - liquidityNorm;
  const farmSizeRisk = getFarmSizeRisk(row.farm_size_ha);
  const deviceRisk = (100 - row.device_trust_score) / 100;
  const identityRisk = (100 - row.identity_consistency) / 100;

  return (
    0.12 * regionRisk +
    0.18 * farmTypeRisk +
    0.15 * experienceRisk +
    0.20 * priorDefaultsRisk +
    0.10 * liquidityRisk +
    0.08 * farmSizeRisk +
    0.10 * deviceRisk +
    0.07 * identityRisk
  );
}

export function sigmoidPdMapping(linearScore: number, k = 15.0, theta = 0.35): number {
  return 1.0 / (1.0 + Math.exp(-k * (linearScore - theta)));
}

export function getRiskTier(pd: number): RiskTier {
  if (pd < 0.15) return 'Low';
  if (pd < 0.35) return 'Medium';
  if (pd < 0.50) return 'High';
  return 'Decline';
}

export function getDecision(pd: number): Decision {
  if (pd < 0.15) return 'approve';
  if (pd < 0.50) return 'manual_review';
  return 'decline';
}

export function explainScore(row: ApplicantProfile, linearScore: number): ScoreExplanation {
  const regionRisk = REGION_MAP[row.region] ?? 0.20;
  const farmTypeRisk = FARM_TYPE_MAP[row.farm_type] ?? 0.25;
  const experienceRisk = getExperienceRisk(row.years_experience);
  const priorDefaultsRisk = Math.min(row.prior_defaults * 0.15, 0.75);
  const liquidityRisk = 1 - Math.min(row.liquidity_ratio / 3.0, 1.0);
  const farmSizeRisk = getFarmSizeRisk(row.farm_size_ha);
  const deviceRisk = (100 - row.device_trust_score) / 100;
  const identityRisk = (100 - row.identity_consistency) / 100;

  const components: RiskComponent[] = [
    { feature: 'region_risk', label: 'Region Risk', raw_risk: regionRisk, weight: 0.12, contribution: 0.12 * regionRisk },
    { feature: 'farm_type_risk', label: 'Farm Type', raw_risk: farmTypeRisk, weight: 0.18, contribution: 0.18 * farmTypeRisk },
    { feature: 'experience_risk', label: 'Experience', raw_risk: experienceRisk, weight: 0.15, contribution: 0.15 * experienceRisk },
    { feature: 'prior_defaults', label: 'Prior Defaults', raw_risk: priorDefaultsRisk, weight: 0.20, contribution: 0.20 * priorDefaultsRisk },
    { feature: 'liquidity_risk', label: 'Liquidity', raw_risk: liquidityRisk, weight: 0.10, contribution: 0.10 * liquidityRisk },
    { feature: 'farm_size_risk', label: 'Farm Size', raw_risk: farmSizeRisk, weight: 0.08, contribution: 0.08 * farmSizeRisk },
    { feature: 'device_trust', label: 'Device Trust', raw_risk: deviceRisk, weight: 0.10, contribution: 0.10 * deviceRisk },
    { feature: 'identity_consistency', label: 'Identity', raw_risk: identityRisk, weight: 0.07, contribution: 0.07 * identityRisk },
  ];

  const sorted = [...components].sort((a, b) => b.contribution - a.contribution);

  return {
    linear_risk_score: linearScore,
    total_contributors: components.length,
    top_3_contributors: sorted.slice(0, 3),
    all_components: sorted,
  };
}

export function scoreApplicant(row: ApplicantProfile): ScoreResult {
  const linearScore = computeLinearRiskScore(row);
  const pd = sigmoidPdMapping(linearScore);
  const riskTier = getRiskTier(pd);
  const decision = getDecision(pd);
  const explanation = explainScore(row, linearScore);

  return {
    user_id: row.user_id,
    linear_risk_score: linearScore,
    late_payment_prob: pd,
    risk_tier: riskTier,
    decision,
    explanation,
  };
}
