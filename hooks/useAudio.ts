'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface AudioState {
  sfxEnabled: boolean;
  musicEnabled: boolean;
}

// ─── Procedural sound helpers ─────────────────────────────────────────────

function noise(ctx: AudioContext, duration: number, gain: number): AudioBufferSourceNode {
  const bufLen = Math.floor(ctx.sampleRate * duration);
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1);

  const src = ctx.createBufferSource();
  src.buffer = buf;

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(gain, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  src.connect(gainNode);
  gainNode.connect(ctx.destination);
  return src;
}

function tone(
  ctx: AudioContext,
  freq: number,
  duration: number,
  gain: number,
  type: OscillatorType = 'square',
  freqEnd?: number
): OscillatorNode {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration);
  }

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(gain, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  return osc;
}

// ─── Hook ────────────────────────────────────────────────────────────────

export function useAudio() {
  const ctxRef    = useRef<AudioContext | null>(null);
  const musicRef  = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);
  const [state, setState] = useState<AudioState>({ sfxEnabled: true, musicEnabled: true });

  const getCtx = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!ctxRef.current) {
      try {
        ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      } catch {
        return null;
      }
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  // ── SFX: gunshot
  const playShot = useCallback(() => {
    if (!state.sfxEnabled) return;
    const ctx = getCtx();
    if (!ctx) return;

    const src = noise(ctx, 0.12, 0.6);
    src.start();
    src.stop(ctx.currentTime + 0.12);

    const click = tone(ctx, 180, 0.08, 0.4, 'sawtooth', 60);
    click.start();
    click.stop(ctx.currentTime + 0.08);
  }, [state.sfxEnabled, getCtx]);

  // ── SFX: duck hit
  const playHit = useCallback(() => {
    if (!state.sfxEnabled) return;
    const ctx = getCtx();
    if (!ctx) return;

    const osc = tone(ctx, 600, 0.25, 0.35, 'sine', 80);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);

    const osc2 = tone(ctx, 400, 0.18, 0.2, 'square', 200);
    osc2.start(ctx.currentTime + 0.05);
    osc2.stop(ctx.currentTime + 0.23);
  }, [state.sfxEnabled, getCtx]);

  // ── SFX: duck escaped
  const playEscape = useCallback(() => {
    if (!state.sfxEnabled) return;
    const ctx = getCtx();
    if (!ctx) return;

    const osc = tone(ctx, 300, 0.5, 0.25, 'triangle', 100);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  }, [state.sfxEnabled, getCtx]);

  // ── SFX: miss (no duck hit, ammo wasted)
  const playMiss = useCallback(() => {
    if (!state.sfxEnabled) return;
    const ctx = getCtx();
    if (!ctx) return;

    const src = noise(ctx, 0.06, 0.2);
    src.start();
    src.stop(ctx.currentTime + 0.06);
  }, [state.sfxEnabled, getCtx]);

  // ── SFX: combo chime (pitch rises with combo level)
  const playCombo = useCallback((comboLevel: number) => {
    if (!state.sfxEnabled) return;
    const ctx = getCtx();
    if (!ctx) return;

    const base = 440;
    const freqs = [base, base * 1.25, base * 1.5, base * 2, base * 2.5];
    const freq = freqs[Math.min(comboLevel - 1, freqs.length - 1)];

    const osc = tone(ctx, freq, 0.2, 0.3, 'sine');
    osc.start();
    osc.stop(ctx.currentTime + 0.2);

    if (comboLevel >= 3) {
      const osc2 = tone(ctx, freq * 1.5, 0.15, 0.2, 'sine');
      osc2.start(ctx.currentTime + 0.05);
      osc2.stop(ctx.currentTime + 0.2);
    }
  }, [state.sfxEnabled, getCtx]);

  // ── SFX: round start fanfare
  const playRoundStart = useCallback(() => {
    if (!state.sfxEnabled) return;
    const ctx = getCtx();
    if (!ctx) return;

    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = tone(ctx, freq, 0.15, 0.25, 'square');
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.15);
    });
  }, [state.sfxEnabled, getCtx]);

  // ── SFX: game over
  const playGameOver = useCallback(() => {
    if (!state.sfxEnabled) return;
    const ctx = getCtx();
    if (!ctx) return;

    const notes = [440, 370, 311, 220];
    notes.forEach((freq, i) => {
      const osc = tone(ctx, freq, 0.3, 0.3, 'sawtooth');
      osc.start(ctx.currentTime + i * 0.22);
      osc.stop(ctx.currentTime + i * 0.22 + 0.3);
    });
  }, [state.sfxEnabled, getCtx]);

  // ── Background music (simple retro loop)
  const startMusic = useCallback(() => {
    if (!state.musicEnabled) return;
    const ctx = getCtx();
    if (!ctx || musicRef.current) return;

    // Create a simple looping melody with an oscillator
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.06;
    gainNode.connect(ctx.destination);

    // We'll drive the melody with a script processor–free approach:
    // encode a sequence of notes and cycle through them manually
    const melody = [262, 294, 330, 349, 392, 349, 330, 294];
    let noteIdx = 0;
    const bpm = 120;
    const noteDur = (60 / bpm) * 0.5; // eighth notes

    const playNote = () => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = melody[noteIdx % melody.length];

      const noteGain = ctx.createGain();
      noteGain.gain.setValueAtTime(0.08, ctx.currentTime);
      noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + noteDur * 0.85);

      osc.connect(noteGain);
      noteGain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + noteDur);

      noteIdx++;
    };

    const intervalId = setInterval(playNote, noteDur * 1000);

    // Store a dummy osc and real gain for cleanup
    const dummyOsc = ctx.createOscillator();
    dummyOsc.frequency.value = 0;
    dummyOsc.connect(gainNode);
    musicRef.current = { osc: dummyOsc, gain: gainNode };

    // Attach interval id to the gain node for cleanup
    (gainNode as unknown as { _intervalId: ReturnType<typeof setInterval> })._intervalId = intervalId;
  }, [state.musicEnabled, getCtx]);

  const stopMusic = useCallback(() => {
    if (!musicRef.current) return;
    const { gain } = musicRef.current;
    const intervalId = (gain as unknown as { _intervalId: ReturnType<typeof setInterval> })._intervalId;
    if (intervalId) clearInterval(intervalId);
    gain.disconnect();
    musicRef.current = null;
  }, []);

  const toggleSfx = useCallback(() => {
    setState(s => ({ ...s, sfxEnabled: !s.sfxEnabled }));
  }, []);

  const toggleMusic = useCallback(() => {
    setState(s => {
      const next = !s.musicEnabled;
      if (!next) stopMusic();
      return { ...s, musicEnabled: next };
    });
  }, [stopMusic]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMusic();
      ctxRef.current?.close();
    };
  }, [stopMusic]);

  return {
    playShot,
    playHit,
    playEscape,
    playMiss,
    playCombo,
    playRoundStart,
    playGameOver,
    startMusic,
    stopMusic,
    toggleSfx,
    toggleMusic,
    sfxEnabled:   state.sfxEnabled,
    musicEnabled: state.musicEnabled,
  };
}
