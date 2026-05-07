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

type CrmEmbedType = "bitrix" | "amocrm";

function buildCrmSearchParams(
  existingSearch: string,
  crm: CrmEmbedType,
  entityId: number | null,
) {
  const sp = new URLSearchParams(existingSearch);
  sp.set("crm", crm);
  if (crm === "bitrix") {
    if (entityId) sp.set("deal_id", String(entityId));
    else sp.delete("deal_id");
    sp.delete("lead_id");
  } else {
    if (entityId) sp.set("lead_id", String(entityId));
    else sp.delete("lead_id");
    sp.delete("deal_id");
  }
  return sp;
}

type CrmTopBarProps = {
  crm?: CrmEmbedType;
  projects: CrmProjectLite[];
  loading?: boolean;
  entityId?: number | null;
  dealId?: number | null;
  /** Current project id if a project is open; null -> Catalog is active */
  activeProjectId?: string | null;
};

export function CrmTopBar({
  crm = "bitrix",
  projects,
  loading,
  entityId,
  dealId,
  activeProjectId,
}: CrmTopBarProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useParams();
  const langSegment = lang ?? i18n.language?.split("-")[0] ?? "en";

  const adminAccess = useAdminAccess();

  const entityIdResolved = useMemo(() => {
    if (typeof entityId === "number") return entityId;
    if (typeof dealId === "number") return dealId;
    const key = crm === "bitrix" ? "deal_id" : "lead_id";
    const fromUrl = toPositiveInt(
      new URLSearchParams(location.search).get(key),
    );
    return fromUrl;
  }, [crm, dealId, entityId, location.search]);

  const value = activeProjectId ?? "catalog";

  const onValueChange = (next: string) => {
    const sp = buildCrmSearchParams(location.search, crm, entityIdResolved);
    if (next === "catalog") {
      navigate({
        pathname: `/${langSegment}/${crm === "bitrix" ? "bitrix" : "amocrm"}`,
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

      {entityIdResolved ? (
        <div className="shrink-0 rounded-md border bg-muted/30 px-2 py-1 text-xs text-muted-foreground">
          {crm === "bitrix" ? t("bitrix.topBar.currentDeal") : "AmoCRM lead"}{" "}
          <span className="font-mono text-foreground">{entityIdResolved}</span>
        </div>
      ) : null}
    </div>
  );
}

export const BitrixCrmTopBar = CrmTopBar;
