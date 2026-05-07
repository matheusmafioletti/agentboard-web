import { useState, useCallback } from "react";

const SESSION_KEY = "sidebar_expanded";

/** Persists sidebar expanded/compact preference for the current browser session. */
export function useSidebarState(): { expanded: boolean; toggle: () => void } {
  const [expanded, setExpanded] = useState<boolean>(() => {
    return sessionStorage.getItem(SESSION_KEY) === "true";
  });

  const toggle = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      sessionStorage.setItem(SESSION_KEY, String(next));
      return next;
    });
  }, []);

  return { expanded, toggle };
}
