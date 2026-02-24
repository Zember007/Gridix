import { useEffect, useRef } from "react";
import { loadSelectorFloorPolygons } from "@/features/projectSelector/api/projectSelectorApi";
import type { Apartment } from "@/entities/apartment/model/types";
import type { ViewMode } from "../types";

interface PolygonRow {
  id: string;
  polygon: unknown;
}

function extractPolygon(raw: unknown): { x: number; y: number }[] {
  return Array.isArray(raw) ? (raw as { x: number; y: number }[]) : [];
}

export interface UseFloorPolygonsParams {
  projectId: string | undefined;
  viewMode: ViewMode;
  selectedFloorForPlan: number | null;
  setApartments: React.Dispatch<React.SetStateAction<Apartment[]>>;
}

export const useFloorPolygons = ({
  projectId,
  viewMode,
  selectedFloorForPlan,
  setApartments,
}: UseFloorPolygonsParams) => {
  const loadedPolygonsForFloorsRef = useRef<Map<number, PolygonRow[]>>(
    new Map(),
  );
  const polygonsLoadingRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const mergePolygons = (floor: number, rows: PolygonRow[]) => {
      setApartments((prev) =>
        prev.map((apt) => {
          if (apt.floor_number !== floor) return apt;
          const found = rows.find((d) => d.id === apt.id);
          if (!found) return apt;
          return { ...apt, polygon: extractPolygon(found.polygon) };
        }),
      );
    };

    const loadPolygonsForFloor = async (floor: number) => {
      if (!projectId || polygonsLoadingRef.current.has(floor)) return;

      const cached = loadedPolygonsForFloorsRef.current.get(floor);
      if (cached && cached.length > 0) {
        mergePolygons(floor, cached);
        return;
      }

      polygonsLoadingRef.current.add(floor);

      try {
        const { polygonsByFloor } = await loadSelectorFloorPolygons(projectId, [
          floor,
        ]);

        const rows: PolygonRow[] = (polygonsByFloor[floor] ?? []).map((d) => ({
          id: d.id,
          polygon: d.polygon,
        }));

        if (rows.length > 0) {
          loadedPolygonsForFloorsRef.current.set(floor, rows);
          mergePolygons(floor, rows);
        }
      } catch (e) {
        console.error("Error loading polygons for floor:", e);
      } finally {
        polygonsLoadingRef.current.delete(floor);
      }
    };

    if (
      projectId &&
      viewMode === "floor-plan" &&
      selectedFloorForPlan !== null
    ) {
      loadPolygonsForFloor(selectedFloorForPlan);
    }
  }, [projectId, viewMode, selectedFloorForPlan, setApartments]);
};
