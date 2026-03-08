import type { UseProjectDomainsResult } from "@/entities/project/queries/useProjectDomains";
import { toast } from "sonner";
import {
  fetchDomainStatus,
  removeDomainWithAutomation,
} from "../api/domainAutomationApi";
import type { DNSRecord, ProjectDomain } from "./types";

type SetDnsInstructions = (
  value:
    | Record<string, DNSRecord[]>
    | ((prev: Record<string, DNSRecord[]>) => Record<string, DNSRecord[]>),
) => void;

interface UseDomainMutationActionsParams {
  projectId: string;
  domains: ProjectDomain[];
  updateDomain: UseProjectDomainsResult["updateDomain"];
  setDnsInstructions: SetDnsInstructions;
}

export const useDomainMutationActions = ({
  projectId,
  domains,
  updateDomain,
  setDnsInstructions,
}: UseDomainMutationActionsParams) => {
  const handleDeleteDomain = async (domainId: string) => {
    try {
      const domain = domains.find((item) => item.id === domainId);
      if (!domain) {
        toast.error("Domain not found");
        return;
      }

      const { result, error } = await removeDomainWithAutomation({
        domain: domain.domain,
        domainId: domain.id,
        projectId,
      });

      if (error) {
        console.error("Remove function error:", error);
        toast.error(`❌ ${error.message || "Failed to remove domain"}`);
        return;
      }

      if (result?.success) {
        toast.success(
          `✅ ${result.message || `Domain ${domain.domain} removed`}`,
        );
        setTimeout(() => window.location.reload(), 1000);
      } else {
        const errorMessage = result?.error || "Failed to remove domain";
        toast.error(`❌ ${errorMessage}`);
      }
    } catch (error) {
      console.error("Domain removal error:", error);
      toast.error("Failed to remove domain");
    }
  };

  const handleCheckDomainStatus = async (
    domain: Pick<ProjectDomain, "domain" | "id">,
  ) => {
    try {
      const { result, error } = await fetchDomainStatus({
        domain: domain.domain,
        projectId,
      });

      if (error) {
        console.error("Status function error:", error);
        toast.error(`❌ ${error.message || "Failed to check status"}`);
        return;
      }

      if (result?.success) {
        if (result.automation?.instructions?.dns_records) {
          setDnsInstructions((prev) => ({
            ...prev,
            [domain.domain]: result.automation?.instructions?.dns_records ?? [],
          }));
        }

        if (result.vercel) {
          const verified = result.vercel.verified
            ? "✅ Verified"
            : "⚠️ Not verified";
          const configured = result.vercel.configured
            ? "✅ Configured"
            : "⚠️ Not configured";
          toast.success(`Domain Status: ${verified} | ${configured}`, {
            duration: 5000,
          });
          return;
        }

        const payload = result.status;
        if (payload) {
          const overall = payload.overall_status || "Unknown";
          const nginxEnabled = payload.nginx?.enabled === true;
          const sslValid = payload.ssl?.certificate_valid === true;
          const nginxStatus = nginxEnabled ? "✅ Enabled" : "❌ Disabled";
          const sslStatus = sslValid ? "✅ Valid" : "❌ Invalid";
          const overallIcon = overall === "active" ? "✅" : "⚠️";
          toast.success(`${overallIcon} Domain Status: ${overall}`, {
            description: `Nginx: ${nginxStatus} | SSL: ${sslStatus}`,
            duration: 5000,
          });
        } else {
          toast.success("✅ Domain status checked", {
            description: "Domain is registered in the system",
            duration: 5000,
          });
        }
      } else {
        const errorMessage = result?.error || "Failed to check status";
        toast.error(`❌ ${errorMessage}`);
      }
    } catch (error) {
      console.error("Status check error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`❌ Failed to check domain status: ${errorMessage}`);
    }
  };

  const handleTogglePrimary = async (domainId: string, isPrimary: boolean) => {
    if (isPrimary) {
      for (const domain of domains) {
        if (domain.id !== domainId && domain.is_primary) {
          await updateDomain(domain.id, { is_primary: false });
        }
      }
    }

    await updateDomain(domainId, { is_primary: isPrimary });
  };

  return {
    handleDeleteDomain,
    handleCheckDomainStatus,
    handleTogglePrimary,
  };
};
