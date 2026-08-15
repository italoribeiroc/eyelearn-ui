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
