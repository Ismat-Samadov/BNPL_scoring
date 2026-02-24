'use client';

import { motion } from 'framer-motion';
import { ClipboardList, Cpu, CheckCircle2 } from 'lucide-react';

const STEPS = [
  {
    icon: ClipboardList,
    step: '01',
    title: 'Submit Profile',
    description: 'Enter farmer details across 3 quick steps — identity, farm info, and financial signals.',
    color: '#6366f1',
  },
  {
    icon: Cpu,
    step: '02',
    title: 'Engine Scores',
    description: 'Our 8-factor weighted model computes a risk score, maps to late-payment probability via sigmoid.',
    color: '#10b981',
  },
  {
    icon: CheckCircle2,
    step: '03',
    title: 'Get Decision',
    description: 'Receive instant approval, manual review flag, or decline — with full BNPL terms and product match.',
    color: '#f59e0b',
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-[#6366f1]/5 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How It <span className="gradient-text">Works</span>
          </h2>
        </motion.div>

        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-1/2 top-16 hidden h-[calc(100%-80px)] w-px -translate-x-1/2 bg-gradient-to-b from-[#6366f1] via-[#10b981] to-[#f59e0b] opacity-30 md:block" />

          <div className="flex flex-col gap-10 md:gap-16">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className={`flex items-center gap-8 ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
              >
                {/* Card */}
                <div className="flex-1 rounded-2xl border border-border/60 bg-card p-6">
                  <div className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: step.color }}>
                    Step {step.step}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </div>

                {/* Icon bubble (center) */}
                <div
                  className="relative z-10 hidden h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 md:flex"
                  style={{ borderColor: step.color, background: `${step.color}15` }}
                >
                  <step.icon className="h-6 w-6" style={{ color: step.color }} />
                </div>

                {/* Spacer */}
                <div className="hidden flex-1 md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
