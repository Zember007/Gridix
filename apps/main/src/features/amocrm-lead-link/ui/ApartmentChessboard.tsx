import { useEffect, useMemo, useState } from "react";
import { useApartmentsByProject } from "@gridix/utils";
import type { Apartment } from "@/entities/apartment/model/types";
import { normalizeApartmentData } from "@/entities/apartment/model/types";
import {
  sortAndNormalizeApartments,
  sortByApartmentNumber,
} from "@/shared/lib/amocrm-link/apartmentSort";
import { FloorList } from "./FloorList";
import { ApartmentGrid } from "./ApartmentGrid";

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
    return sortAndNormalizeApartments(data, normalizeApartmentData);
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

  const floorCounts = useMemo(() => {
    return apartments.reduce<Record<number, number>>((acc, apartment) => {
      const floor = apartment.floor_number;
      acc[floor] = (acc[floor] ?? 0) + 1;
      return acc;
    }, {});
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
        <FloorList
          floors={floors}
          selectedFloor={selectedFloor}
          floorCounts={floorCounts}
          onSelectFloor={setSelectedFloor}
        />
        <ApartmentGrid
          floorApartments={floorApartments}
          selectedApartmentId={selectedApartmentId}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
}
