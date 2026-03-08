import { useEffect, useState } from "react";
import { fetchDomainStatus } from "../api/domainAutomationApi";
import type { DNSRecord, ProjectDomain } from "./types";

interface UseDomainDnsInstructionsParams {
  domains: ProjectDomain[];
  loading: boolean;
  projectId: string;
}

export const useDomainDnsInstructions = ({
  domains,
  loading,
  projectId,
}: UseDomainDnsInstructionsParams) => {
  const [dnsInstructions, setDnsInstructions] = useState<
    Record<string, DNSRecord[]>
  >({});

  useEffect(() => {
    const loadDnsInstructions = async () => {
      if (!domains || domains.length === 0) return;

      for (const domain of domains) {
        if (domain.status === "active") continue;

        try {
          const { result, error } = await fetchDomainStatus({
            domain: domain.domain,
            projectId,
          });

          if (
            !error &&
            result?.success &&
            result.automation?.instructions?.dns_records
          ) {
            setDnsInstructions((prev) => ({
              ...prev,
              [domain.domain]:
                result.automation?.instructions?.dns_records ?? [],
            }));
          }
        } catch (error) {
          console.error(
            `Failed to load DNS instructions for ${domain.domain}:`,
            error,
          );
        }
      }
    };

    if (!loading && domains.length > 0) {
      void loadDnsInstructions();
    }
  }, [domains, loading, projectId]);

  return {
    dnsInstructions,
    setDnsInstructions,
  };
};
