import { useCallback, useEffect, useRef, useState } from "react";

// How long the "You have earned X coins!" toast stays visible.
const COIN_TOAST_MS = 3000;

// Returns [amount | null, show(amount)] for <CoinToast />.
export function useCoinToast() {
  const [amount, setAmount] = useState(null);
  const timeoutRef = useRef(null);

  const show = useCallback((value) => {
    setAmount(value);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setAmount(null), COIN_TOAST_MS);
  }, []);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return [amount, show];
}
