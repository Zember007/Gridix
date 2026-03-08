import { useState } from "react";
import { toast } from "sonner";
import { useProjectDomains } from "@/entities/project/queries/useProjectDomains";
import { useProjectEditorDataContext } from "@/features/projectEditor/context/ProjectEditorDataContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { DnsProvider } from "./types";
import { useDomainDnsInstructions } from "./useDomainDnsInstructions";
import { useDomainAutomationActions } from "./useDomainAutomationActions";

interface UseProjectDomainSettingsParams {
  projectId: string;
}

export const useProjectDomainSettings = ({
  projectId,
}: UseProjectDomainSettingsParams) => {
  const editorData = useProjectEditorDataContext();
  const isEditorContext = Boolean(editorData);
  const isWaitingForEditorData = Boolean(editorData?.loading);
  const initialDomains =
    editorData?.data?.domains != null && Array.isArray(editorData.data.domains)
      ? editorData.data.domains
      : null;
  const projectIdForDomains = isEditorContext
    ? editorData?.data
      ? projectId
      : undefined
    : projectId;

  const { domains, loading, updateDomain } = useProjectDomains(
    projectIdForDomains,
    initialDomains,
  );

  const [newDomain, setNewDomain] = useState("");
  const [dnsProvider, setDnsProvider] = useState<DnsProvider>("manual");
  const [dnsApiKey, setDnsApiKey] = useState("");
  const [dnsZoneId, setDnsZoneId] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { t } = useLanguage();

  const { dnsInstructions, setDnsInstructions } = useDomainDnsInstructions({
    domains,
    loading,
    projectId,
  });

  const {
    isAddingDomain,
    handleAddDomain,
    handleDeleteDomain,
    handleCheckDomainStatus,
    handleTogglePrimary,
  } = useDomainAutomationActions({
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
  });

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success(t("domains.copyValue"));
  };

  return {
    domains,
    loading,
    isWaitingForEditorData,
    newDomain,
    setNewDomain,
    isAddingDomain,
    dnsProvider,
    setDnsProvider,
    dnsApiKey,
    setDnsApiKey,
    dnsZoneId,
    setDnsZoneId,
    showAdvanced,
    setShowAdvanced,
    dnsInstructions,
    copyToClipboard,
    handleAddDomain,
    handleDeleteDomain,
    handleCheckDomainStatus,
    handleTogglePrimary,
  };
};
