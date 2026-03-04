import { supabase } from "@gridix/utils/api";

export async function getAgentAnalyticsPage(
  applicationId: string,
  period: string,
) {
  const { data, error } = await supabase.functions.invoke("agent-program", {
    body: {
      action: "get_agent_analytics_page",
      application_id: applicationId,
      period,
    },
  });
  if (error) throw error;
  return data as Record<string, unknown>;
}
