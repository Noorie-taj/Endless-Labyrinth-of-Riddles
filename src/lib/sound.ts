"use client";

let audioCtx: AudioContext | null = null;
let isMuted = false;

function getContext(): AudioContext | null {
  if (typeof window === "undefined" || isMuted) return null;
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) {
      audioCtx = new Ctx();
    }
    if (audioCtx.state === "suspended") {
      void audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function playTone(
  ctx: AudioContext,
  options: {
    type: OscillatorType;
    startFreq: number;
    endFreq?: number;
    startTime: number;
    duration: number;
    gain: number;
  }
): void {
  const { type, startFreq, endFreq, startTime, duration, gain } = options;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, startTime);
  if (endFreq !== undefined && endFreq !== startFreq) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(20, endFreq),
      startTime + duration
    );
  }

  amp.gain.setValueAtTime(0.0001, startTime);
  amp.gain.exponentialRampToValueAtTime(gain, startTime + 0.008);
  amp.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(amp);
  amp.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
}

export function setSoundMuted(muted: boolean): void {
  isMuted = muted;
}

export function getSoundMuted(): boolean {
  return isMuted;
}

export function playMoveSound(): void {
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(ctx, {
    type: "triangle",
    startFreq: 210,
    endFreq: 135,
    startTime: now,
    duration: 0.055,
    gain: 0.055,
  });
}

export function playWallBumpSound(): void {
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(ctx, {
    type: "sine",
    startFreq: 115,
    endFreq: 68,
    startTime: now,
    duration: 0.07,
    gain: 0.06,
  });
}

export function playGateOpenSound(): void {
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(ctx, {
    type: "triangle",
    startFreq: 392,
    endFreq: 370,
    startTime: now,
    duration: 0.11,
    gain: 0.075,
  });
  playTone(ctx, {
    type: "sine",
    startFreq: 293.66,
    endFreq: 277.18,
    startTime: now + 0.09,
    duration: 0.15,
    gain: 0.075,
  });
}

export function playRiddleSolvedSound(): void {
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99];
  notes.forEach((freq, idx) => {
    playTone(ctx, {
      type: "triangle",
      startFreq: freq,
      startTime: now + idx * 0.075,
      duration: 0.16,
      gain: 0.08,
    });
  });
}

export function playWrongAnswerSound(): void {
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(ctx, {
    type: "sawtooth",
    startFreq: 210,
    endFreq: 155,
    startTime: now,
    duration: 0.16,
    gain: 0.045,
  });
}

export function playLevelCompleteSound(): void {
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, idx) => {
    playTone(ctx, {
      type: "triangle",
      startFreq: freq,
      startTime: now + idx * 0.085,
      duration: idx === notes.length - 1 ? 0.28 : 0.15,
      gain: 0.085,
    });
  });
}

export function playCountdownTickSound(): void {
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(ctx, {
    type: "sine",
    startFreq: 880,
    endFreq: 660,
    startTime: now,
    duration: 0.045,
    gain: 0.035,
  });
}

export function playTimeUpSound(): void {
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const notes = [349.23, 293.66, 220];
  notes.forEach((freq, idx) => {
    playTone(ctx, {
      type: "sawtooth",
      startFreq: freq,
      startTime: now + idx * 0.14,
      duration: idx === notes.length - 1 ? 0.3 : 0.14,
      gain: 0.055,
    });
  });
}
