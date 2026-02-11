import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "@gridix/utils/api";
import { Button, Card, CardContent, Loader } from "@gridix/ui";
import { toast } from "sonner";
import ProjectList from "@/components/projects/ProjectList";
import { BitrixCrmTopBar } from "@/pages/bitrix/components/BitrixCrmTopBar";
import { useBitrixConnect } from "@/pages/bitrix/hooks/useBitrixConnect";
import { useCrmProjectsLite } from "@/pages/bitrix/hooks/useCrmProjectsLite";

function getBitrixDealIdFromPlacement(): number | null {
  try {
    const info = typeof BX24 !== "undefined" ? BX24?.placement?.info?.() ?? null : null;
    const opts = info?.options ?? null;
    const optsObj: Record<string, unknown> | null =
      typeof opts === "object" && opts !== null ? (opts as Record<string, unknown>) : null;

    const toDealId = (v: unknown): number | null => {
      const n = typeof v === "number" ? v : Number(String(v ?? ""));
      return Number.isFinite(n) && n > 0 ? n : null;
    };

    const direct =
      toDealId(optsObj?.ENTITY_ID) ??
      toDealId(optsObj?.entityId) ??
      toDealId(optsObj?.ID) ??
      null;
    if (direct) return direct;

    const raw = typeof opts === "string" ? opts : (optsObj?.PLACEMENT_OPTIONS as unknown);
    if (typeof raw === "string" && raw.trim()) {
      try {
        const parsed = JSON.parse(raw);
        return toDealId(parsed?.ID ?? parsed?.id);
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
  const qp = useMemo(() => new URLSearchParams(window.location.search), []);
  const initialDealId = useMemo(() => {
    const raw = qp.get("deal_id");
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [qp]);
  const initialDomain = useMemo(() => normalizeDomain(qp.get("domain") ?? qp.get("DOMAIN") ?? ""), [qp]);
  const initialMemberId = useMemo(() => qp.get("member_id") ?? qp.get("memberId") ?? qp.get("MEMBER_ID") ?? null, [qp]);

  const [bxDomain, setBxDomain] = useState<string | null>(initialDomain || null);
  const [bxMemberId, setBxMemberId] = useState<string | null>(initialMemberId || null);
  const [dealId, setDealId] = useState<number | null>(initialDealId);
  const [ssoAttempted, setSsoAttempted] = useState(false);

  const { status, user, connectUrl } = useBitrixConnect(bxDomain, bxMemberId);
  const { projects, loading: projectsLoading } = useCrmProjectsLite(!!user && status === "claimed");

  const setSearchParams = (patch: Record<string, string | null>) => {
    const url = new URL(window.location.href);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === undefined || v === "") url.searchParams.delete(k);
      else url.searchParams.set(k, v);
    }
    navigate({ search: url.search }, { replace: true });
  };

  useEffect(() => {
    if (typeof BX24 === "undefined") return;
    try {
      BX24.init(() => {
        try {
          BX24.fitWindow?.();
          const auth = BX24.getAuth?.() ?? null;
          const d = normalizeDomain(auth?.domain ?? null);
          const m = auth?.member_id ?? null;
          if (d) setBxDomain(d);
          if (m) setBxMemberId(String(m));
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
    setSearchParams({ crm: "bitrix", deal_id: dealId ? String(dealId) : null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId]);

  useEffect(() => {
    const run = async () => {
      if (ssoAttempted || !bxDomain || !bxMemberId) return;
      const { data: u0 } = await supabase.auth.getUser();
      if (u0?.user) return;

      setSsoAttempted(true);
      try {
        const { data: ssoData, error: ssoErr } = await supabase.functions.invoke("sso-login", {
          body: { action: "bitrix24", domain: bxDomain, member_id: bxMemberId },
        });
        const sso = (ssoData as { sso?: string } | null)?.sso;
        if (!ssoErr && typeof sso === "string" && sso) {
          const { data: sessionData, error: verifyErr } = await supabase.functions.invoke("sso-login", {
            body: { action: "verify", token: sso },
          });
          const access = (sessionData as { access_token?: string } | null)?.access_token;
          const refresh = (sessionData as { refresh_token?: string } | null)?.refresh_token;
          if (!verifyErr && typeof access === "string" && typeof refresh === "string") {
            await supabase.auth.setSession({ access_token: access, refresh_token: refresh });
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    void run();
  }, [bxDomain, bxMemberId, ssoAttempted]);

  const loading = status === "loading";
  const needsConnect = !user && (status === "pending" || status === "needs_install" || status === "claimed");
  const showProjects = !!user && status === "claimed";

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
            {connectUrl ? (
              <Button
                onClick={() => (window.location.href = connectUrl)}
                className="w-full"
              >
                Подключить Bitrix24
              </Button>
            ) : (
              <div className="text-muted-foreground">
                Нет параметров Bitrix (domain/member_id). Откройте страницу из приложения Gridix в Bitrix24.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showProjects && (
        <ProjectList
          mode="crm"
          embedPathMode="root"
          crmQueryParams={{ crm: "bitrix", deal_id: dealId ? String(dealId) : null }}
        />
      )}
    </div>
  );
}
