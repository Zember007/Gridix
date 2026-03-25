import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gridix/ui/select";
import { CrmProjectLite } from "@/pages/bitrix/hooks/useCrmProjectsLite";
import { useAdminAccess } from "@/entities/admin-access";

function toPositiveInt(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function buildCrmSearchParams(existingSearch: string, dealId: number | null) {
  const sp = new URLSearchParams(existingSearch);
  sp.set("crm", "bitrix");
  if (dealId) sp.set("deal_id", String(dealId));
  else sp.delete("deal_id");
  return sp;
}

type BitrixCrmTopBarProps = {
  projects: CrmProjectLite[];
  loading?: boolean;
  dealId?: number | null;
  /** Current project id if a project is open; null -> Catalog is active */
  activeProjectId?: string | null;
};

export function BitrixCrmTopBar({
  projects,
  loading,
  dealId,
  activeProjectId,
}: BitrixCrmTopBarProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useParams();
  const langSegment = lang ?? i18n.language?.split("-")[0] ?? "en";

  const adminAccess = useAdminAccess();

  const dealIdResolved = useMemo(() => {
    const fromUrl = toPositiveInt(
      new URLSearchParams(location.search).get("deal_id"),
    );
    return dealId ?? fromUrl;
  }, [dealId, location.search]);

  const value = activeProjectId ?? "catalog";

  const onValueChange = (next: string) => {
    const sp = buildCrmSearchParams(location.search, dealIdResolved);
    if (next === "catalog") {
      navigate({
        pathname: `/${langSegment}/bitrix`,
        search: `?${sp.toString()}`,
      });
      return;
    }

    const p = projects.find((x) => x.id === next) ?? null;
    if (!p) return;

    const canUseCrm = adminAccess?.canUseCrmIntegration(p.id) ?? true;
    if (!canUseCrm) {
      window.open(
        `/${langSegment}/admin?page=subscription`,
        "_blank",
        "noopener,noreferrer",
      );
      return;
    }

    const pathname = p.slug
      ? `/embed/project/${p.slug}`
      : `/embed/project/id/${p.id}`;
    navigate({ pathname, search: `?${sp.toString()}` });
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <Select
          value={value}
          onValueChange={onValueChange}
          disabled={!!loading}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder={t("bitrix.topBar.catalog")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="catalog">
              {t("bitrix.topBar.catalog")}
            </SelectItem>
            {projects.map((p) => {
              const canUseCrm = adminAccess?.canUseCrmIntegration(p.id) ?? true;
              return (
                <SelectItem key={p.id} value={p.id} disabled={!canUseCrm}>
                  {p.name}
                  {!canUseCrm ? ` — ${t("bitrix.proGuard.title")}` : ""}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {dealIdResolved ? (
        <div className="shrink-0 rounded-md border bg-muted/30 px-2 py-1 text-xs text-muted-foreground">
          {t("bitrix.topBar.currentDeal")}{" "}
          <span className="font-mono text-foreground">{dealIdResolved}</span>
        </div>
      ) : null}
    </div>
  );
}
