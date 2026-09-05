"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Sparkles, Wand2 } from "lucide-react";
import { MockFlashcard } from "@/components/shared/mock-flashcard";

// "7" is the pH of a neutral solution -- the second of the four options
// (card2.option1..4) below.
const CARD2_CORRECT_OPTION = 1;

export function AiFeatureShowcase() {
  const t = useTranslations("aiFeature");
  const [card1Flipped, setCard1Flipped] = useState(false);
  const [card2Selected, setCard2Selected] = useState<number | null>(null);
  const [card3Value, setCard3Value] = useState("");
  const [card3Submitted, setCard3Submitted] = useState(false);

  const card3Answer = t("card3.answer");
  const card3Correct = card3Value.trim().toLowerCase() === card3Answer.trim().toLowerCase();
  const card3Feedback = card3Correct
    ? t("correctFeedback")
    : t("incorrectFeedbackWithAnswer", { answer: card3Answer });

  return (
    <section className="border-t border-border py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-accent/10 px-3 py-1 text-xs font-semibold text-brand-accent">
            <Wand2 className="size-3.5" aria-hidden="true" />
            {t("eyebrow")}
          </span>
          <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-foreground-muted">{t("description")}</p>

          <ul className="mt-6 space-y-3">
            {[0, 1, 2, 3].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-foreground-muted">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-brand-turquoise" aria-hidden="true" />
                <span>{t(`points.${item}`)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-4">
          <MockFlashcard
            eyebrow={t("card1.eyebrow")}
            question={t("card1.question")}
            variant="reveal"
            revealHint={t("card1.hint")}
            answer={t("card1.answer")}
            flipped={card1Flipped}
            onFlip={() => setCard1Flipped((f) => !f)}
          />
          <MockFlashcard
            eyebrow={t("card2.eyebrow")}
            question={t("card2.question")}
            variant="choice"
            options={[t("card2.option1"), t("card2.option2"), t("card2.option3"), t("card2.option4")]}
            selectedOption={card2Selected}
            onSelect={setCard2Selected}
            correctOption={CARD2_CORRECT_OPTION}
          />
          <MockFlashcard
            eyebrow={t("card3.eyebrow")}
            question={t("card3.question")}
            variant="type"
            typePlaceholder={t("card3.placeholder")}
            value={card3Value}
            onChange={setCard3Value}
            onSubmit={() => setCard3Submitted(true)}
            submitted={card3Submitted}
            correct={card3Correct}
            feedback={card3Feedback}
            submitLabel={t("submitButton")}
          />
        </div>
      </div>
    </section>
  );
}
