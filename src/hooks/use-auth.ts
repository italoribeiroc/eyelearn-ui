"use client";

import { useCallback, useEffect, useState } from "react";
import type { EyeLearnUser } from "@/lib/api/types";

type AuthState = {
  user: EyeLearnUser | null;
  isLoading: boolean;
};

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
  });

  const refetch = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });

      if (!res.ok) {
        setState({ user: null, isLoading: false });
        return;
      }

      const data = (await res.json()) as { user: EyeLearnUser };
      setState({ user: data.user, isLoading: false });
    } catch {
      setState({ user: null, isLoading: false });
    }
  }, []);

  useEffect(() => {
    // Fetch-on-mount: syncs auth state with the httpOnly session cookie,
    // which isn't readable from JS -- there is no non-effect alternative.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
  }, [refetch]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setState({ user: null, isLoading: false });
  }, []);

  return {
    user: state.user,
    isLoading: state.isLoading,
    isAuthenticated: !!state.user,
    refetch,
    logout,
  };
}
