import { useEffect, useRef, useState } from "react";

import Board from "../components/Board";
import NoteToggle from "../components/NoteToggle";
import CoinToast from "../components/CoinToast";
import Modal from "../components/Modal";

import {
  buildLevel,
  revealTile,
  hideTile,
  toggleTileNote,
  revealBoard,
  diagonalStats,
  MAX_LEVEL,
} from "../game/gameLogic";
import {
  POWERS,
  randomPower,
  takePower,
  spendCharge,
  pickReveal3Target,
  bankedLevelScore,
  bonusScore,
  noOnesPenalty,
} from "../game/rogueLogic";

import { useAuthContext } from "../contexts/useAuthContext";
import { useWalletContext } from "../contexts/useWalletContext";
import { useEquippedTheme } from "../utils/useEquippedTheme";
import { useTimeouts } from "../hooks/useTimeouts";
import { useConfirmArm } from "../hooks/useConfirmArm";
import { useCoinToast } from "../hooks/useCoinToast";

import "./FreePlayGame.css";
import "./RogueGame.css";

// How long the max-level "well done" message stays up before looping back.
const MAX_LEVEL_HOLD_MS = 2500;
// How long a Peek shows a tile.
const PEEK_MS = 1000;
// Delay before the whole board flips up after a loss.
const LOSS_REVEAL_MS = 500;

const NO_POWERS = { powers: [], charges: {} };

function getMessageTone(msg) {
  if (!msg) return "";
  if (msg.includes("beaten") || msg.includes("Protect") || msg.includes("Mega") || msg.includes("Well done")) return "message--success";
  if (msg.includes("lost") || msg.includes("reset")) return "message--error";
  return "message--neutral";
}

// Builds a level's board, applying Reveal 3's automatic flip.
// Returns { board, score }.
function setUpLevel(levelNumber, powers) {
  let { grid, maxScore } = buildLevel(levelNumber);
  let score = 1;
  if (powers.includes("Reveal 3")) {
    const target = pickReveal3Target(grid);
    if (target) {
      grid = revealTile(grid, target.row, target.col);
      score = grid[target.row][target.col].value;
    }
  }
  return { board: { grid, maxScore }, score };
}

export default function RogueGame() {
  const { user } = useAuthContext();
  const { addCoins } = useWalletContext();

  // The player's currently-equipped board theme (defaults to "classic").
  const [equippedTheme] = useEquippedTheme();

  // When on, tapping a tile notes it instead of flipping it (and takes
  // priority over an armed Peek). Long-press-to-note (see Tile.jsx) still
  // works independently either way.
  const [noteMode, setNoteMode] = useState(false);

  const [initial] = useState(() => setUpLevel(1, []));
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(initial.score);
  const [totalScore, setTotalScore] = useState(0);
  const [board, setBoard] = useState(initial.board);
  const { grid, maxScore } = board;
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState("");

  // Owned powers (each listed once) and charges for the stackable ones.
  const [kit, setKit] = useState(NO_POWERS);
  const { powers, charges } = kit;
  const [peekArmed, setPeekArmed] = useState(false);
  const [infoPower, setInfoPower] = useState(null);
  // The power offered on level-up; non-null while the reward popup is open.
  const [rewardChoice, setRewardChoice] = useState(null);
  // Holding the "beat level 8" message before looping back.
  const [awaitingMaxLevel, setAwaitingMaxLevel] = useState(false);
  // Whether a tile has been flipped this level (Mega Stone only works on the first).
  // Reveal 3's automatic flip doesn't count.
  const [firstFlipDone, setFirstFlipDone] = useState(false);

  // Gates the column-stagger animation so single-tile flips stay instant.
  const [revealing, setRevealing] = useState(false);

  const [pendingAction, confirm] = useConfirmArm();
  const [coinToast, showCoinToast] = useCoinToast();
  const { schedule, clearAll } = useTimeouts();

  const cornerCountOn = powers.includes("Corner Count");
  const noOnesOn = powers.includes("No Ones");
  const megaOn = powers.includes("Mega Stone");
  const boardLocked = gameOver || rewardChoice !== null || awaitingMaxLevel;

  const setGrid = (update) => setBoard((b) => ({ ...b, grid: update(b.grid) }));

  // A run's total is banked as coins when it ends: on a loss, on New Run, or
  // when the player leaves the page mid-run. `gameOver` means it's already banked.
  function bankCoins(amount) {
    if (!user || amount <= 0) return;
    addCoins(amount);
    showCoinToast(amount);
  }

  const unbankedRef = useRef({ total: 0, addCoins: null });
  useEffect(() => {
    unbankedRef.current = { total: gameOver || !user ? 0 : totalScore, addCoins };
  });
  useEffect(
    () => () => {
      const { total, addCoins: add } = unbankedRef.current;
      if (total > 0) add(total);
    },
    []
  );

  function startNewLevel(levelNumber, ownedPowers) {
    clearAll();
    const next = setUpLevel(levelNumber, ownedPowers);
    setBoard(next.board);
    setScore(next.score);
    setFirstFlipDone(false);
    setRevealing(false);
    setPeekArmed(false);
  }

  function winLevel(levelScore) {
    if (level >= MAX_LEVEL) {
      // No further pattern pool to advance into — bank the score like a
      // normal level-up, show a one-off message, then loop back to MAX_LEVEL.
      setMessage(`Well done, you beat Level ${MAX_LEVEL}!`);
      setAwaitingMaxLevel(true);
      setTotalScore((t) => t + bankedLevelScore(levelScore, powers));
      schedule(() => {
        setMessage("");
        setAwaitingMaxLevel(false);
        startNewLevel(MAX_LEVEL, powers);
      }, MAX_LEVEL_HOLD_MS);
      return;
    }

    // The reward popup waits for a click, which gives the player time to
    // register the win before the next level loads.
    setMessage("Level beaten!");
    setRewardChoice(randomPower(powers));
  }

  function loseRun(row, col) {
    clearAll(); // e.g. a Peek still waiting to flip back
    setGrid((g) => revealTile(g, row, col));
    setGameOver(true);
    setMessage("Oops! You lost!");
    // The level's score is lost with the run; the total so far is banked.
    bankCoins(totalScore);
    schedule(() => {
      setGrid(revealBoard);
      setRevealing(true);
    }, LOSS_REVEAL_MS);
  }

  function peek(row, col) {
    setGrid((g) => revealTile(g, row, col));
    setPeekArmed(false);
    setKit((k) => spendCharge(k.powers, k.charges, "Peek"));
    schedule(() => setGrid((g) => hideTile(g, row, col)), PEEK_MS);
  }

  function handleFlip(row, col) {
    if (boardLocked) return;
    const tile = grid[row][col];
    if (tile.revealed) return;

    if (peekArmed) {
      peek(row, col); // peeking doesn't count as "the first flip"
      return;
    }

    const isFirstFlip = !firstFlipDone;
    setFirstFlipDone(true);
    // Mega Stone only survives if a Voltorb is the very first tile flipped.
    if (megaOn && isFirstFlip) {
      setKit((k) => ({ ...k, powers: k.powers.filter((p) => p !== "Mega Stone") }));
    }

    if (tile.value !== 0) {
      setGrid((g) => revealTile(g, row, col));
      if (tile.value === 1 && noOnesOn) setTotalScore(noOnesPenalty);
      const newScore = score * tile.value;
      setScore(newScore);
      if (newScore === maxScore) winLevel(newScore);
      return;
    }

    // Hit a Voltorb. A saved Voltorb stays face-up so it can't be flipped again.
    if (megaOn && isFirstFlip) {
      setGrid((g) => revealTile(g, row, col));
      setTotalScore((t) => t * 4);
      setMessage("Your Mega Stone shattered the Voltorb - total score x4!");
      return;
    }

    if ((charges.Protect ?? 0) > 0) {
      setGrid((g) => revealTile(g, row, col));
      setKit((k) => spendCharge(k.powers, k.charges, "Protect"));
      setMessage("You use Protect! You survive the Voltorb hit.");
      return;
    }

    // No Protect left, no Mega Stone save - the run ends here.
    loseRun(row, col);
  }

  function handleNote(row, col) {
    if (boardLocked) return;
    setGrid((g) => toggleTileNote(g, row, col));
  }

  function handleTileFlip(row, col) {
    if (noteMode) handleNote(row, col);
    else handleFlip(row, col);
  }

  function applyLevelUp(ownedPowers) {
    setRewardChoice(null);
    const nextLevel = level + 1;
    setLevel(nextLevel);
    setMessage("");
    startNewLevel(nextLevel, ownedPowers);
  }

  function handleTakePower() {
    const next = takePower(powers, charges, rewardChoice);
    setKit(next);
    // Taking No Ones doubles this level's score straight away.
    setTotalScore((t) => t + bankedLevelScore(score, next.powers));
    applyLevelUp(next.powers);
  }

  function handleTakeBonusScore() {
    setTotalScore((t) => t + bankedLevelScore(score, powers) + bonusScore(level, powers));
    applyLevelUp(powers);
  }

  function handleNewRun() {
    if (!gameOver) bankCoins(totalScore);
    setLevel(1);
    setTotalScore(0);
    setKit(NO_POWERS);
    setGameOver(false);
    setRewardChoice(null);
    setAwaitingMaxLevel(false);
    setMessage("");
    startNewLevel(1, []);
  }

  return (
    <div className="free-play-page rogue-page">
      <CoinToast amount={coinToast} />

      <div className="layout">
        <section className="board-panel" aria-label="Rogue board">
          <div className="powers-bar" aria-label="Active powers">
            <span className="powers-bar__label">Powers</span>
            <div className="powers-bar__icons">
              {powers.length === 0 && (
                <span className="powers-bar__empty">None yet - beat a level to pick one up.</span>
              )}
              {powers.map((power) => (
                <button
                  key={power}
                  type="button"
                  className="power-icon"
                  onClick={() => setInfoPower(power)}
                  title={power}
                >
                  <img src={POWERS[power].icon} alt={power} />
                  {charges[power] > 1 && <span className="power-icon__badge">{charges[power]}</span>}
                </button>
              ))}
            </div>
          </div>

          <Board
            grid={grid}
            theme={equippedTheme}
            disabled={boardLocked}
            revealing={revealing}
            onFlip={handleTileFlip}
            onNote={handleNote}
            cornerStats={cornerCountOn ? diagonalStats(grid) : null}
            label="Rogue board tiles"
          />

          <p className="hint">
            Right-click (or long-press on mobile) a tile to note it.
            {powers.includes("Peek") && " Click Peek below, then a tile, to look without flipping."}
          </p>

          <NoteToggle on={noteMode} onChange={setNoteMode} />
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

          {powers.includes("Peek") && (
            <button
              type="button"
              className={`btn btn--ghost btn--peek ${peekArmed ? "armed-peek" : ""}`}
              onClick={() => setPeekArmed((a) => !a)}
              disabled={boardLocked}
              aria-pressed={peekArmed}
            >
              {peekArmed ? "Click a tile to peek…" : `Use Peek (${charges.Peek ?? 0} left)`}
            </button>
          )}

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

      {rewardChoice !== null && (
        <Modal overlayClassName="rogue-popup-overlay" className="rogue-popup" labelledBy="rogue-reward-title">
          <h2 className="rogue-popup__title" id="rogue-reward-title">Level {level} beaten!</h2>
          <p className="rogue-popup__subtitle">Choose your reward:</p>
          <div className="rogue-popup__choices">
            <button type="button" className="rogue-popup__choice" onClick={handleTakePower}>
              <img src={POWERS[rewardChoice].icon} alt="" />
              <span className="rogue-popup__choice-title">
                {rewardChoice}
                {powers.includes(rewardChoice) && " (+ charge)"}
              </span>
              <span className="rogue-popup__choice-desc">{POWERS[rewardChoice].desc}</span>
            </button>
            <button type="button" className="rogue-popup__choice" onClick={handleTakeBonusScore}>
              <span className="rogue-popup__choice-emoji" aria-hidden="true">✦</span>
              <span className="rogue-popup__choice-title">+{bonusScore(level, powers)} Bonus Score</span>
              <span className="rogue-popup__choice-desc">Added straight to your total score.</span>
            </button>
          </div>
        </Modal>
      )}

      {infoPower && (
        <Modal
          overlayClassName="rogue-popup-overlay"
          className="rogue-popup"
          labelledBy="rogue-info-title"
          onClose={() => setInfoPower(null)}
        >
          <img className="rogue-popup__info-icon" src={POWERS[infoPower].icon} alt="" />
          <h2 className="rogue-popup__title" id="rogue-info-title">{infoPower}</h2>
          <p className="rogue-popup__subtitle">{POWERS[infoPower].desc}</p>
          <button type="button" className="btn btn--primary rogue-popup__cta" onClick={() => setInfoPower(null)}>
            Okay
          </button>
        </Modal>
      )}
    </div>
  );
}
