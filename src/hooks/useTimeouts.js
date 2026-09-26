import { useCallback, useEffect, useRef } from "react";

// setTimeout that remembers its ids, so a component can cancel every pending
// callback at once (on reset, level change, or unmount) and a delayed update
// can never land on a board it wasn't scheduled for.
export function useTimeouts() {
  const idsRef = useRef(new Set());

  const clearAll = useCallback(() => {
    idsRef.current.forEach(clearTimeout);
    idsRef.current.clear();
  }, []);

  const schedule = useCallback((fn, ms) => {
    const id = setTimeout(() => {
      idsRef.current.delete(id);
      fn();
    }, ms);
    idsRef.current.add(id);
    return id;
  }, []);

  useEffect(() => clearAll, [clearAll]);

  return { schedule, clearAll };
}
