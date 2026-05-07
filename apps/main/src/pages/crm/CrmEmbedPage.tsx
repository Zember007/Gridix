import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { Button, Card, CardContent, Loader } from "@gridix/ui";
import { useCurrentSession } from "@gridix/utils";
import { supabase } from "@gridix/utils/api";
import ProjectList from "@/components/projects/ProjectList";
import { AdminAccessProvider } from "@/entities/admin-access";
import { CrmTopBar } from "@/pages/bitrix/components/BitrixCrmTopBar";
import { useBitrixConnect } from "@/pages/bitrix/hooks/useBitrixConnect";
import { useCrmProjectsLite } from "@/pages/bitrix/hooks/useCrmProjectsLite";

type CrmEmbedType = "bitrix" | "amocrm";

type CrmEmbedPageProps = {
  crm: CrmEmbedType;
};

function toPositiveInt(raw: string | null): number | null {
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

function normalizeDomain(raw: string | null | undefined): string {
  return String(raw || "")
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");
}

function getBitrixDealIdFromPlacement(): number | null {
  try {
    const info =
      typeof BX24 !== "undefined" ? (BX24?.placement?.info?.() ?? null) : null;
    const opts = info?.options ?? null;
    const optsObj: Record<string, unknown> | null =
      typeof opts === "object" && opts !== null
        ? (opts as Record<string, unknown>)
        : null;

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

    const raw =
      typeof opts === "string" ? opts : (optsObj?.PLACEMENT_OPTIONS as unknown);
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

function CrmEmbedPageInner({ crm }: CrmEmbedPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qp = useMemo(() => new URLSearchParams(window.location.search), []);
  const initialEntityId = useMemo(
    () => toPositiveInt(qp.get(crm === "bitrix" ? "deal_id" : "lead_id")),
    [crm, qp],
  );
  const initialDomain = useMemo(
    () => normalizeDomain(qp.get("domain") ?? qp.get("DOMAIN") ?? ""),
    [qp],
  );
  const initialMemberId = useMemo(
    () =>
      qp.get("member_id") ?? qp.get("memberId") ?? qp.get("MEMBER_ID") ?? null,
    [qp],
  );

  const [bxDomain, setBxDomain] = useState<string | null>(
    initialDomain || null,
  );
  const [bxMemberId, setBxMemberId] = useState<string | null>(
    initialMemberId || null,
  );
  const [entityId, setEntityId] = useState<number | null>(initialEntityId);
  const [ssoAttempted, setSsoAttempted] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const { data: sessionQuery, isLoading: isSessionLoading } =
    useCurrentSession();

  const bitrixConnect = useBitrixConnect(
    crm === "bitrix" ? bxDomain : null,
    crm === "bitrix" ? bxMemberId : null,
  );
  const status = crm === "bitrix" ? bitrixConnect.status : "claimed";
  const user = useMemo(
    () =>
      crm === "bitrix"
        ? bitrixConnect.user
        : sessionQuery?.user
          ? {
              id: sessionQuery.user.id,
              email: sessionQuery.user.email ?? undefined,
            }
          : null,
    [bitrixConnect.user, crm, sessionQuery?.user],
  );
  const { projects, loading: projectsLoading } = useCrmProjectsLite(
    !!user && status === "claimed",
  );
  const claimAttemptedRef = useRef(false);
  const [claimLoading, setClaimLoading] = useState(false);

  const setSearchParams = (patch: Record<string, string | null>) => {
    const url = new URL(window.location.href);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === undefined || v === "") url.searchParams.delete(k);
      else url.searchParams.set(k, v);
    }
    navigate({ search: url.search }, { replace: true });
  };

  const verifySsoToken = async (sso: string) => {
    const { data: sessionData, error: verifyErr } =
      await supabase.functions.invoke("sso-login", {
        body: { action: "verify", token: sso },
      });
    const access = (sessionData as { access_token?: string } | null)
      ?.access_token;
    const refresh = (sessionData as { refresh_token?: string } | null)
      ?.refresh_token;
    if (
      !verifyErr &&
      typeof access === "string" &&
      typeof refresh === "string"
    ) {
      await supabase.auth.setSession({
        access_token: access,
        refresh_token: refresh,
      });
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (crm !== "bitrix") return;
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
          setEntityId(placementDealId);
        } catch {
          // ignore
        }
      });
    } catch {
      // ignore
    }
  }, [crm]);

  useEffect(() => {
    setSearchParams({
      crm,
      deal_id: crm === "bitrix" && entityId ? String(entityId) : null,
      lead_id: crm === "amocrm" && entityId ? String(entityId) : null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crm, entityId]);

  useEffect(() => {
    const run = async () => {
      if (ssoAttempted || isSessionLoading || sessionQuery?.user) return;

      const ssoFromUrl = qp.get("sso");
      if (ssoFromUrl) {
        setSsoAttempted(true);
        setSsoLoading(true);
        try {
          await verifySsoToken(ssoFromUrl);
        } catch (e) {
          console.error(e);
        } finally {
          setSsoLoading(false);
        }
        return;
      }

      if (crm !== "bitrix" || !bxDomain || !bxMemberId) return;

      setSsoAttempted(true);
      setSsoLoading(true);
      try {
        const { data: ssoData, error: ssoErr } =
          await supabase.functions.invoke("sso-login", {
            body: {
              action: "bitrix24",
              domain: bxDomain,
              member_id: bxMemberId,
            },
          });
        const sso = (ssoData as { sso?: string } | null)?.sso;
        if (!ssoErr && typeof sso === "string" && sso) {
          await verifySsoToken(sso);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setSsoLoading(false);
      }
    };
    void run();
  }, [
    bxDomain,
    bxMemberId,
    crm,
    isSessionLoading,
    qp,
    sessionQuery?.user,
    ssoAttempted,
  ]);

  useEffect(() => {
    if (
      crm !== "bitrix" ||
      status !== "pending" ||
      !user ||
      claimAttemptedRef.current
    ) {
      return;
    }

    claimAttemptedRef.current = true;
    setClaimLoading(true);

    void (async () => {
      try {
        const ok = await bitrixConnect.claimInstall();
        if (!ok) {
          claimAttemptedRef.current = false;
        }
      } finally {
        setClaimLoading(false);
      }
    })();
  }, [bitrixConnect, crm, status, user]);

  const showProjects = !!user && status === "claimed";

  const loading =
    (crm === "bitrix" && status === "loading") ||
    claimLoading ||
    isSessionLoading ||
    ssoLoading ||
    (crm === "bitrix" &&
      status === "claimed" &&
      !user &&
      (!ssoAttempted || ssoLoading));
  const needsConnect =
    crm === "bitrix" &&
    !claimLoading &&
    !user &&
    (status === "pending" ||
      status === "needs_install" ||
      status === "claimed");
  const needsAmoAuth = crm === "amocrm" && !user && !loading;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader size="lg" className="mx-auto" />
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-4 bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">
          {crm === "bitrix" ? t("bitrix.page.title") : "Gridix - amoCRM"}
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
        >
          {t("bitrix.page.refresh")}
        </Button>
      </div>

      <CrmTopBar
        crm={crm}
        projects={projects}
        loading={projectsLoading}
        entityId={entityId}
        activeProjectId={null}
      />

      {needsConnect && (
        <Card>
          <CardContent className="space-y-3 p-4 text-sm">
            {bitrixConnect.connectUrl ? (
              <Button
                onClick={() =>
                  (window.location.href = bitrixConnect.connectUrl!)
                }
                className="w-full"
              >
                {t("bitrix.page.connectButton")}
              </Button>
            ) : (
              <div className="text-muted-foreground">
                {t("bitrix.page.missingParams")}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {needsAmoAuth && (
        <Card>
          <CardContent className="space-y-3 p-4 text-sm">
            <div className="text-muted-foreground">
              Войдите в Gridix, чтобы связать amoCRM и открыть проекты.
            </div>
            <Button
              className="w-full"
              onClick={() => {
                const sp = new URLSearchParams(window.location.search);
                const redirect = `${window.location.pathname}?${sp.toString()}`;
                window.location.href = `/ru/auth/signup?redirect=${encodeURIComponent(
                  redirect,
                )}`;
              }}
            >
              Войти в Gridix
            </Button>
          </CardContent>
        </Card>
      )}

      {showProjects && (
        <ProjectList
          mode="crm"
          embedPathMode="root"
          crmQueryParams={{
            crm,
            deal_id: crm === "bitrix" && entityId ? String(entityId) : null,
            lead_id: crm === "amocrm" && entityId ? String(entityId) : null,
            source: crm === "amocrm" ? "amo_widget" : null,
          }}
        />
      )}
    </div>
  );
}

export default function CrmEmbedPage({ crm }: CrmEmbedPageProps) {
  return (
    <AdminAccessProvider>
      <CrmEmbedPageInner crm={crm} />
    </AdminAccessProvider>
  );
}
