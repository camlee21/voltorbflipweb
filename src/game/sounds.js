// sounds.js
// Port of SoundManager from ContentView.swift. Preloads HTMLAudioElements
// so playback has no first-play delay, and clones nodes on play so the same
// sound can overlap itself (e.g. rapid flips) without cutting off.

const SOUND_FILES = {
  "1_flip": "/sounds/1_flip.wav",
  "2_flip": "/sounds/2_flip.wav",
  "3_flip": "/sounds/3_flip.wav",
  v_flip: "/sounds/v_flip.wav",
  note: "/sounds/note.wav",
  complete: "/sounds/complete.wav",
  error: "/sounds/error.wav",
  game_over: "/sounds/game_over.wav",
};

const cache = {};

function getAudio(name) {
  if (!cache[name]) {
    const src = SOUND_FILES[name];
    if (!src) return null;
    cache[name] = new Audio(src);
    cache[name].preload = "auto";
  }
  return cache[name];
}

// Warm the cache so the first real play() call doesn't stall on a fetch.
export function preloadSounds() {
  Object.keys(SOUND_FILES).forEach(getAudio);
}

export function playSound(name) {
  const base = getAudio(name);
  if (!base) {
    console.warn(`Unknown sound: ${name}`);
    return;
  }
  // Clone so overlapping plays of the same sound don't cut each other off.
  const node = base.cloneNode();
  node.play().catch(() => {
    // Autoplay can be blocked before the user's first interaction — safe to ignore.
  });
}
