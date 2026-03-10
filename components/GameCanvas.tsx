'use client';

/**
 * GameCanvas — owns the game loop, physics, spawning, hit detection, and rendering.
 * React state is kept minimal (only values that drive the HUD overlay).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Duck, DuckType, Explosion, ScorePopup, Cloud, Star,
  MuzzleFlash, RoundBanner, Particle, UIState,
} from '@/types/game';
import type { Difficulty, GamePhase } from '@/types/game';
import {
  DIFFICULTY_CONFIGS, DUCK_COLORS, DUCK_HEIGHT, DUCK_POINTS,
  DUCK_TYPE_WEIGHTS, DUCK_WIDTH, FALL_GRAVITY, GROUND_HEIGHT,
  INITIAL_LIVES, ROUND_END_DISPLAY_MS, ROUND_START_BANNER_MS,
  SPEED_SCALE_PER_ROUND, STAR_COUNT,
} from '@/utils/constants';
import {
  drawSky, drawStars, drawClouds, drawGround,
  drawDuck, drawExplosion, drawScorePopup,
  drawMuzzleFlash, drawCrosshair, drawRoundBanner,
} from '@/utils/renderer';

// ─── Internal mutable game state (stored in refs to avoid stale closures) ─

interface GameData {
  ducks:        Duck[];
  explosions:   Explosion[];
  scorePopups:  ScorePopup[];
  clouds:       Cloud[];
  stars:        Star[];
  muzzleFlash:  MuzzleFlash | null;
  roundBanner:  RoundBanner | null;

  // Timers / counters
  spawnTimer:     number;  // ms elapsed since last spawn
  ducksSpawned:   number;
  lastComboTime:  number;  // timestamp for combo timeout
  lastTimestamp:  number;
  frameCount:     number;

  // Gameplay state mirrored here for quick access in the loop
  score:          number;
  lives:          number;
  ammo:           number;
  round:          number;
  combo:          number;
  maxCombo:       number;
  ducksHit:       number;
  ducksEscaped:   number;
  timeLeft:       number | null;
  timeAccum:      number;
  gamePhase:      GamePhase;
  difficulty:     Difficulty;

  nextId:    number;
  mouseX:    number;
  mouseY:    number;
  mouseOnCanvas: boolean;
}

let _id = 0;
const uid = () => ++_id;

// ─── Helper: pick a weighted random duck type ─────────────────────────────

function pickDuckType(difficulty: Difficulty): DuckType {
  const weights = DUCK_TYPE_WEIGHTS[difficulty];
  const r = Math.random();
  let acc = 0;
  for (const [type, w] of Object.entries(weights)) {
    acc += w;
    if (r < acc) return type as DuckType;
  }
  return 'green';
}

// ─── Helper: spawn a single duck ─────────────────────────────────────────

function spawnDuck(gd: GameData, canvasW: number, canvasH: number): Duck {
  const cfg   = DIFFICULTY_CONFIGS[gd.difficulty];
  const speed = cfg.duckSpeed * (1 + (gd.round - 1) * SPEED_SCALE_PER_ROUND);
  const type  = pickDuckType(gd.difficulty);
  const fromLeft = Math.random() < 0.5;
  const groundY  = canvasH - GROUND_HEIGHT;

  // Spawn in the upper 3/4 of the sky area, not near the ground
  const y = 40 + Math.random() * (groundY * 0.65);
  const x = fromLeft ? -DUCK_WIDTH - 10 : canvasW + 10;
  const vx = fromLeft ? speed : -speed;
  const zigzag = Math.random() < cfg.zigzagProbability;

  return {
    id: uid(),
    x, y,
    vx,
    vy:       zigzag ? (Math.random() < 0.5 ? 1 : -1) * speed * 0.4 : 0,
    baseVy:   zigzag ? speed * 0.5 : 0,
    width:    DUCK_WIDTH,
    height:   DUCK_HEIGHT,
    state:    'flying',
    type,
    points:   DUCK_POINTS[type],
    animFrame: 0,
    animTimer: 0,
    wingAngle: Math.random() * Math.PI * 2,
    wingSpeed: 0.16 + Math.random() * 0.08,
    opacity:   1,
    rotation:  0,
    rotationSpeed: 0,
    facingRight: fromLeft,
    zigzag,
    zigzagTimer: 0,
    fallVy:    0,
    flashTimer: 0,
  };
}

// ─── Helper: create explosion ─────────────────────────────────────────────

function createExplosion(x: number, y: number, color: string): Explosion {
  const particles: Particle[] = Array.from({ length: 16 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 3;
    return {
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 2 + Math.random() * 3,
      color,
      opacity: 1,
      life: 0,
      maxLife: 30 + Math.random() * 20,
    };
  });

  return { id: uid(), x, y, radius: 0, maxRadius: 55, opacity: 1, color, particles };
}

// ─── Component ───────────────────────────────────────────────────────────

interface Props {
  initialDifficulty: Difficulty;
  onUIUpdate:  (state: Partial<UIState>) => void;
  onGameOver:  () => void;
  onPhaseChange: (phase: GamePhase) => void;
  audio: {
    playShot: () => void;
    playHit:  () => void;
    playMiss: () => void;
    playEscape: () => void;
    playCombo: (n: number) => void;
    playRoundStart: () => void;
    playGameOver: () => void;
    startMusic: () => void;
    stopMusic:  () => void;
  };
  isPaused: boolean;
}

export function GameCanvas({
  initialDifficulty,
  onUIUpdate,
  onGameOver,
  onPhaseChange,
  audio,
  isPaused,
}: Props) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const gdRef       = useRef<GameData | null>(null);
  const rafRef      = useRef<number>(0);
  const isPausedRef = useRef(isPaused);

  // Keep isPausedRef in sync without re-mounting the loop
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  // ── Initialize game data
  const initGameData = useCallback((difficulty: Difficulty, canvasW: number, canvasH: number): GameData => {
    const cfg = DIFFICULTY_CONFIGS[difficulty];

    // Generate static stars
    const stars: Star[] = Array.from({ length: STAR_COUNT }, () => ({
      x:            Math.random() * canvasW,
      y:            Math.random() * (canvasH - GROUND_HEIGHT - 20),
      radius:       0.5 + Math.random() * 1.5,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.02 + Math.random() * 0.04,
    }));

    // Generate clouds
    const clouds: Cloud[] = Array.from({ length: 5 }, (_, i) => ({
      x:       (canvasW / 5) * i + Math.random() * 80 - 40,
      y:       20 + Math.random() * (canvasH * 0.35),
      width:   90 + Math.random() * 80,
      height:  35 + Math.random() * 25,
      speed:   0.15 + Math.random() * 0.25,
      opacity: 0.4 + Math.random() * 0.4,
    }));

    const gd: GameData = {
      ducks: [], explosions: [], scorePopups: [],
      clouds, stars,
      muzzleFlash: null,
      roundBanner: {
        text: 'ROUND 1',
        subText: difficulty.toUpperCase() + ' MODE',
        opacity: 0,
        scale: 1,
        timer: 0,
        duration: ROUND_START_BANNER_MS,
        color: '#00ffaa',
      },

      spawnTimer:    0,
      ducksSpawned:  0,
      lastComboTime: 0,
      lastTimestamp: 0,
      frameCount:    0,

      score:        0,
      lives:        INITIAL_LIVES,
      ammo:         cfg.ammoPerRound,
      round:        1,
      combo:        0,
      maxCombo:     0,
      ducksHit:     0,
      ducksEscaped: 0,
      timeLeft:     cfg.timeLimit,
      timeAccum:    0,
      gamePhase:    'playing',
      difficulty,

      nextId: 0,
      mouseX: 0, mouseY: 0,
      mouseOnCanvas: false,
    };

    return gd;
  }, []);

  // ── Push UI state to parent
  const pushUI = useCallback((gd: GameData) => {
    onUIUpdate({
      score:        gd.score,
      lives:        gd.lives,
      ammo:         gd.ammo,
      round:        gd.round,
      combo:        gd.combo,
      maxCombo:     gd.maxCombo,
      ducksHit:     gd.ducksHit,
      ducksEscaped: gd.ducksEscaped,
      timeLeft:     gd.timeLeft,
      gamePhase:    gd.gamePhase,
      difficulty:   gd.difficulty,
    });
  }, [onUIUpdate]);

  // ── Handle shoot at (x,y) in canvas logical coords
  const handleShoot = useCallback((x: number, y: number) => {
    const gd = gdRef.current;
    if (!gd || gd.gamePhase !== 'playing' || isPausedRef.current) return;
    if (gd.ammo <= 0) return;

    gd.ammo--;
    audio.playShot();

    // Muzzle flash
    gd.muzzleFlash = { x, y, radius: 22, opacity: 1 };

    // Hit detection: check each duck (back to front, biggest first)
    let hit = false;
    for (let i = gd.ducks.length - 1; i >= 0; i--) {
      const d = gd.ducks[i];
      if (d.state !== 'flying') continue;

      // Shrink hitbox slightly for fairness
      const hbPad = 6;
      if (
        x >= d.x + hbPad && x <= d.x + d.width - hbPad &&
        y >= d.y + hbPad && y <= d.y + d.height - hbPad
      ) {
        // Hit!
        d.state = 'falling';
        d.fallVy = -3;
        d.rotationSpeed = (Math.random() < 0.5 ? 1 : -1) * (0.12 + Math.random() * 0.1);
        d.flashTimer = 8;

        // Combo
        const now = performance.now();
        if (now - gd.lastComboTime < 2000) {
          gd.combo++;
        } else {
          gd.combo = 1;
        }
        gd.lastComboTime = now;
        gd.maxCombo = Math.max(gd.maxCombo, gd.combo);

        const multiplier = gd.combo >= 7 ? 4 : gd.combo >= 5 ? 3 : gd.combo >= 3 ? 2 : 1;
        const pts = d.points * multiplier;
        gd.score += pts;
        gd.ducksHit++;

        audio.playHit();
        if (gd.combo >= 2) audio.playCombo(gd.combo);

        // Explosion
        const colors = DUCK_COLORS[d.type];
        gd.explosions.push(createExplosion(d.x + d.width / 2, d.y + d.height / 2, colors.body));

        // Score popup
        const label = multiplier > 1 ? `+${pts} x${multiplier}!` : `+${pts}`;
        const popColor = multiplier >= 3 ? '#ffd700' : multiplier === 2 ? '#00ffaa' : colors.body;
        gd.scorePopups.push({
          id: uid(),
          x: d.x + d.width / 2,
          y: d.y,
          value: pts,
          label,
          opacity: 1,
          vy: -1.8,
          scale: multiplier > 1 ? 1.3 : 1,
          color: popColor,
        });

        hit = true;
        break; // only hit one duck per shot
      }
    }

    if (!hit) {
      audio.playMiss();
    }

    pushUI(gd);
  }, [audio, pushUI]);

  // ── Advance to next round
  const nextRound = useCallback((gd: GameData, canvasW: number, canvasH: number) => {
    const cfg = DIFFICULTY_CONFIGS[gd.difficulty];
    gd.round++;
    gd.ammo         = cfg.ammoPerRound;
    gd.ducksSpawned = 0;
    gd.spawnTimer   = 0;
    gd.ducks        = gd.ducks.filter(d => d.state !== 'flying' && d.state !== 'escaped');
    gd.timeLeft     = cfg.timeLimit;
    gd.timeAccum    = 0;
    gd.gamePhase    = 'playing';

    // Show round banner
    gd.roundBanner = {
      text:     `ROUND ${gd.round}`,
      subText:  `${gd.ducksHit} DUCKS HIT`,
      opacity:  1,
      scale:    1.2,
      timer:    0,
      duration: ROUND_START_BANNER_MS,
      color:    '#00ffaa',
    };

    audio.playRoundStart();
    onPhaseChange('playing');
    pushUI(gd);
    void canvasW; void canvasH;
  }, [audio, onPhaseChange, pushUI]);

  // ── Game update function (called every frame)
  const update = useCallback((
    gd: GameData,
    dt: number,          // ms since last frame
    canvasW: number,
    canvasH: number,
    timestamp: number,
  ) => {
    if (gd.gamePhase !== 'playing' && gd.gamePhase !== 'roundEnd') return;

    const cfg      = DIFFICULTY_CONFIGS[gd.difficulty];
    const groundY  = canvasH - GROUND_HEIGHT;
    gd.frameCount++;

    // ── Timer
    if (gd.gamePhase === 'playing' && gd.timeLeft !== null) {
      gd.timeAccum += dt;
      if (gd.timeAccum >= 1000) {
        gd.timeAccum -= 1000;
        gd.timeLeft  = Math.max(0, gd.timeLeft - 1);
        if (gd.timeLeft === 0) {
          // Time's up — end round
          endRound(gd, canvasW, canvasH);
          return;
        }
      }
    }

    // ── Spawn ducks
    if (gd.gamePhase === 'playing' && gd.ducksSpawned < cfg.ducksPerRound + (gd.round - 1)) {
      gd.spawnTimer += dt;
      if (gd.spawnTimer >= cfg.spawnInterval) {
        gd.spawnTimer = 0;
        gd.ducks.push(spawnDuck(gd, canvasW, canvasH));
        gd.ducksSpawned++;
      }
    }

    // ── Update clouds
    gd.clouds.forEach(c => {
      c.x += c.speed;
      if (c.x > canvasW + c.width) c.x = -c.width;
    });

    // ── Update ducks
    const toRemove: number[] = [];
    gd.ducks.forEach((d, i) => {
      if (d.state === 'gone') { toRemove.push(i); return; }

      // Flash timer
      if (d.flashTimer > 0) d.flashTimer--;

      if (d.state === 'flying') {
        // Move
        d.x += d.vx;
        d.wingAngle += d.wingSpeed;

        // Zigzag
        if (d.zigzag) {
          d.zigzagTimer += 0.04;
          d.y += Math.sin(d.zigzagTimer) * d.baseVy * 0.3;
        }

        // Keep duck in vertical bounds (between top and ground)
        if (d.y < 20) d.y = 20;
        if (d.y + d.height > groundY - 10) d.y = groundY - d.height - 10;

        // Escape detection
        if (d.x > canvasW + 60 || d.x < -d.width - 60) {
          d.state = 'escaped';
          d.opacity = 0;
          gd.lives--;
          gd.ducksEscaped++;
          audio.playEscape();

          // Escaped popup
          const ex = d.x > canvasW / 2 ? canvasW - 80 : 80;
          gd.scorePopups.push({
            id: uid(),
            x: ex, y: groundY - 40,
            value: 0, label: 'ESCAPED!',
            opacity: 1, vy: -1.2, scale: 1, color: '#ff4444',
          });

          if (gd.lives <= 0) {
            triggerGameOver(gd);
          }
          toRemove.push(i);
          pushUI(gd);
          return;
        }
      }

      if (d.state === 'falling') {
        d.fallVy += FALL_GRAVITY;
        d.y += d.fallVy;
        d.rotation += d.rotationSpeed;
        d.wingAngle += 0.05;

        // Fade as it nears the bottom
        if (d.y > groundY - 80) {
          d.opacity -= 0.06;
        }

        if (d.y > groundY + 30 || d.opacity <= 0) {
          d.state = 'gone';
          toRemove.push(i);
        }
      }
    });

    // Remove dead/escaped ducks (iterate in reverse to preserve indices)
    for (let i = toRemove.length - 1; i >= 0; i--) {
      gd.ducks.splice(toRemove[i], 1);
    }

    // ── Update explosions
    gd.explosions = gd.explosions.filter(e => e.opacity > 0.01);
    gd.explosions.forEach(e => {
      e.radius  += (e.maxRadius - e.radius) * 0.15;
      e.opacity -= 0.045;
      e.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.life++;
        p.opacity = 1 - p.life / p.maxLife;
      });
      e.particles = e.particles.filter(p => p.opacity > 0);
    });

    // ── Update score popups
    gd.scorePopups = gd.scorePopups.filter(s => s.opacity > 0.01);
    gd.scorePopups.forEach(s => {
      s.y  += s.vy;
      s.vy *= 0.95;
      s.opacity -= 0.022;
      if (s.scale > 1) s.scale = Math.max(1, s.scale - 0.03);
    });

    // ── Update muzzle flash
    if (gd.muzzleFlash) {
      gd.muzzleFlash.opacity -= 0.18;
      if (gd.muzzleFlash.opacity <= 0) gd.muzzleFlash = null;
    }

    // ── Update round banner
    if (gd.roundBanner) {
      gd.roundBanner.timer += dt;
      if (gd.roundBanner.timer < 200) {
        gd.roundBanner.opacity = gd.roundBanner.timer / 200;
      } else if (gd.roundBanner.timer > gd.roundBanner.duration - 300) {
        gd.roundBanner.opacity = Math.max(0, (gd.roundBanner.duration - gd.roundBanner.timer) / 300);
      } else {
        gd.roundBanner.opacity = 1;
      }
      gd.roundBanner.scale = 1 + Math.sin(gd.roundBanner.timer * 0.003) * 0.03;
      if (gd.roundBanner.timer >= gd.roundBanner.duration) {
        gd.roundBanner = null;
      }
    }

    // ── Check round completion
    if (gd.gamePhase === 'playing') {
      const allSpawned  = gd.ducksSpawned >= cfg.ducksPerRound + (gd.round - 1);
      const noneFlying  = gd.ducks.every(d => d.state !== 'flying');
      const outOfAmmo   = gd.ammo <= 0;

      if (allSpawned && (noneFlying || outOfAmmo)) {
        endRound(gd, canvasW, canvasH);
      }
    }

    // ── roundEnd timer
    if (gd.gamePhase === 'roundEnd') {
      gd.spawnTimer += dt;
      if (gd.spawnTimer >= ROUND_END_DISPLAY_MS) {
        nextRound(gd, canvasW, canvasH);
      }
    }

    void timestamp;
  }, [audio, pushUI, nextRound]);

  function endRound(gd: GameData, canvasW: number, canvasH: number) {
    if (gd.gamePhase === 'roundEnd') return;
    gd.gamePhase    = 'roundEnd';
    gd.spawnTimer   = 0;

    // Kill all remaining flying ducks
    gd.ducks.forEach(d => { if (d.state === 'flying') d.state = 'escaped'; });
    gd.ducks = gd.ducks.filter(d => d.state !== 'escaped');

    const pct = gd.ducksSpawned > 0
      ? Math.round((gd.ducksHit / Math.max(gd.ducksSpawned, 1)) * 100)
      : 0;

    gd.roundBanner = {
      text:     'ROUND CLEAR',
      subText:  `${pct}% accuracy · Score: ${gd.score}`,
      opacity:  0,
      scale:    1.2,
      timer:    0,
      duration: ROUND_END_DISPLAY_MS,
      color:    '#ffd700',
    };

    onPhaseChange('roundEnd');
    pushUI(gd);
    void canvasW; void canvasH;
  }

  function triggerGameOver(gd: GameData) {
    gd.gamePhase = 'gameOver';
    gd.roundBanner = {
      text:     'GAME OVER',
      subText:  `Final Score: ${gd.score}`,
      opacity:  0,
      scale:    1.5,
      timer:    0,
      duration: 3000,
      color:    '#ff4444',
    };
    audio.playGameOver();
    onPhaseChange('gameOver');
    pushUI(gd);

    // Trigger parent callback after banner shows
    setTimeout(onGameOver, 2200);
  }

  // ── Render function
  const render = useCallback((
    ctx: CanvasRenderingContext2D,
    gd: GameData,
    canvasW: number,
    canvasH: number,
  ) => {
    ctx.clearRect(0, 0, canvasW, canvasH);

    drawSky(ctx, canvasW, canvasH);
    drawStars(ctx, gd.stars, gd.frameCount);
    drawClouds(ctx, gd.clouds);
    drawGround(ctx, canvasW, canvasH);

    gd.ducks.forEach(d => drawDuck(ctx, d));
    gd.explosions.forEach(e => drawExplosion(ctx, e));
    gd.scorePopups.forEach(s => drawScorePopup(ctx, s));
    if (gd.muzzleFlash) drawMuzzleFlash(ctx, gd.muzzleFlash);
    if (gd.roundBanner) drawRoundBanner(ctx, gd.roundBanner, canvasW, canvasH);

    // Crosshair (only when mouse is on canvas and game is active)
    if (gd.mouseOnCanvas && (gd.gamePhase === 'playing' || gd.gamePhase === 'roundEnd')) {
      drawCrosshair(ctx, gd.mouseX, gd.mouseY, gd.ammo);
    }
  }, []);

  // ── Main effect: set up canvas + game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ── Resize handler
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width  = rect.width  * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const logicalW = () => canvas.getBoundingClientRect().width;
    const logicalH = () => canvas.getBoundingClientRect().height;

    // Init game data
    gdRef.current = initGameData(initialDifficulty, logicalW(), logicalH());
    const gd = gdRef.current;

    audio.startMusic();
    audio.playRoundStart();
    pushUI(gd);

    // Fade in the round banner
    if (gd.roundBanner) gd.roundBanner.opacity = 0;

    // ── RAF loop
    let lastTs = 0;
    const loop = (ts: number) => {
      const gd = gdRef.current;
      if (!gd) return;

      const dt = lastTs === 0 ? 16 : Math.min(ts - lastTs, 100);
      lastTs = ts;

      if (!isPausedRef.current) {
        update(gd, dt, logicalW(), logicalH(), ts);
      }

      render(ctx, gd, logicalW(), logicalH());
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      audio.stopMusic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — runs once on mount

  // ── Pointer events (click to shoot)
  const toLogical = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const gd = gdRef.current;
    if (!gd) return;
    const { x, y } = toLogical(e);
    gd.mouseX = x;
    gd.mouseY = y;
    gd.mouseOnCanvas = true;
  }, [toLogical]);

  const handlePointerLeave = useCallback(() => {
    const gd = gdRef.current;
    if (gd) gd.mouseOnCanvas = false;
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== undefined && e.button !== 0) return; // left-click / touch only
    const { x, y } = toLogical(e);
    handleShoot(x, y);
  }, [toLogical, handleShoot]);

  // ── Context menu (right-click) suppressed on canvas
  const handleContextMenu = useCallback((e: React.MouseEvent) => e.preventDefault(), []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block cursor-none touch-none select-none"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onContextMenu={handleContextMenu}
    />
  );
}
