/**
 * Mirrors djangorestframework-simplejwt's default lifetimes (the Django
 * backend has no SIMPLE_JWT override in settings.py). Keep these in sync
 * if the backend ever configures custom token lifetimes.
 */
export const ACCESS_COOKIE = "eyelearn_access";
export const REFRESH_COOKIE = "eyelearn_refresh";

export const ACCESS_TOKEN_MAX_AGE_SECONDS = 5 * 60; // 5 minutes
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 24 * 60 * 60; // 1 day

/** CSRF-protection cookie for the Google OAuth Authorization Code flow's `state` param. */
export const GOOGLE_OAUTH_STATE_COOKIE = "eyelearn_google_oauth_state";
export const GOOGLE_OAUTH_STATE_MAX_AGE_SECONDS = 5 * 60; // 5 minutes

/**
 * Carries the pricing card's `?plan=` intent across the redirect to Google
 * and back, since Google's callback can't read the originating page's URL.
 * Same short lifetime as the state cookie -- it only needs to survive one
 * round trip.
 */
export const GOOGLE_OAUTH_PLAN_COOKIE = "eyelearn_google_oauth_plan";

/**
 * Carries the originating page's locale across the redirect to Google and
 * back -- the callback route lives outside [locale] routing and otherwise
 * always lands on the unprefixed (English) dashboard, which silently
 * broke checkout currency for pt-BR visitors (locale drives both the
 * dashboard URL prefix and the Stripe currency). Same short lifetime as
 * the state cookie.
 */
export const GOOGLE_OAUTH_LOCALE_COOKIE = "eyelearn_google_oauth_locale";
