import Tile from "./Tile";
import Counter from "./Counter";
import { rowStats, columnStats } from "../game/gameLogic";
import { suppressBoardContextMenu } from "../utils/boardContextMenu";

const VOLTORB_ICON = "/sprites/counters/voltorb-count-icon.png";
const STAGGER_MS = 90;

// The 5x5 tile grid with its row and column counters. `cornerStats` fills the
// bottom-right cell (Rogue's Corner Count); otherwise it's left empty.
// `revealing` turns on the column-by-column stagger for whole-board reveals,
// so a normal single-tile flip stays instant.
export default function Board({ grid, theme, disabled, revealing, onFlip, onNote, cornerStats, label }) {
  return (
    <div
      className="board"
      role="group"
      aria-label={label}
      style={{ "--tile-size": "clamp(40px, 12vw, 80px)" }}
      onContextMenu={suppressBoardContextMenu}
    >
      {grid.map((row, r) => {
        const stats = rowStats(grid, r);
        return (
          <div key={r} style={{ display: "contents" }}>
            {row.map((tile, c) => (
              <Tile
                key={tile.id}
                tile={tile}
                row={r}
                col={c}
                theme={theme}
                disabled={disabled}
                onFlip={() => onFlip(r, c)}
                onNote={() => onNote(r, c)}
                flipDelay={revealing && tile.revealed ? c * STAGGER_MS : 0}
              />
            ))}
            <Counter label={`Row ${r + 1}`} points={stats.points} voltorbs={stats.voltorbs} icon={VOLTORB_ICON} />
          </div>
        );
      })}

      {grid[0].map((_, c) => {
        const stats = columnStats(grid, c);
        return (
          <Counter
            key={`col-${c}`}
            label={`Column ${c + 1}`}
            points={stats.points}
            voltorbs={stats.voltorbs}
            icon={VOLTORB_ICON}
          />
        );
      })}

      {cornerStats ? (
        <Counter label="Diagonal" points={cornerStats.points} voltorbs={cornerStats.voltorbs} icon={VOLTORB_ICON} />
      ) : (
        <div />
      )}
    </div>
  );
}
