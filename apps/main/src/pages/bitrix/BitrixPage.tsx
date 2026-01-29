import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "@gridix/utils/api";
import { Button, Card, CardContent, Loader } from "@gridix/ui";
import { toast } from "sonner";
import ProjectList from "@/components/projects/ProjectList";
import { BitrixCrmTopBar } from "@/pages/bitrix/components/BitrixCrmTopBar";
import { useCrmProjectsLite } from "@/pages/bitrix/hooks/useCrmProjectsLite";

type BitrixAuth = { domain?: string; member_id?: string; memberId?: string } | null;

function getBitrixDealIdFromPlacement(): number | null {
  try {
    const info = (BX24 as unknown as { placement?: { info?: () => { options?: unknown } } })?.placement?.info?.();
    const opts = info?.options ?? null;

    const optsObj: Record<string, unknown> | null =
      typeof opts === "object" && opts !== null ? (opts as Record<string, unknown>) : null;

    const toDealId = (v: unknown): number | null => {
      const n = typeof v === "number" ? v : Number(String(v ?? ""));
      return Number.isFinite(n) && n > 0 ? n : null;
    };

    // Common variants
    const direct =
      toDealId(optsObj?.ENTITY_ID) ??
      toDealId(optsObj?.entityId) ??
      toDealId(optsObj?.ID) ??
      null;
    if (direct) return direct;

    // Some placements pass options as JSON string or nested PLACEMENT_OPTIONS
    const raw =
      typeof opts === "string"
        ? opts
        : (optsObj?.PLACEMENT_OPTIONS as unknown);
    if (typeof raw === "string" && raw.trim()) {
      try {
        const parsed = JSON.parse(raw);
        const fromJson = toDealId(parsed?.ID ?? parsed?.id);
        if (fromJson) return fromJson;
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
  return null;
}

function normalizeDomain(raw: string | null | undefined): string {
  return String(raw || "")
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
}

export default function BitrixPage() {
  const navigate = useNavigate();
  const initialParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const initialDealIdFromUrl = useMemo(() => {
    const sp = new URLSearchParams(window.location.search);
    const raw = sp.get("deal_id");
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  }, []);
  const initialDomainFromUrl = useMemo(() => {
    const raw = initialParams.get("domain") ?? initialParams.get("DOMAIN") ?? "";
    return normalizeDomain(raw);
  }, [initialParams]);
  const initialMemberIdFromUrl = useMemo(() => {
    return initialParams.get("member_id") ?? initialParams.get("memberId") ?? initialParams.get("MEMBER_ID") ?? null;
  }, [initialParams]);

  const [loading, setLoading] = useState(true);
  const [bxDomain, setBxDomain] = useState<string | null>(initialDomainFromUrl || null);
  const [bxMemberId, setBxMemberId] = useState<string | null>(initialMemberIdFromUrl || null);
  const [dealId, setDealId] = useState<number | null>(initialDealIdFromUrl);

  const [needsConnect, setNeedsConnect] = useState(false);
  const [connectUrl, setConnectUrl] = useState<string | null>(null);

  const { projects, loading: projectsLoading } = useCrmProjectsLite(!loading && !needsConnect);

  const setSearchParams = (patch: Record<string, string | null>) => {
    const url = new URL(window.location.href);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === undefined || v === "") url.searchParams.delete(k);
      else url.searchParams.set(k, v);
    }
    navigate({ search: url.search }, { replace: true });
  };

  useEffect(() => {
    // Do not block page loading on BX24.init(). In some Bitrix contexts, init callback can be delayed.
    if (typeof BX24 === "undefined") return;
    try {
      BX24.init(() => {
        try {
          BX24.fitWindow?.();
          const auth: BitrixAuth =
            (BX24 as unknown as { getAuth?: () => BitrixAuth })?.getAuth?.() ?? null;
          const authDomain = normalizeDomain(auth?.domain ?? null);
          const authMemberId = auth?.member_id ?? auth?.memberId ?? null;
          if (authDomain) setBxDomain(authDomain);
          if (authMemberId) setBxMemberId(String(authMemberId));

          const placementDealId = getBitrixDealIdFromPlacement();
          setDealId(placementDealId);
        } catch {
          // ignore
        }
      });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setNeedsConnect(false);

        const domain = bxDomain;
        const memberId = bxMemberId;
        const dId = dealId;

        // Propagate CRM context into URL so it survives navigation to project/apartment pages.
        setSearchParams({
          crm: "bitrix",
          deal_id: dId ? String(dId) : null,
        });

        // Bitrix SSO: auto-login using Bitrix domain+member_id
        const { data: u0 } = await supabase.auth.getUser();
        let user = u0?.user ?? null;

        if (!user && domain && memberId) {
          // Reuse shared SSO endpoint (CRM-neutral). It returns a short-lived signed token.
          const { data: ssoData, error: ssoErr } = await supabase.functions.invoke("amocrm-sso-login", {
            body: { action: "bitrix24", domain, member_id: memberId },
          });

          const sso = (ssoData as { sso?: unknown } | null)?.sso;
          if (!ssoErr && typeof sso === "string" && sso) {
            const { data: sessionData, error: verifyErr } = await supabase.functions.invoke("amocrm-sso-login", {
              body: { action: "verify", token: sso },
            });
            const access = (sessionData as { access_token?: unknown } | null)?.access_token;
            const refresh = (sessionData as { refresh_token?: unknown } | null)?.refresh_token;
            if (!verifyErr && typeof access === "string" && typeof refresh === "string") {
              await supabase.auth.setSession({ access_token: access, refresh_token: refresh });
            }
          }

          const { data: u1 } = await supabase.auth.getUser();
          user = u1?.user ?? null;
        }

        if (!user) {
          setNeedsConnect(true);
          if (domain && memberId) {
            setConnectUrl(
              `/embed/connect/bitrix24?domain=${encodeURIComponent(domain)}&member_id=${encodeURIComponent(memberId)}`
            );
          }
          return;
        }
      } catch (e) {
        console.error(e);
        toast.error("Не удалось загрузить Bitrix страницу");
      } finally {
        setLoading(false);
      }
    };

    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bxDomain, bxMemberId, dealId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader size="lg" className="mx-auto" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Gridix • Bitrix</h1>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Обновить
        </Button>
      </div>

      <BitrixCrmTopBar projects={projects} loading={projectsLoading} dealId={dealId} activeProjectId={null} />

      {needsConnect && (
        <Card>
          <CardContent className="p-4 text-sm space-y-3">
            <div className="text-muted-foreground">
              Чтобы открыть проекты, нужно подключить Bitrix24 к аккаунту Gridix (SSO).
            </div>
            {connectUrl ? (
              <Button onClick={() => window.open(connectUrl, "_blank", "noopener,noreferrer")} className="w-full">
                Подключить Bitrix24
              </Button>
            ) : (
              <div className="text-muted-foreground">
                Не удалось получить параметры Bitrix (domain/member_id). Откройте эту страницу из меню приложения в Bitrix.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!needsConnect && (
        <ProjectList
          mode="crm"
          embedPathMode="root"
          crmQueryParams={{ crm: "bitrix", deal_id: dealId ? String(dealId) : null }}
        />
      )}
    </div>
  );
}

