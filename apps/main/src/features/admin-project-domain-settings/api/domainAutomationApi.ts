import { supabase } from "@/shared/api/supabase";
import type { AutoDomainManagerResponse } from "../model/types";

interface InvokeResult {
  result: AutoDomainManagerResponse | null;
  error: Error | null;
}

const invokeAutoDomainManager = async (
  body: Record<string, unknown>,
): Promise<InvokeResult> => {
  const { data, error } =
    await supabase.functions.invoke<AutoDomainManagerResponse>(
      "auto-domain-manager",
      {
        body,
      },
    );

  return {
    result: data ?? null,
    error: error ? new Error(error.message) : null,
  };
};

export const fetchDomainStatus = async (params: {
  domain: string;
  projectId: string;
}) =>
  invokeAutoDomainManager({
    action: "status",
    domain: params.domain,
    project_id: params.projectId,
  });

export const addDomainWithAutomation = async (params: {
  domain: string;
  projectId: string;
  dnsProvider?: "cloudflare" | "godaddy" | "namecheap";
  apiKey?: string;
  zoneId?: string;
}) =>
  invokeAutoDomainManager({
    domain: params.domain,
    project_id: params.projectId,
    ...(params.dnsProvider ? { dns_provider: params.dnsProvider } : {}),
    ...(params.apiKey ? { api_key: params.apiKey } : {}),
    ...(params.zoneId ? { zone_id: params.zoneId } : {}),
  });

export const removeDomainWithAutomation = async (params: {
  domain: string;
  domainId: string;
  projectId: string;
}) =>
  invokeAutoDomainManager({
    action: "remove",
    domain: params.domain,
    project_id: params.projectId,
    domain_id: params.domainId,
  });
