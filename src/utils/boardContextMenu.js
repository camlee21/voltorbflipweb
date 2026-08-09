
export function suppressBoardContextMenu(e) {
  // Blocks the native right-click menu anywhere inside the board container.
  // Tiles handle their own onContextMenu (preventDefault + note) — that
  // fires first and bubbles up here, so this only needs to catch clicks
  // on gaps, counters, or anywhere else inside the board that isn't a tile.
  e.preventDefault();
}