import { useCallback, useEffect, useState } from "react";
import { supabase } from "@gridix/utils/api";

export type BitrixConnectStatus =
  | "loading"
  | "claimed"
  | "pending"
  | "needs_install"
  | "error";

export interface UseBitrixConnectResult {
  status: BitrixConnectStatus;
  user: { id: string; email?: string } | null;
  error: string | null;
  claimInstall: () => Promise<boolean>;
  buildAuthUrl: () => string;
  connectUrl: string | null;
}

function normalizeDomain(raw: string | null | undefined): string {
  return String(raw || "")
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
}

/**
 * Унифицированная логика подключения Bitrix24.
 * Используется в BitrixPage и BitrixInstallPage.
 */
export function useBitrixConnect(
  domain: string | null | undefined,
  memberId: string | null | undefined,
): UseBitrixConnectResult {
  const normDomain = domain ? normalizeDomain(domain) : "";
  const normMemberId = memberId ? String(memberId).trim() : "";

  const [status, setStatus] = useState<BitrixConnectStatus>("loading");
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    if (!normDomain || !normMemberId) {
      setStatus("needs_install");
      return;
    }

    try {
      setError(null);

      const { data: u0 } = await supabase.auth.getUser();
      const currentUser = u0?.user ?? null;
      setUser(
        currentUser
          ? { id: currentUser.id, email: currentUser.email ?? undefined }
          : null,
      );

      if (currentUser) {
        const { data: statusData, error: statusErr } =
          await supabase.functions.invoke("bitrix-app", {
            body: {
              action: "install_status",
              domain: normDomain,
              member_id: normMemberId,
            },
          });

        if (statusErr) {
          setStatus("error");
          setError("Не удалось проверить статус установки");
          return;
        }

        const claimed = (statusData as { claimed?: boolean })?.claimed ?? false;
        const pending = (statusData as { pending?: boolean })?.pending ?? false;

        if (claimed) {
          setStatus("claimed");
        } else if (pending) {
          setStatus("pending");
        } else {
          setStatus("needs_install");
        }
      } else {
        const { data: statusData, error: statusErr } =
          await supabase.functions.invoke("bitrix-app", {
            body: {
              action: "install_status",
              domain: normDomain,
              member_id: normMemberId,
            },
          });

        if (statusErr) {
          setStatus("error");
          setError("Не удалось проверить статус установки");
          return;
        }

        const pending = (statusData as { pending?: boolean })?.pending ?? false;
        setStatus(pending ? "pending" : "needs_install");
      }
    } catch (e) {
      console.error(e);
      setStatus("error");
      setError(e instanceof Error ? e.message : "Ошибка подключения");
    }
  }, [normDomain, normMemberId]);

  useEffect(() => {
    void checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(() => {
      void checkStatus();
    });
    return () => data.subscription.unsubscribe();
  }, [checkStatus]);

  const claimInstall = useCallback(async (): Promise<boolean> => {
    if (!normDomain || !normMemberId) return false;

    try {
      setError(null);
      const { error: claimErr } = await supabase.functions.invoke(
        "bitrix-app",
        {
          body: {
            action: "claim_install",
            domain: normDomain,
            member_id: normMemberId,
          },
        },
      );

      if (claimErr) {
        const msg =
          (claimErr as { message?: string })?.message ??
          "Не удалось привязать установку";
        setError(msg);
        return false;
      }

      setStatus("claimed");
      setUser((prev) => prev ?? null);
      return true;
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Ошибка привязки");
      return false;
    }
  }, [normDomain, normMemberId]);

  const buildAuthUrl = useCallback((): string => {
    const redirect = `/embed/connect/bitrix24?domain=${encodeURIComponent(normDomain)}&member_id=${encodeURIComponent(normMemberId)}`;
    const sp = new URLSearchParams();
    sp.set("redirect", redirect);
    sp.set("bitrix_install", "1");
    sp.set("bitrix_domain", normDomain);
    sp.set("bitrix_member_id", normMemberId);
    return `/ru/auth?${sp.toString()}`;
  }, [normDomain, normMemberId]);

  const connectUrl =
    normDomain && normMemberId
      ? `/embed/connect/bitrix24?domain=${encodeURIComponent(normDomain)}&member_id=${encodeURIComponent(normMemberId)}`
      : null;

  return { status, user, error, claimInstall, buildAuthUrl, connectUrl };
}
