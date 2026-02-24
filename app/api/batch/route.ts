import { NextRequest, NextResponse } from 'next/server';
import { scoreApplicant } from '@/lib/scoring-engine';
import { matchProduct } from '@/lib/product-matcher';
import { computeBnplTerms } from '@/lib/bnpl-policy';
import type { ApplicantProfile, FullRecommendation, BatchSummary } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const applicants: ApplicantProfile[] = await req.json();

    if (!Array.isArray(applicants)) {
      return NextResponse.json({ error: 'Expected an array of applicants' }, { status: 400 });
    }

    const results: FullRecommendation[] = applicants.map(row => {
      const score = scoreApplicant(row);
      const product = matchProduct(row);
      const bnplTerms = computeBnplTerms(row, product.top_1, score.late_payment_prob);
      return { score, product, bnpl_terms: bnplTerms };
    });

    const total = results.length;
    const approved = results.filter(r => r.score.decision === 'approve').length;
    const manualReview = results.filter(r => r.score.decision === 'manual_review').length;
    const declined = results.filter(r => r.score.decision === 'decline').length;
    const meanPd = results.reduce((s, r) => s + r.score.late_payment_prob, 0) / total;

    const summary: BatchSummary = {
      total,
      approved,
      manual_review: manualReview,
      declined,
      approval_rate: (approved + manualReview) / total,
      auto_approve_rate: approved / total,
      mean_pd: meanPd,
      results,
    };

    return NextResponse.json(summary);
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
