import { useMemo } from "react";
import type { SharedProject } from "@gridix/ui";
import { getUnitStatusGroup } from "@/entities/project";
import { createUnitUrl } from "../lib/project-share";
import { useProjectUnitsQuery } from "../model/useProjectUnitsQuery";

interface Props {
  project: SharedProject;
  activeWorkspaceId: string | null;
  baseUrl: string;
  language: string;
  t: (key: string) => string;
}

export function ProjectDrawerUnitsTab({
  project,
  activeWorkspaceId,
  baseUrl,
  language,
  t,
}: Props) {
  const unitsQuery = useProjectUnitsQuery(activeWorkspaceId, project.id);
  const payload = unitsQuery.data;
  const slug = payload?.project?.slug ?? null;

  const units = useMemo(() => payload?.units ?? [], [payload]);

  const floors = useMemo(() => {
    const set = new Set<number>();
    for (const unit of units) set.add(unit.floor_number);
    return Array.from(set).sort((a, b) => b - a);
  }, [units]);

  const unitsByFloor = useMemo(() => {
    const byFloor = new Map<number, typeof units>();
    for (const unit of units) {
      const list = byFloor.get(unit.floor_number) ?? [];
      list.push(unit);
      byFloor.set(unit.floor_number, list);
    }
    for (const list of byFloor.values()) {
      list.sort((a, b) =>
        String(a.apartment_number ?? "").localeCompare(
          String(b.apartment_number ?? ""),
          undefined,
          { numeric: true },
        ),
      );
    }
    return byFloor;
  }, [units]);

  const statusStats = useMemo(() => {
    const stats = { available: 0, booked: 0, sold: 0 };
    for (const unit of units) stats[getUnitStatusGroup(unit.status)] += 1;
    return stats;
  }, [units]);

  const openUnit = (apartmentNumber: string | null) => {
    const url = createUnitUrl({
      baseUrl,
      language,
      slug,
      apartmentNumber,
      activeWorkspaceId,
    });
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const formatUnitPrice = (price: number | null | undefined) => {
    if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
      return "—";
    }
    if (price >= 1000) return `$${Math.round(price / 1000)}K`;
    return `$${Math.round(price)}`;
  };

  if (unitsQuery.isLoading) {
    return (
      <div className="p-6 text-sm text-slate-500">
        {t("common.common.loading")}
      </div>
    );
  }

  if (!unitsQuery.data || units.length === 0) {
    return (
      <div className="p-6 text-sm text-slate-500">
        {t("common.drawer.units.empty")}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-slate-100 px-4 py-3 text-xs font-semibold text-slate-600">
          <div className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span>
              {t("common.drawer.units.legend.available")} (
              {statusStats.available})
            </span>
          </div>
          <div className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span>
              {t("common.drawer.units.legend.booked")} ({statusStats.booked})
            </span>
          </div>
          <div className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span>
              {t("common.drawer.units.legend.sold")} ({statusStats.sold})
            </span>
          </div>
        </div>

        <div className="p-3 md:p-4">
          <div className="flex flex-col gap-2">
            {floors.map((floor) => {
              const floorUnits = unitsByFloor.get(floor) ?? [];
              return (
                <div
                  key={floor}
                  className="flex items-center gap-3 rounded-md px-1 py-0.5 hover:bg-slate-50"
                >
                  <div className="w-7 shrink-0 text-right text-sm font-medium text-slate-400">
                    {floor}
                  </div>
                  <div className="flex flex-1 flex-wrap items-center gap-1.5">
                    {floorUnits.map((unit) => {
                      const status = getUnitStatusGroup(unit.status);
                      const statusColor =
                        status === "available"
                          ? "border-emerald-400 bg-emerald-400 text-white hover:brightness-95"
                          : status === "booked"
                            ? "border-amber-400 bg-amber-400 text-white hover:brightness-95"
                            : "border-slate-300 bg-slate-300 text-white hover:brightness-95";
                      return (
                        <button
                          key={unit.id}
                          type="button"
                          onClick={() => openUnit(unit.apartment_number)}
                          className={[
                            "flex h-12 w-[62px] shrink-0 flex-col items-center justify-center rounded-md border px-1 text-center transition-colors",
                            statusColor,
                          ].join(" ")}
                          title={unit.apartment_number ?? "—"}
                        >
                          <span className="truncate text-[13px] font-semibold leading-none">
                            {unit.apartment_number ?? "—"}
                          </span>
                          <span className="mt-0.5 truncate text-[9px] font-semibold leading-none text-white">
                            {status === "sold"
                              ? t("common.drawer.units.legend.sold")
                              : status === "booked"
                                ? t("common.drawer.units.legend.booked")
                                : formatUnitPrice(unit.price)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
