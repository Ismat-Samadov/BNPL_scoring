/**
 * Canvas rendering utilities for Duck Hunt.
 * All drawing is done here — no inline styles in React components.
 */

import {
  Duck,
  Explosion,
  ScorePopup,
  Cloud,
  Star,
  MuzzleFlash,
  RoundBanner,
} from '@/types/game';
import { DUCK_COLORS, GROUND_HEIGHT } from './constants';

// ─── Background ─────────────────────────────────────────────────────────────

export function drawSky(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
) {
  const grad = ctx.createLinearGradient(0, 0, 0, h - GROUND_HEIGHT);
  grad.addColorStop(0,   '#050010');
  grad.addColorStop(0.5, '#0a0028');
  grad.addColorStop(1,   '#120040');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h - GROUND_HEIGHT);

  // Subtle horizon glow
  const hGlow = ctx.createLinearGradient(0, h - GROUND_HEIGHT - 80, 0, h - GROUND_HEIGHT);
  hGlow.addColorStop(0, 'rgba(60,0,120,0)');
  hGlow.addColorStop(1, 'rgba(100,20,200,0.25)');
  ctx.fillStyle = hGlow;
  ctx.fillRect(0, h - GROUND_HEIGHT - 80, w, 80);
}

export function drawStars(
  ctx: CanvasRenderingContext2D,
  stars: Star[],
  frame: number
) {
  stars.forEach(star => {
    const twinkle = 0.5 + 0.5 * Math.sin(frame * star.twinkleSpeed + star.twinklePhase);
    ctx.save();
    ctx.globalAlpha = 0.4 + 0.6 * twinkle;
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 4 * twinkle;
    ctx.shadowColor = '#aaaaff';
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

export function drawClouds(
  ctx: CanvasRenderingContext2D,
  clouds: Cloud[]
) {
  clouds.forEach(cloud => {
    ctx.save();
    ctx.globalAlpha = cloud.opacity;
    ctx.fillStyle = 'rgba(180, 140, 255, 0.12)';
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(150, 100, 255, 0.3)';
    // Draw cloud as group of overlapping ellipses
    const cx = cloud.x + cloud.width / 2;
    const cy = cloud.y + cloud.height / 2;
    ctx.beginPath();
    ctx.ellipse(cx,            cy,            cloud.width * 0.5, cloud.height * 0.5, 0, 0, Math.PI * 2);
    ctx.ellipse(cx - cloud.width * 0.3, cy + cloud.height * 0.1, cloud.width * 0.35, cloud.height * 0.4, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + cloud.width * 0.3, cy + cloud.height * 0.1, cloud.width * 0.35, cloud.height * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

export function drawGround(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
) {
  const groundY = h - GROUND_HEIGHT;

  // Main ground fill
  const grad = ctx.createLinearGradient(0, groundY, 0, h);
  grad.addColorStop(0,   '#00ff55');
  grad.addColorStop(0.15,'#00cc44');
  grad.addColorStop(1,   '#004422');
  ctx.fillStyle = grad;
  ctx.fillRect(0, groundY, w, GROUND_HEIGHT);

  // Neon top edge glow
  ctx.save();
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 3;
  ctx.shadowBlur = 18;
  ctx.shadowColor = '#00ff88';
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(w, groundY);
  ctx.stroke();
  ctx.restore();

  // Grass blades (decorative)
  ctx.save();
  ctx.strokeStyle = '#00ff66';
  ctx.lineWidth = 2;
  ctx.shadowBlur = 8;
  ctx.shadowColor = '#00ff66';
  for (let x = 8; x < w; x += 16) {
    const h1 = 10 + Math.sin(x * 0.3) * 5;
    ctx.beginPath();
    ctx.moveTo(x, groundY);
    ctx.quadraticCurveTo(x + 4, groundY - h1, x + 8, groundY - h1 * 0.6);
    ctx.stroke();
  }
  ctx.restore();

  // Trees on sides
  drawTree(ctx, 40,  groundY, 50, 100, '#003300', '#00ff44');
  drawTree(ctx, 100, groundY, 35, 80,  '#002200', '#00dd33');
  drawTree(ctx, w - 55,  groundY, 50, 100, '#003300', '#00ff44');
  drawTree(ctx, w - 110, groundY, 38, 85,  '#002200', '#00dd33');
}

function drawTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  width: number,
  height: number,
  trunkColor: string,
  leafColor: string
) {
  // Trunk
  ctx.fillStyle = trunkColor;
  const trunkW = width * 0.18;
  ctx.fillRect(x - trunkW / 2, groundY - height * 0.35, trunkW, height * 0.35);

  // Leaves (triangle stack)
  ctx.save();
  ctx.fillStyle = leafColor;
  ctx.shadowBlur = 12;
  ctx.shadowColor = leafColor;
  const layers = 3;
  for (let i = 0; i < layers; i++) {
    const ly = groundY - height * 0.35 - (layers - i) * (height * 0.22);
    const lw = width * (0.5 + (layers - i) * 0.2);
    ctx.globalAlpha = 0.7 + i * 0.1;
    ctx.beginPath();
    ctx.moveTo(x, ly - height * 0.3);
    ctx.lineTo(x - lw / 2, ly);
    ctx.lineTo(x + lw / 2, ly);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// ─── Duck ───────────────────────────────────────────────────────────────────

export function drawDuck(ctx: CanvasRenderingContext2D, duck: Duck) {
  if (duck.state === 'gone') return;

  const colors = DUCK_COLORS[duck.type];
  const cx = duck.x + duck.width / 2;
  const cy = duck.y + duck.height / 2;

  ctx.save();
  ctx.globalAlpha = duck.opacity;
  ctx.translate(cx, cy);

  if (duck.state === 'falling') {
    ctx.rotate(duck.rotation);
  }

  // Flip horizontally if facing left
  if (!duck.facingRight) ctx.scale(-1, 1);

  // Glow / flash effect on hit
  if (duck.flashTimer > 0) {
    ctx.shadowBlur = 40;
    ctx.shadowColor = '#ffffff';
  } else {
    ctx.shadowBlur = 18;
    ctx.shadowColor = colors.glow;
  }

  const scale = duck.width / 52;
  ctx.scale(scale, scale);

  // ── Body
  ctx.fillStyle = duck.flashTimer > 0 ? '#ffffff' : colors.body;
  ctx.beginPath();
  ctx.ellipse(0, 5, 18, 11, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // ── Tail feathers
  ctx.beginPath();
  ctx.moveTo(-18, 2);
  ctx.lineTo(-28, -6);
  ctx.lineTo(-20, 2);
  ctx.lineTo(-26, 2);
  ctx.lineTo(-18, 10);
  ctx.closePath();
  ctx.fill();

  // ── Neck
  ctx.beginPath();
  ctx.ellipse(10, -4, 7, 9, 0.25, 0, Math.PI * 2);
  ctx.fill();

  // ── Head
  ctx.beginPath();
  ctx.arc(15, -10, 8, 0, Math.PI * 2);
  ctx.fill();

  // ── Beak
  ctx.fillStyle = '#FF8800';
  ctx.beginPath();
  ctx.moveTo(21, -10);
  ctx.lineTo(31, -8);
  ctx.lineTo(21, -6);
  ctx.closePath();
  ctx.fill();

  // ── Eye
  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath();
  ctx.arc(18, -12, 3, 0, Math.PI * 2);
  ctx.fill();
  // Eye shine
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(19, -13, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // ── Wing (animated)
  const wingY = Math.sin(duck.wingAngle) * 9;
  ctx.fillStyle = duck.flashTimer > 0 ? '#ffffff' : colors.wing;
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.quadraticCurveTo(4, -20 + wingY, 14, -10 + wingY / 2);
  ctx.quadraticCurveTo(8, 2, 0, 4);
  ctx.closePath();
  ctx.fill();

  // ── Wing tip accent
  ctx.fillStyle = duck.flashTimer > 0 ? '#ffffff' : colors.accent;
  ctx.globalAlpha = duck.opacity * 0.7;
  ctx.beginPath();
  ctx.moveTo(8, -16 + wingY);
  ctx.quadraticCurveTo(14, -20 + wingY, 16, -14 + wingY / 2);
  ctx.quadraticCurveTo(12, -10 + wingY / 2, 8, -12 + wingY);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// ─── Effects ────────────────────────────────────────────────────────────────

export function drawExplosion(ctx: CanvasRenderingContext2D, explosion: Explosion) {
  ctx.save();
  ctx.globalAlpha = explosion.opacity;

  // Outer ring
  ctx.strokeStyle = explosion.color;
  ctx.lineWidth = 3;
  ctx.shadowBlur = 20;
  ctx.shadowColor = explosion.color;
  ctx.beginPath();
  ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
  ctx.stroke();

  // Inner ring
  ctx.globalAlpha = explosion.opacity * 0.5;
  ctx.beginPath();
  ctx.arc(explosion.x, explosion.y, explosion.radius * 0.6, 0, Math.PI * 2);
  ctx.stroke();

  // Particles
  explosion.particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.opacity * explosion.opacity;
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  ctx.restore();
}

export function drawScorePopup(ctx: CanvasRenderingContext2D, popup: ScorePopup) {
  ctx.save();
  ctx.globalAlpha = popup.opacity;
  ctx.translate(popup.x, popup.y);
  ctx.scale(popup.scale, popup.scale);

  ctx.fillStyle = popup.color;
  ctx.shadowBlur = 15;
  ctx.shadowColor = popup.color;
  ctx.font = 'bold 22px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(popup.label, 0, 0);

  ctx.restore();
}

export function drawMuzzleFlash(ctx: CanvasRenderingContext2D, flash: MuzzleFlash) {
  ctx.save();
  ctx.globalAlpha = flash.opacity;

  // Outer glow
  const grad = ctx.createRadialGradient(flash.x, flash.y, 0, flash.x, flash.y, flash.radius * 2);
  grad.addColorStop(0,   'rgba(255,255,255,0.9)');
  grad.addColorStop(0.3, 'rgba(255,220,100,0.6)');
  grad.addColorStop(1,   'rgba(255,100,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(flash.x, flash.y, flash.radius * 2, 0, Math.PI * 2);
  ctx.fill();

  // Center bright dot
  ctx.fillStyle = '#ffffff';
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#ffff00';
  ctx.beginPath();
  ctx.arc(flash.x, flash.y, flash.radius * 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ─── Crosshair ──────────────────────────────────────────────────────────────

export function drawCrosshair(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ammo: number
) {
  const size = 18;
  const gap = 6;
  const color = ammo > 0 ? '#ff3366' : '#666666';

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.shadowBlur = 10;
  ctx.shadowColor = color;

  // Horizontal
  ctx.beginPath();
  ctx.moveTo(x - size - gap, y);
  ctx.lineTo(x - gap, y);
  ctx.moveTo(x + gap, y);
  ctx.lineTo(x + size + gap, y);
  ctx.stroke();

  // Vertical
  ctx.beginPath();
  ctx.moveTo(x, y - size - gap);
  ctx.lineTo(x, y - gap);
  ctx.moveTo(x, y + gap);
  ctx.lineTo(x, y + size + gap);
  ctx.stroke();

  // Center circle
  ctx.beginPath();
  ctx.arc(x, y, gap - 1, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

// ─── Round banner ───────────────────────────────────────────────────────────

export function drawRoundBanner(
  ctx: CanvasRenderingContext2D,
  banner: RoundBanner,
  w: number,
  h: number
) {
  ctx.save();
  ctx.globalAlpha = banner.opacity;

  const cx = w / 2;
  const cy = (h - GROUND_HEIGHT) / 2;

  // Glass panel background
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.strokeStyle = banner.color;
  ctx.lineWidth = 2;
  ctx.shadowBlur = 30;
  ctx.shadowColor = banner.color;

  const panelW = 420;
  const panelH = 110;
  roundRect(ctx, cx - panelW / 2, cy - panelH / 2, panelW, panelH, 12);
  ctx.fill();
  ctx.stroke();

  // Main text
  ctx.shadowBlur = 20;
  ctx.fillStyle = banner.color;
  ctx.font = `bold ${Math.round(42 * banner.scale)}px "Courier New", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(banner.text, cx, cy - 14);

  // Sub text
  ctx.fillStyle = '#cccccc';
  ctx.font = `${Math.round(18 * banner.scale)}px "Courier New", monospace`;
  ctx.fillText(banner.subText, cx, cy + 22);

  ctx.restore();
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
