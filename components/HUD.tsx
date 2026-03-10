'use client';

/**
 * HUD — overlaid React UI on top of the canvas.
 * Shows score, lives, ammo, timer, round, and combo.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { UIState } from '@/types/game';

interface Props {
  ui: UIState;
  sfxEnabled:   boolean;
  musicEnabled: boolean;
  onToggleSfx:   () => void;
  onToggleMusic: () => void;
  onPause:       () => void;
}

// ── Life indicator (duck silhouette)
function LifeIcon({ alive }: { alive: boolean }) {
  return (
    <div className={`transition-all duration-300 ${alive ? 'opacity-100' : 'opacity-20'}`}>
      <svg width="28" height="22" viewBox="0 0 28 22" fill="none">
        {/* body */}
        <ellipse cx="10" cy="13" rx="8" ry="5" fill={alive ? '#00ff88' : '#444'} />
        {/* head */}
        <circle cx="19" cy="8" r="5" fill={alive ? '#00ff88' : '#444'} />
        {/* beak */}
        <polygon points="23,8 28,9 23,10" fill={alive ? '#ff8800' : '#666'} />
        {/* wing */}
        <ellipse cx="11" cy="9" rx="5" ry="3" transform="rotate(-20 11 9)" fill={alive ? '#00cc66' : '#333'} />
        {/* tail */}
        <polygon points="2,10 -4,5 2,13" fill={alive ? '#00ff88' : '#444'} />
      </svg>
    </div>
  );
}

// ── Ammo bullet icon
function AmmoIcon({ loaded }: { loaded: boolean }) {
  return (
    <div className={`transition-all duration-200 ${loaded ? 'opacity-100' : 'opacity-15'}`}>
      <svg width="10" height="24" viewBox="0 0 10 24">
        <rect x="2" y="8" width="6" height="14" rx="1" fill={loaded ? '#ffd700' : '#444'} />
        <polygon points="5,1 9,8 1,8" fill={loaded ? '#ffaa00' : '#333'} />
      </svg>
    </div>
  );
}

export function HUD({ ui, sfxEnabled, musicEnabled, onToggleSfx, onToggleMusic, onPause }: Props) {
  const { score, highScore, lives, ammo, round, combo, timeLeft, difficulty } = ui;

  const diffColor = difficulty === 'hard' ? '#ff4466' : difficulty === 'medium' ? '#ffd700' : '#00ff88';

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10">

      {/* ── Top bar ─────────────────────────────── */}
      <div className="flex items-start justify-between px-3 pt-3 gap-2">

        {/* Score */}
        <div className="pointer-events-none">
          <div
            className="backdrop-blur-sm rounded-xl px-4 py-2 border"
            style={{
              background: 'rgba(0,0,0,0.55)',
              borderColor: 'rgba(0,255,136,0.4)',
              boxShadow: '0 0 12px rgba(0,255,136,0.2)',
            }}
          >
            <div className="text-xs font-mono uppercase tracking-widest" style={{ color: '#00ff88aa' }}>Score</div>
            <motion.div
              key={score}
              initial={{ scale: 1.3, color: '#00ffaa' }}
              animate={{ scale: 1, color: '#00ff88' }}
              transition={{ duration: 0.25 }}
              className="text-2xl font-mono font-bold"
              style={{ color: '#00ff88', textShadow: '0 0 10px #00ff88' }}
            >
              {score.toLocaleString()}
            </motion.div>
          </div>
        </div>

        {/* Center: High score + Round + Timer */}
        <div className="flex flex-col items-center gap-1 pointer-events-none">
          {/* High score */}
          <div
            className="backdrop-blur-sm rounded-xl px-4 py-1 border flex items-center gap-2"
            style={{
              background: 'rgba(0,0,0,0.55)',
              borderColor: 'rgba(0,170,255,0.35)',
              boxShadow: '0 0 10px rgba(0,170,255,0.15)',
            }}
          >
            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: '#00aaff88' }}>Best</span>
            <span className="text-base font-mono font-bold" style={{ color: '#00aaff', textShadow: '0 0 8px #00aaff' }}>
              {highScore.toLocaleString()}
            </span>
          </div>

          {/* Round indicator */}
          <div
            className="backdrop-blur-sm rounded-xl px-5 py-1 border"
            style={{
              background: 'rgba(0,0,0,0.55)',
              borderColor: `${diffColor}55`,
              boxShadow: `0 0 10px ${diffColor}22`,
            }}
          >
            <span className="text-sm font-mono font-bold tracking-widest" style={{ color: diffColor, textShadow: `0 0 8px ${diffColor}` }}>
              ROUND {round} · {difficulty.toUpperCase()}
            </span>
          </div>

          {/* Timer */}
          {timeLeft !== null && (
            <motion.div
              animate={{
                scale: timeLeft <= 10 ? [1, 1.05, 1] : 1,
              }}
              transition={{ duration: 0.5, repeat: timeLeft <= 10 ? Infinity : 0 }}
              className="backdrop-blur-sm rounded-xl px-4 py-1 border"
              style={{
                background: 'rgba(0,0,0,0.55)',
                borderColor: timeLeft <= 10 ? 'rgba(255,68,102,0.6)' : 'rgba(255,215,0,0.35)',
                boxShadow: timeLeft <= 10 ? '0 0 12px rgba(255,68,102,0.3)' : '0 0 8px rgba(255,215,0,0.15)',
              }}
            >
              <span
                className="text-lg font-mono font-bold"
                style={{
                  color:      timeLeft <= 10 ? '#ff4466' : '#ffd700',
                  textShadow: timeLeft <= 10 ? '0 0 10px #ff4466' : '0 0 8px #ffd700',
                }}
              >
                ⏱ {String(timeLeft).padStart(2, '0')}s
              </span>
            </motion.div>
          )}
        </div>

        {/* Right: Controls */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          {/* Pause button */}
          <button
            onClick={onPause}
            className="backdrop-blur-sm rounded-xl px-3 py-2 border transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'rgba(0,0,0,0.55)',
              borderColor: 'rgba(255,255,255,0.2)',
              color: '#ffffff',
            }}
            aria-label="Pause"
          >
            <span className="text-base">⏸</span>
          </button>

          {/* Sound toggles */}
          <div className="flex gap-1">
            <button
              onClick={onToggleSfx}
              className="backdrop-blur-sm rounded-lg px-2 py-1.5 border text-xs font-mono transition-all hover:scale-105 active:scale-95"
              style={{
                background: sfxEnabled ? 'rgba(0,255,136,0.15)' : 'rgba(0,0,0,0.55)',
                borderColor: sfxEnabled ? 'rgba(0,255,136,0.4)' : 'rgba(255,255,255,0.15)',
                color: sfxEnabled ? '#00ff88' : '#666',
              }}
              aria-label="Toggle SFX"
            >
              SFX
            </button>
            <button
              onClick={onToggleMusic}
              className="backdrop-blur-sm rounded-lg px-2 py-1.5 border text-xs font-mono transition-all hover:scale-105 active:scale-95"
              style={{
                background: musicEnabled ? 'rgba(0,170,255,0.15)' : 'rgba(0,0,0,0.55)',
                borderColor: musicEnabled ? 'rgba(0,170,255,0.4)' : 'rgba(255,255,255,0.15)',
                color: musicEnabled ? '#00aaff' : '#666',
              }}
              aria-label="Toggle Music"
            >
              ♪
            </button>
          </div>
        </div>
      </div>

      {/* ── Combo indicator ──────────────────────── */}
      <AnimatePresence>
        {combo >= 2 && (
          <motion.div
            key={combo}
            initial={{ scale: 0.5, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className="absolute top-24 left-1/2 -translate-x-1/2 pointer-events-none"
          >
            <div
              className="rounded-full px-6 py-2 font-mono font-bold text-xl border"
              style={{
                background: 'rgba(0,0,0,0.7)',
                borderColor: combo >= 5 ? '#ffd700' : combo >= 3 ? '#ff4466' : '#00ffaa',
                color:       combo >= 5 ? '#ffd700' : combo >= 3 ? '#ff4466' : '#00ffaa',
                textShadow:  `0 0 12px ${combo >= 5 ? '#ffd700' : combo >= 3 ? '#ff4466' : '#00ffaa'}`,
                boxShadow:   `0 0 20px ${combo >= 5 ? 'rgba(255,215,0,0.4)' : combo >= 3 ? 'rgba(255,68,102,0.3)' : 'rgba(0,255,170,0.25)'}`,
              }}
            >
              🔥 {combo}x COMBO
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom bar: Lives + Ammo ──────────────── */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-4 pb-3 pointer-events-none">

        {/* Lives */}
        <div
          className="backdrop-blur-sm rounded-xl px-3 py-2 border"
          style={{
            background: 'rgba(0,0,0,0.6)',
            borderColor: 'rgba(0,255,136,0.3)',
            boxShadow: '0 0 10px rgba(0,255,136,0.1)',
          }}
        >
          <div className="text-xs font-mono mb-1 uppercase tracking-wider" style={{ color: '#00ff8866' }}>Lives</div>
          <div className="flex gap-2">
            {Array.from({ length: 3 }, (_, i) => (
              <LifeIcon key={i} alive={i < lives} />
            ))}
          </div>
        </div>

        {/* Ammo */}
        <div
          className="backdrop-blur-sm rounded-xl px-3 py-2 border"
          style={{
            background: 'rgba(0,0,0,0.6)',
            borderColor: 'rgba(255,215,0,0.3)',
            boxShadow: '0 0 10px rgba(255,215,0,0.1)',
          }}
        >
          <div className="text-xs font-mono mb-1 uppercase tracking-wider text-right" style={{ color: '#ffd70066' }}>Ammo</div>
          <div className="flex gap-1.5 justify-end">
            {Array.from({ length: 6 }, (_, i) => (
              <AmmoIcon key={i} loaded={i < ammo} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
