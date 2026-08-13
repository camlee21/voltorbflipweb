import { useEffect } from "react";
import { useEquippedTheme } from "./useEquippedTheme";
import { getTheme } from "../game/themes";
import { rgba, lighten, darken, relativeLuminance, contrastInk } from "./colour";

// The full set of root tokens this hook manages. Kept in one place so
// clearing them (for the Classic/default case) can't drift out of sync
// with setting them.
const MANAGED_PROPERTIES = [
  "--main",
  "--main-strong",
  "--main-glow",
  "--main-bg",
  "--main-border",
  "--bg-main",
  "--bg-alt",
  "--accent",
  "--accent-glow",
  "--accent-bg",
  "--accent-border",
  "--accent-text",
  "--color-ink",
  "--color-surface",
  "--color-surface-raised",
  "--color-surface-recessed",
  "--color-border",
  "--color-border-strong",
  "--color-accent",
  "--color-accent-strong",
  "--color-accent-ink",
];

// Applies the equipped theme's colours to the document root as CSS custom
// property overrides. Because buttons, panels, borders, and glows across
// the site are already built on var(--main)/var(--accent)/var(--color-*),
// this alone re-colours everything — no per-component styling needed.
// Call once from Layout.jsx so it's active on every route, not just the
// game boards.
export function useApplyTheme() {
  const [equippedTheme] = useEquippedTheme();

  useEffect(() => {
    const root = document.documentElement.style;
    const theme = getTheme(equippedTheme);

    // Classic is the site's original static palette — clear any prior
    // overrides instead of re-deriving, so it's a byte-for-byte match to
    // the default :root values in every case, including for logged-out
    // visitors who've never touched the shop.
    if (theme.id === "classic") {
      MANAGED_PROPERTIES.forEach((prop) => root.removeProperty(prop));
      return;
    }

    const main = theme.accentColour;
    const ink = contrastInk(main);
    // Bright accents (e.g. Pikachu's yellow) darken on hover instead of
    // lightening toward white, where a lighten would barely read as a
    // hover change at all.
    const mainStrong = relativeLuminance(main) > 0.6 ? darken(main, 0.15) : lighten(main, 0.18);

    // Background tiers derived from the theme's swatch colour, darkened
    // further at each step so text/panels stay legible regardless of how
    // bright that swatch itself is.
    const bgMain = darken(theme.bgColour, 0.35);
    const bgAlt = darken(theme.bgColour, 0.15);
    const surface = darken(theme.bgColour, 0.1);
    const surfaceRaised = lighten(surface, 0.08);
    const surfaceRecessed = darken(bgMain, 0.15);
    const border = lighten(surface, 0.12);
    const borderStrong = lighten(surface, 0.22);

    root.setProperty("--main", main);
    root.setProperty("--main-strong", mainStrong);
    root.setProperty("--main-glow", rgba(main, 0.35));
    root.setProperty("--main-bg", rgba(main, 0.15));
    root.setProperty("--main-border", rgba(main, 0.35));

    root.setProperty("--bg-main", bgMain);
    root.setProperty("--bg-alt", bgAlt);

    root.setProperty("--accent", main);
    root.setProperty("--accent-glow", rgba(main, 0.35));
    root.setProperty("--accent-bg", rgba(main, 0.15));
    root.setProperty("--accent-border", rgba(main, 0.35));
    root.setProperty("--accent-text", ink);

    root.setProperty("--color-ink", bgMain);
    root.setProperty("--color-surface", surface);
    root.setProperty("--color-surface-raised", surfaceRaised);
    root.setProperty("--color-surface-recessed", surfaceRecessed);
    root.setProperty("--color-border", border);
    root.setProperty("--color-border-strong", borderStrong);
    root.setProperty("--color-accent", main);
    root.setProperty("--color-accent-strong", mainStrong);
    root.setProperty("--color-accent-ink", ink);
    // --color-danger / --color-success and --color-text / --color-text-muted
    // are intentionally left untouched — see message for rationale.
  }, [equippedTheme]);
}