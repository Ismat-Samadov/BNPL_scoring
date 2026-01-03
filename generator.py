# generator.py
"""Synthetic data generator for Agrarian BNPL risk scoring prototype.

Generates 1000 realistic synthetic farmer profiles with ground truth labels
for product matching validation (≥85% accuracy target).

100% SYNTHETIC DATA - No real PII, deterministic seed (42).
"""

import numpy as np
import pandas as pd

np.random.seed(42)


def generate_synthetic_agrarian_data(n_samples=1000):
    """Generate synthetic agrarian BNPL applicant rows with ground truth labels.

    Args:
        n_samples: Number of synthetic applicants to generate (default 1000)

    Returns:
        pandas.DataFrame with synthetic farmer profiles and true_preferred_product labels
    """

    data = {}

    # User IDs (clearly marked as SYNTHETIC)
    data['user_id'] = [f"SYNTHETIC_{i:04d}" for i in range(1, n_samples + 1)]

    # Region (correlated with risk - West/South higher default rates)
    regions = ['North', 'South', 'East', 'West', 'Central']
    region_weights = [0.25, 0.20, 0.25, 0.15, 0.15]
    data['region'] = np.random.choice(regions, n_samples, p=region_weights)

    # Farm type (correlated with size and income)
    farm_types = ['smallholder', 'commercial', 'cooperative']
    farm_type_probs = [0.60, 0.25, 0.15]
    data['farm_type'] = np.random.choice(farm_types, n_samples, p=farm_type_probs)

    # Crop type (determines product match)
    crop_types = ['maize', 'rice', 'vegetables', 'livestock', 'mixed', 'horticulture']
    data['crop_type'] = np.random.choice(crop_types, n_samples)

    # Farm size in hectares (log-normal distribution, farm_type dependent)
    base_size = np.random.lognormal(mean=2.0, sigma=1.5, size=n_samples)
    size_multiplier = np.where(data['farm_type'] == 'smallholder', 0.3,
                               np.where(data['farm_type'] == 'commercial', 3.0, 1.5))
    data['farm_size_ha'] = np.clip(base_size * size_multiplier, 0.5, 500.0)

    # Years farming experience (0-40, gamma distribution)
    data['years_experience'] = np.clip(
        np.random.gamma(shape=3, scale=4, size=n_samples).astype(int), 0, 40
    )

    # Monthly income estimate (correlated with farm_size and experience)
    base_income = 5000 + data['farm_size_ha'] * 800 + data['years_experience'] * 500
    income_noise = np.random.lognormal(mean=0, sigma=0.4, size=n_samples)
    data['monthly_income_est'] = np.clip(base_income * income_noise, 5000, 500000)

    # Recent cash inflows in last 90 days (0-3x monthly income)
    cash_multiplier = np.random.beta(a=2, b=3, size=n_samples) * 3
    data['recent_cash_inflows'] = np.clip(
        data['monthly_income_est'] * cash_multiplier, 0, 1000000
    )

    # Average order value from historical purchases
    base_order = 1000 + data['farm_size_ha'] * 200
    order_noise = np.random.lognormal(mean=0, sigma=0.5, size=n_samples)
    data['avg_order_value'] = np.clip(base_order * order_noise, 1000, 200000)

    # Device trust score (0-100, right-skewed towards high trust)
    data['device_trust_score'] = np.clip(
        np.random.beta(a=6, b=2, size=n_samples) * 100, 0, 100
    )

    # Identity consistency score (0-100, similar distribution)
    data['identity_consistency'] = np.clip(
        np.random.beta(a=7, b=2, size=n_samples) * 100, 0, 100
    )

    # Prior payment defaults (0-5, heavily skewed to 0)
    default_prob = np.random.beta(a=1, b=9, size=n_samples)
    data['prior_defaults'] = np.clip(
        np.random.poisson(lam=default_prob * 2, size=n_samples), 0, 5
    )

    # Liquidity ratio (calculated feature)
    data['liquidity_ratio'] = data['recent_cash_inflows'] / data['monthly_income_est']

    # Generate true_preferred_product labels (GROUND TRUTH for product matching)
    # This logic MUST match product_matcher.py for ≥85% accuracy
    products = []
    for i in range(n_samples):
        crop = data['crop_type'][i]
        aov = data['avg_order_value'][i]
        farm = data['farm_type'][i]
        trust = data['device_trust_score'][i]

        # Rule-based labeling (deterministic, matches product_matcher.py priority)
        if crop in ['maize', 'rice'] and aov < 30000:
            product = 'Seeds_BNPL'
        elif crop in ['vegetables', 'horticulture'] and aov < 50000:
            product = 'Fertilizer_BNPL'
        elif farm == 'commercial' and aov > 80000:
            product = 'Equipment_Lease'
        elif crop == 'mixed' or (farm == 'cooperative' and trust > 60):
            product = 'Input_Bundle'
        elif aov < 15000 and trust > 70:
            product = 'Cash_Advance'
        else:
            product = 'Premium_BNPL'

        products.append(product)

    data['true_preferred_product'] = products

    df = pd.DataFrame(data)
    return df


if __name__ == "__main__":
    # Generate and save synthetic dataset
    df = generate_synthetic_agrarian_data(1000)
    output_file = 'synthetic_agrarian_bnpl_data.csv'
    df.to_csv(output_file, index=False)

    print(f"✓ Generated {len(df)} synthetic rows")
    print(f"✓ Saved to: {output_file}")
    print(f"\nSchema:")
    print(df.dtypes)
    print(f"\nFirst 3 rows:")
    print(df.head(3))
    print(f"\nProduct distribution:")
    print(df['true_preferred_product'].value_counts())
    print(f"\nRisk indicators summary:")
    print(df[['farm_size_ha', 'years_experience', 'monthly_income_est',
              'device_trust_score', 'prior_defaults']].describe())
