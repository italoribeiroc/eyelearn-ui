export type EyeLearnUser = {
  id: number;
  username: string;
  email: string;
};

export type AuthTokens = {
  access: string;
  refresh: string;
};

export type RegisterPayload = {
  username: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  username: string;
  password: string;
};

export type GoogleAuthPayload = {
  id_token: string;
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
