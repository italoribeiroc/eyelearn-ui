"use client";

import { useCallback, useSyncExternalStore } from "react";

// sessionStorage (not localStorage) on purpose: "keep going without a timer"
// is remembered across a refresh of this tab, but a fresh tab or a later
// visit sees the time-up dialog again -- the server's deadline is the truth,
// this only stops the same dialog from re-asking on every reload.
const keyFor = (examId: number) => `exam:${examId}:continued`;

const listeners = new Set<() => void>();
function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

// Fallback for when sessionStorage is unavailable (private mode, blocked storage).
const inMemory = new Set<number>();

function read(examId: number): boolean {
  if (inMemory.has(examId)) return true;
  try {
    return window.sessionStorage.getItem(keyFor(examId)) === "1";
  } catch {
    return false;
  }
}

/** Whether the user chose "keep going without a timer" for this exam, in this tab. */
export function useExamContinued(examId: number): [boolean, () => void] {
  const continued = useSyncExternalStore(
    subscribe,
    () => read(examId),
    () => false,
  );

  const markContinued = useCallback(() => {
    inMemory.add(examId);
    try {
      window.sessionStorage.setItem(keyFor(examId), "1");
    } catch {
      // In-memory flag above still covers this page session.
    }
    listeners.forEach((listener) => listener());
  }, [examId]);

  return [continued, markContinued];
}
