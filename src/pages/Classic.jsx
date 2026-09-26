import { useState } from "react";
import Board from "../components/Board";
import NoteToggle from "../components/NoteToggle";
import CoinToast from "../components/CoinToast";
import {
  buildLevel,
  revealTile,
  toggleTileNote,
  revealBoard,
  classicLevelAfterLoss,
  classicLevelAfterWin,
  MAX_LEVEL,
} from "../game/gameLogic";
import "./FreePlayGame.css"; // shares the board/tile/panel look with Free Play
import "./Classic.css";

import { useAuthContext } from "../contexts/useAuthContext";
import { useWalletContext } from "../contexts/useWalletContext";
import { useEquippedTheme } from "../utils/useEquippedTheme";
import { useTimeouts } from "../hooks/useTimeouts";
import { useConfirmArm } from "../hooks/useConfirmArm";
import { useCoinToast } from "../hooks/useCoinToast";

// Timing for the automatic loss sequence
const REVEAL_DELAY_MS = 500;
const REVEAL_HOLD_MS = 1400;
const MESSAGE_HOLD_MS = 2200;

// Timing for the automatic win sequence
const WIN_HOLD_MS = 2500;

function getMessageTone(msg) {
  if (!msg) return "";
  if (msg.includes("beaten") || msg.includes("Well done")) return "message--success";
  if (msg.includes("lost") || msg.includes("pushed back")) return "message--error";
  return "message--neutral";
}

export default function Classic() {
  const { user } = useAuthContext();
  const { addCoins } = useWalletContext();

  const [equippedTheme] = useEquippedTheme();

  // When on, tapping a tile notes it instead of flipping it.
  // Long-press-to-note (see Tile.jsx) still works independently either way.
  const [noteMode, setNoteMode] = useState(false);

  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(1);
  const [totalScore, setTotalScore] = useState(0);
  const [board, setBoard] = useState(() => buildLevel(1));
  const { grid, maxScore } = board;
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState("");

  // Tiles flipped this level (Voltorbs don't count) — decides demotion on a loss.
  const [flipCount, setFlipCount] = useState(0);
  // Consecutive clears with at least JUMP_MIN_FLIPS flips — five in a row jumps to level 8.
  const [winStreak, setWinStreak] = useState(0);

  const [revealing, setRevealing] = useState(false);
  const [awaitingNextLevel, setAwaitingNextLevel] = useState(false);

  const [pendingAction, confirm] = useConfirmArm();
  const [coinToast, showCoinToast] = useCoinToast();
  const { schedule, clearAll } = useTimeouts();

  const setGrid = (update) => setBoard((b) => ({ ...b, grid: update(b.grid) }));

  function startNewLevel(levelNumber) {
    clearAll();
    setBoard(buildLevel(levelNumber));
    setScore(1);
    setFlipCount(0);
    setRevealing(false);
    setAwaitingNextLevel(false);
  }

  // Each cleared level's score is banked as coins straight away, so leaving
  // the page mid-run never loses anything already won.
  function bankCoins(amount) {
    if (!user || amount <= 0) return;
    addCoins(amount);
    showCoinToast(amount);
  }

  function winLevel(levelScore, flips) {
    const next = classicLevelAfterWin(level, flips, winStreak);
    const jumped = next.level === MAX_LEVEL && level + 1 < MAX_LEVEL;

    setWinStreak(next.streak);
    setMessage(
      level >= MAX_LEVEL
        ? `Well done, you beat Level ${MAX_LEVEL}!`
        : jumped
          ? `Level beaten! Five big clears in a row — jumping to level ${MAX_LEVEL}!`
          : "Level beaten!"
    );
    setGrid(revealBoard);
    setRevealing(true);
    setAwaitingNextLevel(true);
    setTotalScore((t) => t + levelScore);
    bankCoins(levelScore);

    schedule(() => {
      setLevel(next.level);
      setMessage("");
      startNewLevel(next.level);
    }, WIN_HOLD_MS);
  }

  function loseLevel(row, col) {
    const nextLevel = classicLevelAfterLoss(level, flipCount);

    setGrid((g) => revealTile(g, row, col));
    setGameOver(true);
    setWinStreak(0);
    setMessage("Oops! You lost!");

    schedule(() => {
      setGrid(revealBoard);
      setRevealing(true);

      schedule(() => {
        setMessage(
          nextLevel < level
            ? `You've been pushed back to level ${nextLevel}!`
            : `You're still on level ${level}.`
        );

        schedule(() => {
          setLevel(nextLevel);
          setGameOver(false);
          setMessage("");
          startNewLevel(nextLevel);
        }, MESSAGE_HOLD_MS);
      }, REVEAL_HOLD_MS);
    }, REVEAL_DELAY_MS);
  }

  function handleFlip(row, col) {
    if (gameOver || awaitingNextLevel) return;
    const tile = grid[row][col];
    if (tile.revealed) return;

    if (tile.value === 0) {
      loseLevel(row, col);
      return;
    }

    const newScore = score * tile.value;
    const flips = flipCount + 1;
    setGrid((g) => revealTile(g, row, col));
    setScore(newScore);
    setFlipCount(flips);
    if (newScore === maxScore) winLevel(newScore, flips);
  }

  function handleNote(row, col) {
    if (gameOver || awaitingNextLevel) return;
    setGrid((g) => toggleTileNote(g, row, col));
  }

  function handleTileFlip(row, col) {
    if (noteMode) handleNote(row, col);
    else handleFlip(row, col);
  }

  function handleNewRun() {
    setLevel(1);
    setTotalScore(0);
    setWinStreak(0);
    setGameOver(false);
    setMessage("");
    startNewLevel(1);
  }

  return (
    <div className="free-play-page classic-page">
      <CoinToast amount={coinToast} />

      <div className="layout">
        <section className="board-panel" aria-label="Classic board">
          <Board
            grid={grid}
            theme={equippedTheme}
            disabled={gameOver || awaitingNextLevel}
            revealing={revealing}
            onFlip={handleTileFlip}
            onNote={handleNote}
            label="Classic board tiles"
          />

          <p className="hint">Right-click (or long-press on mobile) a tile to note it.</p>

          <NoteToggle on={noteMode} onChange={setNoteMode} />
        </section>

        <aside className="sidebar">
          <div className="sidebar__group">
            <span className="field-label">Level</span>
            <div className="classic-level-display">{level}</div>
          </div>

          <div className="classic-scores">
            <div className="scoreboard">
              <span className="scoreboard__label">Lvl. Score</span>
              {/* HGSS shows 0 until the first flip; score is a running product, so it starts at 1. */}
              <span className="scoreboard__value">{flipCount === 0 ? 0 : score}</span>
            </div>
            <div className="scoreboard">
              <span className="scoreboard__label">Total</span>
              <span className="scoreboard__value">{totalScore}</span>
            </div>
          </div>

          {message && (
            <p className={`message ${getMessageTone(message)}`} role="status">
              {message}
            </p>
          )}

          <div className="sidebar__actions">
            <button
              type="button"
              data-confirm="reset"
              className={`btn btn--ghost ${pendingAction === "reset" ? "armed" : ""}`}
              onClick={() => confirm("reset", handleNewRun)}
            >
              New Run
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
