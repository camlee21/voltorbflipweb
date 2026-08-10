
import { useEffect, useState } from "react";
import { getPokedollars, POKEDOLLARS_EVENT } from "./pokedollars";

// Live-reads the Pokedollar wallet and re-renders whenever it changes,
// whether the change came from this tab (custom event) or another
// tab/window (native "storage" event).
export function usePokedollars() {
  const [amount, setAmount] = useState(getPokedollars);

  useEffect(() => {
    function handleLocalChange(e) {
      setAmount(e.detail);
    }
    function handleStorageEvent() {
      setAmount(getPokedollars());
    }

    window.addEventListener(POKEDOLLARS_EVENT, handleLocalChange);
    window.addEventListener("storage", handleStorageEvent);
    return () => {
      window.removeEventListener(POKEDOLLARS_EVENT, handleLocalChange);
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, []);

  return amount;
}