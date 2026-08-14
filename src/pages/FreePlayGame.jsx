import { useEffect, useRef, useState } from "react";

import Tile from "../components/Tile";
import Counter from "../components/Counter";
import { suppressBoardContextMenu } from "../utils/boardContextMenu";

import {
  getRandomPatternForLevel,
  buildGrid,
  rowStats,
  columnStats,
  revealBoard,
} from "../game/gameLogic";

import { useEquippedTheme } from "../utils/useEquippedTheme";

import "./FreePlayGame.css";

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8];
const BACKGROUND_IMAGE = `/sprites/voltorb_background.png`;
const VOLTORB_ICON = "/sprites/counters/voltorb-count-icon.png";
const POINTS_ICON = "/sprites/counters/points-count-icon-placeholder.png";
const STAGGER_MS = 90;

function getMessageTone(msg) {
  if (!msg) return "";
  if (msg.includes("beaten")) return "message--success";
  if (msg.includes("lost") || msg.includes("unfinished") || msg.includes("Reset")) return "message--error";
  return "message--neutral";
}

export default function FreePlayGame() {
  // The player's currently-equipped board theme (defaults to "classic")
  // Tile sprite paths (`/sprites/${value}_${theme}.png`) key off this
  const [equippedTheme] = useEquippedTheme();

  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [newGame, setNewGame] = useState(true);
  const [grid, setGrid] = useState([]);
  const [maxScore, setMaxScore] = useState(1);
  const [message, setMessage] = useState("");
  const [pendingAction, setPendingAction] = useState(null);

  // Gates the column-stagger animation so a normal single-tile flip stays instant.
  const [revealing, setRevealing] = useState(false);

  // Guards against the level-change effect firing on first mount
  const isFirstRender = useRef(true);
  const resetBtnRef = useRef(null);
  const revealBtnRef = useRef(null);

  useEffect(() => {
    startLevel(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    startLevel(level);
    setScore(1);
    setNewGame(true);
    setGameOver(false);
    setMessage("");
    setRevealing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  useEffect(() => {
    if (!pendingAction) return;
    function handleWindowClick(e) {
      const activeRef = pendingAction === "reset" ? resetBtnRef.current : revealBtnRef.current;
      if (activeRef && !activeRef.contains(e.target)) {
        setPendingAction(null);
      }
    }
    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, [pendingAction]);

  function startLevel(levelNumber) {
    const pattern = getRandomPatternForLevel(levelNumber);
    const { grid, maxScore } = buildGrid(pattern);
    setGrid(grid);
    setMaxScore(maxScore);
  }

  function handleFlip(row, col) {
    if (gameOver) return;
    const tile = grid[row][col];
    if (tile.revealed) return;

    const value = tile.value;
    const newGrid = grid.map((r) => r.map((t) => ({ ...t })));
    newGrid[row][col].revealed = true;
    newGrid[row][col].noted = false;
    setGrid(newGrid);

    if (value !== 0) {
      setScore((s) => s * value);
    } else {
      // Hit a Voltorb.
      setGameOver(true);
      setMessage("Oops! You lost!");
      setTimeout(() => {
        setGrid(revealBoard(newGrid));
        setRevealing(true);
      }, 500);
    }
  }

  function toggleNote(row, col) {
    const tile = grid[row][col];
    if (tile.revealed) return;
    const newGrid = grid.map((r) => r.map((t) => ({ ...t })));
    newGrid[row][col].noted = !newGrid[row][col].noted;
    setGrid(newGrid);
  }

  function handleRightClickNote(row, col) {
    if (gameOver) return;
    toggleNote(row, col);
  }

  function handleReset() {
    startLevel(level);
    setScore(1);
    setNewGame(true);
    setGameOver(false);
    setMessage("");
    setRevealing(false);
  }

  function handleReveal() {
    setGrid(revealBoard(grid));
    setRevealing(true);
  }

  function handleDangerClick(action) {
    if (pendingAction === action) {
      setPendingAction(null);
      if (action === "reset") handleReset();
      else handleReveal();
      return;
    }
    if (pendingAction !== null) {
      setPendingAction(null);
      return;
    }
    setPendingAction(action);
  }

  function handleSubmit() {
    if (score === maxScore && newGame) {
      setMessage("Level beaten!");
      setNewGame(false);
      setGrid(revealBoard(grid));
      setRevealing(true);
      // setTimeout(() => {
      //   startLevel(level);
      //   setNewGame(true);
      //   setScore(1);
      //   setMessage("");
      // }, 1000);
    } else if (score === maxScore) {
      setMessage("Reset to start a new game.");
    } else {
      setMessage("Game unfinished!");
    }
  }

  function flipDelayFor(col, tile) {
    if (!revealing || !tile.revealed) return 0;
    return col * STAGGER_MS;
  }

  if (grid.length === 0) {
    return (
      <div className="free-play-page">
        <p className="loading-text">Loading…</p>
      </div>
    );
  }

  return (
    <div className="free-play-page" style={{ "--bg-image": `url(${BACKGROUND_IMAGE})` }}>

      <main className="layout">
        <section className="board-panel" aria-label="Game board">
          <div className="board" style={{ "--tile-size": "clamp(40px, 12vw, 80px)" }} onContextMenu={suppressBoardContextMenu}>
            {grid.map((row, r) => (
              <div key={r} style={{ display: "contents" }}>
                {row.map((tile, c) => (
                  <Tile
                    key={tile.id}
                    tile={tile}
                    theme={equippedTheme}
                    disabled={gameOver}
                    onFlip={() => handleFlip(r, c)}
                    onNote={() => handleRightClickNote(r, c)}
                    flipDelay={flipDelayFor(c, tile)}
                  />
                ))}
                {(() => {
                  const stats = rowStats(grid, r);
                  return <Counter points={stats.points} voltorbs={stats.voltorbs} icon={VOLTORB_ICON} />;
                })()}
              </div>
            ))}

            {[0, 1, 2, 3, 4].map((c) => {
              const stats = columnStats(grid, c);
              return <Counter key={`col-${c}`} points={stats.points} voltorbs={stats.voltorbs} icon={VOLTORB_ICON} />;
            })}
            <div />
          </div>

          <p className="hint">Right-click (or long-press on mobile) a tile to note it.</p>
        </section>

        <aside className="sidebar">
          <div className="sidebar__group">
            <span className="field-label">Level</span>
            <div className="level-pills" role="group" aria-label="Level">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  className={`level-pill ${level === lvl ? "active" : ""}`}
                  onClick={() => setLevel(lvl)}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="scoreboard">
            <span className="scoreboard__label">Lvl. Score</span>
            <span className="scoreboard__value">{score}</span>
          </div>

          {message && <p className={`message ${getMessageTone(message)}`}>{message}</p>}

          <div className="sidebar__actions">
            <button
              ref={resetBtnRef}
              type="button"
              className={`btn btn--ghost ${pendingAction === "reset" ? "armed" : ""}`}
              onClick={() => handleDangerClick("reset")}
            >
              Reset
            </button>
            <button
              ref={revealBtnRef}
              type="button"
              className={`btn btn--ghost ${pendingAction === "reveal" ? "armed" : ""}`}
              onClick={() => handleDangerClick("reveal")}
            >
              Reveal
            </button>
            <button type="button" className="btn btn--primary" onClick={handleSubmit}>
              Submit
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}