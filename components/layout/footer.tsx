import Link from 'next/link';
import { Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/80">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6366f1]">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold">
              <span className="text-[#6366f1]">BNPL</span>Score
            </span>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Agricultural BNPL Risk Scoring — Transparent, Auditable, Fair
          </p>
          <nav className="flex gap-4 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link href="/score" className="hover:text-foreground transition-colors">Score</Link>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
