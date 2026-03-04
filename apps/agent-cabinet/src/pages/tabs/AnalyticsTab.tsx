import { Download } from "lucide-react";
import { useAgentAnalyticsTabModel } from "@/features/agent-analytics/model/useAgentAnalyticsTabModel";
import { AgentAnalyticsContent } from "@/features/agent-analytics/ui/AgentAnalyticsContent";
import { AgentAnalyticsToolbar } from "@/features/agent-analytics/ui/AgentAnalyticsToolbar";
import { useLanguage } from "@/shared/lib/language";
import { ModuleHeader } from "@/shared/ui/ModuleHeader";

export function AnalyticsTab() {
  const { t } = useLanguage();
  const {
    activeWorkspaceId,
    selectedWorkspaceLabel,
    view,
    period,
    crm,
    finance,
    isLoading,
    isError,
    setView,
    setPeriod,
  } = useAgentAnalyticsTabModel();

  const translate = (key: string, vars?: unknown) =>
    String(t(key, vars as never));

  const handleExport = () => {
    console.log("Export triggered");
  };

  const subtitle = selectedWorkspaceLabel
    ? translate("common.analytics.subtitleWithWorkspace", {
        workspace: selectedWorkspaceLabel,
      })
    : translate("common.analytics.subtitle");

  return (
    <div className="flex h-full flex-col overflow-x-hidden bg-[#F8FAFC]">
      <ModuleHeader
        title={translate("common.analytics.title")}
        subtitle={subtitle}
        hideSearch
        primaryAction={{
          label: translate("common.analytics.export"),
          icon: <Download size={18} />,
          onClick: handleExport,
        }}
      />

      <AgentAnalyticsToolbar
        view={view}
        period={period}
        t={translate}
        onViewChange={setView}
        onPeriodChange={setPeriod}
      />

      <div className="custom-scrollbar flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto min-w-0 max-w-[1600px]">
          <AgentAnalyticsContent
            activeWorkspaceId={activeWorkspaceId}
            view={view}
            crm={crm}
            finance={finance}
            isLoading={isLoading}
            isError={isError}
            t={translate}
          />
        </div>
      </div>
    </div>
  );
}
