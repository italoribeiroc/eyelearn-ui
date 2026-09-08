"use client";

import { useState } from "react";
import { MockFlashcard } from "@/components/shared/mock-flashcard";

type NotFoundCardProps = {
  eyebrow: string;
  question: string;
  answer: string;
  flipHint: string;
  className?: string;
};

/** Client wrapper that makes the 404 page's flashcard genuinely
 * click-to-flip, the same mechanic as the landing page cards. The page
 * itself is a Server Component, so the flip state lives here. */
export function NotFoundCard({ eyebrow, question, answer, flipHint, className }: NotFoundCardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <MockFlashcard
      className={className}
      contentClassName="text-center"
      variant="answer"
      eyebrow={eyebrow}
      question={question}
      answer={answer}
      flipHint={flipHint}
      flipped={flipped}
      onFlip={() => setFlipped((f) => !f)}
    />
  );
}
