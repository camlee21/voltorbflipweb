import { useEffect, useRef, useState } from "react";
import "./Tile.css";

const LONG_PRESS_MS = 300;
const MOVE_THRESHOLD_PX = 10;

function describeTile(tile, row, col) {
  const where = `Row ${row + 1}, column ${col + 1}`;
  if (tile.revealed) return `${where}: ${tile.value === 0 ? "Voltorb" : tile.value}`;
  return `${where}: ${tile.noted ? "hidden, noted" : "hidden"}`;
}

export default function Tile({ tile, row, col, theme, onFlip, onNote, disabled, flipDelay = 0 }) {
  // The value shown on the front face. It only updates when a tile flips
  // face-up (and stays put while it flips back down), and starts out empty so
  // hidden values never appear in the DOM or as image requests.
  const [displayedValue, setDisplayedValue] = useState(null);
  if (tile.revealed && displayedValue !== tile.value) {
    setDisplayedValue(tile.value);
  }

  // The long-press timer calls whatever onNote is current when it fires, not
  // the one from the render where the touch started.
  const onNoteRef = useRef(onNote);
  useEffect(() => {
    onNoteRef.current = onNote;
  });

  const frontSrc = displayedValue === null ? null : `/sprites/${displayedValue}_${theme}.png`;
  const backSrc = tile.noted
    ? `/sprites/NotedTile_${theme}.png`
    : `/sprites/UnknownTile_${theme}.png`;

  const timerRef = useRef(null);
  const longPressFiredRef = useRef(false);
  const startCoordsRef = useRef({ x: 0, y: 0 });

  function clearPressTimer() {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }

  function handleClick() {
    if (disabled) return;
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      return;
    }
    onFlip();
  }

  function handleContextMenu(e) {
    e.preventDefault();
    if (disabled) return;
    // If our own touch long-press already fired onNote() for this press,
    // don't let the browser's native long-press contextmenu fire it again
    // (that's what causes the "hold too long" un-note bug).
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      return;
    }
    onNote();
  }

  useEffect(() => () => clearTimeout(timerRef.current), []);

  function handleTouchStart(e) {
    if (disabled) return;
    // Suppress the browser's own long-press gesture (text selection,
    // image callout, native contextmenu) so it can't fire a competing note toggle.
    // e.preventDefault();
    const touch = e.touches[0];
    startCoordsRef.current = { x: touch.clientX, y: touch.clientY };
    longPressFiredRef.current = false;
    timerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      if (navigator.vibrate) navigator.vibrate(15);
      onNoteRef.current();
    }, LONG_PRESS_MS);
  }

  function handleTouchMove(e) {
    if (!timerRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - startCoordsRef.current.x;
    const dy = touch.clientY - startCoordsRef.current.y;
    if (Math.sqrt(dx * dx + dy * dy) > MOVE_THRESHOLD_PX) {
      clearPressTimer();
    }
  }

  function handleTouchEnd() {
    clearPressTimer();
  }

  function handleTouchCancel() {
    clearPressTimer();
    longPressFiredRef.current = false;
  }

  return (
    <button
      type="button"
      className="tile"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      disabled={disabled || tile.revealed}
      aria-label={describeTile(tile, row, col)}
      style={{ WebkitTouchCallout: "none" }}
    >
      <div
        className={`tile-flip ${tile.revealed ? "is-flipped" : ""}`}
        style={{ "--flip-delay": `${flipDelay}ms` }}
      >
        <div className="tile-face tile-face-back">
          <img src={backSrc} alt="" draggable={false} />
        </div>
        <div className="tile-face tile-face-front">
          {frontSrc && <img src={frontSrc} alt="" draggable={false} />}
        </div>
      </div>
    </button>
  );
}