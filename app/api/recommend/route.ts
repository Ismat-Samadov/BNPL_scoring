import { NextRequest, NextResponse } from 'next/server';
import { scoreApplicant } from '@/lib/scoring-engine';
import { matchProduct } from '@/lib/product-matcher';
import { computeBnplTerms } from '@/lib/bnpl-policy';
import type { ApplicantProfile, FullRecommendation } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body: ApplicantProfile = await req.json();

    const score = scoreApplicant(body);
    const product = matchProduct(body);
    const bnplTerms = computeBnplTerms(body, product.top_1, score.late_payment_prob);

    const result: FullRecommendation = { score, product, bnpl_terms: bnplTerms };
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
