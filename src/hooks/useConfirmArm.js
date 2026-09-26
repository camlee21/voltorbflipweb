import { useEffect, useState } from "react";

// Two-click confirm for destructive buttons: the first click arms the action,
// the second runs it. Clicking anywhere outside the armed button disarms it.
// Buttons opt in with `data-confirm="<action>"`.
export function useConfirmArm() {
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    if (!pendingAction) return;
    function handleWindowClick(e) {
      if (!e.target.closest?.(`[data-confirm="${pendingAction}"]`)) {
        setPendingAction(null);
      }
    }
    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, [pendingAction]);

  function confirm(action, run) {
    if (pendingAction === action) {
      setPendingAction(null);
      run();
      return;
    }
    // Clicking a different armed-style button while one is armed just disarms.
    setPendingAction(pendingAction === null ? action : null);
  }

  return [pendingAction, confirm];
}
