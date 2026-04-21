import { supabase } from "@gridix/utils/api";
import type {
  Project,
  ProjectDrawerResponse,
  ProjectUnit,
} from "../model/types";

export async function listAgentCatalogProjects(
  applicationId: string,
): Promise<Project[]> {
  const { data, error } = await supabase.functions.invoke("agent-program", {
    body: { action: "list_projects", agent_id: applicationId },
  });
  if (error) throw error;
  return ((data as { projects?: unknown })?.projects ?? []) as Project[];
}

export async function getProjectDrawer(
  applicationId: string,
  projectId: string,
): Promise<ProjectDrawerResponse> {
  const { data, error } = await supabase.functions.invoke("agent-program", {
    body: {
      action: "get_project_drawer",
      application_id: applicationId,
      project_id: projectId,
    },
  });
  if (error) throw error;
  return data as ProjectDrawerResponse;
}

export async function listProjectUnits(
  applicationId: string,
  projectId: string,
): Promise<{
  project?: { slug?: string | null; currency?: string | null };
  units?: ProjectUnit[];
}> {
  const { data, error } = await supabase.functions.invoke("agent-program", {
    body: {
      action: "list_project_units",
      application_id: applicationId,
      project_id: projectId,
    },
  });
  if (error) throw error;
  return data as {
    project?: { slug?: string | null; currency?: string | null };
    units?: ProjectUnit[];
  };
}
