export type EyeLearnUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  has_seen_onboarding: boolean;
};

export type AuthTokens = {
  access: string;
  refresh: string;
};

export type RegisterPayload = {
  username: string;
  email: string;
  password: string;
  first_name: string;
  locale: string;
};

export type LoginPayload = {
  username: string;
  password: string;
};

export type GoogleAuthPayload = {
  id_token: string;
};

export type PasswordResetRequestPayload = {
  email: string;
  locale: string;
};

export type PasswordResetConfirmPayload = {
  uid: string;
  token: string;
  new_password: string;
};

/** Django/DRF validation errors: field name -> array of messages, plus optional root-level "detail". */
export type ApiFieldErrors = Record<string, string[] | undefined> & {
  detail?: string;
};

export type SubscriptionPlan = "free" | "monthly" | "annual";

export type SubscriptionStatus = {
  plan: SubscriptionPlan;
  status:
    | "active"
    | "trialing"
    | "past_due"
    | "canceled"
    | "incomplete"
    | "incomplete_expired"
    | "unpaid"
    | "paused"
    | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export type Collection = {
  id: number;
  name: string;
  description: string;
  parent: number | null;
  flashcard_count: number;
  due_count: number;
  created_at: string;
  updated_at: string;
};

export type CardType = "basic" | "multiple_choice" | "typed_answer";

export type FlashcardOption = {
  text: string;
  is_correct: boolean;
};

export type MediaType = "image" | "audio" | "video";
export type MediaSide = "prompt" | "answer";

export type FlashcardMediaItem = {
  id: number;
  media_type: MediaType;
  side: MediaSide;
  content_type: string;
  size_bytes: number;
  url: string;
  created_at: string;
};

export type Flashcard = {
  id: number;
  collection: number;
  card_type: CardType;
  prompt: string;
  answer: string;
  options: FlashcardOption[];
  accepted_answers: string[];
  media: FlashcardMediaItem[];
  created_at: string;
  updated_at: string;
};

export type AiGenerationDraftCard = {
  id: number;
  prompt: string;
  answer: string;
  options: FlashcardOption[];
  accepted_answers: string[];
};

export type AiGenerationDraftStatus = "pending" | "confirmed" | "discarded";

export type AiGenerationDraft = {
  id: number;
  collection: number;
  card_type: CardType;
  learning_request: string;
  status: AiGenerationDraftStatus;
  // Total cards this generation is working toward. `cards.length < target_count`
  // means it's not finished yet -- see generateNextAiBatch().
  target_count: number;
  cards: AiGenerationDraftCard[];
};

export type AiGenerationConfirmResult = {
  created: Flashcard[];
  errors: { id: number; errors: unknown }[];
};

export type ReviewSchedulingState = "new" | "learning" | "review" | "relearning";

export type StudyQueueItem = {
  flashcard: Flashcard;
  due: string;
  state: ReviewSchedulingState;
  reps: number;
};

/** fsrs.Rating: 1 Again, 2 Hard, 3 Good, 4 Easy -- only meaningful for BASIC cards. */
export type ReviewRating = 1 | 2 | 3 | 4;

export type ReviewSubmission =
  | { rating: ReviewRating }
  | { selected_option: number }
  | { submitted_answer: string };

export type ReviewResult = {
  correct: boolean | null;
  due: string;
  state: ReviewSchedulingState;
  reps: number;
  lapses: number;
};

export type CollectionGoalProgress = {
  collection: number;
  target_date: string;
  total: number;
  mastered: number;
  remaining: number;
  today_target: number;
  reviewed_today: number;
  overdue: boolean;
  days_until: number;
};

export type ActiveGoal = CollectionGoalProgress & { collection_name: string };

export type GoalsSummary = {
  streak: number;
  cards_studied_today: number;
  active_goals: ActiveGoal[];
  daily_target_total: number;
  daily_due_count: number;
};

export type StreakCalendarDay = {
  date: string;
  studied: boolean;
  cards_reviewed: number;
};

export type StreakCalendar = {
  current_streak: number;
  days: StreakCalendarDay[];
};

export type ContactPayload = {
  name: string;
  email: string;
  message: string;
  locale: string;
};
