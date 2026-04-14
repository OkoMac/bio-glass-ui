/**
 * Real page-flip sound — plays one of 3 short recordings.
 *
 * Assets live in /public/sounds (see ATTRIBUTION.md). They're pre-loaded
 * on first call so subsequent flips have zero latency. We round-robin
 * through variants so consecutive flips don't sound identical.
 */

const FLIP_VARIANTS = [
  "/sounds/page-flip-1.mp3",
  "/sounds/page-flip-2.mp3",
  "/sounds/page-flip-3.mp3",
];

let audioPool: HTMLAudioElement[] = [];
let nextIdx = 0;
let lastPlay = 0;
let primed = false;

function prime() {
  if (primed || typeof window === "undefined") return;
  primed = true;
  audioPool = FLIP_VARIANTS.map((src) => {
    const a = new Audio(src);
    a.preload = "auto";
    a.volume = 0.6;
    // Trigger network + decode now
    a.load();
    return a;
  });
}

export function playFlipSound(volume = 0.6) {
  // Debounce rapid triggers — at most one flip per 200ms
  const now = Date.now();
  if (now - lastPlay < 200) return;
  lastPlay = now;

  try {
    if (!primed) prime();
    if (audioPool.length === 0) return;

    // Pick next variant + shuffle occasionally for more randomness
    const picked = audioPool[nextIdx % audioPool.length];
    nextIdx = (nextIdx + 1) % audioPool.length;

    // Clone the node so overlapping plays don't cut each other off
    const node = picked.cloneNode(true) as HTMLAudioElement;
    node.volume = Math.max(0, Math.min(1, volume));
    // playbackRate jitter (±7%) to reduce repetition fatigue
    node.playbackRate = 0.93 + Math.random() * 0.14;
    const playPromise = node.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        // Autoplay blocked — silent, will work after next user interaction
      });
    }
  } catch {
    /* noop — audio is a nice-to-have */
  }
}

/** Optional: pre-load sounds during app idle time so first flip is instant. */
export function preloadFlipSounds() {
  prime();
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
