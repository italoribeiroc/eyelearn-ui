"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { playTimerAlert } from "@/lib/audio/beep";

export type StudyTimerPresetId = "pomodoro" | "shortBreak" | "custom";

const POMODORO_SECONDS = 25 * 60;
const SHORT_BREAK_SECONDS = 5 * 60;
const MIN_CUSTOM_SECONDS = 1;
const MAX_CUSTOM_SECONDS = 180 * 60;

type StudyTimerState = {
  presetId: StudyTimerPresetId;
  durationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  soundEnabled: boolean;
};

export function useStudyTimer() {
  const t = useTranslations("dashboard.timer");
  const [state, setState] = useState<StudyTimerState>({
    presetId: "pomodoro",
    durationSeconds: POMODORO_SECONDS,
    remainingSeconds: POMODORO_SECONDS,
    isRunning: false,
    soundEnabled: true,
  });

  // Read inside the interval via a ref so the 1s tick doesn't need to be
  // recreated every time settings change, only when isRunning toggles.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const selectPreset = useCallback((presetId: "pomodoro" | "shortBreak") => {
    const durationSeconds =
      presetId === "pomodoro" ? POMODORO_SECONDS : SHORT_BREAK_SECONDS;

    setState((prev) => ({
      ...prev,
      presetId,
      durationSeconds,
      remainingSeconds: durationSeconds,
      isRunning: false,
    }));
  }, []);

  const setCustomDuration = useCallback((minutes: number, seconds: number) => {
    const totalSeconds = Math.round(minutes) * 60 + Math.round(seconds);
    const durationSeconds = Math.min(
      MAX_CUSTOM_SECONDS,
      Math.max(MIN_CUSTOM_SECONDS, totalSeconds),
    );

    setState((prev) => ({
      ...prev,
      presetId: "custom",
      durationSeconds,
      remainingSeconds: durationSeconds,
      isRunning: false,
    }));
  }, []);

  const start = useCallback(() => {
    setState((prev) =>
      prev.remainingSeconds > 0 ? { ...prev, isRunning: true } : prev,
    );
  }, []);

  const pause = useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: false }));
  }, []);

  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isRunning: false,
      remainingSeconds: prev.durationSeconds,
    }));
  }, []);

  const toggleSound = useCallback(() => {
    setState((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  useEffect(() => {
    if (!state.isRunning) return;

    const intervalId = setInterval(() => {
      const current = stateRef.current;

      if (current.remainingSeconds <= 1) {
        clearInterval(intervalId);

        if (current.soundEnabled) {
          playTimerAlert();
        }

        toast(t("finishedTitle"), { description: t("finishedDescription") });

        setState((prev) => ({ ...prev, remainingSeconds: 0, isRunning: false }));

        return;
      }

      setState((prev) => ({
        ...prev,
        remainingSeconds: prev.remainingSeconds - 1,
      }));
    }, 1000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isRunning]);

  return {
    presetId: state.presetId,
    durationSeconds: state.durationSeconds,
    remainingSeconds: state.remainingSeconds,
    isRunning: state.isRunning,
    soundEnabled: state.soundEnabled,
    selectPreset,
    setCustomDuration,
    start,
    pause,
    reset,
    toggleSound,
  };
}
