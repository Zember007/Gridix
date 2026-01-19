import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "@/shared/api/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import Loader from "@/shared/ui/loader";
import { toast } from "sonner";

type BitrixAuth = { domain?: string; member_id?: string; memberId?: string } | null;

type ProjectLite = {
  id: string;
  name: string;
  slug: string | null;
};

function getBitrixDealIdFromPlacement(): number | null {
  try {
    const info = (BX24 as any)?.placement?.info?.();
    const opts = info?.options ?? null;

    const toDealId = (v: unknown): number | null => {
      const n = typeof v === "number" ? v : Number(String(v ?? ""));
      return Number.isFinite(n) && n > 0 ? n : null;
    };

    // Common variants
    const direct =
      toDealId(opts?.ENTITY_ID) ??
      toDealId(opts?.entityId) ??
      toDealId(opts?.ID) ??
      null;
    if (direct) return direct;

    // Some placements pass options as JSON string or nested PLACEMENT_OPTIONS
    const raw = typeof opts === "string" ? opts : (opts?.PLACEMENT_OPTIONS as unknown);
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
  const initialDealIdFromUrl = useMemo(() => {
    const sp = new URLSearchParams(window.location.search);
    const raw = sp.get("deal_id");
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  }, []);

  const [loading, setLoading] = useState(true);
  const [bxDomain, setBxDomain] = useState<string | null>(null);
  const [bxMemberId, setBxMemberId] = useState<string | null>(null);
  const [dealId, setDealId] = useState<number | null>(initialDealIdFromUrl);

  const [needsConnect, setNeedsConnect] = useState(false);
  const [connectUrl, setConnectUrl] = useState<string | null>(null);

  const [projects, setProjects] = useState<ProjectLite[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const setSearchParams = (patch: Record<string, string | null>) => {
    const url = new URL(window.location.href);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === undefined || v === "") url.searchParams.delete(k);
      else url.searchParams.set(k, v);
    }
    navigate({ search: url.search }, { replace: true });
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setNeedsConnect(false);

        // Init BX24 if available (inside Bitrix iframe)
        if (typeof BX24 !== "undefined") {
          BX24.init(() => {
            try {
              BX24.fitWindow?.();
              const auth: BitrixAuth = (BX24 as any)?.getAuth?.() ?? null;
              const domain = normalizeDomain(auth?.domain ?? null);
              const memberId = auth?.member_id ?? auth?.memberId ?? null;
              if (domain) setBxDomain(domain);
              if (memberId) setBxMemberId(String(memberId));

              const dId = getBitrixDealIdFromPlacement();
              setDealId(dId);
              // Propagate CRM context into URL so it survives navigation to project/apartment pages.
              setSearchParams({
                crm: "bitrix",
                deal_id: dId ? String(dId) : null,
              });
            } catch {
              // ignore
            }
          });
        }

        // Bitrix SSO: auto-login using Bitrix domain+member_id
        const { data: u0 } = await supabase.auth.getUser();
        let user = u0?.user ?? null;

        if (!user && bxDomain && bxMemberId) {
          // Reuse shared SSO endpoint (CRM-neutral). It returns a short-lived signed token.
          const { data: ssoData, error: ssoErr } = await supabase.functions.invoke("amocrm-sso-login", {
            body: { action: "bitrix24", domain: bxDomain, member_id: bxMemberId },
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
          if (bxDomain && bxMemberId) {
            setConnectUrl(
              `/embed/connect/bitrix24?domain=${encodeURIComponent(bxDomain)}&member_id=${encodeURIComponent(bxMemberId)}`
            );
          }
          setProjects([]);
          return;
        }

        // Load projects for current Gridix user using RLS
        const { data: pData, error: pErr } = await supabase
          .from("projects")
          .select("id,name,slug")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (pErr) throw pErr;
        const list = (pData ?? []) as ProjectLite[];
        setProjects(list);
        if (!selectedProjectId && list[0]?.id) setSelectedProjectId(list[0].id);
      } catch (e) {
        console.error(e);
        toast.error("Не удалось загрузить Bitrix страницу");
      } finally {
        setLoading(false);
      }
    };

    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bxDomain, bxMemberId]);

  const openSelectedProject = () => {
    if (!selectedProject) return;
    const base = selectedProject.slug ? `/embed/project/${selectedProject.slug}` : `/embed/project/id/${selectedProject.id}`;
    const url = new URL(base, window.location.origin);
    url.searchParams.set("crm", "bitrix");
    if (dealId) url.searchParams.set("deal_id", String(dealId));
    window.open(url.toString(), "_self");
  };

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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Контекст</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div>
            Deal ID: <span className="font-mono">{dealId ?? "—"}</span>
          </div>
          <div className="text-muted-foreground">
            Если страница открыта из сделки — Deal ID определится автоматически и будет доступен при привязке квартиры.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Проекты</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {projects.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Нет проектов. Войдите в Gridix под аккаунтом застройщика и создайте проект.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {projects.map((p) => (
                  <Button
                    key={p.id}
                    variant={p.id === selectedProjectId ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedProjectId(p.id)}
                  >
                    {p.name}
                  </Button>
                ))}
              </div>

              <Button className="w-full" onClick={openSelectedProject} disabled={!selectedProject}>
                Открыть проект
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

