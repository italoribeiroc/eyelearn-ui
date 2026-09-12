"use client";

import { useCallback, useSyncExternalStore } from "react";

export type StudyCardStyle = "reveal" | "flip";

const STORAGE_KEY = "eyelearn:study-card-style";
// Opt-in: everyone keeps today's reveal-button behavior until they choose
// the flip animation themselves (see study-card-style-toggle.tsx).
const DEFAULT_STYLE: StudyCardStyle = "reveal";

function readStoredStyle(): StudyCardStyle {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "flip" ? "flip" : DEFAULT_STYLE;
  } catch {
    return DEFAULT_STYLE; // private browsing / storage disabled
  }
}

function getServerSnapshot(): StudyCardStyle {
  return DEFAULT_STYLE;
}

// Same-tab pub/sub so every component reading this hook re-renders the
// moment the toggle writes a new value -- useSyncExternalStore has no
// built-in way to know localStorage changed unless something tells it to
// re-check, and the native "storage" event only fires for *other* tabs.
const listeners = new Set<() => void>();
function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

/**
 * Per-browser preference for how the study session's Basic cards reveal
 * their answer (a plain "Show answer" button, or a flip animation) --
 * intentionally client-only, matching this app's other two per-user UI
 * preferences (theme via next-themes, locale via next-intl), neither of
 * which is synced to the backend user profile either. `useSyncExternalStore`
 * (rather than useState+useEffect) mirrors ThemeToggle's own
 * `useHasMounted` idiom for reading an external, possibly-unavailable-on-
 * the-server source: `getServerSnapshot` returns the safe default for the
 * server-rendered pass, and the real localStorage value takes over on the
 * client without a manual effect.
 */
export function useStudyCardStyle(): [StudyCardStyle, (style: StudyCardStyle) => void] {
  const style = useSyncExternalStore(subscribe, readStoredStyle, getServerSnapshot);

  const setStyle = useCallback((next: StudyCardStyle) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore write failures (e.g. private browsing) -- listeners still
      // fire below so the UI reflects the choice for the rest of this tab's
      // session even though it won't persist across a reload.
    }
    listeners.forEach((listener) => listener());
  }, []);

  return [style, setStyle];
}
