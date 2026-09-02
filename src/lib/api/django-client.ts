import "server-only";

const DJANGO_API_URL = process.env.EYELEARN_API_URL ?? "http://localhost:8000";
const INTERNAL_API_KEY = process.env.EYELEARN_INTERNAL_API_KEY ?? "";

export class DjangoApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`Django API request failed with status ${status}`);
    this.status = status;
    this.body = body;
  }
}

/**
 * Server-only fetch wrapper for calling the Django backend directly.
 * Never import this from a "use client" file -- EYELEARN_API_URL and
 * bearer tokens must stay on the server side of the BFF proxy.
 */
export async function djangoFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(`${DJANGO_API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Api-Key": INTERNAL_API_KEY,
      ...init?.headers,
    },
    cache: "no-store",
  });
}

export async function djangoFetchJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await djangoFetch(path, init);
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new DjangoApiError(response.status, body);
  }

  return body as T;
}

/**
 * Same as djangoFetchJson, but also console.logs a specific response
 * header -- used by the AI flashcard generation calls (lib/flashcards/api.ts)
 * to report which provider (claude/gemini/groq) actually served the
 * request, right in the server console: `next dev`'s terminal locally, or
 * the deployment's function logs in Vercel. Mirrors Django's own
 * X-AI-Provider response header + logger.info line
 * (flashcards/ai_providers/__init__.py) one hop further up the stack, for
 * checking which provider is live without curling Django directly. This is
 * a developer-only signal: nothing in the UI reads or displays it.
 */
export async function djangoFetchJsonLoggingHeader<T>(
  path: string,
  headerName: string,
  logLabel: string,
  init?: RequestInit,
): Promise<T> {
  const response = await djangoFetch(path, init);
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new DjangoApiError(response.status, body);
  }

  console.log(`[${logLabel}] ${headerName}: ${response.headers.get(headerName) ?? "(none)"}`);
  return body as T;
}

/**
 * Maps a DjangoApiError (or any other thrown error) to the
 * {status, body} shape route handlers pass to NextResponse.json --
 * shared by the flashcards BFF routes, which all follow the same
 * try/djangoFetchJson/catch pattern as the billing routes.
 */
export function djangoErrorResponse(error: unknown): { status: number; body: unknown } {
  if (error instanceof DjangoApiError) {
    return { status: error.status, body: error.body };
  }

  return { status: 502, body: { detail: "Network error while reaching Eye Learn." } };
}
