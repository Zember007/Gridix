import { useQuery } from "@tanstack/react-query";
import { supabase } from "../api/supabase";

export interface ApartmentByProject {
  id: string;
  apartment_number: string | null;
  floor_number: number;
  rooms: string | number;
  area: number | null;
  price: number | null;
  status: string;
  project_id: string;
  created_at: string;
  updated_at: string;
  floor_plan_id: string | null;
  custom_fields: unknown;
  type: string | null;
  polygon: unknown;
}

async function fetchApartmentsByProject(
  projectId: string,
): Promise<ApartmentByProject[]> {
  const { data, error } = await supabase
    .from("apartments")
    .select(
      "id, apartment_number, floor_number, rooms, area, price, status, project_id, created_at, updated_at, floor_plan_id, custom_fields, type, polygon",
    )
    .eq("project_id", projectId);

  if (error) throw error;

  return (data ?? []) as ApartmentByProject[];
}

export function useApartmentsByProject(
  projectId: string | null,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: ["apartments", projectId],
    queryFn: () => fetchApartmentsByProject(projectId as string),
    enabled: enabled && Boolean(projectId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
