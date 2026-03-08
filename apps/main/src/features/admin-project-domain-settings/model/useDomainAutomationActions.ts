import type { UseProjectDomainsResult } from "@/entities/project/queries/useProjectDomains";
import type { DNSRecord, DnsProvider, ProjectDomain } from "./types";
import { useAddDomainAutomation } from "./useAddDomainAutomation";
import { useDomainMutationActions } from "./useDomainMutationActions";

type SetDnsInstructions = (
  value:
    | Record<string, DNSRecord[]>
    | ((prev: Record<string, DNSRecord[]>) => Record<string, DNSRecord[]>),
) => void;

interface UseDomainAutomationActionsParams {
  projectId: string;
  domains: ProjectDomain[];
  updateDomain: UseProjectDomainsResult["updateDomain"];
  newDomain: string;
  setNewDomain: (value: string) => void;
  dnsProvider: DnsProvider;
  dnsApiKey: string;
  setDnsApiKey: (value: string) => void;
  dnsZoneId: string;
  setDnsZoneId: (value: string) => void;
  setDnsInstructions: SetDnsInstructions;
}

export const useDomainAutomationActions = ({
  projectId,
  domains,
  updateDomain,
  newDomain,
  setNewDomain,
  dnsProvider,
  dnsApiKey,
  setDnsApiKey,
  dnsZoneId,
  setDnsZoneId,
  setDnsInstructions,
}: UseDomainAutomationActionsParams) => {
  const { isAddingDomain, handleAddDomain } = useAddDomainAutomation({
    projectId,
    newDomain,
    setNewDomain,
    dnsProvider,
    dnsApiKey,
    setDnsApiKey,
    dnsZoneId,
    setDnsZoneId,
    setDnsInstructions,
  });

  const { handleDeleteDomain, handleCheckDomainStatus, handleTogglePrimary } =
    useDomainMutationActions({
      projectId,
      domains,
      updateDomain,
      setDnsInstructions,
    });

  return {
    isAddingDomain,
    handleAddDomain,
    handleDeleteDomain,
    handleCheckDomainStatus,
    handleTogglePrimary,
  };
};
