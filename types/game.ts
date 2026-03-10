// Core game types for Duck Hunt

export type GamePhase = 'start' | 'playing' | 'paused' | 'roundEnd' | 'gameOver';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type DuckState = 'flying' | 'hit' | 'falling' | 'escaped' | 'gone';
export type DuckType = 'green' | 'blue' | 'red' | 'golden';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Duck {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseVy: number; // zigzag amplitude
  width: number;
  height: number;
  state: DuckState;
  type: DuckType;
  points: number;
  animFrame: number;
  animTimer: number;
  wingAngle: number;
  wingSpeed: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  facingRight: boolean;
  zigzag: boolean;
  zigzagTimer: number;
  fallVy: number;
  flashTimer: number;
}

export interface Explosion {
  id: number;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  color: string;
  particles: Particle[];
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  opacity: number;
  life: number;
  maxLife: number;
}

export interface ScorePopup {
  id: number;
  x: number;
  y: number;
  value: number;
  label: string;
  opacity: number;
  vy: number;
  scale: number;
  color: string;
}

export interface MuzzleFlash {
  x: number;
  y: number;
  radius: number;
  opacity: number;
}

export interface Cloud {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  opacity: number;
}

export interface Star {
  x: number;
  y: number;
  radius: number;
  twinklePhase: number;
  twinkleSpeed: number;
}

export interface GameConfig {
  ducksPerRound: number;
  duckSpeed: number;
  ammoPerRound: number;
  timeLimit: number | null;
  zigzagProbability: number;
  goldenDuckChance: number;
  spawnInterval: number; // ms between duck spawns
}

export interface UIState {
  score: number;
  highScore: number;
  lives: number;
  ammo: number;
  round: number;
  combo: number;
  maxCombo: number;
  ducksHit: number;
  ducksEscaped: number;
  timeLeft: number | null;
  gamePhase: GamePhase;
  difficulty: Difficulty;
}

export interface RoundBanner {
  text: string;
  subText: string;
  opacity: number;
  scale: number;
  timer: number;
  duration: number;
  color: string;
}
