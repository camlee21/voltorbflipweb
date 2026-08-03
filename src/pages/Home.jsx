import { useState } from "react";
import FreePlayGame from "./FreePlayGame";
import RogueGame from "./RogueGame";
import "./Home.css";

export default function Home() {
  const [mode, setMode] = useState("freeplay");

  return (
    <>
      <div className="mode-toggle-wrapper">
        <div className="mode-toggle">
          <div
            className="mode-toggle-slider"
            style={{ transform: mode === "rogue" ? "translateX(100%)" : "translateX(0%)" }}
          />
          <button
            type="button"
            onClick={() => setMode("freeplay")}
            className={`mode-toggle-btn ${mode === "freeplay" ? "active" : ""}`}
          >
            Free Play
          </button>
          <button
            type="button"
            onClick={() => setMode("rogue")}
            className={`mode-toggle-btn ${mode === "rogue" ? "active" : ""}`}
          >
            Rogue
          </button>
        </div>
      </div>

      {mode === "freeplay" ? <FreePlayGame /> : <RogueGame />}
    </>
  );
}