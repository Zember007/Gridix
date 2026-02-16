import { useEffect, useMemo, useState } from "react";
import { supabase } from "@gridix/utils/api";
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

export function ObjectUnitSelect({
  projectId,
  selectedApartmentId,
  onSelect,
}: {
  projectId: string;
  selectedApartmentId: string | null;
  onSelect: (apartment: Apartment | null) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apartments, setApartments] = useState<Apartment[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setApartments([]);
    onSelect(null);

    (async () => {
      try {
        const { data, error } = await supabase
          .from("apartments")
          .select(
            "id, apartment_number, floor_number, rooms, area, price, status, project_id, created_at, updated_at, floor_plan_id, custom_fields, type, polygon",
          )
          .eq("project_id", projectId);
        if (error) throw error;
        if (cancelled) return;
        setApartments(
          (data || []).map(normalizeApartmentData).sort(sortByApartmentNumber),
        );
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Ошибка загрузки объектов");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const options = useMemo(() => apartments, [apartments]);

  if (loading) {
    return (
      <div className="rounded-xl border bg-background p-6 text-sm text-muted-foreground">
        Загружаем список объектов…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border bg-background p-6">
        <div className="text-sm font-medium">Не удалось загрузить объекты</div>
        <div className="mt-1 text-sm text-destructive">{error}</div>
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className="rounded-xl border bg-background p-6 text-sm text-muted-foreground">
        В проекте нет объектов для выбора.
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-background p-6">
      <div className="text-sm font-medium">Выбор номера объекта</div>
      <div className="mt-2 text-xs text-muted-foreground">
        Для проектов типа “object” выбираем номер/юнит списком.
      </div>

      <div className="mt-4">
        <select
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          value={selectedApartmentId ?? ""}
          onChange={(e) => {
            const id = e.target.value || null;
            const apt = id ? (options.find((a) => a.id === id) ?? null) : null;
            onSelect(apt);
          }}
        >
          <option value="">Выберите номер…</option>
          {options.map((apt) => (
            <option
              key={apt.id}
              value={apt.id}
              disabled={apt.status !== "available"}
            >
              №{apt.apartment_number}{" "}
              {apt.status !== "available" ? "(недоступно)" : ""}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
