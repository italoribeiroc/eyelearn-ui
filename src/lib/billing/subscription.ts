import "server-only";
import { cache } from "react";
import { djangoFetchJson } from "@/lib/api/django-client";
import type { SubscriptionStatus } from "@/lib/api/types";
import { getValidAccessToken } from "@/lib/auth/session";

/**
 * Server-side helper mirroring `getCurrentUser()`: reads the subscription
 * for the current session, or null if the visitor isn't authenticated or
 * the request fails. Kept separate from `EyeLearnUser`/`getCurrentUser()`
 * so pages that don't need billing data don't pay for the extra Django
 * round-trip -- see CLAUDE.md for the full rationale.
 */
export const getSubscriptionStatus = cache(
  async (): Promise<SubscriptionStatus | null> => {
    const access = await getValidAccessToken();
    if (!access) return null;

    try {
      return await djangoFetchJson<SubscriptionStatus>("/api/billing/subscription/", {
        headers: { Authorization: `Bearer ${access}` },
      });
    } catch {
      return null;
    }
  },
);
