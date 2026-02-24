'use client';

import { motion } from 'framer-motion';
import { Shield, Zap, BarChart2, Leaf, Lock, Globe } from 'lucide-react';

const FEATURES = [
  {
    icon: Shield,
    title: '8-Factor Risk Engine',
    description: 'Region, farm type, experience, defaults, liquidity, farm size, device trust, and identity — weighted and transparent.',
    color: 'text-[#6366f1]',
    bg: 'bg-[#6366f1]/10',
  },
  {
    icon: Zap,
    title: 'Instant Decisions',
    description: 'Sub-second scoring with auto-approve, manual review, or decline — no waiting, no manual bottlenecks.',
    color: 'text-[#10b981]',
    bg: 'bg-[#10b981]/10',
  },
  {
    icon: BarChart2,
    title: 'Full Explainability',
    description: 'Every decision comes with a ranked breakdown of risk contributors. No black boxes.',
    color: 'text-[#f59e0b]',
    bg: 'bg-[#f59e0b]/10',
  },
  {
    icon: Leaf,
    title: 'Crop-Cycle Tenors',
    description: 'Repayment schedules aligned with maize, rice, horticulture, and livestock harvest cycles.',
    color: 'text-[#10b981]',
    bg: 'bg-[#10b981]/10',
  },
  {
    icon: Lock,
    title: 'Risk-Adjusted Limits',
    description: 'Credit limits dynamically scaled by PD, income, tenure, and product type — sustainable DTI guaranteed.',
    color: 'text-[#6366f1]',
    bg: 'bg-[#6366f1]/10',
  },
  {
    icon: Globe,
    title: 'Multi-Region Coverage',
    description: 'North, South, East, West, and Central region risk calibration with cooperative and commercial tiers.',
    color: 'text-[#f59e0b]',
    bg: 'bg-[#f59e0b]/10',
  },
];

export default function FeaturesGrid() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything You Need for <span className="gradient-text">Agricultural Credit</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Built for the realities of smallholder and commercial farming.
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="group rounded-2xl border border-border/60 bg-card p-6 transition-all hover:border-[#6366f1]/40 hover:shadow-lg hover:shadow-[#6366f1]/5"
            >
              <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${f.bg}`}>
                <f.icon className={`h-5 w-5 ${f.color}`} />
              </div>
              <h3 className="mb-2 font-semibold">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
