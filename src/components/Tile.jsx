import "./Tile.css";

export default function Tile({ tile, theme, onFlip, onNote, disabled, flipDelay = 0 }) {
  const frontSrc = `/sprites/${tile.value}_${theme}.png`;
  const backSrc = tile.noted
    ? `/sprites/NotedTile_${theme}.png`
    : `/sprites/UnknownTile_${theme}.png`;

  function handleClick() {
    if (disabled) return;
    onFlip();
  }

  function handleContextMenu(e) {
    e.preventDefault();
    if (disabled) return;
    onNote();
  }

  return (
    <button
      type="button"
      className="tile"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      disabled={disabled || tile.revealed}
      aria-label={tile.revealed ? `Revealed tile: ${tile.value}` : "Hidden tile"}
    >
      <div
        className={`tile-flip ${tile.revealed ? "is-flipped" : ""}`}
        style={{ "--flip-delay": `${flipDelay}ms` }}
      >
        <div className="tile-face tile-face-back">
          <img src={backSrc} alt="" draggable={false} />
        </div>
        <div className="tile-face tile-face-front">
          <img src={frontSrc} alt="" draggable={false} />
        </div>
      </div>
    </button>
  );
}