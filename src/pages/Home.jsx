import { useState } from "react";
import Classic from "./Classic";
import FreePlayGame from "./FreePlayGame";
import RogueGame from "./RogueGame";
import "./Home.css";

const MODES = [
  { key: "classic", label: "Classic" },
  { key: "freeplay", label: "Free Play" },
  { key: "rogue", label: "Rogue" },
];

export default function Home() {
  const [mode, setMode] = useState("classic");
  const activeIndex = MODES.findIndex((m) => m.key === mode);

  return (
    <>
      <div className="mode-toggle-wrapper">
        <div className="mode-toggle">
          <div
            className="mode-toggle-slider"
            style={{ transform: `translateX(${activeIndex * 100}%)` }}
          />
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMode(m.key)}
              className={`mode-toggle-btn ${mode === m.key ? "active" : ""}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: mode === "classic" ? "block" : "none" }}>
        <Classic />
      </div>
      <div style={{ display: mode === "freeplay" ? "block" : "none" }}>
        <FreePlayGame />
      </div>
      <div style={{ display: mode === "rogue" ? "block" : "none" }}>
        <RogueGame />
      </div>
    </>
  );
}