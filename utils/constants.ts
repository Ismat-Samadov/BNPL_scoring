import { Difficulty, GameConfig } from '@/types/game';

// Canvas logical dimensions (actual pixel size scales with DPR)
export const CANVAS_BASE_WIDTH = 800;
export const CANVAS_BASE_HEIGHT = 550;
export const GROUND_HEIGHT = 110; // grass strip at bottom

// Duck visual config
export const DUCK_WIDTH = 52;
export const DUCK_HEIGHT = 40;
export const DUCK_SPAWN_MARGIN = 80; // how far off-screen ducks spawn

export const DUCK_COLORS = {
  green:  { body: '#00ff88', wing: '#00cc55', accent: '#44ffaa', glow: 'rgba(0,255,136,0.6)' },
  blue:   { body: '#00ccff', wing: '#0088cc', accent: '#44ddff', glow: 'rgba(0,204,255,0.6)' },
  red:    { body: '#ff4466', wing: '#cc2244', accent: '#ff6688', glow: 'rgba(255,68,102,0.6)' },
  golden: { body: '#ffd700', wing: '#cc9900', accent: '#ffe555', glow: 'rgba(255,215,0,0.8)' },
};

export const DUCK_POINTS = {
  green:  50,
  blue:   100,
  red:    200,
  golden: 500,
};

// Probability weights for duck types per difficulty
export const DUCK_TYPE_WEIGHTS: Record<Difficulty, Record<string, number>> = {
  easy:   { green: 0.60, blue: 0.30, red: 0.10, golden: 0.04 },
  medium: { green: 0.40, blue: 0.35, red: 0.20, golden: 0.08 },
  hard:   { green: 0.20, blue: 0.35, red: 0.35, golden: 0.12 },
};

export const DIFFICULTY_CONFIGS: Record<Difficulty, GameConfig> = {
  easy: {
    ducksPerRound:    3,
    duckSpeed:        2.2,
    ammoPerRound:     6,
    timeLimit:        null,
    zigzagProbability: 0.15,
    goldenDuckChance:  0.04,
    spawnInterval:     1800,
  },
  medium: {
    ducksPerRound:    5,
    duckSpeed:        3.8,
    ammoPerRound:     5,
    timeLimit:        60,
    zigzagProbability: 0.40,
    goldenDuckChance:  0.08,
    spawnInterval:     1400,
  },
  hard: {
    ducksPerRound:    7,
    duckSpeed:        5.5,
    ammoPerRound:     4,
    timeLimit:        45,
    zigzagProbability: 0.70,
    goldenDuckChance:  0.12,
    spawnInterval:     1000,
  },
};

// Speed multiplier increase per round (applied to base speed)
export const SPEED_SCALE_PER_ROUND = 0.08; // 8% faster per round

// Lives
export const INITIAL_LIVES = 3;

// Combo system
export const COMBO_TIMEOUT_MS = 2000;
export const COMBO_THRESHOLDS = [3, 5, 7]; // hits needed for x2, x3, x4 multiplier

// Animation
export const WING_SPEED_BASE = 0.18; // radians per frame
export const FALL_GRAVITY = 0.45;
export const FALL_INITIAL_VY = -3;

// Timing
export const ROUND_END_DISPLAY_MS = 2500;
export const ROUND_START_BANNER_MS = 2000;

// Stars
export const STAR_COUNT = 80;
