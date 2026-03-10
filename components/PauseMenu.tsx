'use client';

import { motion } from 'framer-motion';
import { Difficulty } from '@/types/game';

interface Props {
  difficulty: Difficulty;
  sfxEnabled:   boolean;
  musicEnabled: boolean;
  onResume:      () => void;
  onRestart:     () => void;
  onMenu:        () => void;
  onToggleSfx:   () => void;
  onToggleMusic: () => void;
}

export function PauseMenu({
  difficulty,
  sfxEnabled,
  musicEnabled,
  onResume,
  onRestart,
  onMenu,
  onToggleSfx,
  onToggleMusic,
}: Props) {
  const diffColor =
    difficulty === 'hard'   ? '#ff4466' :
    difficulty === 'medium' ? '#ffd700' : '#00ff88';

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-30 px-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="w-full max-w-xs rounded-3xl border p-7"
        style={{
          background: 'linear-gradient(135deg, rgba(10,0,30,0.96), rgba(5,0,20,0.98))',
          borderColor: `${diffColor}44`,
          boxShadow:   `0 0 40px rgba(0,0,0,0.8), 0 0 20px ${diffColor}22`,
        }}
        initial={{ scale: 0.8, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 30 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* Title */}
        <div className="text-center mb-7">
          <div
            className="text-3xl font-mono font-black tracking-tight"
            style={{ color: diffColor, textShadow: `0 0 16px ${diffColor}` }}
          >
            PAUSED
          </div>
        </div>

        {/* Sound toggles */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={onToggleSfx}
            className="flex-1 rounded-xl py-3 font-mono text-sm font-bold uppercase tracking-widest border transition-all"
            style={{
              background:  sfxEnabled ? 'rgba(0,255,136,0.12)' : 'rgba(0,0,0,0.4)',
              borderColor: sfxEnabled ? '#00ff88' : 'rgba(255,255,255,0.1)',
              color:        sfxEnabled ? '#00ff88' : '#555',
            }}
          >
            🔊 SFX {sfxEnabled ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={onToggleMusic}
            className="flex-1 rounded-xl py-3 font-mono text-sm font-bold uppercase tracking-widest border transition-all"
            style={{
              background:  musicEnabled ? 'rgba(0,170,255,0.12)' : 'rgba(0,0,0,0.4)',
              borderColor: musicEnabled ? '#00aaff' : 'rgba(255,255,255,0.1)',
              color:        musicEnabled ? '#00aaff' : '#555',
            }}
          >
            ♪ BGM {musicEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Nav buttons */}
        <div className="space-y-3">
          <motion.button
            onClick={onResume}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-full rounded-2xl py-3.5 font-mono font-bold text-base uppercase tracking-widest border-2 outline-none"
            style={{
              background:  `rgba(0,0,0,0.5)`,
              borderColor: diffColor,
              color:        diffColor,
              textShadow:  `0 0 8px ${diffColor}`,
              boxShadow:   `0 0 16px ${diffColor}22`,
            }}
          >
            ▶ RESUME
          </motion.button>

          <motion.button
            onClick={onRestart}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-full rounded-2xl py-3 font-mono font-bold text-sm uppercase tracking-widest border outline-none"
            style={{
              background:  'rgba(255,215,0,0.06)',
              borderColor: 'rgba(255,215,0,0.35)',
              color:        '#ffd70088',
            }}
          >
            ↺ RESTART
          </motion.button>

          <motion.button
            onClick={onMenu}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-full rounded-2xl py-3 font-mono font-bold text-sm uppercase tracking-widest border outline-none"
            style={{
              background:  'rgba(0,0,0,0.3)',
              borderColor: 'rgba(255,255,255,0.1)',
              color:        '#ffffff44',
            }}
          >
            ☰ MAIN MENU
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
