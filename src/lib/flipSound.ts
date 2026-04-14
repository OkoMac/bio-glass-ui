/**
 * Synthesised page-flip sound — a brief filtered-noise "rustle" that
 * evokes paper without needing an audio file. Uses Web Audio API.
 *
 * Design: band-pass filtered noise with a decaying envelope and a
 * frequency sweep from ~4.5kHz → 1.5kHz. Total duration ~350ms.
 */

let audioCtx: AudioContext | null = null;
let lastPlay = 0;

type AudioCtxCtor = typeof AudioContext;
type WindowWithWebkit = Window & { webkitAudioContext?: AudioCtxCtor };

function getCtx(): AudioContext | null {
  try {
    if (!audioCtx) {
      const Ctor: AudioCtxCtor | undefined =
        typeof window !== "undefined"
          ? window.AudioContext ?? (window as WindowWithWebkit).webkitAudioContext
          : undefined;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    }
    if (audioCtx.state === "suspended") {
      // Fire-and-forget; resume requires a user gesture but may already be allowed
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function playFlipSound(volume = 0.15) {
  // Debounce rapid triggers — at most one flip per 150ms
  const now = Date.now();
  if (now - lastPlay < 150) return;
  lastPlay = now;

  const ctx = getCtx();
  if (!ctx) return;

  try {
    const startAt = ctx.currentTime;
    const duration = 0.35;

    // ── Noise buffer with decaying amplitude
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      // Shaped noise — louder at start, decaying
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 1.5);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    // ── Band-pass filter sweeping down — mimics a page whooshing past the ear
    const bpf = ctx.createBiquadFilter();
    bpf.type = "bandpass";
    bpf.Q.value = 0.8;
    bpf.frequency.setValueAtTime(4500, startAt);
    bpf.frequency.exponentialRampToValueAtTime(1500, startAt + duration);

    // ── Amplitude envelope
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(volume, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);

    // ── Subtle high-pass so we don't get low-end rumble
    const hpf = ctx.createBiquadFilter();
    hpf.type = "highpass";
    hpf.frequency.value = 400;

    noise.connect(bpf).connect(hpf).connect(gain).connect(ctx.destination);
    noise.start(startAt);
    noise.stop(startAt + duration);
  } catch {
    // Silent fail — audio is nice-to-have
  }
}

const MUTE_KEY = "bion_catalog_muted";

export function isCatalogMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setCatalogMuted(muted: boolean) {
  try {
    if (muted) localStorage.setItem(MUTE_KEY, "1");
    else localStorage.removeItem(MUTE_KEY);
  } catch {
    /* noop */
  }
}
