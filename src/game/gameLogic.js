// gameLogic.js
// Port of VoltorbStructs.swift + the daily-board logic from DailyVoltorbView.swift
// Pure JS, no framework dependencies, so it's easy to unit test independently of React.

export const GRID_SIZE = 5;

// Same "pattern options per level" table as `levelOptions` in DailyVoltorbView.swift.
// Each pattern is [count2, count3, count0(voltorbs)] for a 5x5 (25-tile) board.
export const levelOptions = [
  [[3, 1, 6], [0, 3, 6], [5, 0, 6], [2, 2, 6], [4, 1, 6]],
  [[1, 3, 7], [6, 0, 7], [3, 2, 7], [0, 4, 7], [5, 1, 7]],
  [[2, 3, 8], [7, 0, 8], [4, 2, 8], [1, 4, 8], [6, 1, 8]],
  [[3, 3, 8], [0, 5, 8], [8, 0, 10], [5, 2, 10], [2, 4, 10]],
  [[7, 1, 10], [4, 3, 10], [1, 5, 10], [9, 0, 10], [6, 2, 10]],
  [[3, 4, 10], [0, 6, 10], [8, 1, 10], [5, 3, 10], [2, 5, 10]],
  [[7, 2, 10], [4, 4, 10], [1, 6, 13], [9, 1, 13], [6, 3, 10]],
  [[0, 7, 10], [8, 2, 10], [5, 4, 10], [2, 6, 10], [7, 3, 10]],
];

// The day the daily-challenge numbering starts from (Day #1).
// Change this if you want your own launch date.
const DAILY_EPOCH = new Date(2025, 4, 25); // May 25, 2025 (month is 0-indexed)

/**
 * Returns the number of whole calendar days between DAILY_EPOCH and today,
 * using local time at midnight (mirrors Swift's `calendar.startOfDay`).
 */
export function getDayNumber(now = new Date()) {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfEpoch = new Date(
    DAILY_EPOCH.getFullYear(),
    DAILY_EPOCH.getMonth(),
    DAILY_EPOCH.getDate()
  );
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysSince = Math.round((startOfToday - startOfEpoch) / msPerDay);
  return daysSince + 1; // Day 1 is the epoch date
}

// --- Seeded PRNG -----------------------------------------------------------
// The iOS app seeds a Mersenne-Twister with the day number so every player
// sees the same board on the same day. We don't need bit-for-bit parity with
// iOS (this is a separate, standalone web game) — we just need something
// deterministic per-day. mulberry32 is a small, fast, good-enough PRNG for this.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministically builds today's set of 8 level patterns (one per level,
 * chosen from that level's 5 options) from a single seeded RNG stream —
 * same idea as `getDailyBoard(for:)` in DailyVoltorbView.swift.
 */
export function getDailyBoard(day) {
  const rng = mulberry32(day);
  return levelOptions.map((options) => {
    const idx = Math.floor(rng() * options.length);
    return options[idx];
  });
}

/**
 * Picks a random pattern for a level for free-play/"Normal" mode — same
 * pattern pool as the daily board (`levelOptions`), just chosen freshly
 * with Math.random() each time instead of a per-day seed.
 */
export function getRandomPatternForLevel(level) {
  const options = levelOptions[level - 1];
  const idx = Math.floor(Math.random() * options.length);
  return options[idx];
}

// --- Board / tile generation ------------------------------------------------

/**
 * Builds a fresh 5x5 grid of tiles from a [count2, count3, count0] pattern.
 * Returns { grid, maxScore } where grid is a 2D array of tile objects:
 *   { id, value, revealed, noted }
 * value: 0 = Voltorb (bomb), 1/2/3 = point multiplier tiles.
 */
export function buildGrid(pattern) {
  const [count2, count3, count0] = pattern;
  const totalTiles = GRID_SIZE * GRID_SIZE; // 25
  const count1 = totalTiles - count2 - count3 - count0;

  if (count1 < 0) {
    throw new Error("Invalid pattern: total tile counts exceed grid size");
  }

  const maxScore = Math.pow(2, count2) * Math.pow(3, count3);

  let values = [
    ...Array(count2).fill(2),
    ...Array(count3).fill(3),
    ...Array(count0).fill(0),
    ...Array(count1).fill(1),
  ];

  // Fisher-Yates shuffle
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }

  const grid = [];
  let uid = 0;
  for (let r = 0; r < GRID_SIZE; r++) {
    const row = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      row.push({
        id: uid++,
        value: values[r * GRID_SIZE + c],
        revealed: false,
        noted: false,
      });
    }
    grid.push(row);
  }

  return { grid, maxScore };
}

export function rowStats(grid, row) {
  const tiles = grid[row];
  const voltorbs = tiles.filter((t) => t.value === 0).length;
  const points = tiles.filter((t) => t.value > 0).reduce((sum, t) => sum + t.value, 0);
  return { voltorbs, points };
}

export function columnStats(grid, col) {
  const voltorbs = grid.filter((row) => row[col].value === 0).length;
  const points = grid
    .filter((row) => row[col].value > 0)
    .reduce((sum, row) => sum + row[col].value, 0);
  return { voltorbs, points };
}

export function revealBoard(grid) {
  return grid.map((row) => row.map((tile) => ({ ...tile, noted: false, revealed: true })));
}
