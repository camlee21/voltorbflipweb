import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AuthContext } from "../contexts/useAuthContext";
import { WalletContext } from "../contexts/useWalletContext";
import Classic from "./Classic";
import FreePlayGame from "./FreePlayGame";
import RogueGame from "./RogueGame";

// Every level gets the same known board: a Voltorb at row 1 col 1, a 2 and
// a 3 next to it, and 1s everywhere else (so clearing it scores 6).
vi.mock("../game/gameLogic", async (importOriginal) => {
  const actual = await importOriginal();
  const values = [
    [0, 2, 3, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
  ];
  return {
    ...actual,
    buildLevel: () => ({
      grid: values.map((row, r) => row.map((value, c) => ({ id: r * 5 + c, value, revealed: false, noted: false }))),
      maxScore: 6,
    }),
  };
});

const VOLTORB = [1, 1];
const TWO = [1, 2];
const THREE = [1, 3];

function tile([row, col]) {
  return screen.getByRole("button", { name: new RegExp(`^Row ${row}, column ${col}:`) });
}
const label = (pos) => tile(pos).getAttribute("aria-label");
const flip = (pos) => fireEvent.click(tile(pos));
const advance = (ms) => act(() => vi.advanceTimersByTime(ms));
const clickTwice = (name) => {
  fireEvent.click(screen.getByRole("button", { name }));
  fireEvent.click(screen.getByRole("button", { name }));
};

let addCoins;

function renderMode(ui) {
  addCoins = vi.fn();
  return render(
    <AuthContext.Provider value={{ user: { id: "user-1" } }}>
      <WalletContext.Provider value={{ addCoins }}>{ui}</WalletContext.Provider>
    </AuthContext.Provider>
  );
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Tile", () => {
  it("keeps hidden values out of the DOM until a tile is flipped", () => {
    const { container } = renderMode(<FreePlayGame />);
    expect(container.querySelectorAll(".tile-face-front img")).toHaveLength(0);
    flip(TWO);
    const fronts = container.querySelectorAll(".tile-face-front img");
    expect(fronts).toHaveLength(1);
    expect(fronts[0].getAttribute("src")).toBe("/sprites/2_classic.png");
  });

  it("long-press notes the tile without undoing a flip made in the meantime", () => {
    renderMode(<FreePlayGame />);
    fireEvent.touchStart(tile([2, 2]), { touches: [{ clientX: 0, clientY: 0 }] });
    flip(TWO);
    advance(400);
    expect(label([2, 2])).toBe("Row 2, column 2: hidden, noted");
    expect(label(TWO)).toBe("Row 1, column 2: 2");
  });
});

describe("Free Play", () => {
  it("a pending loss reveal doesn't land on a newly selected level", () => {
    renderMode(<FreePlayGame />);
    flip(VOLTORB);
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    advance(1000);
    expect(label(TWO)).toBe("Row 1, column 2: hidden");
    expect(tile(TWO).disabled).toBe(false);
  });

  it("Submit after flipping a Voltorb doesn't count as a win", () => {
    renderMode(<FreePlayGame />);
    flip(TWO);
    flip(THREE);
    flip(VOLTORB);
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(screen.queryByText("Level beaten!")).toBeNull();
    expect(screen.getByText(/You lost this board/)).toBeTruthy();
  });
});

describe("Classic", () => {
  it("banks a cleared level's score straight away", () => {
    renderMode(<Classic />);
    flip(TWO);
    flip(THREE);
    expect(addCoins).toHaveBeenCalledWith(6);
  });

  it("New Run during the win pause isn't undone by the pending level-up", () => {
    const { container } = renderMode(<Classic />);
    flip(TWO);
    flip(THREE);
    clickTwice("New Run");
    advance(5000);
    expect(container.querySelector(".classic-level-display").textContent).toBe("1");
    expect(addCoins).toHaveBeenCalledTimes(1);
  });
});

describe("Rogue", () => {
  function clearLevelTakingBonus() {
    flip(TWO);
    flip(THREE);
    fireEvent.click(screen.getByRole("button", { name: /Bonus Score/ }));
  }

  it("a loss banks the run total without the lost level's score", () => {
    renderMode(<RogueGame />);
    clearLevelTakingBonus(); // total = 6 + 50
    flip(TWO);
    flip(VOLTORB);
    expect(addCoins).toHaveBeenCalledTimes(1);
    expect(addCoins).toHaveBeenCalledWith(56);
  });

  it("New Run banks an unfinished run, and doesn't bank a lost one twice", () => {
    renderMode(<RogueGame />);
    clearLevelTakingBonus();
    clickTwice("New Run");
    expect(addCoins).toHaveBeenCalledWith(56);

    clearLevelTakingBonus();
    flip(VOLTORB);
    clickTwice("New Run");
    expect(addCoins).toHaveBeenCalledTimes(2);
  });

  it("a Voltorb survived with Protect stays face-up", () => {
    vi.spyOn(Math, "random").mockReturnValue(0); // first offered power: Protect
    renderMode(<RogueGame />);
    flip(TWO);
    flip(THREE);
    fireEvent.click(screen.getByRole("button", { name: /^Protect/ }));
    flip(VOLTORB);
    advance(2000);
    expect(screen.getByText(/You use Protect/)).toBeTruthy();
    expect(label(VOLTORB)).toBe("Row 1, column 1: Voltorb");
  });
});
