'use client';

import { motion } from 'framer-motion';
import type { RiskComponent } from '@/lib/types';

interface Props {
  components: RiskComponent[];
}

const MAX_CONTRIBUTION = 0.15; // visual scale cap

export default function ContributorsChart({ components }: Props) {
  return (
    <div className="space-y-3">
      {components.map((c, i) => {
        const pct = Math.min((c.contribution / MAX_CONTRIBUTION) * 100, 100);
        const isHigh = c.contribution > 0.04;
        return (
          <div key={c.feature}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="font-medium">{c.label}</span>
              <span className="text-muted-foreground">
                {(c.contribution * 100).toFixed(2)}% (w={c.weight})
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-border/50">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: isHigh ? '#f59e0b' : '#6366f1' }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, delay: i * 0.07, ease: 'easeOut' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
