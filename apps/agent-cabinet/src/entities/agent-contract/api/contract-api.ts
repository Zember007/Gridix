import { supabase } from "@gridix/utils/api";
import type { AgentApplicationSettings, SignedContract } from "../model/types";

export async function getAgentContractSettings(
  applicationId: string,
): Promise<AgentApplicationSettings | null> {
  const { data, error } = await supabase.functions.invoke("agent-program", {
    body: { action: "get_agent_settings", application_id: applicationId },
  });
  if (error) throw error;
  const response = data as {
    success?: boolean;
    application?: AgentApplicationSettings;
  };
  if (!response?.success || !response.application) return null;
  return response.application;
}

export async function listMySignedContracts(
  applicationId: string,
): Promise<SignedContract[]> {
  const { data, error } = await supabase.functions.invoke("agent-program", {
    body: {
      action: "list_my_signed_contracts",
      application_id: applicationId,
    },
  });
  if (error) throw error;

  const response = data as { success?: boolean; contracts?: unknown };
  const list = Array.isArray(response?.contracts)
    ? (response.contracts as unknown[])
    : [];

  return list.map((item) => {
    const contract = item as Record<string, unknown>;
    return {
      id: String(contract.id),
      signed_at: contract.signed_at ? String(contract.signed_at) : null,
      signed_download_url: contract.signed_download_url
        ? String(contract.signed_download_url)
        : null,
      signed_contract_mime: contract.signed_contract_mime
        ? String(contract.signed_contract_mime)
        : null,
      template_lang: contract.template_lang
        ? String(contract.template_lang)
        : null,
    };
  });
}
