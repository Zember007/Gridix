import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  loadSelectorInitial,
  type SelectorInitialResult,
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
  setApartments: React.Dispatch<React.SetStateAction<Apartment[]>>;
  apartmentsLoaded: boolean;
  preloadedLayoutPhotosByRooms: Record<string, LayoutPhoto[]>;
  fieldSettings: Array<Record<string, unknown>>;
  customFields: Array<Record<string, unknown>>;
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

  const [apartments, setApartments] = useState<Apartment[]>([]);

  useEffect(() => {
    if (rawApartments.length > 0) {
      setApartments(rawApartments);
    }
  }, [rawApartments]);

  const { incrementViewCount } = useProjectCRUD();
  const resolvedProjectId = query.data?.project?.id;

  useEffect(() => {
    if (resolvedProjectId) {
      incrementViewCount(resolvedProjectId);
    }
  }, [resolvedProjectId, incrementViewCount]);

  return {
    project: (query.data?.project as Project) ?? null,
    apartments,
    setApartments,
    apartmentsLoaded: !query.isLoading,
    preloadedLayoutPhotosByRooms:
      (query.data?.layoutPhotosByRooms as Record<string, LayoutPhoto[]>) ?? {},
    fieldSettings:
      (query.data?.fieldSettings as Array<Record<string, unknown>>) ?? [],
    customFields:
      (query.data?.customFields as Array<Record<string, unknown>>) ?? [],
  };
};
