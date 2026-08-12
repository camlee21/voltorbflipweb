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

import { useAuthContext } from "../contexts/AuthContext";
import { useWalletContext } from "../contexts/WalletContext";
import { useEquippedTheme } from "../utils/useEquippedTheme";
import { getTheme } from "../game/themes";

import "./FreePlayGame.css";
import "./RogueGame.css";

const VOLTORB_ICON = "/sprites/counters/voltorb-count-icon.png";
const STAGGER_MS = 90;

// How long the "You have earned X coins!" toast stays visible.
const COIN_NOTIF_MS = 3000;

const POWERS = {
  Protect: {
    icon: "/sprites/powers/protect.png",
    desc: "Survive a Voltorb instead of losing. This power can stack.",
  },
  "Corner Count": {
    icon: "/sprites/powers/corner-count.png",
    desc: "Reveals the stat counter for the main diagonal.",
    },
  "Money Multiplier": {
    icon: "/sprites/powers/money-multiplier.png",
    desc: "Doubles the bonus score offered when you level up.",
  },
  "Reveal 3": {
    icon: "/sprites/powers/reveal-3.png",
    desc: "Automatically flips a 3 tile (or a 2, if no 3 is on the board) at the start of each level.",
  },
  Peek: {
    icon: "/sprites/powers/peek.png",
    desc: "Reveal a tile for a second without flipping it. This power stacks, each copy adding two charges.",
  },
  "No Ones": {
    icon: "/sprites/powers/no-ones.png",
    desc: "Flipping a 1 costs you 10% of your total score — but your banked score doubles each level.",
  },
  "Mega Stone": {
    icon: "/sprites/powers/mega-stone.png",
    desc: "Your score quadruples if the first tile you flip for the level is a Voltorb.",
  },
};
const ALL_POWER_NAMES = Object.keys(POWERS);

function randomPower(currentPowers) {
  const available = ALL_POWER_NAMES.filter((p) => !currentPowers.includes(p));
  const pool = available.length > 0 ? available : ALL_POWER_NAMES;
  return pool[Math.floor(Math.random() * pool.length)];
}

function buildLevel(levelNumber) {
  const pattern = getRandomPatternForLevel(levelNumber);
  return buildGrid(pattern); // { grid, maxScore }
}

function diagonalStats(grid) {
  let voltorbs = 0;
  let points = 0;
  for (let i = 0; i < 5; i++) {
    const tile = grid[i][i];
    if (tile.value === 0) voltorbs += 1;
    else points += tile.value;
  }
  return { voltorbs, points };
}

function getMessageTone(msg) {
  if (!msg) return "";
  if (msg.includes("beaten") || msg.includes("Protected") || msg.includes("Mega")) return "message--success";
  if (msg.includes("lost") || msg.includes("reset")) return "message--error";
  return "message--neutral";
}

export default function RogueGame() {
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

  const [currentPowers, setCurrentPowers] = useState([]);
  const [numProtects, setNumProtects] = useState(0);
  const [numPeeks, setNumPeeks] = useState(0);
  const [peekArmed, setPeekArmed] = useState(false);
  const [infoPower, setInfoPower] = useState(null);

  const [showRewardPopup, setShowRewardPopup] = useState(false);
  const [showGameOverPopup, setShowGameOverPopup] = useState(false);
  const [rewardChoice, setRewardChoice] = useState(null); // power offered this level-up

  // "You have earned X coins!" toast — shown when a run ends in a loss and
  // the final total score gets banked as coins.
  const [coinNotification, setCoinNotification] = useState(null);
  const coinNotifTimeoutRef = useRef(null);

  // Gates the column-stagger animation so a normal single-tile flip (and
  // tempFlip's Protect/Peek/Mega Stone peeks) stay instant.
  const [revealing, setRevealing] = useState(false);

  const [pendingAction, setPendingAction] = useState(null); // mirrors Free Play's confirm-arm reset
  const resetBtnRef = useRef(null);

  const cornerCountOn = currentPowers.includes("Corner Count");
  const protectOn = currentPowers.includes("Protect");
  const noOnesOn = currentPowers.includes("No Ones");
  const megaOn = currentPowers.includes("Mega Stone");
  const moneyMultiplier = currentPowers.includes("Money Multiplier") ? 2 : 1;
  const firstFlipRef = useRef(false);

  function showCoinNotification(amount) {
    setCoinNotification(amount);
    if (coinNotifTimeoutRef.current) clearTimeout(coinNotifTimeoutRef.current);
    coinNotifTimeoutRef.current = setTimeout(() => {
      setCoinNotification(null);
      coinNotifTimeoutRef.current = null;
    }, COIN_NOTIF_MS);
  }

  useEffect(() => {
    startNewLevel(1, []);
    return () => {
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
  // (score === maxScore), replacing the old manual Submit button. The
  // reward popup that follows requires the player to click a choice, which
  // is what gives them time to register the win before the next level loads
  // — no extra timer needed here, unlike Classic mode.
  useEffect(() => {
    if (grid.length === 0) return;
    if (gameOver || showRewardPopup) return;
    if (score !== maxScore) return;

    setMessage("Level beaten!");
    setRewardChoice(randomPower(currentPowers));
    setShowRewardPopup(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, maxScore, gameOver, showRewardPopup, grid.length]);

  function startNewLevel(levelNumber, powers) {
    const { grid: newGrid, maxScore: newMax } = buildLevel(levelNumber);
    let workingGrid = newGrid;
    let startScore = 1;
    firstFlipRef.current = false;
    setRevealing(false);

    if (powers.includes("Reveal 3")) {
        const flat = [];
        workingGrid.forEach((row, r) => row.forEach((tile, c) => flat.push({ r, c, tile })));
        const target =
        flat.find((t) => t.tile.value === 3 && !t.tile.revealed) ||
        flat.find((t) => t.tile.value === 2 && !t.tile.revealed);
        if (target) {
        workingGrid = workingGrid.map((row) => row.map((t) => ({ ...t })));
        workingGrid[target.r][target.c].revealed = true;
        startScore *= target.tile.value;
        firstFlipRef.current = true; // this auto-reveal counts as the level's first flip
        if (powers.includes("Mega Stone")) {
            setCurrentPowers((p) => p.filter((x) => x !== "Mega Stone"));
        }
        }
    }

    setGrid(workingGrid);
    setMaxScore(newMax);
    setScore(startScore);
    }

  function tempFlip(row, col) {
    setGrid((g) => {
      const next = g.map((r) => r.map((t) => ({ ...t })));
      next[row][col].revealed = true;
      return next;
    });
    setTimeout(() => {
      setGrid((g) => {
        const next = g.map((r) => r.map((t) => ({ ...t })));
        next[row][col].revealed = false;
        return next;
      });
    }, 1000);
  }

  function handleFlip(row, col) {
    if (gameOver || showRewardPopup) return;
    const tile = grid[row][col];
    if (tile.revealed) return;

    if (peekArmed) {
        tempFlip(row, col);
        setPeekArmed(false);
        setNumPeeks((n) => {
        const next = n - 1;
        if (next <= 0) {
            setCurrentPowers((p) => p.filter((x) => x !== "Peek"));
            return 0;
        }
        return next;
        });
        return; // peeking doesn't count as "the first flip"
    }

    const value = tile.value;
    const isFirstFlip = !firstFlipRef.current;
    firstFlipRef.current = true;

    if (value !== 0) {
        const newGrid = grid.map((r) => r.map((t) => ({ ...t })));
        newGrid[row][col].revealed = true;
        newGrid[row][col].noted = false;
        setGrid(newGrid);

        if (value === 1 && noOnesOn) {
        setTotalScore((t) => Math.round(t - t * 0.1));
        }
        setScore((s) => s * value);

        // Mega Stone only survives if a Voltorb is the very first tile flipped.
        if (megaOn && isFirstFlip) {
        setCurrentPowers((p) => p.filter((x) => x !== "Mega Stone"));
        }
        return;
    }

    // Hit a Voltorb.
    if (megaOn && isFirstFlip) {
        tempFlip(row, col);
        setTotalScore((t) => t * 4);
        setCurrentPowers((p) => p.filter((x) => x !== "Mega Stone"));
        setMessage("Your Mega Stone shattered the Voltorb - total score x4!");
        return;
    }

    if (protectOn) {
        tempFlip(row, col);
        setNumProtects((n) => {
        const next = n - 1;
        if (next <= 0) {
            setCurrentPowers((p) => p.filter((x) => x !== "Protect"));
            return 0;
        }
        return next;
        });
        setMessage("You use Protect! You survive the Voltorb hit.");
        return;
    }

    // No Protect left, no Mega Stone save - the run ends here.
    const newGrid = grid.map((r) => r.map((t) => ({ ...t })));
    newGrid[row][col].revealed = true;
    setGrid(newGrid);
    setGameOver(true);
    setMessage("Oops! You lost!");
    setTimeout(() => {
        setGrid(revealBoard(newGrid));
        setRevealing(true);
        const scoreMult = noOnesOn ? 2 : 1;
        const finalTotal = totalScore + score * scoreMult;
        setTotalScore(finalTotal);

        // Losing a run banks the final total score as coins.
        if (finalTotal > 0) {
          if (user) addCoins(finalTotal);
          if (user) showCoinNotification(finalTotal);
        }
        // setShowGameOverPopup(true);
    }, 500);
    }

  function toggleNote(row, col) {
    if (gameOver || showRewardPopup) return;
    const tile = grid[row][col];
    if (tile.revealed) return;
    const newGrid = grid.map((r) => r.map((t) => ({ ...t })));
    newGrid[row][col].noted = !newGrid[row][col].noted;
    setGrid(newGrid);
  }

  function applyLevelUp(updatedPowers) {
    setShowRewardPopup(false);
    const nextLevel = level + 1;
    setLevel(nextLevel);
    setMessage("");
    startNewLevel(nextLevel, updatedPowers);
  }

  function handleTakePower() {
    const power = rewardChoice;
    const updatedPowers = [...currentPowers, power];
    setCurrentPowers(updatedPowers);
    if (power === "Protect") setNumProtects((n) => n + 1);
    if (power === "Peek") setNumPeeks((n) => n + 2);
    const scoreMult = updatedPowers.includes("No Ones") ? 2 : 1;
    setTotalScore((t) => t + score * scoreMult);
    applyLevelUp(updatedPowers);
  }

  function handleTakeBonusScore() {
    const bonus = level * 50 * moneyMultiplier;
    const scoreMult = noOnesOn ? 2 : 1;
    setTotalScore((t) => t + score * scoreMult + bonus);
    applyLevelUp(currentPowers);
  }

  function handleNewRun() {
    setLevel(1);
    setTotalScore(0);
    setCurrentPowers([]);
    setNumProtects(0);
    setNumPeeks(0);
    setPeekArmed(false);
    setGameOver(false);
    setShowGameOverPopup(false);
    setShowRewardPopup(false);
    setMessage("");
    startNewLevel(1, []);
  }

  function handleDangerClick() {
    if (pendingAction === "reset") {
      setPendingAction(null);
      handleNewRun();
      return;
    }
    setPendingAction("reset");
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
    <div
      className="free-play-page rogue-page"
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
        <section className="board-panel" aria-label="Rogue board">
          <div className="powers-bar" aria-label="Active powers">
            <span className="powers-bar__label">Powers</span>
            <div className="powers-bar__icons">
              {currentPowers.length === 0 && (
                <span className="powers-bar__empty">None yet - beat a level to pick one up.</span>
              )}
              {currentPowers.map((power, i) => (
                <button
                  key={`${power}-${i}`}
                  type="button"
                  className="power-icon"
                  onClick={() => setInfoPower(power)}
                  title={power}
                >
                  <img src={POWERS[power].icon} alt={power} />
                  {power === "Protect" && numProtects > 1 && (
                    <span className="power-icon__badge">{numProtects}</span>
                  )}
                  {power === "Peek" && numPeeks > 1 && (
                    <span className="power-icon__badge">{numPeeks}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="board" style={{ "--tile-size": "clamp(40px, 12vw, 80px)" }} onContextMenu={suppressBoardContextMenu}>
            {grid.map((row, r) => (
              <div key={r} style={{ display: "contents" }}>
                {row.map((tile, c) => (
                  <Tile
                    key={tile.id}
                    tile={tile}
                    theme={equippedTheme}
                    disabled={gameOver || showRewardPopup}
                    onFlip={() => handleFlip(r, c)}
                    onNote={() => toggleNote(r, c)}
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

            {cornerCountOn ? (
              (() => {
                const stats = diagonalStats(grid);
                return <Counter points={stats.points} voltorbs={stats.voltorbs} icon={VOLTORB_ICON} />;
              })()
            ) : (
              <div />
            )}
          </div>

          <p className="hint">
            Right-click (or long-press on mobile) a tile to note it.
            {currentPowers.includes("Peek") && " Click Peek below, then a tile, to look without flipping."}
          </p>
        </section>

        <aside className="sidebar">
          <div className="sidebar__group">
            <span className="field-label">Level</span>
            <div className="rogue-level-display">{level}</div>
          </div>

          <div className="rogue-scores">
            <div className="scoreboard">
              <span className="scoreboard__label">Lvl. Score</span>
              <span className="scoreboard__value">{score}</span>
            </div>
            <div className="scoreboard">
              <span className="scoreboard__label">Total</span>
              <span className="scoreboard__value">{totalScore}</span>
            </div>
          </div>

          {currentPowers.includes("Peek") && (
            <button
              type="button"
              className={`btn btn--ghost btn--peek ${peekArmed ? "armed-peek" : ""}`}
              onClick={() => setPeekArmed((a) => !a)}
              disabled={gameOver || showRewardPopup}
            >
              {peekArmed ? "Click a tile to peek…" : `Use Peek (${numPeeks} left)`}
            </button>
          )}

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

      {showRewardPopup && (
        <div className="rogue-popup-overlay">
          <div className="rogue-popup">
            <h2 className="rogue-popup__title">Level {level} beaten!</h2>
            <p className="rogue-popup__subtitle">Choose your reward:</p>
            <div className="rogue-popup__choices">
              <button type="button" className="rogue-popup__choice" onClick={handleTakePower}>
                <img src={POWERS[rewardChoice].icon} alt={rewardChoice} />
                <span className="rogue-popup__choice-title">{rewardChoice}</span>
                <span className="rogue-popup__choice-desc">{POWERS[rewardChoice].desc}</span>
              </button>
              <button type="button" className="rogue-popup__choice" onClick={handleTakeBonusScore}>
                <span className="rogue-popup__choice-emoji">✦</span>
                <span className="rogue-popup__choice-title">+{level * 50 * moneyMultiplier} Bonus Score</span>
                <span className="rogue-popup__choice-desc">Added straight to your total score.</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showGameOverPopup && (
        <div className="rogue-popup-overlay">
          <div className="rogue-popup">
            <h2 className="rogue-popup__title">Run over!</h2>
            <p className="rogue-popup__subtitle">
              You reached level {level} with a total score of {totalScore}.
            </p>
            <button type="button" className="btn btn--primary rogue-popup__cta" onClick={handleNewRun}>
              Start New Run
            </button>
          </div>
        </div>
      )}

      {infoPower && (
        <div className="rogue-popup-overlay" onClick={() => setInfoPower(null)}>
          <div className="rogue-popup" onClick={(e) => e.stopPropagation()}>
            <img className="rogue-popup__info-icon" src={POWERS[infoPower].icon} alt={infoPower} />
            <h2 className="rogue-popup__title">{infoPower}</h2>
            <p className="rogue-popup__subtitle">{POWERS[infoPower].desc}</p>
            <button type="button" className="btn btn--primary rogue-popup__cta" onClick={() => setInfoPower(null)}>
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}