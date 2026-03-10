'use client';

import { motion } from 'framer-motion';
import { UIState, Difficulty } from '@/types/game';

interface Props {
  ui: UIState;
  isNewHighScore: boolean;
  onRestart: (difficulty: Difficulty) => void;
  onMenu:    () => void;
}

const statRow = (label: string, value: string | number, color: string) => (
  <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
    <span className="text-sm font-mono uppercase tracking-wider" style={{ color: '#ffffff55' }}>{label}</span>
    <span className="text-base font-mono font-bold" style={{ color, textShadow: `0 0 8px ${color}` }}>{value}</span>
  </div>
);

export function EndScreen({ ui, isNewHighScore, onRestart, onMenu }: Props) {
  const { score, highScore, round, ducksHit, ducksEscaped, maxCombo, difficulty } = ui;
  const accuracy = (ducksHit + ducksEscaped) > 0
    ? Math.round((ducksHit / (ducksHit + ducksEscaped)) * 100)
    : 0;

  const diffColor =
    difficulty === 'hard'   ? '#ff4466' :
    difficulty === 'medium' ? '#ffd700' : '#00ff88';

  const grade =
    accuracy >= 90 ? 'S' :
    accuracy >= 75 ? 'A' :
    accuracy >= 55 ? 'B' :
    accuracy >= 35 ? 'C' : 'D';

  const gradeColor =
    grade === 'S' ? '#ffd700' :
    grade === 'A' ? '#00ff88' :
    grade === 'B' ? '#00aaff' :
    grade === 'C' ? '#ff8800' : '#ff4466';

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-30 px-4"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="w-full max-w-md rounded-3xl border p-6 sm:p-8"
        style={{
          background: 'linear-gradient(135deg, rgba(10,0,30,0.95), rgba(5,0,20,0.98))',
          borderColor: 'rgba(255,255,255,0.1)',
          boxShadow:   '0 0 60px rgba(0,0,0,0.8), 0 0 30px rgba(255,68,102,0.15)',
        }}
        initial={{ scale: 0.7, y: 60 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
      >
        {/* Game Over title */}
        <motion.div
          className="text-center mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div
            className="text-4xl font-mono font-black tracking-tight"
            style={{ color: '#ff4466', textShadow: '0 0 20px #ff4466, 0 0 40px rgba(255,68,102,0.4)' }}
          >
            GAME OVER
          </div>
          <div className="text-sm font-mono mt-1 uppercase tracking-widest" style={{ color: diffColor }}>
            {difficulty} mode
          </div>
        </motion.div>

        {/* Grade */}
        <motion.div
          className="flex justify-center mb-6"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.4 }}
        >
          <div
            className="w-24 h-24 rounded-full border-4 flex items-center justify-center"
            style={{
              borderColor: gradeColor,
              boxShadow:   `0 0 30px ${gradeColor}55`,
              background:  `rgba(0,0,0,0.6)`,
            }}
          >
            <span
              className="text-5xl font-mono font-black"
              style={{ color: gradeColor, textShadow: `0 0 16px ${gradeColor}` }}
            >
              {grade}
            </span>
          </div>
        </motion.div>

        {/* New high score banner */}
        {isNewHighScore && (
          <motion.div
            className="text-center mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <div
              className="inline-block rounded-full px-5 py-1.5 text-sm font-mono font-bold uppercase tracking-widest border"
              style={{
                background:  'rgba(255,215,0,0.15)',
                borderColor: '#ffd700',
                color:        '#ffd700',
                textShadow:  '0 0 10px #ffd700',
                boxShadow:   '0 0 20px rgba(255,215,0,0.3)',
              }}
            >
              ★ NEW HIGH SCORE ★
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {statRow('Score',    score.toLocaleString(), '#00ff88')}
          {statRow('Best',     highScore.toLocaleString(), '#00aaff')}
          {statRow('Round',    round, diffColor)}
          {statRow('Ducks Hit', ducksHit, '#00ff88')}
          {statRow('Escaped',  ducksEscaped, '#ff4466')}
          {statRow('Accuracy', `${accuracy}%`, gradeColor)}
          {statRow('Max Combo', `${maxCombo}x`, '#ffd700')}
        </motion.div>

        {/* Buttons */}
        <motion.div
          className="flex gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
        >
          <motion.button
            onClick={() => onRestart(difficulty)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="flex-1 rounded-2xl py-3.5 font-mono font-bold text-base uppercase tracking-widest border-2 outline-none transition-all"
            style={{
              background:  'rgba(0,255,136,0.1)',
              borderColor: '#00ff88',
              color:        '#00ff88',
              textShadow:  '0 0 8px #00ff88',
              boxShadow:   '0 0 16px rgba(0,255,136,0.2)',
            }}
          >
            RETRY
          </motion.button>
          <motion.button
            onClick={onMenu}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="flex-1 rounded-2xl py-3.5 font-mono font-bold text-base uppercase tracking-widest border-2 outline-none transition-all"
            style={{
              background:  'rgba(0,170,255,0.1)',
              borderColor: '#00aaff',
              color:        '#00aaff',
              textShadow:  '0 0 8px #00aaff',
              boxShadow:   '0 0 16px rgba(0,170,255,0.2)',
            }}
          >
            MENU
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
