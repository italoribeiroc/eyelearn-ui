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
  terms_accepted: boolean;
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
  refund_eligible_until: string | null;
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

export type GenerationSourceDocument = {
  id: number;
  filename: string;
  content_type: string;
  size_bytes: number;
  // Server-side extracted (or, for scanned pages/photos, vision-transcribed)
  // text length. The draft's source_documents list (see AiGenerationDraft)
  // only ever carries this shape -- the full text isn't repeated on every
  // draft-status poll; see GenerationSourceDocumentDetail for that.
  char_count: number;
  created_at: string;
};

// Returned only by the upload-confirm and update-text calls, which is where
// the uploader needs to actually see (and, for update, correct) what the
// server read from their file -- most useful right after a photo or scanned
// page goes through vision transcription.
export type GenerationSourceDocumentDetail = GenerationSourceDocument & {
  extracted_text: string;
};

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
  source_documents: GenerationSourceDocument[];
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

/** Response from undoing the most recent review -- same shape as ReviewResult
 * minus `correct`, which only ever described the review being undone. */
export type UndoReviewResult = Omit<ReviewResult, "correct">;

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

export type ExamStatus = "in_progress" | "completed";
export type ExamMode = "random" | "selected" | "retake";

/**
 * Score summary of a finished exam. `unanswered_when_time_ran_out` counts
 * everything still open when the clock hit zero (answered late + never
 * answered) and is 0 for an untimed or in-time exam.
 */
export type ExamSummary = {
  total: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  correct_in_time: number;
  answered_after_time: { count: number; correct: number };
  unanswered_when_time_ran_out: number;
  timed_out: boolean;
  time_taken_seconds: number | null;
  score_percent: number;
};

type ExamHeader = {
  id: number;
  status: ExamStatus;
  mode: ExamMode;
  time_limit_seconds: number | null;
  started_at: string;
  ends_at: string | null;
  finished_at: string | null;
  source_labels: string[];
  /** Server clock at response time, for correcting client clock skew. */
  server_now: string;
  total: number;
  answered_count: number;
};

/** A history-list row: counts only, no questions. */
export type ExamListItem = ExamHeader & { summary: ExamSummary | null };

/** A question while the exam is running: never reveals the right answer. */
export type ExamPlayerQuestion = {
  id: number;
  position: number;
  card_type: CardType;
  prompt: string;
  /** Multiple choice: option text only. */
  options: string[];
  /** Only present for basic cards (needed for self-grading). */
  answer: string | null;
  media: FlashcardMediaItem[];
  selected_option: number | null;
  submitted_answer: string;
  self_correct: boolean | null;
  answered: boolean;
};

export type ExamResultQuestion = {
  id: number;
  position: number;
  card_type: CardType;
  prompt: string;
  answer: string;
  options: FlashcardOption[];
  accepted_answers: string[];
  media: FlashcardMediaItem[];
  selected_option: number | null;
  submitted_answer: string;
  self_correct: boolean | null;
  /** null = never answered. */
  is_correct: boolean | null;
  answered: boolean;
  answered_after_time: boolean;
  card_deleted: boolean;
};

export type ExamInProgress = ExamHeader & {
  status: "in_progress";
  summary: null;
  questions: ExamPlayerQuestion[];
};

export type ExamResult = ExamHeader & {
  status: "completed";
  summary: ExamSummary;
  questions: ExamResultQuestion[];
};

export type ExamDetail = ExamInProgress | ExamResult;

export type ExamCreatePayload =
  | { mode: "random"; collection_ids: number[]; count: number | null; time_limit_minutes: number | null }
  | { mode: "selected"; card_ids: number[]; time_limit_minutes: number | null }
  | { mode: "retake"; exam_id: number; time_limit_minutes: number | null };

export type ExamAnswerPayload =
  | { question_id: number; selected_option: number }
  | { question_id: number; submitted_answer: string }
  | { question_id: number; self_correct: boolean };

export type ExamAnswerResult = {
  question_id: number;
  answered: boolean;
  answered_count: number;
  after_time: boolean;
  server_now: string;
};

export type ExamStatusCheck = {
  status: ExamStatus;
  ends_at: string | null;
  finished_at: string | null;
  server_now: string;
  answered_count: number;
};
