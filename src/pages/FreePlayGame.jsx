import { useState } from "react";

import Board from "../components/Board";
import NoteToggle from "../components/NoteToggle";

import { buildLevel, revealTile, toggleTileNote, revealBoard, levelOptions } from "../game/gameLogic";

import { useEquippedTheme } from "../utils/useEquippedTheme";
import { useTimeouts } from "../hooks/useTimeouts";
import { useConfirmArm } from "../hooks/useConfirmArm";

import "./FreePlayGame.css";

const LEVELS = levelOptions.map((_, i) => i + 1);
// Delay before the whole board flips up after a loss.
const LOSS_REVEAL_MS = 500;

function getMessageTone(msg) {
  if (!msg) return "";
  if (msg.includes("beaten")) return "message--success";
  if (msg.includes("lost") || msg.includes("unfinished") || msg.includes("Reset")) return "message--error";
  return "message--neutral";
}

export default function FreePlayGame() {
  // The player's currently-equipped board theme (defaults to "classic")
  const [equippedTheme] = useEquippedTheme();

  // When on, tapping a tile notes it instead of flipping it.
  // Long-press-to-note (see Tile.jsx) still works independently either way.
  const [noteMode, setNoteMode] = useState(false);

  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  // False once this board has been submitted as beaten.
  const [newGame, setNewGame] = useState(true);
  const [board, setBoard] = useState(() => buildLevel(1));
  const { grid, maxScore } = board;
  const [message, setMessage] = useState("");

  // Gates the column-stagger animation so a normal single-tile flip stays instant.
  const [revealing, setRevealing] = useState(false);

  const [pendingAction, confirm] = useConfirmArm();
  const { schedule, clearAll } = useTimeouts();

  const setGrid = (update) => setBoard((b) => ({ ...b, grid: update(b.grid) }));

  function startLevel(levelNumber) {
    clearAll();
    setBoard(buildLevel(levelNumber));
    setScore(1);
    setNewGame(true);
    setGameOver(false);
    setMessage("");
    setRevealing(false);
  }

  function selectLevel(levelNumber) {
    if (levelNumber === level) return;
    setLevel(levelNumber);
    startLevel(levelNumber);
  }

  function handleFlip(row, col) {
    if (gameOver) return;
    const tile = grid[row][col];
    if (tile.revealed) return;

    setGrid((g) => revealTile(g, row, col));

    if (tile.value !== 0) {
      setScore((s) => s * tile.value);
      return;
    }

    // Hit a Voltorb.
    setGameOver(true);
    setMessage("Oops! You lost!");
    schedule(() => {
      setGrid(revealBoard);
      setRevealing(true);
    }, LOSS_REVEAL_MS);
  }

  function handleNote(row, col) {
    if (gameOver) return;
    setGrid((g) => toggleTileNote(g, row, col));
  }

  function handleTileFlip(row, col) {
    if (noteMode) handleNote(row, col);
    else handleFlip(row, col);
  }

  function handleReveal() {
    clearAll();
    setGrid(revealBoard);
    setRevealing(true);
  }

  function handleSubmit() {
    if (gameOver) {
      setMessage("You lost this board! Reset to try again.");
    } else if (score === maxScore && newGame) {
      setMessage("Level beaten!");
      setNewGame(false);
      setGrid(revealBoard);
      setRevealing(true);
    } else if (score === maxScore) {
      setMessage("Reset to start a new game.");
    } else {
      setMessage("Game unfinished!");
    }
  }

  return (
    <div className="free-play-page">
      <div className="layout">
        <section className="board-panel" aria-label="Free Play board">
          <Board
            grid={grid}
            theme={equippedTheme}
            disabled={gameOver}
            revealing={revealing}
            onFlip={handleTileFlip}
            onNote={handleNote}
            label="Free Play board tiles"
          />

          <p className="hint">Right-click (or long-press on mobile) a tile to note it.</p>

          <NoteToggle on={noteMode} onChange={setNoteMode} />
        </section>

        <aside className="sidebar">
          <div className="sidebar__group">
            <span className="field-label" id="free-play-level-label">Level</span>
            <div className="level-pills" role="group" aria-labelledby="free-play-level-label">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  className={`level-pill ${level === lvl ? "active" : ""}`}
                  aria-pressed={level === lvl}
                  onClick={() => selectLevel(lvl)}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <dl className="readout">
            <div className="readout__row">
              <dt className="readout__label">Level score</dt>
              <dd className="readout__value">{score}</dd>
            </div>
          </dl>

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
              onClick={() => confirm("reset", () => startLevel(level))}
            >
              Reset
            </button>
            <button
              type="button"
              data-confirm="reveal"
              className={`btn btn--ghost ${pendingAction === "reveal" ? "armed" : ""}`}
              onClick={() => confirm("reveal", handleReveal)}
            >
              Reveal
            </button>
            <button type="button" className="btn btn--primary" onClick={handleSubmit}>
              Submit
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
