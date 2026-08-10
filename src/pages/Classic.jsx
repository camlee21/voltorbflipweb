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
import "./FreePlayGame.css"; // shares the board/tile/panel look with Free Play
import "./Classic.css";

import { addPokedollars } from "../utils/pokedollars";

const THEME = "classic";
const VOLTORB_ICON = "/sprites/counters/voltorb-count-icon.png";
const STAGGER_MS = 90;

// Timing for the automatic loss sequence.
const REVEAL_DELAY_MS = 500; // delay before the full board flips over
const REVEAL_HOLD_MS = 1400; // time to look at the revealed board before the regression note appears
const MESSAGE_HOLD_MS = 1800; // time to read the regression note before the next level quietly starts

function buildLevel(levelNumber) {
  const pattern = getRandomPatternForLevel(levelNumber);
  return buildGrid(pattern); // { grid, maxScore }
}

function getMessageTone(msg) {
  if (!msg) return "";
  if (msg.includes("beaten")) return "message--success";
  if (msg.includes("lost") || msg.includes("unfinished") || msg.includes("pushed back")) return "message--error";
  return "message--neutral";
}

export default function Classic() {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(1);
  const [totalScore, setTotalScore] = useState(0);
  const [grid, setGrid] = useState([]);
  const [maxScore, setMaxScore] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState("");

  // Number of multiplier cards (including ×1s) successfully flipped during
  // the current level attempt. Used to compute the level-drop on a loss.
  const [flipCount, setFlipCount] = useState(0);

  // Staggered-reveal state: `origin` is the tile the cascade ripples out from
  // (the clicked Voltorb on a loss, or null for the win reveal's diagonal wave).
  // `revealing` gates the stagger so a normal single-tile flip stays instant.
  const [origin, setOrigin] = useState(null);
  const [revealing, setRevealing] = useState(false);

  // True once a level's been successfully submitted and its board revealed,
  // until the player explicitly advances — swaps Submit for a Next Level button.
  const [awaitingNextLevel, setAwaitingNextLevel] = useState(false);

  const [showGameOverPopup, setShowGameOverPopup] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const resetBtnRef = useRef(null);

  // Tracks every pending setTimeout from the loss sequence so it can be
  // cancelled if the player starts a new run (or the component unmounts)
  // before it finishes playing out.
  const timeoutsRef = useRef([]);

  function clearPendingTimeouts() {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }

  useEffect(() => {
    startNewLevel(1);
    return clearPendingTimeouts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!pendingAction) return;
    function handleWindowClick(e) {
      if (resetBtnRef.current && !resetBtnRef.current.contains(e.target)) {
        setPendingAction(null);
      }
    }
    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, [pendingAction]);

  function startNewLevel(levelNumber) {
    const { grid: newGrid, maxScore: newMax } = buildLevel(levelNumber);
    setGrid(newGrid);
    setMaxScore(newMax);
    setScore(1);
    setFlipCount(0);
    setOrigin(null);
    setRevealing(false);
    setAwaitingNextLevel(false);
  }

  function handleFlip(row, col) {
    if (gameOver) return;
    const tile = grid[row][col];
    if (tile.revealed) return;

    const value = tile.value;

    if (value !== 0) {
      const newGrid = grid.map((r) => r.map((t) => ({ ...t })));
      newGrid[row][col].revealed = true;
      newGrid[row][col].noted = false;
      setGrid(newGrid);
      setScore((s) => s * value);
      setFlipCount((c) => c + 1);
      return;
    }

    // Hit a Voltorb — the run ends here. The level score is forfeited
    // (never added to totalScore), and totalScore is left untouched.
    // `flipCount` here is whatever it was before this flip, since a
    // Voltorb doesn't increment it — exactly the count the regression
    // rule needs.
    const flipsBeforeLoss = flipCount;

    const newGrid = grid.map((r) => r.map((t) => ({ ...t })));
    newGrid[row][col].revealed = true;
    setGrid(newGrid);
    setGameOver(true);
    setMessage("Oops! You lost!");
    setOrigin({ row, col });

    const revealTimeout = setTimeout(() => {
      setGrid(revealBoard(newGrid));
      setRevealing(true);
      //   setShowGameOverPopup(true);

      const messageTimeout = setTimeout(() => {
        const nextLevel = flipsBeforeLoss < level ? Math.max(1, flipsBeforeLoss) : level;

        setMessage(
          nextLevel < level
            ? `You've been pushed back to level ${nextLevel}!`
            : `You're still on level ${level}.`
        );

        const advanceTimeout = setTimeout(() => {
          setLevel(nextLevel);
          setGameOver(false);
          setMessage("");
          startNewLevel(nextLevel);
        }, MESSAGE_HOLD_MS);

        timeoutsRef.current.push(advanceTimeout);
      }, REVEAL_HOLD_MS);

      timeoutsRef.current.push(messageTimeout);
    }, REVEAL_DELAY_MS);

    timeoutsRef.current.push(revealTimeout);
  }

  function toggleNote(row, col) {
    if (gameOver) return;
    const tile = grid[row][col];
    if (tile.revealed) return;
    const newGrid = grid.map((r) => r.map((t) => ({ ...t })));
    newGrid[row][col].noted = !newGrid[row][col].noted;
    setGrid(newGrid);
  }

  function handleSubmit() {
    if (score !== maxScore) {
      setMessage("Game unfinished!");
      return;
    }
    setMessage("Level beaten!");
    setOrigin(null); // no clicked tile to ripple from — use the diagonal wave
    setGrid((g) => revealBoard(g));
    setRevealing(true);
    setAwaitingNextLevel(true);
  }

  function handleNextLevel() {
    const nextLevel = level + 1;
    setTotalScore((t) => t + score);
    setLevel(nextLevel);
    startNewLevel(nextLevel);
    setMessage("");
  }

  function handleNewRun() {
    clearPendingTimeouts();
    setLevel(1);
    setTotalScore(0);
    setGameOver(false);
    setShowGameOverPopup(false);
    setMessage("");
    startNewLevel(1);
  }

  function handleDangerClick() {
    if (pendingAction === "reset") {
      setPendingAction(null);
      handleNewRun();
      return;
    }
    setPendingAction("reset");
  }

  function flipDelayFor(row, col, tile) {
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
    <div className="free-play-page classic-page">
      <main className="layout">
        <section className="board-panel" aria-label="Classic board">
          <div
            className="board"
            style={{ "--tile-size": "clamp(40px, 12vw, 80px)" }}
            onContextMenu={suppressBoardContextMenu}
          >
            {grid.map((row, r) => (
              <div key={r} style={{ display: "contents" }}>
                {row.map((tile, c) => (
                  <Tile
                    key={tile.id}
                    tile={tile}
                    theme={THEME}
                    disabled={gameOver}
                    onFlip={() => handleFlip(r, c)}
                    onNote={() => toggleNote(r, c)}
                    flipDelay={flipDelayFor(r, c, tile)}
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

          <p className="hint">Right-click a tile to note it.</p>
        </section>

        <aside className="sidebar">
          <div className="sidebar__group">
            <span className="field-label">Level</span>
            <div className="classic-level-display">{level}</div>
          </div>

          <div className="classic-scores">
            <div className="scoreboard">
              <span className="scoreboard__label">Lvl. Score</span>
              <span className="scoreboard__value">{score}</span>
            </div>
            <div className="scoreboard">
              <span className="scoreboard__label">Total</span>
              <span className="scoreboard__value">{totalScore}</span>
            </div>
          </div>

          {message && <p className={`message ${getMessageTone(message)}`}>{message}</p>}

          <div className="sidebar__actions">
            <button
              ref={resetBtnRef}
              type="button"
              className={`btn btn--ghost ${pendingAction === "reset" ? "armed" : ""}`}
              onClick={handleDangerClick}
            >
              New Run
            </button>
            {!gameOver && (
              awaitingNextLevel ? (
                <button type="button" className="btn btn--primary" onClick={handleNextLevel}>
                  Next Level
                </button>
              ) : (
                <button type="button" className="btn btn--primary" onClick={handleSubmit}>
                  Submit
                </button>
              )
            )}
          </div>
        </aside>
      </main>

      {showGameOverPopup && (
        <div className="classic-popup-overlay">
          <div className="classic-popup">
            <h2 className="classic-popup__title">Run over!</h2>
            <p className="classic-popup__subtitle">
              You reached level {level} with a total score of {totalScore}.
            </p>
            <button type="button" className="btn btn--primary classic-popup__cta" onClick={handleNewRun}>
              Start New Run
            </button>
          </div>
        </div>
      )}
    </div>
  );
}