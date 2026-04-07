import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  loadSelectorSubProject,
  type SelectorSubProjectResult,
} from "@/features/projectSelector/api/projectSelectorApi";
import {
  type Apartment,
  normalizeApartmentData,
} from "@/entities/apartment/model/types";
import type { LayoutPhoto } from "../types";
import type { Tables } from "@gridix/types/database";

type Project = Tables<"projects">;
type SubProjectRow = Tables<"sub_projects">;

interface UseProjectSelectorSubProjectResult {
  project: Project | null;
  subProject: SubProjectRow | null;
  subProjectId: string | null;
  apartments: Apartment[];
  setApartments: React.Dispatch<React.SetStateAction<Apartment[]>>;
  apartmentsLoaded: boolean;
  preloadedLayoutPhotosByRooms: Record<string, LayoutPhoto[]>;
  fieldSettings: Array<Record<string, unknown>>;
  customFields: Array<Record<string, unknown>>;
  customDomain: string | null;
  subProjectNotFound: boolean;
}

export const useProjectSelectorSubProject = (
  projectId: string,
  subProjectSlug: string,
): UseProjectSelectorSubProjectResult => {
  const query = useQuery<SelectorSubProjectResult>({
    queryKey: ["project-selector", "sub-project", projectId, subProjectSlug],
    queryFn: () => loadSelectorSubProject(projectId, subProjectSlug),
    enabled: !!projectId && !!subProjectSlug,
    retry: false,
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

  useEffect(() => {
    if (rawApartments.length > 0) {
      setApartments(rawApartments);
    }
  }, [rawApartments]);

  const subProjectNotFound =
    query.isError &&
    query.error instanceof Error &&
    query.error.message === "Sub-project not found";

  return {
    project: (query.data?.project as Project) ?? null,
    subProject: (query.data?.subProject as SubProjectRow) ?? null,
    subProjectId:
      query.data?.subProjectId ??
      (query.data?.subProject as SubProjectRow | null)?.id ??
      null,
    apartments,
    setApartments,
    apartmentsLoaded: !query.isLoading,
    preloadedLayoutPhotosByRooms:
      (query.data?.layoutPhotosByRooms as Record<string, LayoutPhoto[]>) ?? {},
    fieldSettings,
    customFields,
    customDomain: query.data?.customDomain ?? null,
    subProjectNotFound,
  };
};
