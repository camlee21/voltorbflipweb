import { useEffect, useState } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { getEquippedTheme, setEquippedTheme, EQUIPPED_THEME_EVENT, DEFAULT_THEME } from "./equippedTheme";

export function useEquippedTheme() {
  const { user } = useAuthContext();
  const [storedTheme, setStoredTheme] = useState(getEquippedTheme);

  useEffect(() => {
    function handleLocalChange(e) {
      setStoredTheme(e.detail);
    }
    function handleStorageEvent() {
      setStoredTheme(getEquippedTheme());
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

  const theme = user ? storedTheme : DEFAULT_THEME;

  return [theme, equip];
}