import { useEffect, useState } from "react";
import { getEquippedTheme, setEquippedTheme, EQUIPPED_THEME_EVENT } from "./equippedTheme";

// Live-reads the equipped theme and re-renders whenever it changes, whether
// from this tab (custom event) or another tab/window (native "storage").
export function useEquippedTheme() {
  const [theme, setTheme] = useState(getEquippedTheme);

  useEffect(() => {
    function handleLocalChange(e) {
      setTheme(e.detail);
    }
    function handleStorageEvent() {
      setTheme(getEquippedTheme());
    }
    window.addEventListener(EQUIPPED_THEME_EVENT, handleLocalChange);
    window.addEventListener("storage", handleStorageEvent);
    return () => {
      window.removeEventListener(EQUIPPED_THEME_EVENT, handleLocalChange);
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, []);

  function equip(themeId) {
    setEquippedTheme(themeId);
  }

  return [theme, equip];
}