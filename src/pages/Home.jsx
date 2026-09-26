import { useSearchParams } from "react-router-dom";
import Classic from "./Classic";
import FreePlayGame from "./FreePlayGame";
import RogueGame from "./RogueGame";
import PageMeta from "../components/PageMeta";
import "./Home.css";

const MODES = [
  { key: "classic", label: "Classic", Component: Classic },
  { key: "freeplay", label: "Free Play", Component: FreePlayGame },
  { key: "rogue", label: "Rogue", Component: RogueGame },
];

export default function Home() {
  // The mode lives in the URL (?mode=rogue) so it can be linked to directly.
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("mode");
  const mode = MODES.some((m) => m.key === requested) ? requested : "classic";
  const activeIndex = MODES.findIndex((m) => m.key === mode);

  function selectMode(key) {
    setSearchParams(key === "classic" ? {} : { mode: key }, { replace: true });
  }

  return (
    <main>
      <PageMeta path="/" />

      <div className="mode-toggle-wrapper">
        <div className="mode-toggle" role="tablist" aria-label="Game mode">
          <div
            className="mode-toggle-slider"
            style={{ transform: `translateX(${activeIndex * 100}%)` }}
          />
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              role="tab"
              id={`mode-tab-${m.key}`}
              aria-selected={mode === m.key}
              aria-controls={`mode-panel-${m.key}`}
              onClick={() => selectMode(m.key)}
              className={`mode-toggle-btn ${mode === m.key ? "active" : ""}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* All modes stay mounted so switching tabs doesn't throw away a game in progress. */}
      {MODES.map(({ key, Component }) => (
        <div
          key={key}
          id={`mode-panel-${key}`}
          role="tabpanel"
          aria-labelledby={`mode-tab-${key}`}
          hidden={mode !== key}
        >
          <Component />
        </div>
      ))}
    </main>
  );
}
