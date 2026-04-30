import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import type { ViewMode } from "../types";

/** URL parameter names */
export const PARAM_VIEW = "view";
const PARAM_FLOOR = "floor";
export const PARAM_FAVORITES = "favorites";

const VALID_VIEW_MODES: ViewMode[] = [
  "facade",
  "floor-plan",
  "list",
  "map",
  "favorites",
  "chess",
];

function isValidViewMode(value: string): value is ViewMode {
  return (VALID_VIEW_MODES as string[]).includes(value);
}

// ── Parse helpers ──

export function parseViewMode(params: URLSearchParams): ViewMode {
  const raw = params.get(PARAM_VIEW);
  return raw && isValidViewMode(raw) ? raw : "facade";
}

export function parseFloor(params: URLSearchParams): number | null {
  const raw = params.get(PARAM_FLOOR);
  if (raw === null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Comma-separated apartment numbers from share links (FavoritesTab). */
export function parseFavoritesParam(params: URLSearchParams): string[] {
  const raw = params.get(PARAM_FAVORITES);
  if (raw == null || raw === "") return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// ── Hook ──

interface UseUrlStateResult {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedFloorForPlan: number | null;
  setSelectedFloorForPlan: (floor: number | null) => void;
}

export const useUrlState = (): UseUrlStateResult => {
  const [searchParams, setSearchParams] = useSearchParams();

  const viewMode = parseViewMode(searchParams);
  const selectedFloorForPlan = parseFloor(searchParams);

  const setViewMode = useCallback(
    (mode: ViewMode) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (mode === "facade") {
            next.delete(PARAM_VIEW);
          } else {
            next.set(PARAM_VIEW, mode);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setSelectedFloorForPlan = useCallback(
    (floor: number | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (floor === null) {
            next.delete(PARAM_FLOOR);
          } else {
            next.set(PARAM_FLOOR, String(floor));
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return {
    viewMode,
    setViewMode,
    selectedFloorForPlan,
    setSelectedFloorForPlan,
  };
};
