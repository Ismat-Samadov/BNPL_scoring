// Port of product_matcher.py — Deterministic product matching for Agrarian BNPL

import type { ApplicantProfile, ProductInfo, ProductRecommendation } from './types';

const PRODUCTS: Record<string, ProductInfo> = {
  Seeds_BNPL: {
    name: 'Seeds BNPL',
    description: 'Seed financing for maize/rice farmers',
    base_limit: 20000,
    base_tenor_months: 4,
    target_crops: ['maize', 'rice'],
  },
  Fertilizer_BNPL: {
    name: 'Fertilizer BNPL',
    description: 'Input financing for high-intensity crops',
    base_limit: 35000,
    base_tenor_months: 3,
    target_crops: ['vegetables', 'horticulture'],
  },
  Equipment_Lease: {
    name: 'Equipment Lease',
    description: 'Machinery leasing for commercial farms',
    base_limit: 150000,
    base_tenor_months: 12,
    target_crops: ['all'],
  },
  Input_Bundle: {
    name: 'Input Bundle',
    description: 'Multi-input package for diversified farms',
    base_limit: 50000,
    base_tenor_months: 6,
    target_crops: ['mixed', 'livestock'],
  },
  Cash_Advance: {
    name: 'Cash Advance',
    description: 'Short-term cash bridge for small needs',
    base_limit: 10000,
    base_tenor_months: 2,
    target_crops: ['all'],
  },
  Premium_BNPL: {
    name: 'Premium BNPL',
    description: 'General BNPL for established customers',
    base_limit: 75000,
    base_tenor_months: 6,
    target_crops: ['all'],
  },
};

export function getProductInfo(productName: string): ProductInfo {
  return PRODUCTS[productName] ?? {
    name: productName,
    description: 'Unknown product',
    base_limit: 50000,
    base_tenor_months: 6,
    target_crops: ['all'],
  };
}

export function matchProduct(row: ApplicantProfile): ProductRecommendation {
  const productScores: [string, number][] = [];

  // Rule 1: Seeds_BNPL — maize/rice, low-ticket
  if (['maize', 'rice'].includes(row.crop_type) && row.avg_order_value < 30000) {
    productScores.push(['Seeds_BNPL', 100]);
  }

  // Rule 2: Fertilizer_BNPL — vegetables/horticulture, medium-ticket
  if (['vegetables', 'horticulture'].includes(row.crop_type) && row.avg_order_value < 50000) {
    productScores.push(['Fertilizer_BNPL', 95]);
  }

  // Rule 3: Equipment_Lease — commercial, high-ticket
  if (row.farm_type === 'commercial' && row.avg_order_value > 80000) {
    productScores.push(['Equipment_Lease', 90]);
  }

  // Rule 4: Input_Bundle — mixed/cooperative + trust
  if (row.crop_type === 'mixed' || (row.farm_type === 'cooperative' && row.device_trust_score > 60)) {
    productScores.push(['Input_Bundle', 85]);
  }

  // Rule 5: Cash_Advance — small orders, high trust
  if (row.avg_order_value < 15000 && row.device_trust_score > 70) {
    productScores.push(['Cash_Advance', 80]);
  }

  // Rule 6: Premium_BNPL — always eligible fallback
  productScores.push(['Premium_BNPL', 50]);

  // Apply secondary boosts
  const boosted: [string, number][] = productScores.map(([product, base]) => {
    let boost = 0;
    if (product === 'Equipment_Lease' && row.farm_size_ha > 50) boost += 5;
    if (['Seeds_BNPL', 'Fertilizer_BNPL'].includes(product) && row.farm_type === 'smallholder') boost += 3;
    if (product === 'Input_Bundle' && row.farm_size_ha > 10) boost += 4;
    if (row.device_trust_score > 80) boost += 2;
    return [product, base + boost];
  });

  boosted.sort((a, b) => b[1] - a[1]);

  // Deduplicate
  const seen = new Set<string>();
  const unique: [string, number][] = [];
  for (const [product, score] of boosted) {
    if (!seen.has(product)) {
      unique.push([product, score]);
      seen.add(product);
    }
  }

  const top1 = unique[0][0];
  const top3 = unique.slice(0, 3).map(([p]) => p);

  return {
    top_1: top1,
    top_3: top3,
    product_info: getProductInfo(top1),
  };
}
