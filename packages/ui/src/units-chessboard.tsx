import { useMemo } from "react";

export type UnitsChessStatusGroup = "available" | "booked" | "sold";

export interface UnitsChessItem {
  id: string;
  apartment_number: string | null;
  floor_number: number;
  status: string | null;
  price?: number | null;
}

interface UnitsChessboardLabels {
  available: string;
  booked: string;
  sold: string;
}

export interface UnitsChessboardProps<
  TUnit extends UnitsChessItem = UnitsChessItem,
> {
  units: TUnit[];
  labels: UnitsChessboardLabels;
  loading?: boolean;
  loadingText?: string;
  emptyText?: string;
  selectedUnitId?: string | null;
  onUnitClick?: (unit: TUnit) => void;
  getUnitStatusGroup?: (status: string | null) => UnitsChessStatusGroup;
  renderUnitMeta?: (
    unit: TUnit,
    status: UnitsChessStatusGroup,
    labels: UnitsChessboardLabels,
  ) => string;
}

const defaultGetUnitStatusGroup = (
  status: string | null,
): UnitsChessStatusGroup => {
  const st = String(status ?? "").toLowerCase();
  if (st === "available") return "available";
  if (st === "reserved" || st === "booked") return "booked";
  return "sold";
};

const defaultRenderUnitMeta = <TUnit extends UnitsChessItem>(
  unit: TUnit,
  status: UnitsChessStatusGroup,
  labels: UnitsChessboardLabels,
): string => {
  if (status === "sold") return labels.sold;
  if (status === "booked") return labels.booked;
  if (
    typeof unit.price !== "number" ||
    !Number.isFinite(unit.price) ||
    unit.price <= 0
  ) {
    return "-";
  }
  if (unit.price >= 1000) return `$${Math.round(unit.price / 1000)}K`;
  return `$${Math.round(unit.price)}`;
};

export function UnitsChessboard<TUnit extends UnitsChessItem>({
  units,
  labels,
  loading = false,
  loadingText = "Loading...",
  emptyText = "No units",
  selectedUnitId = null,
  onUnitClick,
  getUnitStatusGroup = defaultGetUnitStatusGroup,
  renderUnitMeta = defaultRenderUnitMeta,
}: UnitsChessboardProps<TUnit>) {
  const { floors, unitsByFloor, statusById, statusStats } = useMemo(() => {
    const floorSet = new Set<number>();
    const byFloor = new Map<number, TUnit[]>();
    const nextStatusById = new Map<string, UnitsChessStatusGroup>();
    const nextStatusStats = { available: 0, booked: 0, sold: 0 };

    for (const unit of units) {
      floorSet.add(unit.floor_number);

      const list = byFloor.get(unit.floor_number) ?? [];
      list.push(unit);
      byFloor.set(unit.floor_number, list);

      const status = getUnitStatusGroup(unit.status);
      nextStatusById.set(unit.id, status);
      nextStatusStats[status] += 1;
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

    return {
      floors: Array.from(floorSet).sort((a, b) => b - a),
      unitsByFloor: byFloor,
      statusById: nextStatusById,
      statusStats: nextStatusStats,
    };
  }, [units, getUnitStatusGroup]);

  if (loading) {
    return <div className="p-6 text-sm text-slate-500">{loadingText}</div>;
  }

  if (units.length === 0) {
    return <div className="p-6 text-sm text-slate-500">{emptyText}</div>;
  }

  return (
    <div className="p-6">
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-slate-100 px-4 py-3 text-xs font-semibold text-slate-600">
          <div className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span>
              {labels.available} ({statusStats.available})
            </span>
          </div>
          <div className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span>
              {labels.booked} ({statusStats.booked})
            </span>
          </div>
          <div className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span>
              {labels.sold} ({statusStats.sold})
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
                      const status = statusById.get(unit.id) ?? "sold";
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
                          onClick={() => onUnitClick?.(unit)}
                          className={[
                            "flex h-12 w-[62px] shrink-0 flex-col items-center justify-center rounded-md border px-1 text-center transition-colors",
                            statusColor,
                            selectedUnitId === unit.id
                              ? "ring-2 ring-slate-700 ring-offset-1"
                              : "",
                          ].join(" ")}
                          title={unit.apartment_number ?? "-"}
                        >
                          <span className="truncate text-[13px] leading-none font-semibold">
                            {unit.apartment_number ?? "-"}
                          </span>
                          <span className="mt-0.5 truncate text-[9px] leading-none font-semibold text-white">
                            {renderUnitMeta(unit, status, labels)}
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
