import type { ReactNode } from "react";
import {
  AgentCabinetLayout,
  type AgentCabinetPage,
  useAgentCabinetPageRouting,
} from "@/app/layout";
import {
  AgentSettingsTab,
  AnalyticsTab,
  CatalogTab,
  ContactsTab,
  DashboardTab,
  PartnerProgramTab,
} from "@/pages/tabs";

export function AgentCabinetRouter() {
  const { activePage, setActivePage } = useAgentCabinetPageRouting();
  const pageContent: Record<AgentCabinetPage, ReactNode> = {
    dashboard: <DashboardTab />,
    analytics: <AnalyticsTab />,
    contacts: <ContactsTab />,
    catalog: <CatalogTab />,
    partnerProgram: <PartnerProgramTab />,
    settings: <AgentSettingsTab />,
  };

  return (
    <AgentCabinetLayout activePage={activePage} onChangePage={setActivePage}>
      {pageContent[activePage]}
    </AgentCabinetLayout>
  );
}
