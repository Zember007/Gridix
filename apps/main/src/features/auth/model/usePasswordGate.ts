import { useEffect, useMemo, useRef, useState } from "react";
import { hasUserPassword } from "@gridix/utils";
import { supabase } from "@/shared/api/supabase";

interface UsePasswordGateParams {
  loading: boolean;
  requireAuth: boolean;
  userId?: string;
  provider?: string;
  requiresPasswordSetup?: boolean;
}

export const usePasswordGate = ({
  loading,
  requireAuth,
  userId,
  provider,
  requiresPasswordSetup,
}: UsePasswordGateParams) => {
  const [passwordGateLoading, setPasswordGateLoading] = useState(false);
  const [needsPasswordSet, setNeedsPasswordSet] = useState(false);
  const passwordCheckCacheRef = useRef<Map<string, boolean>>(new Map());

  const isEmailProvider = useMemo(() => provider === "email", [provider]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (loading || !requireAuth || !userId) {
        setNeedsPasswordSet(false);
        setPasswordGateLoading(false);
        return;
      }

      try {
        const cacheKey = `has_password:${userId}`;
        const cachedHasPassword = passwordCheckCacheRef.current.get(userId);
        const storedHasPassword =
          typeof window !== "undefined"
            ? window.sessionStorage.getItem(cacheKey)
            : null;

        const mustSetPassword =
          (isEmailProvider && !cachedHasPassword) || !!requiresPasswordSetup;

        if (cachedHasPassword !== undefined) {
          setNeedsPasswordSet(mustSetPassword);
          setPasswordGateLoading(false);
          return;
        }

        if (storedHasPassword === "true" || storedHasPassword === "false") {
          const hasPassword = storedHasPassword === "true";
          passwordCheckCacheRef.current.set(userId, hasPassword);
          setNeedsPasswordSet(
            (isEmailProvider && !hasPassword) || !!requiresPasswordSetup,
          );
          setPasswordGateLoading(false);
          return;
        }

        setPasswordGateLoading(true);
        const hasPassword = await hasUserPassword(supabase as any);

        if (!cancelled) {
          passwordCheckCacheRef.current.set(userId, hasPassword);
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem(cacheKey, String(hasPassword));
          }
          setNeedsPasswordSet(
            (isEmailProvider && !hasPassword) || !!requiresPasswordSetup,
          );
        }
      } catch {
        if (!cancelled) setNeedsPasswordSet(!!requiresPasswordSetup);
      } finally {
        if (!cancelled) setPasswordGateLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [loading, requireAuth, userId, isEmailProvider, requiresPasswordSetup]);

  return { passwordGateLoading, needsPasswordSet };
};
