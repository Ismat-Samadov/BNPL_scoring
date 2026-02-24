'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

const STATS = [
  { label: 'Approval Rate', value: 99.9, suffix: '%', prefix: '' },
  { label: 'Auto-Decisions', value: 67, suffix: '%', prefix: '' },
  { label: 'Risk Factors', value: 8, suffix: '', prefix: '' },
  { label: 'Avg Decision Time', value: 0.3, suffix: 's', prefix: '<' },
];

function Counter({ target, suffix, prefix }: { target: number; suffix: string; prefix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 1200;
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current = Math.min(current + increment, target);
      setCount(current);
      if (current >= target) clearInterval(interval);
    }, duration / steps);
    return () => clearInterval(interval);
  }, [inView, target]);

  const display = target < 1 ? count.toFixed(1) : Math.round(count).toString();

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{display}{suffix}
    </span>
  );
}

export default function StatsBar() {
  return (
    <section className="border-y border-border/40 bg-[#6366f1]/5 py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="flex flex-col items-center gap-1 text-center"
            >
              <span className="text-3xl font-extrabold text-[#6366f1] sm:text-4xl">
                <Counter target={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
              </span>
              <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
