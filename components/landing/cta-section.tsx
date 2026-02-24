'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CtaSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#6366f1] to-[#4f46e5] p-10 text-center text-white sm:p-16"
        >
          {/* BG decoration */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-black/10" />

          <h2 className="relative text-3xl font-extrabold sm:text-4xl">
            Ready to Score Your First Farmer?
          </h2>
          <p className="relative mt-4 text-base text-white/80 sm:text-lg">
            3-step form. Instant result. Full risk explanation.
          </p>
          <div className="relative mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/score">
              <Button size="lg" className="gap-2 bg-white px-8 text-[#6366f1] hover:bg-white/90">
                Score a Farmer
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="gap-2 border-white/30 px-8 text-white hover:bg-white/10">
                View Analytics Dashboard
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
