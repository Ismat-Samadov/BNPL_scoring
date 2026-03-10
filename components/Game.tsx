'use client';

/**
 * Game — root component that orchestrates all screens and state.
 * Renders GameCanvas + overlay components based on game phase.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Difficulty, GamePhase, UIState } from '@/types/game';
import { DIFFICULTY_CONFIGS, INITIAL_LIVES } from '@/utils/constants';
import { useAudio } from '@/hooks/useAudio';
import { useHighScore } from '@/hooks/useHighScore';
import { GameCanvas } from './GameCanvas';
import { HUD } from './HUD';
import { StartScreen } from './StartScreen';
import { EndScreen } from './EndScreen';
import { PauseMenu } from './PauseMenu';

const DEFAULT_DIFFICULTY: Difficulty = 'medium';

function buildDefaultUI(difficulty: Difficulty): UIState {
  const cfg = DIFFICULTY_CONFIGS[difficulty];
  return {
    score:        0,
    highScore:    0,
    lives:        INITIAL_LIVES,
    ammo:         cfg.ammoPerRound,
    round:        1,
    combo:        0,
    maxCombo:     0,
    ducksHit:     0,
    ducksEscaped: 0,
    timeLeft:     cfg.timeLimit,
    gamePhase:    'start',
    difficulty,
  };
}

export function Game() {
  const [screen, setScreen] = useState<'start' | 'playing' | 'gameover'>('start');
  const [difficulty, setDifficulty]   = useState<Difficulty>(DEFAULT_DIFFICULTY);
  const [isPaused, setIsPaused]       = useState(false);
  const [gamePhase, setGamePhase]     = useState<GamePhase>('start');
  const [ui, setUI]                   = useState<UIState>(() => buildDefaultUI(DEFAULT_DIFFICULTY));
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  // Remount key forces GameCanvas to reinitialize when restarting
  const [mountKey, setMountKey] = useState(0);

  const audio = useAudio();
  const { highScore, submitScore } = useHighScore(difficulty);

  // Sync highScore from localStorage into UI state
  const uiWithHigh: UIState = { ...ui, highScore };

  // ── Callbacks passed to GameCanvas ──────────────────────────────────────

  const handleUIUpdate = useCallback((partial: Partial<UIState>) => {
    setUI(prev => ({ ...prev, ...partial }));
  }, []);

  const handlePhaseChange = useCallback((phase: GamePhase) => {
    setGamePhase(phase);
  }, []);

  const handleGameOver = useCallback(() => {
    setScreen('gameover');
    const isNew = ui.score > highScore && ui.score > 0;
    submitScore(ui.score);
    setIsNewHighScore(isNew);
    // Force update highScore display
    setUI(prev => ({ ...prev, highScore: Math.max(prev.highScore, prev.score) }));
  }, [ui.score, highScore, submitScore]);

  // ── User actions ────────────────────────────────────────────────────────

  const handleStart = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    setUI(buildDefaultUI(diff));
    setIsNewHighScore(false);
    setIsPaused(false);
    setGamePhase('playing');
    setScreen('playing');
    setMountKey(k => k + 1);
  }, []);

  const handlePause = useCallback(() => {
    setIsPaused(true);
    setGamePhase('paused');
  }, []);

  const handleResume = useCallback(() => {
    setIsPaused(false);
    setGamePhase('playing');
  }, []);

  const handleRestart = useCallback((diff?: Difficulty) => {
    const d = diff ?? difficulty;
    setDifficulty(d);
    setUI(buildDefaultUI(d));
    setIsNewHighScore(false);
    setIsPaused(false);
    setGamePhase('playing');
    setScreen('playing');
    setMountKey(k => k + 1);
  }, [difficulty]);

  const handleMenu = useCallback(() => {
    setScreen('start');
    setIsPaused(false);
    setGamePhase('start');
  }, []);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (screen !== 'playing') return;
        if (isPaused) handleResume();
        else handlePause();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, isPaused, handleResume, handlePause]);

  // ── High score scores for start screen ────────────────────────────────
  const [allHighScores] = useState<Record<Difficulty, number>>({ easy: 0, medium: 0, hard: 0 });

  // Read all high scores from localStorage once
  useEffect(() => {
    try {
      const raw = localStorage.getItem('duck-hunt-highscores');
      if (raw) {
        const parsed = JSON.parse(raw) as Record<Difficulty, number>;
        Object.assign(allHighScores, parsed);
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]); // refresh when returning to start screen

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: '#050010' }}>

      {/* ── Start screen ────────────────────────── */}
      <AnimatePresence>
        {screen === 'start' && (
          <StartScreen
            key="start"
            highScores={allHighScores}
            onStart={handleStart}
          />
        )}
      </AnimatePresence>

      {/* ── Game canvas (always mounted when playing) ── */}
      {screen === 'playing' && (
        <GameCanvas
          key={mountKey}
          initialDifficulty={difficulty}
          onUIUpdate={handleUIUpdate}
          onGameOver={handleGameOver}
          onPhaseChange={handlePhaseChange}
          audio={audio}
          isPaused={isPaused}
        />
      )}

      {/* ── HUD (only during gameplay) ─────────── */}
      {screen === 'playing' && !isPaused && (
        <HUD
          ui={uiWithHigh}
          sfxEnabled={audio.sfxEnabled}
          musicEnabled={audio.musicEnabled}
          onToggleSfx={audio.toggleSfx}
          onToggleMusic={audio.toggleMusic}
          onPause={handlePause}
        />
      )}

      {/* ── Pause menu ──────────────────────────── */}
      <AnimatePresence>
        {screen === 'playing' && isPaused && (
          <PauseMenu
            key="pause"
            difficulty={difficulty}
            sfxEnabled={audio.sfxEnabled}
            musicEnabled={audio.musicEnabled}
            onResume={handleResume}
            onRestart={handleRestart}
            onMenu={handleMenu}
            onToggleSfx={audio.toggleSfx}
            onToggleMusic={audio.toggleMusic}
          />
        )}
      </AnimatePresence>

      {/* ── Game over screen ────────────────────── */}
      <AnimatePresence>
        {screen === 'gameover' && (
          <EndScreen
            key="gameover"
            ui={uiWithHigh}
            isNewHighScore={isNewHighScore}
            onRestart={handleRestart}
            onMenu={handleMenu}
          />
        )}
      </AnimatePresence>

      {/* Background canvas shown on start/gameover screens */}
      {screen !== 'playing' && (
        <div className="absolute inset-0 -z-10 pointer-events-none">
          {/* Decorative neon grid lines */}
          <svg className="w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#00ff88" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      )}
    </div>
  );
}
