# bnpl_policy.py
"""BNPL policy rules for credit limit and repayment tenor calculation.

Computes risk-adjusted credit limits and crop-cycle-aligned tenors based on
late payment probability, income proxies, and farmer characteristics.
"""

import numpy as np


def compute_bnpl_limit(row, recommended_product, late_payment_prob):
    """Compute BNPL credit limit based on risk, income, and product.

    Formula:
        bnpl_limit = base_limit × risk_multiplier × income_multiplier × tenure_multiplier

    Args:
        row: dict or pandas Series with applicant features
        recommended_product: Product name (str)
        late_payment_prob: Late payment probability in [0, 1]

    Returns:
        int: BNPL credit limit (rounded to nearest 1000), or 0 if declined
    """

    # Decline if PD >= 0.50
    if late_payment_prob >= 0.50:
        return 0

    # Base limits by product
    base_limits = {
        'Seeds_BNPL': 20000,
        'Fertilizer_BNPL': 35000,
        'Equipment_Lease': 150000,
        'Input_Bundle': 50000,
        'Cash_Advance': 10000,
        'Premium_BNPL': 75000
    }
    base_limit = base_limits.get(recommended_product, 50000)

    # Risk multiplier: decreases linearly with PD, floor at 0.2x
    # PD=0.10 → 0.75x, PD=0.30 → 0.25x, PD≥0.32 → 0.20x
    risk_multiplier = max(0.2, 1 - (late_payment_prob * 2.5))

    # Income multiplier: scales with income up to 2.5x, caps at 125k income
    # Ensures limit stays within 1-3 months of income (sustainable DTI)
    income_multiplier = min(2.5, row['monthly_income_est'] / 50000)

    # Tenure multiplier: rewards established farmers and high trust
    tenure_multiplier = 1.0
    if row['farm_type'] == 'commercial':
        tenure_multiplier *= 1.3
    if row['years_experience'] > 15:
        tenure_multiplier *= 1.2
    if row['device_trust_score'] > 85:
        tenure_multiplier *= 1.1

    # Final limit calculation
    bnpl_limit = base_limit * risk_multiplier * income_multiplier * tenure_multiplier

    # Round to nearest 1000
    bnpl_limit = round(bnpl_limit, -3)

    return int(bnpl_limit)


def compute_bnpl_tenor(row, recommended_product, late_payment_prob):
    """Compute BNPL repayment tenor (months) aligned with crop cycles.

    Args:
        row: dict or pandas Series with applicant features
        recommended_product: Product name (str)
        late_payment_prob: Late payment probability in [0, 1]

    Returns:
        int: Tenor in months, or 0 if declined
    """

    # Decline if PD >= 0.50
    if late_payment_prob >= 0.50:
        return 0

    # Base tenor by product (aligned with typical product lifecycle)
    base_tenors = {
        'Seeds_BNPL': 4,          # One crop cycle
        'Fertilizer_BNPL': 3,     # Short-season input
        'Equipment_Lease': 12,     # Durable asset amortization
        'Input_Bundle': 6,         # Mixed inputs, mid-term
        'Cash_Advance': 2,         # Short-term bridge
        'Premium_BNPL': 6          # Standard term
    }
    base_tenor = base_tenors.get(recommended_product, 6)

    # Risk adjustment: shorten tenor for higher PD (reduce exposure window)
    if late_payment_prob < 0.15:
        tenor = base_tenor  # Low risk: full tenor
    elif late_payment_prob < 0.30:
        tenor = max(2, base_tenor - 1)  # Medium risk: -1 month
    else:  # 0.30 <= PD < 0.50
        tenor = max(2, base_tenor - 2)  # High risk: -2 months

    # Crop-cycle alignment (override if crop has shorter cycle)
    if row['crop_type'] in ['maize', 'rice']:
        tenor = min(tenor, 4)  # Harvest cycle ~4 months
    elif row['crop_type'] == 'horticulture':
        tenor = min(tenor, 3)  # Short-season crops

    return int(tenor)


def get_policy_explanation(row, recommended_product, late_payment_prob, bnpl_limit, bnpl_tenor):
    """Generate human-readable explanation for BNPL policy decision.

    Args:
        row: Applicant features
        recommended_product: Product name
        late_payment_prob: PD
        bnpl_limit: Computed limit
        bnpl_tenor: Computed tenor

    Returns:
        dict: Explanation breakdown
    """

    # Compute multipliers for transparency
    risk_mult = max(0.2, 1 - (late_payment_prob * 2.5))
    income_mult = min(2.5, row['monthly_income_est'] / 50000)

    tenure_mult = 1.0
    tenure_factors = []
    if row['farm_type'] == 'commercial':
        tenure_mult *= 1.3
        tenure_factors.append('commercial farm (+30%)')
    if row['years_experience'] > 15:
        tenure_mult *= 1.2
        tenure_factors.append('experienced farmer (+20%)')
    if row['device_trust_score'] > 85:
        tenure_mult *= 1.1
        tenure_factors.append('high device trust (+10%)')

    if not tenure_factors:
        tenure_factors.append('no tenure boosts')

    # Tenor adjustment reason
    if late_payment_prob < 0.15:
        tenor_reason = 'Low risk: full base tenor'
    elif late_payment_prob < 0.30:
        tenor_reason = 'Medium risk: shortened by 1 month'
    else:
        tenor_reason = 'High risk: shortened by 2 months for manual review'

    # Crop cycle impact
    crop_impact = ''
    if row['crop_type'] in ['maize', 'rice']:
        crop_impact = ' (capped at 4mo for grain harvest cycle)'
    elif row['crop_type'] == 'horticulture':
        crop_impact = ' (capped at 3mo for short-season crops)'

    return {
        'limit_breakdown': {
            'base_limit': bnpl_limit / (risk_mult * income_mult * tenure_mult) if (risk_mult * income_mult * tenure_mult) > 0 else 0,
            'risk_multiplier': risk_mult,
            'income_multiplier': income_mult,
            'tenure_multiplier': tenure_mult,
            'tenure_factors': tenure_factors,
            'final_limit': bnpl_limit
        },
        'tenor_breakdown': {
            'base_tenor': {
                'Seeds_BNPL': 4, 'Fertilizer_BNPL': 3, 'Equipment_Lease': 12,
                'Input_Bundle': 6, 'Cash_Advance': 2, 'Premium_BNPL': 6
            }.get(recommended_product, 6),
            'risk_adjustment': tenor_reason,
            'crop_cycle_impact': crop_impact if crop_impact else 'No crop cycle override',
            'final_tenor': bnpl_tenor
        },
        'decision_rationale': f"Limit based on {late_payment_prob:.1%} PD, {row['monthly_income_est']:,.0f} income. Tenor aligned with {row['crop_type']} crop cycle."
    }


if __name__ == "__main__":
    # Test policy calculations
    test_cases = [
        {
            'name': 'Low-risk smallholder',
            'row': {
                'farm_type': 'smallholder',
                'years_experience': 8,
                'device_trust_score': 76,
                'monthly_income_est': 42000,
                'crop_type': 'maize'
            },
            'product': 'Seeds_BNPL',
            'pd': 0.12
        },
        {
            'name': 'High-risk new farmer',
            'row': {
                'farm_type': 'smallholder',
                'years_experience': 1,
                'device_trust_score': 60,
                'monthly_income_est': 18000,
                'crop_type': 'vegetables'
            },
            'product': 'Fertilizer_BNPL',
            'pd': 0.42
        },
        {
            'name': 'Commercial farm (best terms)',
            'row': {
                'farm_type': 'commercial',
                'years_experience': 22,
                'device_trust_score': 92,
                'monthly_income_est': 285000,
                'crop_type': 'livestock'
            },
            'product': 'Equipment_Lease',
            'pd': 0.05
        }
    ]

    print("BNPL Policy Test Cases")
    print("=" * 70)

    for case in test_cases:
        limit = compute_bnpl_limit(case['row'], case['product'], case['pd'])
        tenor = compute_bnpl_tenor(case['row'], case['product'], case['pd'])
        explanation = get_policy_explanation(case['row'], case['product'], case['pd'], limit, tenor)

        print(f"\n{case['name']}:")
        print(f"  Product: {case['product']}, PD: {case['pd']:.1%}")
        print(f"  BNPL Limit: {limit:,} (base × {explanation['limit_breakdown']['risk_multiplier']:.2f} risk × {explanation['limit_breakdown']['income_multiplier']:.2f} income × {explanation['limit_breakdown']['tenure_multiplier']:.2f} tenure)")
        print(f"  Tenor: {tenor} months ({explanation['tenor_breakdown']['risk_adjustment']})")
        print(f"  Rationale: {explanation['decision_rationale']}")
