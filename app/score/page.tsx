import ScoreForm from '@/components/score/score-form';

export const metadata = { title: 'Score a Farmer — BNPLScore' };

export default function ScorePage() {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-7xl flex-col items-center justify-start px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          BNPL Risk <span className="gradient-text">Score</span>
        </h1>
        <p className="mt-3 text-muted-foreground">
          Complete 3 short steps to get an instant credit decision.
        </p>
      </div>
      <ScoreForm />
    </div>
  );
}
