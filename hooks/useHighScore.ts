'use client';

import { useCallback, useEffect, useState } from 'react';
import { Difficulty } from '@/types/game';

const STORAGE_KEY = 'duck-hunt-highscores';

type HighScores = Record<Difficulty, number>;

const DEFAULT_SCORES: HighScores = { easy: 0, medium: 0, hard: 0 };

export function useHighScore(difficulty: Difficulty) {
  const [scores, setScores] = useState<HighScores>(DEFAULT_SCORES);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setScores(JSON.parse(stored) as HighScores);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const submitScore = useCallback(
    (score: number) => {
      setScores(prev => {
        if (score <= prev[difficulty]) return prev;
        const next = { ...prev, [difficulty]: score };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore storage errors
        }
        return next;
      });
    },
    [difficulty]
  );

  return { highScore: scores[difficulty], submitScore };
}
