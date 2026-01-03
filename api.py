# api.py
"""FastAPI REST API for Agrarian BNPL risk scoring and product recommendations.

Endpoints:
- POST /score: Compute risk score and late payment probability
- POST /recommend_product: Get product recommendation with BNPL terms
- POST /batch_score: Batch scoring for multiple applicants
- GET /health: Health check

Usage:
    uvicorn api:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict
from datetime import datetime
import time

from scoring_engine import (compute_linear_risk_score, sigmoid_pd_mapping,
                            get_risk_tier, get_decision, explain_score)
from product_matcher import match_product, get_product_info
from bnpl_policy import compute_bnpl_limit, compute_bnpl_tenor

# Initialize FastAPI app
app = FastAPI(
    title="Agrarian BNPL Risk Scoring API",
    description="Privacy-first API for BNPL risk assessment and product recommendations",
    version="1.0.0"
)

# Track startup time for health check
START_TIME = time.time()


# ===== Pydantic Models =====

class ApplicantProfile(BaseModel):
    """Applicant profile input schema."""
    user_id: str = Field(..., example="SYNTHETIC_0042")
    region: str = Field(..., example="North")
    farm_type: str = Field(..., example="smallholder")
    crop_type: str = Field(..., example="maize")
    farm_size_ha: float = Field(..., ge=0.5, le=500, example=3.5)
    years_experience: int = Field(..., ge=0, le=40, example=8)
    monthly_income_est: float = Field(..., ge=5000, le=500000, example=45000)
    recent_cash_inflows: float = Field(..., ge=0, le=1000000, example=120000)
    avg_order_value: float = Field(..., ge=1000, le=200000, example=18000)
    device_trust_score: float = Field(..., ge=0, le=100, example=78)
    identity_consistency: float = Field(..., ge=0, le=100, example=85)
    prior_defaults: int = Field(..., ge=0, le=5, example=0)

    @validator('region')
    def validate_region(cls, v):
        valid_regions = ['North', 'South', 'East', 'West', 'Central']
        if v not in valid_regions:
            raise ValueError(f"Region must be one of {valid_regions}")
        return v

    @validator('farm_type')
    def validate_farm_type(cls, v):
        valid_types = ['smallholder', 'commercial', 'cooperative']
        if v not in valid_types:
            raise ValueError(f"Farm type must be one of {valid_types}")
        return v

    @validator('crop_type')
    def validate_crop_type(cls, v):
        valid_crops = ['maize', 'rice', 'vegetables', 'livestock', 'mixed', 'horticulture']
        if v not in valid_crops:
            raise ValueError(f"Crop type must be one of {valid_crops}")
        return v


class ScoreResponse(BaseModel):
    """Risk score response schema."""
    user_id: str
    linear_risk_score: float
    late_payment_prob: float
    risk_tier: str
    decision: str
    explanation: Optional[Dict] = None
    timestamp: str


class ProductRecommendationResponse(BaseModel):
    """Product recommendation response schema."""
    user_id: str
    recommended_product: str
    top_3_products: List[str]
    bnpl_limit: int
    bnpl_tenor_months: int
    late_payment_prob: float
    risk_tier: str
    match_reason: Optional[str] = None
    timestamp: str


class BatchScoreRequest(BaseModel):
    """Batch scoring request schema."""
    applicants: List[ApplicantProfile]


class BatchScoreResponse(BaseModel):
    """Batch scoring response schema."""
    results: List[ProductRecommendationResponse]
    batch_summary: Dict


# ===== Helper Functions =====

def compute_liquidity_ratio(applicant: ApplicantProfile) -> float:
    """Compute liquidity ratio from applicant profile."""
    return applicant.recent_cash_inflows / applicant.monthly_income_est


def applicant_to_dict(applicant: ApplicantProfile) -> dict:
    """Convert Pydantic model to dict for scoring functions."""
    data = applicant.dict()
    data['liquidity_ratio'] = compute_liquidity_ratio(applicant)
    return data


# ===== API Endpoints =====

@app.post("/score", response_model=ScoreResponse)
async def score_applicant(applicant: ApplicantProfile):
    """Compute risk score and late payment probability for an applicant.

    Returns linear risk score, late payment probability, risk tier, decision,
    and top-3 rule contributions for explainability.
    """
    try:
        # Convert to dict with calculated features
        applicant_dict = applicant_to_dict(applicant)

        # Compute scores
        linear_score = compute_linear_risk_score(applicant_dict)
        late_prob = sigmoid_pd_mapping(linear_score)
        risk_tier = get_risk_tier(late_prob)
        decision = get_decision(late_prob)

        # Generate explanation
        explanation = explain_score(applicant_dict, linear_score)

        return ScoreResponse(
            user_id=applicant.user_id,
            linear_risk_score=round(linear_score, 3),
            late_payment_prob=round(late_prob, 3),
            risk_tier=risk_tier,
            decision=decision,
            explanation={
                'top_contributors': [
                    {
                        'feature': comp['feature'],
                        'contribution': round(comp['contribution'], 3),
                        'weight': comp['weight']
                    }
                    for comp in explanation['top_3_contributors']
                ]
            },
            timestamp=datetime.utcnow().isoformat() + 'Z'
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring error: {str(e)}")


@app.post("/recommend_product", response_model=ProductRecommendationResponse)
async def recommend_product(applicant: ApplicantProfile):
    """Recommend BNPL product with credit limit and tenor.

    Returns top-1 product recommendation, top-3 alternatives, risk-adjusted
    BNPL limit, and crop-cycle-aligned repayment tenor.
    """
    try:
        # Convert to dict
        applicant_dict = applicant_to_dict(applicant)

        # Compute risk score
        linear_score = compute_linear_risk_score(applicant_dict)
        late_prob = sigmoid_pd_mapping(linear_score)
        risk_tier = get_risk_tier(late_prob)

        # Match product
        top_1, top_3 = match_product(applicant_dict)

        # Compute BNPL terms
        bnpl_limit = compute_bnpl_limit(applicant_dict, top_1, late_prob)
        bnpl_tenor = compute_bnpl_tenor(applicant_dict, top_1, late_prob)

        # Generate match reason
        product_info = get_product_info(top_1)
        match_reason = f"{product_info['description']} - {applicant.crop_type} crop"

        return ProductRecommendationResponse(
            user_id=applicant.user_id,
            recommended_product=top_1,
            top_3_products=top_3,
            bnpl_limit=bnpl_limit,
            bnpl_tenor_months=bnpl_tenor,
            late_payment_prob=round(late_prob, 3),
            risk_tier=risk_tier,
            match_reason=match_reason,
            timestamp=datetime.utcnow().isoformat() + 'Z'
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation error: {str(e)}")


@app.post("/batch_score", response_model=BatchScoreResponse)
async def batch_score(request: BatchScoreRequest):
    """Batch scoring for multiple applicants.

    Processes multiple applicants in parallel and returns aggregated
    batch summary with approval/decline counts.
    """
    try:
        results = []
        approved_count = 0
        declined_count = 0
        manual_review_count = 0

        for applicant in request.applicants:
            # Reuse recommend_product logic
            response = await recommend_product(applicant)
            results.append(response)

            # Count by risk tier
            if response.risk_tier == 'Low':
                approved_count += 1
            elif response.risk_tier in ['Medium', 'High']:
                manual_review_count += 1
            else:
                declined_count += 1

        batch_summary = {
            'total_count': len(request.applicants),
            'approved_count': approved_count,
            'declined_count': declined_count,
            'manual_review_count': manual_review_count
        }

        return BatchScoreResponse(
            results=results,
            batch_summary=batch_summary
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch scoring error: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint.

    Returns service status, version, uptime, and component readiness.
    """
    uptime_seconds = int(time.time() - START_TIME)

    return {
        'status': 'healthy',
        'version': '1.0.0',
        'uptime_seconds': uptime_seconds,
        'checks': {
            'scoring_engine': 'ready',
            'product_matcher': 'ready',
            'bnpl_policy': 'ready'
        },
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    }


@app.get("/")
async def root():
    """Root endpoint with API documentation link."""
    return {
        'message': 'Agrarian BNPL Risk Scoring API',
        'version': '1.0.0',
        'documentation': '/docs',
        'health': '/health'
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
