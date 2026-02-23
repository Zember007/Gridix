import { useEffect, useMemo, useState } from "react";
import { useApartmentsByProject } from "@gridix/utils";
import type { Apartment } from "@/entities/apartment/model/types";
import { normalizeApartmentData } from "@/entities/apartment/model/types";

function isNumericLike(v: string) {
  return v.trim() !== "" && Number.isFinite(Number(v));
}

function sortByApartmentNumber(a: Apartment, b: Apartment) {
  const an = a.apartment_number ?? "";
  const bn = b.apartment_number ?? "";
  if (isNumericLike(an) && isNumericLike(bn)) return Number(an) - Number(bn);
  return an.localeCompare(bn, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function ApartmentChessboard({
  projectId,
  selectedApartmentId,
  onSelect,
}: {
  projectId: string;
  selectedApartmentId: string | null;
  onSelect: (apartment: Apartment | null) => void;
}) {
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const { data, isLoading, error } = useApartmentsByProject(projectId);

  const apartments = useMemo(() => {
    return (data ?? []).map(normalizeApartmentData).sort(sortByApartmentNumber);
  }, [data]);

  useEffect(() => {
    setSelectedFloor(null);
    onSelect(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    const nextFloors = Array.from(
      new Set(apartments.map((a) => a.floor_number)),
    ).sort((a, b) => b - a);
    setSelectedFloor((prev) => prev ?? nextFloors[0] ?? null);
  }, [apartments]);

  const floors = useMemo(() => {
    return Array.from(new Set(apartments.map((a) => a.floor_number))).sort(
      (a, b) => b - a,
    );
  }, [apartments]);

  const floorApartments = useMemo(() => {
    const f = selectedFloor;
    const filtered =
      f === null ? apartments : apartments.filter((a) => a.floor_number === f);
    return filtered.slice().sort(sortByApartmentNumber);
  }, [apartments, selectedFloor]);

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-background p-6 text-sm text-muted-foreground">
        Загружаем план…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border bg-background p-6">
        <div className="text-sm font-medium">Не удалось загрузить квартиры</div>
        <div className="mt-1 text-sm text-destructive">
          {error instanceof Error ? error.message : "Ошибка загрузки квартир"}
        </div>
      </div>
    );
  }

  if (apartments.length === 0) {
    return (
      <div className="rounded-xl border bg-background p-6 text-sm text-muted-foreground">
        В проекте нет объектов для выбора.
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-medium">Выбор апартамента</div>
          <div className="text-xs text-muted-foreground">
            Этажи слева, квартиры справа.
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
        <div className="rounded-lg border bg-card p-2">
          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
            Этаж
          </div>
          <div className="max-h-[420px] overflow-auto">
            {floors.map((f) => {
              const count = apartments.filter(
                (a) => a.floor_number === f,
              ).length;
              const isActive = f === selectedFloor;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setSelectedFloor(f)}
                  className={[
                    "w-full rounded-md px-3 py-2 text-left text-sm transition",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between">
                    <span>Этаж {f}</span>
                    <span
                      className={
                        isActive
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      }
                    >
                      {count}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-3">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> доступно
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> бронь
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-gray-400" /> продано
            </span>
          </div>

          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(76px, 1fr))",
            }}
          >
            {floorApartments.map((apt) => {
              const isSelected = apt.id === selectedApartmentId;
              const isAvailable = apt.status === "available";
              const statusColor =
                apt.status === "available"
                  ? "border-emerald-300 bg-emerald-50 hover:bg-emerald-100"
                  : apt.status === "reserved"
                    ? "border-amber-300 bg-amber-50 hover:bg-amber-100"
                    : "border-gray-200 bg-gray-50";

              return (
                <button
                  key={apt.id}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => onSelect(apt)}
                  className={[
                    "rounded-lg border px-2 py-3 text-left transition",
                    statusColor,
                    isSelected
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "",
                    !isAvailable ? "cursor-not-allowed opacity-60" : "",
                  ].join(" ")}
                  title={!isAvailable ? "Недоступно для привязки" : "Выбрать"}
                >
                  <div className="text-sm font-semibold leading-none">
                    №{apt.apartment_number}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {apt.area ? `${Math.round(apt.area)}м²` : "—"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
