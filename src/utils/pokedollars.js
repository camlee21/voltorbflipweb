
// Simple localStorage-backed "Pokedollars" wallet, shared across all game
// modes and the Layout header. Reads/writes a single integer under one key
// and broadcasts a custom window event on every change so any mounted
// component can stay in sync within the same tab — localStorage's built-in
// "storage" event only fires in *other* tabs, not the one that wrote it.

const STORAGE_KEY = "voltorbflip:pokedollars";
const POKEDOLLARS_EVENT = "voltorbflip:pokedollars-changed";

export function getPokedollars() {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function writePokedollars(amount) {
  const safeAmount = Math.max(0, Math.round(amount));
  window.localStorage.setItem(STORAGE_KEY, String(safeAmount));
  window.dispatchEvent(new CustomEvent(POKEDOLLARS_EVENT, { detail: safeAmount }));
  return safeAmount;
}

// Adds `amount` Pokedollars to the stored total (no-ops for zero/negative
// amounts) and returns the new total.
export function addPokedollars(amount) {
  if (!amount || amount <= 0) return getPokedollars();
  return writePokedollars(getPokedollars() + amount);
}

// Wipes the wallet back to 0. Not wired to any button yet — here in case
// you want a "reset Pokedollars" debug/settings action later.
export function resetPokedollars() {
  return writePokedollars(0);
}

export { POKEDOLLARS_EVENT };