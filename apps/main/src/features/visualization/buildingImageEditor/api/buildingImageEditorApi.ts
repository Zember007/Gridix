import { supabase } from "@gridix/utils/api";
import { compressToWebP } from "@gridix/utils/lib";
import type { ProjectFacade } from "../model/types";

export async function fetchFacades(projectId: string, subProjectId?: string) {
  let query = supabase
    .from("project_facades")
    .select("*")
    .eq("project_id", projectId);
  if (subProjectId) query = query.eq("sub_project_id", subProjectId);
  const { data, error } = await query.order("order_index");
  if (error) throw error;
  return (data as unknown as ProjectFacade[]) || [];
}

export async function fetchApartmentNumbers(
  projectId: string,
  subProjectId?: string,
) {
  let query = supabase
    .from("apartments")
    .select("apartment_number")
    .eq("project_id", projectId);
  if (subProjectId) query = query.eq("sub_project_id", subProjectId);
  const { data } = await query.order("apartment_number");

  const numbers = (data || [])
    .map((a) =>
      typeof a.apartment_number === "number"
        ? a.apartment_number
        : Number(a.apartment_number),
    )
    .filter((n): n is number => !isNaN(n));
  return [...new Set(numbers)].sort((a, b) => a - b);
}

export async function fetchBuildingFloors(projectId: string, facadeId: string) {
  const { data } = await supabase
    .from("building_floors")
    .select("*")
    .eq("project_id", projectId)
    .eq("facade_id", facadeId)
    .order("floor_number");

  return (data || []).map((floor) => ({
    ...floor,
    polygon: Array.isArray(floor.polygon)
      ? (floor.polygon as { x: number; y: number }[])
      : [],
  }));
}

export async function fetchFacadeDisplaySettings(
  projectId: string,
  subProjectId?: string,
) {
  const table = subProjectId ? "sub_projects" : "projects";
  const id = subProjectId ?? projectId;
  const { data, error } = await supabase
    .from(table)
    .select("polygon_settings_facade")
    .eq("id", id)
    .single();
  if (error) throw error;

  const defaultSettings = {
    colors: { building: "#3b82f6" },
    opacity: { normal: 0.4, hover: 0.7 },
    hoverEffects: {
      scale: false,
      colorChange: true,
      opacityChange: true,
      glow: true,
    },
    display: { showNumbers: true, showTooltip: false },
  };

  if (
    data &&
    "polygon_settings_facade" in data &&
    data.polygon_settings_facade
  ) {
    const s = data.polygon_settings_facade as Record<string, unknown>;
    const colors = s?.colors as Record<string, unknown> | undefined;
    const opacity = s?.opacity as Record<string, unknown> | undefined;
    const hoverEffects = s?.hoverEffects as Record<string, unknown> | undefined;
    const display = s?.display as Record<string, unknown> | undefined;
    return {
      colors: {
        building:
          typeof colors?.building === "string" ? colors.building : "#3b82f6",
      },
      opacity: {
        normal: typeof opacity?.normal === "number" ? opacity.normal : 0.4,
        hover: typeof opacity?.hover === "number" ? opacity.hover : 0.7,
      },
      hoverEffects: {
        scale:
          typeof hoverEffects?.scale === "boolean" ? hoverEffects.scale : false,
        colorChange:
          typeof hoverEffects?.colorChange === "boolean"
            ? hoverEffects.colorChange
            : true,
        opacityChange:
          typeof hoverEffects?.opacityChange === "boolean"
            ? hoverEffects.opacityChange
            : true,
        glow:
          typeof hoverEffects?.glow === "boolean" ? hoverEffects.glow : true,
      },
      display: {
        showNumbers:
          typeof display?.showNumbers === "boolean"
            ? display.showNumbers
            : true,
        showTooltip:
          typeof display?.showTooltip === "boolean"
            ? display.showTooltip
            : false,
      },
    };
  }

  return defaultSettings;
}

export async function insertFacade(
  projectId: string,
  name: string,
  orderIndex: number,
  subProjectId?: string,
) {
  const { data, error } = await supabase
    .from("project_facades")
    .insert({
      project_id: projectId,
      name,
      image_url: null,
      order_index: orderIndex,
      ...(subProjectId && { sub_project_id: subProjectId }),
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as ProjectFacade;
}

export async function updateFacadeImage(facadeId: string, imageUrl: string) {
  const { error } = await supabase
    .from("project_facades")
    .update({ image_url: imageUrl })
    .eq("id", facadeId);
  if (error) throw error;
}

export async function renameFacade(facadeId: string, name: string) {
  const { error } = await supabase
    .from("project_facades")
    .update({ name })
    .eq("id", facadeId);
  if (error) throw error;
}

export async function deleteFacade(facadeId: string) {
  const { error } = await supabase
    .from("project_facades")
    .delete()
    .eq("id", facadeId);
  if (error) throw error;
}

export async function updateFacadeOrder(facadeId: string, orderIndex: number) {
  const { error } = await supabase
    .from("project_facades")
    .update({ order_index: orderIndex })
    .eq("id", facadeId);
  if (error) throw error;
}

export async function syncProjectBuildingImage(
  projectId: string,
  imageUrl: string | null,
) {
  const { error } = await supabase
    .from("projects")
    .update({ building_image_url: imageUrl })
    .eq("id", projectId);
  if (error) throw error;
}

export async function syncSubProjectBuildingImage(
  subProjectId: string,
  imageUrl: string | null,
) {
  const { error } = await supabase
    .from("sub_projects")
    .update({ building_image_url: imageUrl })
    .eq("id", subProjectId);
  if (error) throw error;
}

export async function uploadFacadeImageToStorage(
  projectId: string,
  file: File,
): Promise<string> {
  const compressed = await compressToWebP(file);
  const fileName = `${projectId}-facade-${Date.now()}.webp`;

  const { error: uploadError } = await supabase.storage
    .from("project-images")
    .upload(fileName, compressed, { upsert: true });
  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from("project-images").getPublicUrl(fileName);
  return publicUrl;
}

export async function upsertFloorPolygon(params: {
  projectId: string;
  facadeId: string;
  floorNumber: number;
  polygon: { x: number; y: number }[];
  color: string;
  subProjectId?: string;
}) {
  const { error } = await supabase.from("building_floors").upsert(
    {
      project_id: params.projectId,
      facade_id: params.facadeId,
      floor_number: params.floorNumber,
      polygon: params.polygon,
      color: params.color,
      ...(params.subProjectId && { sub_project_id: params.subProjectId }),
    },
    { onConflict: "project_id,facade_id,floor_number" },
  );
  if (error) throw error;
}

export async function updateFloorPolygon(
  floorId: string,
  polygon: { x: number; y: number }[],
  color: string,
) {
  const { error } = await supabase
    .from("building_floors")
    .update({ polygon, color })
    .eq("id", floorId);
  if (error) throw error;
}

export async function deleteFloorPolygon(floorId: string) {
  const { error } = await supabase
    .from("building_floors")
    .delete()
    .eq("id", floorId);
  if (error) throw error;
}

export async function updateProjectFloors(projectId: string, floors: number) {
  const { error } = await supabase
    .from("projects")
    .update({ floors })
    .eq("id", projectId);
  if (error) throw error;
}

export async function updateSubProjectFloors(
  subProjectId: string,
  floors: number,
) {
  const { error } = await supabase
    .from("sub_projects")
    .update({ floors })
    .eq("id", subProjectId);
  if (error) throw error;
}
