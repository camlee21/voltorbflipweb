import { useEffect, useRef } from "react";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

// Accessible dialog shell: moves focus inside on open, keeps Tab cycling
// within it, closes on Escape / overlay click when `onClose` is given, and
// hands focus back to whatever had it before.
export default function Modal({ onClose, labelledBy, overlayClassName, className, children }) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement;
    // A dialog inside a hidden game mode (display: none) shouldn't grab the keyboard.
    const isVisible = () => dialog.getClientRects().length > 0;
    const focusables = () => [...dialog.querySelectorAll(FOCUSABLE)];

    if (isVisible()) focusables()[0]?.focus();

    function handleKeyDown(e) {
      if (!isVisible()) return;
      if (e.key === "Escape" && onCloseRef.current) {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused && document.contains(previouslyFocused)) previouslyFocused.focus();
    };
  }, []);

  return (
    <div className={overlayClassName} onClick={() => onCloseRef.current?.()}>
      <div
        ref={dialogRef}
        className={className}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
