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
