// Simple localStorage-backed "which theme is equipped" flag. Separate from
// the Supabase-backed *ownership* list (profiles.themes) — this only tracks
// which owned theme is currently active, and works even for logged-out
// users (who always just get "classic", since the shop locks purchasing
// and equipping behind login).
const STORAGE_KEY = "voltorbflip:equippedTheme";
const EQUIPPED_THEME_EVENT = "voltorbflip:equipped-theme-changed";
const DEFAULT_THEME = "classic";

export function getEquippedTheme() {
  if (typeof window === "undefined") return DEFAULT_THEME;
  return window.localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
}

export function setEquippedTheme(themeId) {
  const value = themeId || DEFAULT_THEME;
  window.localStorage.setItem(STORAGE_KEY, value);
  window.dispatchEvent(new CustomEvent(EQUIPPED_THEME_EVENT, { detail: value }));
  return value;
}

export { EQUIPPED_THEME_EVENT, DEFAULT_THEME };