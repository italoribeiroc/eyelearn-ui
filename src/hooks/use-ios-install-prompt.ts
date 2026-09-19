"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "eyelearn:ios-install-prompt-dismissed";

// Other iOS browsers (Chrome, Firefox, Edge, Opera, Google app) and in-app
// webviews (Facebook, Instagram) all include "Safari" in their user agent
// too, but the "..." > Share > Add to Home Screen path the prompt describes
// is specific to Safari itself, so they're excluded explicitly.
const NON_SAFARI_IOS_BROWSERS = /CriOS|FxiOS|EdgiOS|OPiOS|GSA|FBAN|FBAV|Instagram/;

function isIphoneSafari(): boolean {
  const ua = window.navigator.userAgent;
  return /iPhone|iPod/.test(ua) && /Safari/.test(ua) && !NON_SAFARI_IOS_BROWSERS.test(ua);
}

// Already launched from the home screen (i.e. already installed).
// `navigator.standalone` is an iOS-only, non-standard property.
function isStandalone(): boolean {
  const standaloneFlag = (window.navigator as Navigator & { standalone?: boolean }).standalone;
  return standaloneFlag === true || window.matchMedia("(display-mode: standalone)").matches;
}

// Fallback for when localStorage is unavailable (private browsing), so the X
// still closes the prompt for the rest of this page session.
let dismissedInMemory = false;

function isDismissed(): boolean {
  if (dismissedInMemory) return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false; // private browsing / storage disabled
  }
}

function getSnapshot(): boolean {
  return isIphoneSafari() && !isStandalone() && !isDismissed();
}

// Server render and first hydration pass never show the prompt (there's no
// user agent to inspect yet), so there's no hydration mismatch -- it appears
// right after mount for the visitors it applies to.
function getServerSnapshot(): boolean {
  return false;
}

// Same-tab pub/sub, same reason as use-study-card-style.ts: useSyncExternalStore
// needs to be told localStorage changed, and the native "storage" event only
// fires for other tabs.
const listeners = new Set<() => void>();
function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

/**
 * Whether to show the "Add to Home Screen" prompt: only on iPhone Safari,
 * only when the site isn't already running as an installed home-screen app,
 * and only until the visitor dismisses it. Dismissal is remembered
 * per-browser (localStorage) -- a client-only preference like this app's
 * theme and study-card-style ones, not something synced to the backend.
 */
export function useIosInstallPrompt(): [boolean, () => void] {
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const dismiss = useCallback(() => {
    dismissedInMemory = true;
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Ignore write failures -- dismissedInMemory above still closes it
      // for this page session, it just won't be remembered next visit.
    }
    listeners.forEach((listener) => listener());
  }, []);

  return [visible, dismiss];
}
