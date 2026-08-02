import "./Tile.css";

// Port of TileView from VoltorbStructs.swift.
// theme is a folder-name prefix, e.g. "classic" -> /sprites/0_classic.png etc.
export default function Tile({ tile, theme, onFlip, onNote, disabled }) {
  const isFront = tile.revealed || tile.noted;

  const frontSrc = tile.noted
    ? `/sprites/NotedTile_${theme}.png`
    : `/sprites/${tile.value}_${theme}.png`;
  const backSrc = `/sprites/UnknownTile_${theme}.png`;

  function handleClick() {
    if (disabled) return;
    onFlip();
  }

  function handleContextMenu(e) {
    // Right-click on desktop acts like the long-press "note" gesture in the app.
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
      aria-label={isFront ? `Revealed tile: ${tile.value}` : "Hidden tile"}
    >
      <img src={isFront ? frontSrc : backSrc} alt="" draggable={false} />
    </button>
  );
}