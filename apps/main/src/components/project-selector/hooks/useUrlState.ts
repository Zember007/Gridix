import { useCallback, useEffect, useRef, useState } from 'react';
import type { ViewMode } from '../types';

/** URL parameter names */
const PARAM_VIEW = 'view';
const PARAM_FLOOR = 'floor';

const VALID_VIEW_MODES: ViewMode[] = [
  'facade',
  'floor-plan',
  'list',
  'map',
  'favorites',
  'chess',
];

function isValidViewMode(value: string): value is ViewMode {
  return (VALID_VIEW_MODES as string[]).includes(value);
}

/** Read current search params from window.location without react-router. */
function readParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

/** Write search params via replaceState (no history entry). */
function writeParams(params: URLSearchParams) {
  const url = new URL(window.location.href);
  url.search = params.toString();
  window.history.replaceState(window.history.state, '', url.toString());
}



// ── Parse helpers ──

export function parseViewMode(params: URLSearchParams): ViewMode {
  const raw = params.get(PARAM_VIEW);
  return raw && isValidViewMode(raw) ? raw : 'facade';
}

export function parseFloor(params: URLSearchParams): number | null {
  const raw = params.get(PARAM_FLOOR);
  if (raw === null || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

// ── Hook ──

interface UseUrlStateResult {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedFloorForPlan: number | null;
  setSelectedFloorForPlan: (floor: number | null) => void;
}

/**
 * Provides `viewMode` and `selectedFloorForPlan` state synchronized with URL
 * search parameters (`?view=` and `?floor=`).
 *
 * - On mount, state is initialized from the URL.
 * - When state changes, the URL is updated via `replaceState` (no new history entry).
 * - The apartment slide-over URL is managed separately (pushState in the handler).
 */
export const useUrlState = (): UseUrlStateResult => {
  // Initialization from URL happens only once.
  const [viewMode, setViewModeRaw] = useState<ViewMode>(() => parseViewMode(readParams()));
  const [selectedFloorForPlan, setFloorRaw] = useState<number | null>(() => parseFloor(readParams()));

  // Track whether the current URL write was triggered by us (to avoid loops with popstate).
  const isInternalUpdate = useRef(false);

  // ── Sync state → URL ──
  useEffect(() => {
    isInternalUpdate.current = true;
    const params = readParams();

    // viewMode
    if (viewMode === 'facade') {
      params.delete(PARAM_VIEW);
    } else {
      params.set(PARAM_VIEW, viewMode);
    }

    // floor
    if (selectedFloorForPlan !== null) {
      params.set(PARAM_FLOOR, String(selectedFloorForPlan));
    } else {
      params.delete(PARAM_FLOOR);
    }

    writeParams(params);

    // Allow next popstate to be treated as external.
    requestAnimationFrame(() => {
      isInternalUpdate.current = false;
    });
  }, [viewMode, selectedFloorForPlan]);

  // ── Wrapped setters ──

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeRaw(mode);
  }, []);

  const setSelectedFloorForPlan = useCallback((floor: number | null) => {
    setFloorRaw(floor);
  }, []);

  return {
    viewMode,
    setViewMode,
    selectedFloorForPlan,
    setSelectedFloorForPlan,
  };
};
