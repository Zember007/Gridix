import { supabase } from "@gridix/utils/api";

export async function getAgentDashboard(applicationId: string) {
  const { data, error } = await supabase.functions.invoke("agent-program", {
    body: {
      action: "get_agent_dashboard",
      application_id: applicationId,
    },
  });
  if (error) throw error;
  return data as Record<string, unknown>;
}
