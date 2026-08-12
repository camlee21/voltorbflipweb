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

import { useAuthContext } from "../contexts/AuthContext";
import { useWalletContext } from "../contexts/WalletContext";
import { useEquippedTheme } from "../utils/useEquippedTheme";
import { getTheme } from "../game/themes";

const VOLTORB_ICON = "/sprites/counters/voltorb-count-icon.png";
const STAGGER_MS = 90;

// Timing for the automatic loss sequence.
const REVEAL_DELAY_MS = 500; // delay before the full board flips over
const REVEAL_HOLD_MS = 1400; // time to look at the revealed board before the regression note appears
const MESSAGE_HOLD_MS = 2200; // time to read the regression note before the next level quietly starts

// Timing for the automatic win sequence — gives the player a moment to
// see "Level beaten!" and the revealed board before the next level loads.
const WIN_HOLD_MS = 2500;

// How long the "You have earned X coins!" toast stays visible.
const COIN_NOTIF_MS = 3000;

function buildLevel(levelNumber) {
  const pattern = getRandomPatternForLevel(levelNumber);
  return buildGrid(pattern); // { grid, maxScore }
}

function getMessageTone(msg) {
  if (!msg) return "";
  if (msg.includes("beaten")) return "message--success";
  if (msg.includes("lost") || msg.includes("pushed back")) return "message--error";
  return "message--neutral";
}

export default function Classic() {
  const { user } = useAuthContext();
  const { addCoins } = useWalletContext();

  // The player's currently-equipped board theme (defaults to "classic").
  // Tile sprite paths (`/sprites/${value}_${theme}.png`) key off this.
  const [equippedTheme] = useEquippedTheme();
  const themeColours = getTheme(equippedTheme);

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

  // True from the moment all 2s/3s are flipped (score === maxScore) until
  // the next level has been built. Freezes the board and guards the win
  // effect against firing more than once for the same level.
  const [awaitingNextLevel, setAwaitingNextLevel] = useState(false);

  const [showGameOverPopup, setShowGameOverPopup] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const resetBtnRef = useRef(null);

  // "You have earned X coins!" toast — only ever shown when a new run is
  // started and the just-finished run's total score gets banked.
  const [coinNotification, setCoinNotification] = useState(null);
  const coinNotifTimeoutRef = useRef(null);

  // Tracks every pending setTimeout from the loss/win sequences so they can
  // be cancelled if the player starts a new run (or the component unmounts)
  // before they finish playing out.
  const timeoutsRef = useRef([]);

  function clearPendingTimeouts() {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }

  function showCoinNotification(amount) {
    setCoinNotification(amount);
    if (coinNotifTimeoutRef.current) clearTimeout(coinNotifTimeoutRef.current);
    coinNotifTimeoutRef.current = setTimeout(() => {
      setCoinNotification(null);
      coinNotifTimeoutRef.current = null;
    }, COIN_NOTIF_MS);
  }

  useEffect(() => {
    startNewLevel(1);
    return () => {
      clearPendingTimeouts();
      if (coinNotifTimeoutRef.current) clearTimeout(coinNotifTimeoutRef.current);
    };
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

  // Fires automatically the instant every 2 and 3 has been flipped
  // (score === maxScore), replacing the old manual Submit button. Reveals
  // the board, shows "Level beaten!", then quietly advances after
  // WIN_HOLD_MS so the player has time to register the win.
  useEffect(() => {
    if (grid.length === 0) return;
    if (gameOver || awaitingNextLevel) return;
    if (score !== maxScore) return;

    setMessage("Level beaten!");
    setOrigin(null); // no clicked tile to ripple from — use the diagonal wave
    setGrid((g) => revealBoard(g));
    setRevealing(true);
    setAwaitingNextLevel(true);

    const winTimeout = setTimeout(() => {
      const nextLevel = level + 1;
      setTotalScore((t) => t + score);
      setLevel(nextLevel);
      startNewLevel(nextLevel);
      setMessage("");
    }, WIN_HOLD_MS);

    timeoutsRef.current.push(winTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, maxScore, gameOver, awaitingNextLevel, grid.length]);

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
    if (gameOver || awaitingNextLevel) return;
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
    // Coins are NOT awarded here — only when the player starts a new run.
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
    if (gameOver || awaitingNextLevel) return;
    const tile = grid[row][col];
    if (tile.revealed) return;
    const newGrid = grid.map((r) => r.map((t) => ({ ...t })));
    newGrid[row][col].noted = !newGrid[row][col].noted;
    setGrid(newGrid);
  }

  function handleNewRun() {
    clearPendingTimeouts();

    // Bank whatever total score was built up before wiping it out.
    if (totalScore > 0) {
      if (user) addCoins(totalScore);
      if (user) showCoinNotification(totalScore);
    }

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
    <div
      className="free-play-page classic-page"
      style={{ "--theme-bg": themeColours.bgColour, "--theme-accent": themeColours.accentColour }}
    >
      {coinNotification !== null && (
        <div
          role="status"
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            padding: "10px 18px",
            borderRadius: "10px",
            background: "rgba(20, 160, 90, 0.95)",
            color: "#fff",
            fontWeight: 600,
            fontSize: "14px",
            boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
            animation: "coin-toast-fade 3s ease forwards",
          }}
        >
          You have earned {coinNotification.toLocaleString()} coins!
        </div>
      )}
      <style>{`
        @keyframes coin-toast-fade {
          0% { opacity: 0; transform: translate(-50%, -8px); }
          10% { opacity: 1; transform: translate(-50%, 0); }
          85% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, -8px); }
        }
      `}</style>

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
                    theme={equippedTheme}
                    disabled={gameOver || awaitingNextLevel}
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

          <p className="hint">Right-click (or long-press on mobile) a tile to note it.</p>
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