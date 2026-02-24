// Shared TypeScript interfaces for BNPL Scoring System

export interface ApplicantProfile {
  user_id: string;
  region: 'North' | 'South' | 'East' | 'West' | 'Central';
  farm_type: 'smallholder' | 'commercial' | 'cooperative';
  crop_type: 'maize' | 'rice' | 'vegetables' | 'horticulture' | 'mixed' | 'livestock';
  farm_size_ha: number;
  years_experience: number;
  monthly_income_est: number;
  recent_cash_inflows: number;
  avg_order_value: number;
  device_trust_score: number;
  identity_consistency: number;
  prior_defaults: number;
  liquidity_ratio: number;
}

export type RiskTier = 'Low' | 'Medium' | 'High' | 'Decline';
export type Decision = 'approve' | 'manual_review' | 'decline';

export interface RiskComponent {
  feature: string;
  label: string;
  raw_risk: number;
  weight: number;
  contribution: number;
}

export interface ScoreExplanation {
  linear_risk_score: number;
  total_contributors: number;
  top_3_contributors: RiskComponent[];
  all_components: RiskComponent[];
}

export interface ScoreResult {
  user_id: string;
  linear_risk_score: number;
  late_payment_prob: number;
  risk_tier: RiskTier;
  decision: Decision;
  explanation: ScoreExplanation;
}

export interface ProductInfo {
  name: string;
  description: string;
  base_limit: number;
  base_tenor_months: number;
  target_crops: string[];
}

export interface ProductRecommendation {
  top_1: string;
  top_3: string[];
  product_info: ProductInfo;
}

export interface LimitBreakdown {
  base_limit: number;
  risk_multiplier: number;
  income_multiplier: number;
  tenure_multiplier: number;
  tenure_factors: string[];
  final_limit: number;
}

export interface TenorBreakdown {
  base_tenor: number;
  risk_adjustment: string;
  crop_cycle_impact: string;
  final_tenor: number;
}

export interface BnplTerms {
  credit_limit: number;
  tenor_months: number;
  limit_breakdown: LimitBreakdown;
  tenor_breakdown: TenorBreakdown;
  decision_rationale: string;
}

export interface FullRecommendation {
  score: ScoreResult;
  product: ProductRecommendation;
  bnpl_terms: BnplTerms;
}

export interface BatchSummary {
  total: number;
  approved: number;
  manual_review: number;
  declined: number;
  approval_rate: number;
  auto_approve_rate: number;
  mean_pd: number;
  results: FullRecommendation[];
}

// Dashboard / synthetic data types
export interface SyntheticProfile extends ApplicantProfile {
  late_payment_prob: number;
  risk_tier: RiskTier;
  decision: Decision;
  recommended_product: string;
  bnpl_limit: number;
  bnpl_tenor: number;
}
