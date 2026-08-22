"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Bell, BellOff, Pause, Play, RotateCcw, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useStudyTimer } from "@/hooks/use-study-timer";

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function StudyTimerPopover() {
  const t = useTranslations("dashboard.timer");
  const [customMinutesInput, setCustomMinutesInput] = useState("25");
  const [customSecondsInput, setCustomSecondsInput] = useState("0");
  const {
    presetId,
    remainingSeconds,
    isRunning,
    soundEnabled,
    selectPreset,
    setCustomDuration,
    start,
    pause,
    reset,
    toggleSound,
  } = useStudyTimer();

  function handleSetCustomDuration() {
    const minutes = Number(customMinutesInput) || 0;
    const seconds = Number(customSecondsInput) || 0;
    if (minutes > 0 || seconds > 0) {
      setCustomDuration(minutes, seconds);
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("openLabel")}
          className="relative"
        >
          <Timer className="size-5" />
          {isRunning && (
            <span
              aria-hidden="true"
              className="absolute top-1.5 right-1.5 size-2 rounded-full bg-brand-accent"
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(20rem,calc(100vw-2rem))]"
      >
        <p className="px-1 text-sm font-semibold text-foreground">
          {t("title")}
        </p>

        <div className="flex gap-1.5 px-1">
          <Button
            type="button"
            size="sm"
            variant={presetId === "pomodoro" ? "secondary" : "outline"}
            className="min-w-0 flex-1"
            onClick={() => selectPreset("pomodoro")}
          >
            <span className="truncate">{t("pomodoro")}</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant={presetId === "shortBreak" ? "secondary" : "outline"}
            className="min-w-0 flex-1"
            onClick={() => selectPreset("shortBreak")}
          >
            <span className="truncate">{t("shortBreak")}</span>
          </Button>
        </div>

        <div className="flex items-center gap-1.5 px-1">
          <Input
            type="number"
            min={0}
            max={180}
            placeholder="MM"
            value={customMinutesInput}
            onChange={(event) => setCustomMinutesInput(event.target.value)}
            aria-label={t("minutesLabel")}
            className="w-14 shrink-0 text-center"
          />
          <span className="shrink-0 text-sm font-semibold text-muted-foreground">
            :
          </span>
          <Input
            type="number"
            min={0}
            max={59}
            placeholder="SS"
            value={customSecondsInput}
            onChange={(event) => setCustomSecondsInput(event.target.value)}
            aria-label={t("secondsLabel")}
            className="w-14 shrink-0 text-center"
          />
          <Button
            type="button"
            size="sm"
            variant={presetId === "custom" ? "secondary" : "outline"}
            className="shrink-0"
            onClick={handleSetCustomDuration}
          >
            {t("setButton")}
          </Button>
        </div>

        <div
          className="py-3 text-center font-[family-name:var(--font-heading)] text-4xl font-semibold tabular-nums text-foreground"
          aria-live="polite"
        >
          {formatTime(remainingSeconds)}
        </div>

        <div className="flex gap-1.5 px-1">
          <Button
            type="button"
            size="sm"
            className="flex-1"
            onClick={isRunning ? pause : start}
          >
            {isRunning ? (
              <>
                <Pause className="size-4" aria-hidden="true" />
                {t("pause")}
              </>
            ) : (
              <>
                <Play className="size-4" aria-hidden="true" />
                {t("start")}
              </>
            )}
          </Button>
          <Button type="button" size="icon-sm" variant="outline" onClick={reset} aria-label={t("reset")}>
            <RotateCcw className="size-4" />
          </Button>
        </div>

        <div className="flex flex-col gap-2.5 border-t border-border px-1 pt-2.5">
          <label className="flex cursor-pointer items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5 text-sm text-foreground">
              {soundEnabled ? (
                <Bell className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              ) : (
                <BellOff className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              )}
              <span className="truncate">{t("sound")}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {soundEnabled ? t("on") : t("off")}
              </span>
            </span>
            <Switch
              checked={soundEnabled}
              onCheckedChange={toggleSound}
              className="shrink-0"
            />
          </label>
        </div>
      </PopoverContent>
    </Popover>
  );
}
