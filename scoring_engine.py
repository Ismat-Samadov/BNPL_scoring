# scoring_engine.py
"""Rule-based risk scoring engine for Agrarian BNPL.

Computes linear risk scores from 8 weighted rule components, then maps to
late payment probability via sigmoid function. Transparent, auditable logic.
"""

import numpy as np


def compute_linear_risk_score(row):
    """Compute linear risk score from applicant features.

    Args:
        row: dict or pandas Series with applicant features

    Returns:
        float: Linear risk score in range [0, 1]
    """

    # 1. Region risk lookup
    region_map = {
        'North': 0.15,
        'South': 0.25,
        'East': 0.15,
        'West': 0.30,
        'Central': 0.20
    }
    region_risk = region_map.get(row['region'], 0.20)

    # 2. Farm type risk
    farm_type_map = {
        'smallholder': 0.35,
        'commercial': 0.10,
        'cooperative': 0.20
    }
    farm_type_risk = farm_type_map.get(row['farm_type'], 0.25)

    # 3. Experience buckets
    exp = row['years_experience']
    if exp <= 2:
        experience_risk = 0.40
    elif exp <= 10:
        experience_risk = 0.25
    elif exp <= 20:
        experience_risk = 0.15
    else:
        experience_risk = 0.10

    # 4. Prior defaults penalty (capped at 0.75)
    prior_defaults_risk = min(row['prior_defaults'] * 0.15, 0.75)

    # 5. Liquidity ratio (normalized to 0-1, target = 3x monthly income)
    liquidity_norm = min(row['liquidity_ratio'] / 3.0, 1.0)
    liquidity_risk = 1 - liquidity_norm

    # 6. Farm size penalties (U-shaped risk: very small or very large)
    size = row['farm_size_ha']
    if size < 1:
        farm_size_risk = 0.30  # Subsistence farming, high volatility
    elif size < 10:
        farm_size_risk = 0.10
    elif size < 100:
        farm_size_risk = 0.05  # Optimal range
    else:
        farm_size_risk = 0.15  # Concentration risk, commodity exposure

    # 7. Device trust score (lower score = higher risk)
    device_risk = (100 - row['device_trust_score']) / 100

    # 8. Identity consistency (lower score = higher risk)
    identity_risk = (100 - row['identity_consistency']) / 100

    # Weighted linear combination (weights sum to 1.00)
    linear_score = (
        0.12 * region_risk +
        0.18 * farm_type_risk +
        0.15 * experience_risk +
        0.20 * prior_defaults_risk +
        0.10 * liquidity_risk +
        0.08 * farm_size_risk +
        0.10 * device_risk +
        0.07 * identity_risk
    )

    return linear_score


def sigmoid_pd_mapping(linear_score, k=15.0, theta=0.35):
    """Map linear risk score to late payment probability via sigmoid.

    Args:
        linear_score: Risk score in [0, 1]
        k: Steepness parameter (default 15.0)
        theta: Inflection point (default 0.35)

    Returns:
        float: Late payment probability in [0, 1]
    """
    return 1.0 / (1.0 + np.exp(-k * (linear_score - theta)))


def get_risk_tier(late_payment_prob):
    """Assign risk tier based on late payment probability.

    Args:
        late_payment_prob: PD in [0, 1]

    Returns:
        str: 'Low', 'Medium', 'High', or 'Decline'
    """
    if late_payment_prob < 0.15:
        return 'Low'
    elif late_payment_prob < 0.35:
        return 'Medium'
    elif late_payment_prob < 0.50:
        return 'High'
    else:
        return 'Decline'


def get_decision(late_payment_prob):
    """Map late payment probability to approval decision.

    Args:
        late_payment_prob: PD in [0, 1]

    Returns:
        str: 'approve', 'manual_review', or 'decline'
    """
    if late_payment_prob < 0.15:
        return 'approve'
    elif late_payment_prob < 0.50:
        return 'manual_review'
    else:
        return 'decline'


def explain_score(row, linear_score):
    """Generate explainability breakdown for a risk score.

    Args:
        row: dict or pandas Series with applicant features
        linear_score: Computed linear risk score

    Returns:
        dict: Explanation with top contributors and their impacts
    """

    # Recompute individual components for explainability
    region_map = {'North': 0.15, 'South': 0.25, 'East': 0.15, 'West': 0.30, 'Central': 0.20}
    region_risk = region_map.get(row['region'], 0.20)

    farm_type_map = {'smallholder': 0.35, 'commercial': 0.10, 'cooperative': 0.20}
    farm_type_risk = farm_type_map.get(row['farm_type'], 0.25)

    exp = row['years_experience']
    if exp <= 2:
        experience_risk = 0.40
    elif exp <= 10:
        experience_risk = 0.25
    elif exp <= 20:
        experience_risk = 0.15
    else:
        experience_risk = 0.10

    prior_defaults_risk = min(row['prior_defaults'] * 0.15, 0.75)
    liquidity_risk = 1 - min(row['liquidity_ratio'] / 3.0, 1.0)

    size = row['farm_size_ha']
    if size < 1:
        farm_size_risk = 0.30
    elif size < 10:
        farm_size_risk = 0.10
    elif size < 100:
        farm_size_risk = 0.05
    else:
        farm_size_risk = 0.15

    device_risk = (100 - row['device_trust_score']) / 100
    identity_risk = (100 - row['identity_consistency']) / 100

    # Component contributions
    components = [
        {'feature': 'region_risk', 'raw_risk': region_risk, 'weight': 0.12,
         'contribution': 0.12 * region_risk},
        {'feature': 'farm_type_risk', 'raw_risk': farm_type_risk, 'weight': 0.18,
         'contribution': 0.18 * farm_type_risk},
        {'feature': 'experience_risk', 'raw_risk': experience_risk, 'weight': 0.15,
         'contribution': 0.15 * experience_risk},
        {'feature': 'prior_defaults', 'raw_risk': prior_defaults_risk, 'weight': 0.20,
         'contribution': 0.20 * prior_defaults_risk},
        {'feature': 'liquidity_risk', 'raw_risk': liquidity_risk, 'weight': 0.10,
         'contribution': 0.10 * liquidity_risk},
        {'feature': 'farm_size_risk', 'raw_risk': farm_size_risk, 'weight': 0.08,
         'contribution': 0.08 * farm_size_risk},
        {'feature': 'device_trust', 'raw_risk': device_risk, 'weight': 0.10,
         'contribution': 0.10 * device_risk},
        {'feature': 'identity_consistency', 'raw_risk': identity_risk, 'weight': 0.07,
         'contribution': 0.07 * identity_risk}
    ]

    # Sort by contribution (descending)
    components_sorted = sorted(components, key=lambda x: x['contribution'], reverse=True)

    return {
        'linear_risk_score': linear_score,
        'total_contributors': len(components),
        'top_3_contributors': components_sorted[:3],
        'all_components': components_sorted
    }


if __name__ == "__main__":
    # Test with sample applicant
    test_applicant = {
        'user_id': 'SYNTHETIC_TEST',
        'region': 'North',
        'farm_type': 'smallholder',
        'crop_type': 'maize',
        'farm_size_ha': 3.2,
        'years_experience': 8,
        'monthly_income_est': 42000,
        'recent_cash_inflows': 115000,
        'avg_order_value': 18500,
        'device_trust_score': 76.3,
        'identity_consistency': 83.2,
        'prior_defaults': 0,
        'liquidity_ratio': 115000 / 42000
    }

    linear_score = compute_linear_risk_score(test_applicant)
    late_prob = sigmoid_pd_mapping(linear_score)
    risk_tier = get_risk_tier(late_prob)
    decision = get_decision(late_prob)
    explanation = explain_score(test_applicant, linear_score)

    print("Risk Scoring Test")
    print("=" * 60)
    print(f"Applicant: {test_applicant['user_id']}")
    print(f"Linear Risk Score: {linear_score:.3f}")
    print(f"Late Payment Prob: {late_prob:.1%}")
    print(f"Risk Tier: {risk_tier}")
    print(f"Decision: {decision}")
    print(f"\nTop 3 Risk Contributors:")
    for i, comp in enumerate(explanation['top_3_contributors'], 1):
        print(f"  {i}. {comp['feature']}: {comp['contribution']:.3f} "
              f"(weight={comp['weight']:.2f} × risk={comp['raw_risk']:.2f})")
