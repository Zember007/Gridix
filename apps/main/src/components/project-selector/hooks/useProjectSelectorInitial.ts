import { useState, useEffect, useLayoutEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  loadSelectorInitial,
  type SelectorInitialResult,
  type SubProjectListItem,
  type MasterplanListItem,
} from "@/features/projectSelector/api/projectSelectorApi";
import {
  type Apartment,
  normalizeApartmentData,
} from "@/entities/apartment/model/types";
import { useProjectCRUD } from "@/entities/project/queries/useProjects";
import type { LayoutPhoto } from "../types";
import type { Tables } from "@gridix/types/database";

export { getUniqueLayoutTypes } from "./useApartmentsData";

type Project = Tables<"projects">;

interface UseProjectSelectorInitialResult {
  project: Project | null;
  apartments: Apartment[];
  /** Count from the last API payload (for favorites URL hydration; may differ from `apartments` for one frame). */
  fetchedApartmentCount: number;
  setApartments: React.Dispatch<React.SetStateAction<Apartment[]>>;
  apartmentsLoaded: boolean;
  preloadedLayoutPhotosByRooms: Record<string, LayoutPhoto[]>;
  firstApartmentPhotoById: Record<string, string | null>;
  fieldSettings: Array<Record<string, unknown>>;
  customFields: Array<Record<string, unknown>>;
  customDomain: string | null;
  subProjects: SubProjectListItem[];
  masterplansList: MasterplanListItem[];
}

function requestIdle(cb: () => void, timeoutMs = 1500) {
  if (typeof window === "undefined") return;
  const ric = window.requestIdleCallback as
    | ((callback: IdleRequestCallback, options?: IdleRequestOptions) => number)
    | undefined;
  if (ric) {
    ric(() => cb(), { timeout: timeoutMs });
    return;
  }
  window.setTimeout(cb, Math.min(timeoutMs, 1000));
}

export const useProjectSelectorInitial = (
  projectId: string,
): UseProjectSelectorInitialResult => {
  const query = useQuery<SelectorInitialResult>({
    queryKey: ["project-selector", "initial", projectId],
    queryFn: () => loadSelectorInitial(projectId),
    enabled: !!projectId,
  });

  const rawApartments = useMemo(
    () => (query.data?.apartments ?? []).map(normalizeApartmentData),
    [query.data?.apartments],
  );
  const fieldSettings = useMemo(
    () => (query.data?.fieldSettings as Array<Record<string, unknown>>) ?? [],
    [query.data?.fieldSettings],
  );
  const customFields = useMemo(
    () => (query.data?.customFields as Array<Record<string, unknown>>) ?? [],
    [query.data?.customFields],
  );

  const [apartments, setApartments] = useState<Apartment[]>([]);

  // useLayoutEffect so `apartments` is populated in the same commit as `!query.isLoading`
  // (favorites ?favorites= URL hydration must not run against [] while data exists).
  useLayoutEffect(() => {
    if (rawApartments.length > 0) {
      setApartments(rawApartments);
    }
  }, [rawApartments]);

  const { incrementViewCount } = useProjectCRUD();
  const resolvedProjectId = query.data?.project?.id;

  useEffect(() => {
    if (resolvedProjectId) {
      requestIdle(() => {
        incrementViewCount(resolvedProjectId);
      });
    }
  }, [resolvedProjectId, incrementViewCount]);

  return {
    project: (query.data?.project as Project) ?? null,
    apartments,
    fetchedApartmentCount: rawApartments.length,
    setApartments,
    apartmentsLoaded: !query.isLoading,
    preloadedLayoutPhotosByRooms:
      (query.data?.layoutPhotosByRooms as Record<string, LayoutPhoto[]>) ?? {},
    firstApartmentPhotoById: query.data?.firstApartmentPhotoById ?? {},
    fieldSettings,
    customFields,
    customDomain: query.data?.customDomain ?? null,
    subProjects: query.data?.subProjects ?? [],
    masterplansList: query.data?.masterplansList ?? [],
  };
};
