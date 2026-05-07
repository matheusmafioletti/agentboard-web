import { useState, useCallback, useEffect } from "react";

const DARK_MODE_KEY = "agentboard_dark_mode";

function applyDark(next: boolean): void {
  document.documentElement.classList.toggle("dark", next);
  document.documentElement.style.colorScheme = next ? "dark" : "light";
  localStorage.setItem(DARK_MODE_KEY, String(next));
}

// IMPORTANT: Initial dark class is applied by the inline script in index.html before
// React mounts. This hook reads the DOM state set by that script instead of re-applying it,
// ensuring a single source of truth for flash prevention.
function readInitialDark(): boolean {
  return document.documentElement.classList.contains("dark");
}

/** Reads and toggles dark mode. Applies the `dark` class and `color-scheme` to <html> on toggle. */
export function useDarkMode(): { isDark: boolean; toggle: () => void } {
  const [isDark, setIsDark] = useState(readInitialDark);

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      applyDark(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");

    function handleOsChange(e: { matches: boolean }): void {
      if (localStorage.getItem(DARK_MODE_KEY) !== null) return;
      const next = e.matches;
      applyDark(next);
      setIsDark(next);
    }

    mql.addEventListener("change", handleOsChange);
    return () => mql.removeEventListener("change", handleOsChange);
  }, []);

  return { isDark, toggle };
}
