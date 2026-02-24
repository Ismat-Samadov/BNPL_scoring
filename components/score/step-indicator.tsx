'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const STEPS = ['Identity', 'Farm Info', 'Financial'];

export default function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {STEPS.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div key={label} className="flex flex-1 items-center">
              {/* Circle */}
              <div className="flex flex-col items-center">
                <motion.div
                  animate={{
                    backgroundColor: done ? '#10b981' : active ? '#6366f1' : 'transparent',
                    borderColor: done ? '#10b981' : active ? '#6366f1' : '#4b5563',
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2"
                >
                  {done ? (
                    <Check className="h-4 w-4 text-white" />
                  ) : (
                    <span className={`text-sm font-bold ${active ? 'text-white' : 'text-muted-foreground'}`}>
                      {i + 1}
                    </span>
                  )}
                </motion.div>
                <span className={`mt-1.5 text-xs font-medium ${active ? 'text-[#6366f1]' : done ? 'text-[#10b981]' : 'text-muted-foreground'}`}>
                  {label}
                </span>
              </div>

              {/* Connector */}
              {i < STEPS.length - 1 && (
                <div className="relative mx-2 h-0.5 flex-1 bg-border">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-[#10b981]"
                    animate={{ width: done ? '100%' : '0%' }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
