import { NextRequest, NextResponse } from 'next/server';
import { scoreApplicant } from '@/lib/scoring-engine';
import type { ApplicantProfile } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body: ApplicantProfile = await req.json();
    const result = scoreApplicant(body);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
