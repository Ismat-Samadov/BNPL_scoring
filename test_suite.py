# test_suite.py
"""Unit test suite for Agrarian BNPL risk scoring system.

Tests all core components: data generation, scoring, product matching,
BNPL policy calculations. Run with pytest for 80% coverage target.

Usage:
    pytest test_suite.py -v
    pytest test_suite.py -v --cov=. --cov-report=html
"""

import pytest
import numpy as np
import pandas as pd
from generator import generate_synthetic_agrarian_data
from scoring_engine import (compute_linear_risk_score, sigmoid_pd_mapping,
                            get_risk_tier, get_decision, explain_score)
from product_matcher import match_product, compute_product_match_accuracy, get_product_info
from bnpl_policy import compute_bnpl_limit, compute_bnpl_tenor, get_policy_explanation

np.random.seed(42)


# ===== Data Generator Tests =====

def test_synthetic_data_schema():
    """Validate synthetic data schema has all required columns."""
    df = generate_synthetic_agrarian_data(10)

    required_cols = [
        'user_id', 'region', 'farm_type', 'crop_type', 'farm_size_ha',
        'years_experience', 'monthly_income_est', 'recent_cash_inflows',
        'avg_order_value', 'device_trust_score', 'identity_consistency',
        'prior_defaults', 'liquidity_ratio', 'true_preferred_product'
    ]

    for col in required_cols:
        assert col in df.columns, f"Missing column: {col}"


def test_synthetic_data_ranges():
    """Ensure synthetic data values are within expected ranges."""
    df = generate_synthetic_agrarian_data(100)

    assert df['farm_size_ha'].between(0.5, 500).all()
    assert df['years_experience'].between(0, 40).all()
    assert df['monthly_income_est'].between(5000, 500000).all()
    assert df['device_trust_score'].between(0, 100).all()
    assert df['identity_consistency'].between(0, 100).all()
    assert df['prior_defaults'].between(0, 5).all()


def test_synthetic_user_ids():
    """Ensure all user IDs are marked SYNTHETIC."""
    df = generate_synthetic_agrarian_data(50)
    assert df['user_id'].str.startswith('SYNTHETIC_').all()


# ===== Scoring Engine Tests =====

def test_linear_score_range():
    """Ensure linear scores are in [0, 1]."""
    df = generate_synthetic_agrarian_data(100)

    for idx, row in df.iterrows():
        score = compute_linear_risk_score(row)
        assert 0 <= score <= 1, f"Linear score {score} out of bounds"


def test_pd_range():
    """Ensure PD (late payment probability) is in [0, 1]."""
    for score in np.linspace(0, 1, 50):
        pd = sigmoid_pd_mapping(score)
        assert 0 <= pd <= 1, f"PD {pd} out of bounds for score {score}"


def test_risk_tier_consistency():
    """Ensure risk tiers match PD ranges."""
    assert get_risk_tier(0.10) == 'Low'
    assert get_risk_tier(0.20) == 'Medium'
    assert get_risk_tier(0.40) == 'High'
    assert get_risk_tier(0.60) == 'Decline'


def test_decision_consistency():
    """Ensure decision logic matches risk tiers."""
    assert get_decision(0.10) == 'approve'
    assert get_decision(0.20) == 'manual_review'
    assert get_decision(0.40) == 'manual_review'
    assert get_decision(0.60) == 'decline'


def test_explain_score_completeness():
    """Ensure explanation contains all 8 components."""
    test_row = {
        'region': 'North',
        'farm_type': 'smallholder',
        'crop_type': 'maize',
        'farm_size_ha': 3.2,
        'years_experience': 8,
        'monthly_income_est': 42000,
        'recent_cash_inflows': 115000,
        'device_trust_score': 76.3,
        'identity_consistency': 83.2,
        'prior_defaults': 0,
        'liquidity_ratio': 115000 / 42000
    }

    score = compute_linear_risk_score(test_row)
    explanation = explain_score(test_row, score)

    assert 'all_components' in explanation
    assert len(explanation['all_components']) == 8
    assert 'top_3_contributors' in explanation
    assert len(explanation['top_3_contributors']) == 3


# ===== Product Matcher Tests =====

def test_product_match_deterministic():
    """Ensure product matching is deterministic (same input = same output)."""
    df = generate_synthetic_agrarian_data(50)

    for idx, row in df.iterrows():
        top1_a, top3_a = match_product(row)
        top1_b, top3_b = match_product(row)
        assert top1_a == top1_b, "Product match non-deterministic"
        assert top3_a == top3_b, "Top-3 match non-deterministic"


def test_product_match_accuracy_target():
    """Validate product match accuracy meets ≥85% target on synthetic data."""
    df = generate_synthetic_agrarian_data(1000)

    predictions = []
    for idx, row in df.iterrows():
        top_1, _ = match_product(row)
        predictions.append(top_1)

    accuracy = compute_product_match_accuracy(predictions, df['true_preferred_product'].tolist())

    # Should be ~95-100% on clean synthetic data (deterministic logic)
    assert accuracy >= 0.85, f"Product match accuracy {accuracy:.2%} < 85% target"
    print(f"  Product match accuracy: {accuracy:.2%}")


def test_product_info_coverage():
    """Ensure all products have metadata."""
    products = ['Seeds_BNPL', 'Fertilizer_BNPL', 'Equipment_Lease',
                'Input_Bundle', 'Cash_Advance', 'Premium_BNPL']

    for product in products:
        info = get_product_info(product)
        assert 'name' in info
        assert 'base_limit' in info
        assert 'base_tenor_months' in info


def test_top3_contains_top1():
    """Ensure top-1 product is always in top-3 list."""
    df = generate_synthetic_agrarian_data(100)

    for idx, row in df.iterrows():
        top_1, top_3 = match_product(row)
        assert top_1 in top_3, f"Top-1 {top_1} not in top-3 {top_3}"


# ===== BNPL Policy Tests =====

def test_bnpl_limit_decline_threshold():
    """Ensure BNPL limit is 0 when PD >= 0.50."""
    test_row = {
        'farm_type': 'smallholder',
        'years_experience': 5,
        'device_trust_score': 70,
        'monthly_income_est': 40000
    }

    limit = compute_bnpl_limit(test_row, 'Premium_BNPL', late_payment_prob=0.55)
    assert limit == 0, f"Expected limit=0 for PD=0.55, got {limit}"

    limit = compute_bnpl_limit(test_row, 'Premium_BNPL', late_payment_prob=0.50)
    assert limit == 0, f"Expected limit=0 for PD=0.50, got {limit}"


def test_bnpl_limit_positive_for_low_risk():
    """Ensure BNPL limit > 0 for low-risk applicants."""
    test_row = {
        'farm_type': 'commercial',
        'years_experience': 18,
        'device_trust_score': 92,
        'monthly_income_est': 250000
    }

    limit = compute_bnpl_limit(test_row, 'Equipment_Lease', late_payment_prob=0.08)
    assert limit > 0, f"Expected limit > 0 for PD=0.08, got {limit}"
    assert limit >= 100000, f"Expected high limit for commercial farmer, got {limit}"


def test_bnpl_tenor_decline_threshold():
    """Ensure BNPL tenor is 0 when PD >= 0.50."""
    test_row = {
        'crop_type': 'maize',
        'farm_type': 'smallholder',
        'years_experience': 5,
        'device_trust_score': 70
    }

    tenor = compute_bnpl_tenor(test_row, 'Seeds_BNPL', late_payment_prob=0.55)
    assert tenor == 0, f"Expected tenor=0 for PD=0.55, got {tenor}"


def test_bnpl_tenor_crop_alignment():
    """Ensure tenor aligns with crop cycles."""
    test_row_maize = {
        'crop_type': 'maize',
        'farm_type': 'smallholder',
        'years_experience': 10,
        'device_trust_score': 80
    }

    # Maize should cap at 4 months (harvest cycle)
    tenor = compute_bnpl_tenor(test_row_maize, 'Premium_BNPL', late_payment_prob=0.10)
    assert tenor <= 4, f"Maize crop tenor {tenor} exceeds 4-month cycle"

    test_row_horticulture = {
        'crop_type': 'horticulture',
        'farm_type': 'smallholder',
        'years_experience': 10,
        'device_trust_score': 80
    }

    # Horticulture should cap at 3 months
    tenor = compute_bnpl_tenor(test_row_horticulture, 'Premium_BNPL', late_payment_prob=0.10)
    assert tenor <= 3, f"Horticulture tenor {tenor} exceeds 3-month cycle"


def test_policy_explanation_structure():
    """Ensure policy explanation has required structure."""
    test_row = {
        'farm_type': 'smallholder',
        'years_experience': 8,
        'device_trust_score': 76,
        'monthly_income_est': 42000,
        'crop_type': 'maize'
    }

    limit = compute_bnpl_limit(test_row, 'Seeds_BNPL', late_payment_prob=0.15)
    tenor = compute_bnpl_tenor(test_row, 'Seeds_BNPL', late_payment_prob=0.15)

    explanation = get_policy_explanation(test_row, 'Seeds_BNPL', 0.15, limit, tenor)

    assert 'limit_breakdown' in explanation
    assert 'tenor_breakdown' in explanation
    assert 'decision_rationale' in explanation
    assert 'risk_multiplier' in explanation['limit_breakdown']
    assert 'income_multiplier' in explanation['limit_breakdown']


# ===== Integration Tests =====

def test_end_to_end_scoring_pipeline():
    """Test complete scoring pipeline for a single applicant."""
    applicant = {
        'user_id': 'TEST_INTEGRATION',
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

    # Step 1: Compute risk score
    linear_score = compute_linear_risk_score(applicant)
    assert 0 <= linear_score <= 1

    # Step 2: Map to PD
    late_prob = sigmoid_pd_mapping(linear_score)
    assert 0 <= late_prob <= 1

    # Step 3: Get risk tier and decision
    risk_tier = get_risk_tier(late_prob)
    decision = get_decision(late_prob)
    assert risk_tier in ['Low', 'Medium', 'High', 'Decline']
    assert decision in ['approve', 'manual_review', 'decline']

    # Step 4: Match product
    product, top_3 = match_product(applicant)
    assert product in ['Seeds_BNPL', 'Fertilizer_BNPL', 'Equipment_Lease',
                       'Input_Bundle', 'Cash_Advance', 'Premium_BNPL']
    assert len(top_3) <= 3

    # Step 5: Compute BNPL terms
    limit = compute_bnpl_limit(applicant, product, late_prob)
    tenor = compute_bnpl_tenor(applicant, product, late_prob)

    if late_prob < 0.50:
        assert limit > 0
        assert tenor > 0
    else:
        assert limit == 0
        assert tenor == 0

    print(f"\n  ✓ End-to-end test passed:")
    print(f"    Risk: {linear_score:.3f} → PD: {late_prob:.1%} → {risk_tier}")
    print(f"    Product: {product}, Limit: {limit:,}, Tenor: {tenor}mo")


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, '-v', '--tb=short'])
