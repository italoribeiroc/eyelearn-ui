import "server-only";

const DJANGO_API_URL = process.env.EYELEARN_API_URL ?? "http://localhost:8000";

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
