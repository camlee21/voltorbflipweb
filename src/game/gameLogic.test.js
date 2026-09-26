import { describe, expect, it } from "vitest";
import {
  GRID_SIZE,
  MAX_LEVEL,
  levelOptions,
  buildGrid,
  buildLevel,
  rowStats,
  columnStats,
  diagonalStats,
  revealTile,
  hideTile,
  toggleTileNote,
  revealBoard,
  classicLevelAfterLoss,
  classicLevelAfterWin,
  JUMP_STREAK,
  JUMP_MIN_FLIPS,
} from "./gameLogic";

const flat = (grid) => grid.flat();
const count = (grid, value) => flat(grid).filter((t) => t.value === value).length;

describe("levelOptions", () => {
  it("has 5 patterns for each of the 8 levels, all fitting on the board", () => {
    expect(levelOptions).toHaveLength(8);
    expect(MAX_LEVEL).toBe(8);
    for (const options of levelOptions) {
      expect(options).toHaveLength(5);
      for (const [c2, c3, c0] of options) {
        expect(c2 + c3 + c0).toBeLessThanOrEqual(GRID_SIZE * GRID_SIZE);
        expect(c2 + c3).toBeGreaterThan(0);
      }
    }
  });
});

describe("buildGrid", () => {
  it("places exactly the pattern's tile counts and computes maxScore", () => {
    for (const options of levelOptions) {
      for (const pattern of options) {
        const [c2, c3, c0] = pattern;
        const { grid, maxScore } = buildGrid(pattern);
        expect(grid).toHaveLength(GRID_SIZE);
        grid.forEach((row) => expect(row).toHaveLength(GRID_SIZE));
        expect(count(grid, 2)).toBe(c2);
        expect(count(grid, 3)).toBe(c3);
        expect(count(grid, 0)).toBe(c0);
        expect(count(grid, 1)).toBe(25 - c2 - c3 - c0);
        expect(maxScore).toBe(2 ** c2 * 3 ** c3);
        expect(flat(grid).every((t) => !t.revealed && !t.noted)).toBe(true);
      }
    }
  });

  it("rejects patterns that overflow the board", () => {
    expect(() => buildGrid([10, 10, 10])).toThrow();
  });

  it("builds a board from the requested level's pool", () => {
    const rng = () => 0; // always the level's first pattern
    const { grid } = buildLevel(8, rng);
    expect(count(grid, 3)).toBe(7);
    expect(count(grid, 0)).toBe(10);
  });
});

describe("stats", () => {
  const values = [
    [0, 1, 2, 3, 1],
    [1, 0, 1, 1, 1],
    [2, 1, 0, 1, 1],
    [3, 1, 1, 1, 0],
    [1, 1, 1, 1, 2],
  ];
  const grid = values.map((row) => row.map((value, i) => ({ id: i, value, revealed: false, noted: false })));

  it("counts points and Voltorbs per row, column and diagonal", () => {
    expect(rowStats(grid, 0)).toEqual({ points: 7, voltorbs: 1 });
    expect(columnStats(grid, 0)).toEqual({ points: 7, voltorbs: 1 });
    expect(columnStats(grid, 4)).toEqual({ points: 5, voltorbs: 1 });
    expect(diagonalStats(grid)).toEqual({ points: 3, voltorbs: 3 });
  });
});

describe("grid updates", () => {
  const { grid } = buildGrid([3, 1, 6]);

  it("reveal/hide/note return new grids and leave the original untouched", () => {
    const noted = toggleTileNote(grid, 1, 2);
    expect(noted[1][2].noted).toBe(true);
    expect(grid[1][2].noted).toBe(false);
    expect(toggleTileNote(noted, 1, 2)[1][2].noted).toBe(false);

    const revealed = revealTile(noted, 1, 2);
    expect(revealed[1][2]).toMatchObject({ revealed: true, noted: false });
    expect(revealed[0]).toBe(noted[0]); // untouched rows are shared
    expect(toggleTileNote(revealed, 1, 2)).toBe(revealed); // can't note a revealed tile

    expect(hideTile(revealed, 1, 2)[1][2].revealed).toBe(false);
    expect(flat(revealBoard(noted)).every((t) => t.revealed && !t.noted)).toBe(true);
  });
});

describe("Classic level rules", () => {
  it("demotes to the number of tiles flipped when it's below the level", () => {
    expect(classicLevelAfterLoss(5, 2)).toBe(2);
    expect(classicLevelAfterLoss(5, 0)).toBe(1);
    expect(classicLevelAfterLoss(1, 0)).toBe(1);
    expect(classicLevelAfterLoss(5, 5)).toBe(5);
    expect(classicLevelAfterLoss(3, 9)).toBe(3);
  });

  it("advances one level per clear and caps at the max level", () => {
    expect(classicLevelAfterWin(1, 4, 0)).toEqual({ level: 2, streak: 0 });
    expect(classicLevelAfterWin(MAX_LEVEL, 4, 0).level).toBe(MAX_LEVEL);
  });

  it(`jumps to level ${MAX_LEVEL} after ${JUMP_STREAK} clears in a row with ${JUMP_MIN_FLIPS}+ flips`, () => {
    let state = { level: 1, streak: 0 };
    for (let i = 0; i < JUMP_STREAK - 1; i++) {
      state = classicLevelAfterWin(state.level, JUMP_MIN_FLIPS, state.streak);
    }
    expect(state).toEqual({ level: JUMP_STREAK, streak: JUMP_STREAK - 1 });
    expect(classicLevelAfterWin(state.level, JUMP_MIN_FLIPS, state.streak).level).toBe(MAX_LEVEL);
  });

  it("resets the streak on a clear with too few flips", () => {
    expect(classicLevelAfterWin(3, JUMP_MIN_FLIPS - 1, 4)).toEqual({ level: 4, streak: 0 });
  });
});
