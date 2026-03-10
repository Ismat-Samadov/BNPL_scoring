# 🦆 Duck Hunt — Neon Edition

A full-stack browser game built with **Next.js 16**, **TypeScript**, and **Tailwind CSS**. Shoot neon-glowing ducks across a retro dark sky in this arcade-style reimagining of the classic Duck Hunt.

![Duck Hunt Neon Edition](public/favicon.svg)

---

## ✨ Features

- **Retro-neon visual style** — dark purple sky, neon-green ground, glowing duck sprites drawn with Canvas 2D
- **3 difficulty modes** — Easy (3 ducks, 6 ammo), Medium (5 ducks, 5 ammo, 60s timer), Hard (7 ducks, 4 ammo, 45s timer)
- **Combo multiplier system** — chain kills within 2s for ×2 / ×3 / ×4 score multipliers
- **4 duck types** — Green (50pts), Blue (100pts), Red (200pts), Golden (500pts)
- **Infinite rounds** — difficulty scales each round (speed +8% per round, more ducks)
- **Lives system** — lose a life when a duck escapes; game over at 0 lives
- **Procedural sound effects** — gunshot, hit, escape, combo chimes via Web Audio API
- **Background music** — retro 8-bit melody (toggleable)
- **High score** — persisted per difficulty in `localStorage`
- **Pause / resume** — `P` or `Esc` key, or the ⏸ button
- **Particle explosions** — neon ring + scatter particles on hit
- **Muzzle flash** — visual shot feedback on every click/tap
- **Custom crosshair** — replaces cursor on the canvas; turns grey when out of ammo
- **Fully responsive** — fills any viewport; works on mobile (tap to shoot), tablet, and desktop
- **No horizontal scroll** — game always fits within viewport
- **Animated overlays** — Framer Motion on start screen, pause menu, game-over screen
- **Grade system** on game over — S/A/B/C/D based on accuracy
- **Themed favicon** — neon duck SVG icon

---

## 🎮 Controls

| Action        | Desktop          | Mobile         |
|---------------|------------------|----------------|
| Shoot         | Left-click       | Tap            |
| Pause/Resume  | `P` or `Esc`     | Tap ⏸ button  |
| Navigate menu | Mouse click      | Tap            |

---

## 🛠 Tech Stack

| Layer           | Technology                        |
|-----------------|-----------------------------------|
| Framework       | Next.js 16 (App Router)           |
| Language        | TypeScript (strict mode)          |
| Styling         | Tailwind CSS v4 (no inline styles)|
| Animations      | Framer Motion                     |
| Rendering       | HTML5 Canvas 2D API               |
| Audio           | Web Audio API (procedural, no files)|
| Persistence     | `localStorage` for high scores    |
| Deployment      | Vercel (zero-config)              |

---

## 📁 Project Structure

```
app/
  globals.css          # Global styles, neon variables
  layout.tsx           # Root layout with metadata
  page.tsx             # Entry point

components/
  Game.tsx             # Root orchestrator — manages screens & state
  GameCanvas.tsx       # Canvas game engine (loop, physics, rendering)
  HUD.tsx              # Score, lives, ammo overlay
  StartScreen.tsx      # Animated difficulty selector
  EndScreen.tsx        # Game-over with stats & grade
  PauseMenu.tsx        # Pause overlay with sound toggles

hooks/
  useAudio.ts          # Web Audio API — all procedural sound
  useHighScore.ts      # localStorage high score per difficulty

types/
  game.ts              # All TypeScript interfaces and enums

utils/
  constants.ts         # Game constants, difficulty configs, duck data
  renderer.ts          # Canvas drawing functions (ducks, sky, effects)

public/
  favicon.svg          # Custom neon duck icon
```

---

## 🚀 Run Locally

**Prerequisites:** Node.js 18+

```bash
# Clone / navigate to project
cd duck_hunt

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

```bash
# Build for production
npm run build

# Preview production build
npm start
```

---

## ▲ Deploy on Vercel

1. Push the repository to GitHub/GitLab/Bitbucket
2. Import the project on [vercel.com](https://vercel.com/new)
3. No extra configuration needed — click **Deploy**

The app uses only static + client-side features, so it deploys as a fully static site with zero server costs.

---

## 🎯 Gameplay Tips

- **Combo kills** are key — hit ducks in quick succession (within 2s) for multipliers
- **Golden ducks** are rare but worth 500pts — prioritise them!
- **Hard mode** ducks zigzag more aggressively and the timer is tight
- **Ammo is limited** — aim carefully, especially on Hard where you only get 4 shots
- Each round adds one more duck to the wave, so later rounds are brutally busy

---

## 🏆 Scoring

| Duck Type | Base Points | Rarity |
|-----------|-------------|--------|
| Green     | 50          | Common |
| Blue      | 100         | Common |
| Red       | 200         | Uncommon |
| Golden    | 500         | Rare |

**Combo multipliers:**
- 1–2 kills in chain → ×1
- 3–4 kills → ×2
- 5–6 kills → ×3
- 7+ kills → ×4

---

## 📜 License

MIT — free to use, modify, and deploy.
