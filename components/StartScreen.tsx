'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Difficulty } from '@/types/game';

interface Props {
  highScores: Record<Difficulty, number>;
  onStart: (difficulty: Difficulty) => void;
}

const DIFFICULTIES: { key: Difficulty; label: string; desc: string; color: string; glow: string }[] = [
  {
    key:   'easy',
    label: 'EASY',
    desc:  '3 ducks · 6 shots · Unlimited time',
    color: '#00ff88',
    glow:  'rgba(0,255,136,0.35)',
  },
  {
    key:   'medium',
    label: 'MEDIUM',
    desc:  '5 ducks · 5 shots · 60s timer',
    color: '#ffd700',
    glow:  'rgba(255,215,0,0.35)',
  },
  {
    key:   'hard',
    label: 'HARD',
    desc:  '7 ducks · 4 shots · 45s timer',
    color: '#ff4466',
    glow:  'rgba(255,68,102,0.35)',
  },
];

// Floating animated duck silhouette
function FloatingDuck({ x, y, delay, color }: { x: number; y: number; delay: number; color: string }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%` }}
      animate={{ y: [0, -18, 0], x: [0, 8, 0], rotate: [0, 3, -3, 0] }}
      transition={{ duration: 3 + delay * 0.5, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg width="56" height="44" viewBox="0 0 56 44" style={{ filter: `drop-shadow(0 0 8px ${color})` }}>
        <ellipse cx="20" cy="26" rx="16" ry="10" fill={color} opacity="0.7" />
        <circle cx="38" cy="16" r="10" fill={color} opacity="0.7" />
        <polygon points="46,15 56,17 46,19" fill="#ff8800" opacity="0.9" />
        <ellipse cx="22" cy="18" rx="9" ry="5" transform="rotate(-15 22 18)" fill={color} opacity="0.5" />
        <polygon points="4,22 -6,14 4,28" fill={color} opacity="0.6" />
        <circle cx="41" cy="13" r="3" fill="#1a1a2e" />
        <circle cx="42" cy="12" r="1.2" fill="white" />
      </svg>
    </motion.div>
  );
}

export function StartScreen({ highScores, onStart }: Props) {
  const [selected, setSelected] = useState<Difficulty>('medium');
  const [hovered, setHovered]   = useState<Difficulty | null>(null);

  const active = hovered ?? selected;

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-20 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #050010 0%, #0a0028 50%, #120040 100%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
    >
      {/* Background ducks */}
      <FloatingDuck x={5}  y={15} delay={0}   color="#00ff88" />
      <FloatingDuck x={80} y={10} delay={0.7} color="#00aaff" />
      <FloatingDuck x={88} y={55} delay={1.4} color="#ff4466" />
      <FloatingDuck x={3}  y={60} delay={0.4} color="#ffd700" />

      {/* Stars */}
      {Array.from({ length: 60 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width:  1 + Math.random() * 2,
            height: 1 + Math.random() * 2,
            left:   `${Math.random() * 100}%`,
            top:    `${Math.random() * 80}%`,
          }}
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 2 + Math.random() * 3, delay: Math.random() * 2, repeat: Infinity }}
        />
      ))}

      {/* Title */}
      <motion.div
        className="text-center mb-8 relative z-10"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, delay: 0.1 }}
      >
        {/* Duck icon */}
        <motion.div
          className="flex justify-center mb-4"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width="90" height="70" viewBox="0 0 90 70" style={{ filter: 'drop-shadow(0 0 16px #00ff88)' }}>
            <ellipse cx="32" cy="42" rx="25" ry="16" fill="#00ff88" />
            <circle cx="62" cy="26" r="16" fill="#00ff88" />
            <polygon points="75,24 90,27 75,30" fill="#ff8800" />
            <ellipse cx="36" cy="28" rx="14" ry="8" transform="rotate(-15 36 28)" fill="#00cc66" />
            <polygon points="8,36 -6,22 8,44" fill="#00ff88" />
            <circle cx="66" cy="21" r="4.5" fill="#1a1a2e" />
            <circle cx="67.5" cy="19.5" r="1.8" fill="white" />
          </svg>
        </motion.div>

        <h1
          className="text-5xl sm:text-6xl font-mono font-black tracking-tight"
          style={{
            color: '#00ff88',
            textShadow: '0 0 20px #00ff88, 0 0 40px rgba(0,255,136,0.5)',
          }}
        >
          DUCK HUNT
        </h1>
        <motion.p
          className="text-base font-mono mt-2 tracking-widest uppercase"
          style={{ color: '#00aaff88' }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Neon Edition
        </motion.p>
      </motion.div>

      {/* Difficulty selector */}
      <motion.div
        className="w-full max-w-sm px-4 space-y-3 relative z-10"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        <p className="text-center text-sm font-mono uppercase tracking-widest mb-4" style={{ color: '#ffffff44' }}>
          Select Difficulty
        </p>

        {DIFFICULTIES.map(({ key, label, desc, color, glow }) => {
          const isSelected = selected === key;
          return (
            <motion.button
              key={key}
              onClick={() => { setSelected(key); }}
              onMouseEnter={() => setHovered(key)}
              onMouseLeave={() => setHovered(null)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full rounded-2xl px-5 py-3.5 border text-left transition-all duration-200 outline-none"
              style={{
                background: isSelected ? `rgba(0,0,0,0.75)` : 'rgba(0,0,0,0.45)',
                borderColor: isSelected ? color : `${color}44`,
                boxShadow:   isSelected ? `0 0 20px ${glow}, inset 0 0 12px rgba(0,0,0,0.5)` : 'none',
              }}
              aria-pressed={isSelected}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div
                    className="text-lg font-mono font-bold"
                    style={{ color, textShadow: isSelected ? `0 0 8px ${color}` : 'none' }}
                  >
                    {label}
                  </div>
                  <div className="text-xs font-mono mt-0.5" style={{ color: `${color}88` }}>
                    {desc}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-xs font-mono" style={{ color: '#ffffff44' }}>BEST</div>
                  <div
                    className="text-base font-mono font-bold"
                    style={{ color: `${color}cc` }}
                  >
                    {highScores[key].toLocaleString()}
                  </div>
                </div>
              </div>
              {isSelected && (
                <motion.div
                  layoutId="selected-indicator"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                  style={{ background: color, boxShadow: `0 0 8px ${color}` }}
                />
              )}
            </motion.button>
          );
        })}
      </motion.div>

      {/* Start button */}
      <motion.div
        className="mt-8 relative z-10"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <motion.button
          onClick={() => onStart(selected)}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          animate={{
            boxShadow: [
              `0 0 20px ${DIFFICULTIES.find(d => d.key === active)?.glow}`,
              `0 0 40px ${DIFFICULTIES.find(d => d.key === active)?.glow}`,
              `0 0 20px ${DIFFICULTIES.find(d => d.key === active)?.glow}`,
            ],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="rounded-2xl px-12 py-4 text-xl font-mono font-black uppercase tracking-widest border-2 outline-none"
          style={{
            background:  `linear-gradient(135deg, rgba(0,0,0,0.8), rgba(0,0,0,0.6))`,
            borderColor: DIFFICULTIES.find(d => d.key === active)?.color,
            color:       DIFFICULTIES.find(d => d.key === active)?.color,
            textShadow:  `0 0 10px ${DIFFICULTIES.find(d => d.key === active)?.color}`,
          }}
        >
          START HUNT
        </motion.button>
      </motion.div>

      {/* Controls hint */}
      <motion.div
        className="mt-6 text-center px-4 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <p className="text-xs font-mono" style={{ color: '#ffffff33' }}>
          Click / Tap to shoot · P to pause · Esc to pause
        </p>
      </motion.div>
    </motion.div>
  );
}
