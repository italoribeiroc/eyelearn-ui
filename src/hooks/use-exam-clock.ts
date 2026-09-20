"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ExamClockPhase = "untimed" | "running" | "expired" | "overtime";

type ClockInput = {
  /** Server-computed deadline (ISO), or null for an untimed exam. */
  endsAt: string | null;
  startedAt: string;
  /** Server clock at the moment the exam payload was produced (ISO). */
  serverNow: string;
  /** The user chose "keep going without a timer" after time ran out. */
  continued: boolean;
};

/**
 * Countdown (or elapsed count-up, for untimed exams) for a running exam.
 *
 * Nothing here counts ticks: every render's value is recomputed from the
 * absolute server deadline and the current time, so a throttled background
 * tab, a sleeping laptop, or a slow interval can never make it drift. The
 * client's own clock may be wrong, so `Date.now()` is corrected by an
 * `offset` (server time minus client time) taken from `serverNow` and
 * refreshed via `sync()` whenever the server tells us the time again.
 */
export function useExamClock({ endsAt, startedAt, serverNow, continued }: ClockInput) {
  const endsAtMs = endsAt ? Date.parse(endsAt) : null;
  const startedAtMs = Date.parse(startedAt);

  // First render (server and client alike) is derived purely from props, so
  // markup matches on hydration; the effect below then snaps to the real clock.
  const offsetRef = useRef<number | null>(null);
  const compute = useCallback(
    (nowMs: number) =>
      endsAtMs !== null ? Math.ceil((endsAtMs - nowMs) / 1000) : Math.floor((nowMs - startedAtMs) / 1000),
    [endsAtMs, startedAtMs],
  );
  const [seconds, setSeconds] = useState(() => compute(Date.parse(serverNow)));

  const refresh = useCallback(() => {
    if (offsetRef.current === null) return;
    setSeconds(compute(Date.now() + offsetRef.current));
  }, [compute]);

  useEffect(() => {
    offsetRef.current = Date.parse(serverNow) - Date.now();
    refresh();
    // Sub-second interval, but state only changes when the displayed second
    // does, so this re-renders once a second at most.
    const interval = window.setInterval(refresh, 250);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [serverNow, refresh]);

  /** Re-anchors the client clock to a fresh server timestamp (from any API response). */
  const sync = useCallback(
    (freshServerNow: string) => {
      offsetRef.current = Date.parse(freshServerNow) - Date.now();
      refresh();
    },
    [refresh],
  );

  let phase: ExamClockPhase;
  if (endsAtMs === null) phase = "untimed";
  else if (seconds > 0) phase = "running";
  else phase = continued ? "overtime" : "expired";

  return {
    phase,
    /** Whole seconds left (timed, running); 0 otherwise. */
    remainingSeconds: endsAtMs !== null ? Math.max(seconds, 0) : 0,
    /** Whole seconds past the deadline (timed, after expiry); 0 otherwise. */
    overtimeSeconds: endsAtMs !== null ? Math.max(-seconds, 0) : 0,
    /** Whole seconds since the start (untimed exams). */
    elapsedSeconds: endsAtMs === null ? Math.max(seconds, 0) : 0,
    sync,
  };
}

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(Math.floor(totalSeconds), 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(secs).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}
