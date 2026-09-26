// gameLogic.js
// Port of VoltorbStructs.swift. Pure JS, no framework dependencies, so it's
// easy to unit test independently of React.

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

// The highest level with a defined pattern pool — beating it loops back
// instead of advancing to an undefined level.
export const MAX_LEVEL = levelOptions.length;

/**
 * Picks a random pattern for a level from that level's pool in `levelOptions`.
 */
export function getRandomPatternForLevel(level, rng = Math.random) {
  const options = levelOptions[level - 1];
  const idx = Math.floor(rng() * options.length);
  return options[idx];
}

// --- Board / tile generation ------------------------------------------------

/**
 * Builds a fresh 5x5 grid of tiles from a [count2, count3, count0] pattern.
 * Returns { grid, maxScore } where grid is a 2D array of tile objects:
 *   { id, value, revealed, noted }
 * value: 0 = Voltorb (bomb), 1/2/3 = point multiplier tiles.
 */
export function buildGrid(pattern, rng = Math.random) {
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
    const j = Math.floor(rng() * (i + 1));
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

/** Builds a random board for a level: { grid, maxScore }. */
export function buildLevel(level, rng = Math.random) {
  return buildGrid(getRandomPatternForLevel(level, rng), rng);
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

/** Stats for the top-left → bottom-right diagonal (Rogue's Corner Count). */
export function diagonalStats(grid) {
  let voltorbs = 0;
  let points = 0;
  for (let i = 0; i < GRID_SIZE; i++) {
    const tile = grid[i][i];
    if (tile.value === 0) voltorbs += 1;
    else points += tile.value;
  }
  return { voltorbs, points };
}

// --- Immutable grid updates -------------------------------------------------
// Always use these through a functional updater (`setGrid((g) => ...)`) so a
// delayed callback never writes back an out-of-date copy of the board.

function updateTile(grid, row, col, patch) {
  return grid.map((r, ri) =>
    ri === row ? r.map((t, ci) => (ci === col ? { ...t, ...patch } : t)) : r
  );
}

export function revealTile(grid, row, col) {
  return updateTile(grid, row, col, { revealed: true, noted: false });
}

export function hideTile(grid, row, col) {
  return updateTile(grid, row, col, { revealed: false });
}

export function toggleTileNote(grid, row, col) {
  const tile = grid[row][col];
  if (tile.revealed) return grid;
  return updateTile(grid, row, col, { noted: !tile.noted });
}

export function revealBoard(grid) {
  return grid.map((row) => row.map((tile) => ({ ...tile, noted: false, revealed: true })));
}

// --- Classic (HGSS) level rules ---------------------------------------------

// HGSS: clear this many boards in a row, flipping at least
// JUMP_MIN_FLIPS tiles on each, and you jump straight to level 8.
export const JUMP_STREAK = 5;
export const JUMP_MIN_FLIPS = 8;

/**
 * Level after flipping a Voltorb: if you flipped fewer tiles than your
 * current level number, you drop to that many (minimum 1).
 */
export function classicLevelAfterLoss(level, flips) {
  return flips < level ? Math.max(1, flips) : level;
}

/**
 * Level and streak after clearing a board. `streak` counts consecutive
 * clears with at least JUMP_MIN_FLIPS flips each.
 */
export function classicLevelAfterWin(level, flips, streak) {
  const nextStreak = flips >= JUMP_MIN_FLIPS ? streak + 1 : 0;
  const nextLevel = nextStreak >= JUMP_STREAK ? MAX_LEVEL : Math.min(level + 1, MAX_LEVEL);
  return { level: nextLevel, streak: nextStreak };
}
