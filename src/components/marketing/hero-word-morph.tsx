"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export function HeroWordMorph({
  phrases,
  intervalMs = 1100,
}: {
  phrases: string[];
  intervalMs?: number;
}) {
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const lastIndex = phrases.length - 1;
  const isDone = index >= lastIndex;

  useEffect(() => {
    if (reducedMotion || isDone) return;

    const id = setTimeout(() => {
      setIndex((current) => Math.min(current + 1, lastIndex));
    }, intervalMs);

    return () => clearTimeout(id);
  }, [index, reducedMotion, isDone, intervalMs, lastIndex]);

  const displayIndex = reducedMotion ? lastIndex : index;

  return (
    <span className="relative inline-flex h-[1.15em] min-w-[1ch] items-center justify-center overflow-hidden align-bottom">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={displayIndex}
          initial={reducedMotion ? false : { y: "0.5em", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reducedMotion ? undefined : { y: "-0.5em", opacity: 0 }}
          transition={{ duration: 0.32, ease: "easeOut" }}
          className="inline-block whitespace-nowrap bg-gradient-to-r from-brand-turquoise to-brand-mint bg-clip-text text-transparent"
        >
          {phrases[displayIndex]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
