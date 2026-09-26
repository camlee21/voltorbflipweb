import "./NoteToggle.css";

// When on, tapping a tile notes it instead of flipping it.
export default function NoteToggle({ on, onChange }) {
  return (
    <div className="note-toggle">
      <span className="note-toggle__label">Note Mode</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Note mode"
        className={`note-toggle__switch ${on ? "is-on" : ""}`}
        onClick={() => onChange(!on)}
      >
        <span className="note-toggle__knob" />
      </button>
    </div>
  );
}
