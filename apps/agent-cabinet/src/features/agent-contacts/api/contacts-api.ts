import { supabase } from "@gridix/utils/api";
import { aggregateContacts, type Contact } from "@/entities/contact";

export async function listAgentContacts(
  applicationId: string,
): Promise<Contact[]> {
  const { data, error } = await supabase.functions.invoke("agent-program", {
    body: { action: "list_agent_leads", application_id: applicationId },
  });
  if (error) throw error;

  const leads = ((data as { leads?: unknown })?.leads ?? []) as Array<
    Record<string, unknown>
  >;
  return aggregateContacts(leads);
}
