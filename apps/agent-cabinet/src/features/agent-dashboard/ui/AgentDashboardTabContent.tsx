import { useCallback, useMemo, type ReactNode } from "react";
import { useWorkspace } from "@gridix/utils/react";
import { ModuleHeader } from "@/shared/ui/ModuleHeader";
import { useLanguage } from "@/shared/lib/language";
import {
  buildActivities,
  buildRevenueData,
  LiveActivityFeed,
  mapDashboardMetrics,
  RevenueChart,
} from "@/entities/dashboard";
import { LoadingState } from "@/shared/ui/LoadingState";
import { useAgentDashboardQuery } from "../model/useAgentDashboardQuery";
import { DashboardMetricsGrid } from "./DashboardMetricsGrid";
import { NoActiveWorkspaceNotice } from "./NoActiveWorkspaceNotice";

export function AgentDashboardTabContent() {
  const { t } = useLanguage();
  const { activeWorkspaceId, availableWorkspaces } = useWorkspace();
  const selected =
    availableWorkspaces.find(
      (workspace) => workspace.id === activeWorkspaceId,
    ) ?? null;

  const dashboardQuery = useAgentDashboardQuery(activeWorkspaceId);

  const translate = useCallback(
    (key: string, vars?: unknown) => String(t(key, vars as never)),
    [t],
  );

  const metrics = useMemo(
    () => mapDashboardMetrics(dashboardQuery.data),
    [dashboardQuery.data],
  );

  const revenueData = useMemo(
    () => buildRevenueData(metrics.paid),
    [metrics.paid],
  );

  const activities = useMemo(
    () => buildActivities(metrics, translate),
    [metrics, translate],
  );

  let dashboardContent: ReactNode;
  if (!activeWorkspaceId) {
    dashboardContent = <NoActiveWorkspaceNotice />;
  } else if (dashboardQuery.isLoading) {
    dashboardContent = <LoadingState message={t("common.common.loading")} />;
  } else {
    dashboardContent = (
      <>
        <DashboardMetricsGrid metrics={metrics} revenueData={revenueData} />

        <div className="grid h-auto grid-cols-1 gap-6 lg:h-[400px] lg:grid-cols-3">
          <div className="h-full lg:col-span-2">
            <RevenueChart data={revenueData} t={t} />
          </div>
          <div className="h-full">
            <LiveActivityFeed activities={activities} t={t} />
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#F8FAFC]">
      <ModuleHeader
        title={t("common.dashboard.title")}
        subtitle={
          selected
            ? t("common.dashboard.subtitleWorkspace", {
                workspace: selected.label,
              })
            : t("common.dashboard.subtitleNoWorkspace")
        }
        hideSearch
      />

      <div className="custom-scrollbar flex-1 overflow-visible p-4 md:overflow-y-auto md:p-8">
        <div className="mx-auto max-w-[1600px] space-y-6">
          {dashboardContent}
        </div>
      </div>
    </div>
  );
}
