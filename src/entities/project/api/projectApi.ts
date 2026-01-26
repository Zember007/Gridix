import { supabase } from "@/shared/api/supabase";
import { Tables } from "@/integrations/supabase/types";

type ProjectRow = Tables<"projects">;

// The generated Supabase `Tables<'projects'>` type in this repo is slightly out of sync
// with the columns actually used in the app (e.g. `slug`, nullable `description`).
export type Project = Omit<ProjectRow, "slug" | "description"> & {
  slug?: string | null;
  description?: string | null;
};

export interface ProjectFilters {
  userId?: string;
  isPublic?: boolean;
  isFeatured?: boolean;
  limit?: number;
  offset?: number;
}

export const fetchProjects = async (filters: ProjectFilters = {}): Promise<Project[]> => {
  let query = supabase.from("projects").select("*");

  if (filters.userId) {
    query = query.eq("user_id", filters.userId);
  } else if (filters.isPublic !== undefined) {
    query = query.eq("is_public", filters.isPublic);
  }

  if (filters.isFeatured !== undefined) {
    query = query.eq("is_featured", filters.isFeatured);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []) as Project[];
};

const isUUID = (identifier: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier);

export const fetchProjectByIdOrSlug = async (identifier: string): Promise<Project | null> => {
  if (!identifier) return null;

  let query = supabase.from("projects").select("*");

  if (isUUID(identifier)) {
    query = query.eq("id", identifier);
  } else {
    query = query.eq("slug", identifier);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    if ((error as any).code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return (data || null) as Project | null;
};

export const createProject = async (
  userId: string,
  projectData: Omit<Project, "id" | "created_at" | "updated_at" | "view_count" | "user_id">
): Promise<Project> => {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      ...projectData,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;

  return data as Project;
};

export const updateProject = async (
  userId: string,
  projectId: string,
  updates: Partial<Project>
): Promise<Project> => {
  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", projectId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;

  return data as Project;
};

export const deleteProject = async (userId: string, projectId: string): Promise<void> => {
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", userId);

  if (error) throw error;
};

export const incrementProjectView = async (projectId: string, userId?: string | null) => {
  try {
    await supabase.from("project_views").insert({
      project_id: projectId,
      user_id: userId || null,
      ip_address: null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
    });

    const { error } = await supabase.rpc("increment_view_count", {
      project_id: projectId,
    });

    if (error) {
      console.error("Error incrementing view count:", error);
    }
  } catch (err) {
    console.error("Error tracking view:", err);
  }
};

export const fetchProjectByDomain = async (host: string) => {
  const { data, error } = await supabase
    .from("project_domains")
    .select(
      `
      project_id,
      domain,
      is_primary,
      status,
      projects!inner (
        *,
        subscription_status,
        subscription_expires_at,
        is_public_visible
      )
    `
    )
    .eq("domain", host)
    .eq("status", "active")
    .single();

  if (error) {
    if ((error as any).code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return data;
};
