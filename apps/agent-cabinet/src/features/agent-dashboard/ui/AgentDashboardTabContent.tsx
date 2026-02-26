import { useCallback, useMemo } from "react";
import { useWorkspace } from "@gridix/utils/react";
import { Handshake, Layers, Lock, Wallet, Zap } from "lucide-react";
import { ModuleHeader } from "@/shared/ui/ModuleHeader";
import { useLanguage } from "@/shared/lib/language";
import {
  buildActivities,
  buildRevenueData,
  LiveActivityFeed,
  mapDashboardMetrics,
  MetricCard,
  RevenueChart,
} from "@/entities/dashboard";
import { LoadingState } from "@/shared/ui/LoadingState";
import { useAgentDashboardQuery } from "../model/useAgentDashboardQuery";

export function AgentDashboardTabContent() {
  const { t } = useLanguage();
  const { activeWorkspaceId, availableWorkspaces } = useWorkspace();
  const selected =
    availableWorkspaces.find(
      (workspace) => workspace.id === activeWorkspaceId,
    ) ?? null;

  const dashboardQuery = useAgentDashboardQuery(activeWorkspaceId);

  const metrics = useMemo(
    () => mapDashboardMetrics(dashboardQuery.data),
    [dashboardQuery.data],
  );
  const revenueData = useMemo(
    () => buildRevenueData(metrics.paid),
    [metrics.paid],
  );
  const translate = useCallback(
    (key: string, vars?: unknown) => String(t(key, vars as never)),
    [t],
  );
  const activities = useMemo(
    () => buildActivities(metrics, translate),
    [metrics, translate],
  );

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
          {!activeWorkspaceId ? (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <Lock size={18} className="text-slate-400" />
              <div>
                <div className="font-bold text-slate-900">
                  {t("common.workspace.noActiveTitle")}
                </div>
                <div className="text-sm text-slate-600">
                  {t("common.workspace.pickInSidebar")}
                </div>
              </div>
            </div>
          ) : dashboardQuery.isLoading ? (
            <LoadingState message={t("common.common.loading")} />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  title={t("common.dashboard.metrics.commissionPaid")}
                  value={`$${metrics.paid.toLocaleString()}`}
                  trend={metrics.paid > 0 ? "+15%" : undefined}
                  trendUp
                  icon={<Wallet size={22} />}
                  color="emerald"
                  chartData={revenueData}
                />
                <MetricCard
                  title={t("common.dashboard.metrics.commissionPending")}
                  value={`$${metrics.pending.toLocaleString()}`}
                  trend={metrics.pending > 0 ? "+8%" : undefined}
                  trendUp
                  icon={<Handshake size={22} />}
                  color="purple"
                  subtext={t("common.dashboard.metrics.projectsSubtext", {
                    count: metrics.projects,
                  })}
                />
                <MetricCard
                  title={t("common.dashboard.metrics.leads")}
                  value={metrics.leads}
                  trend={metrics.leads > 0 ? "+4" : undefined}
                  trendUp
                  icon={<Zap size={22} />}
                  color="blue"
                  chartData={[10, 12, 15, 14, 18, metrics.leads || 22]}
                  subtext={
                    metrics.contacts
                      ? t("common.dashboard.metrics.contactsSubtext", {
                          count: metrics.contacts,
                        })
                      : undefined
                  }
                />
                <MetricCard
                  title={t("common.dashboard.metrics.catalog")}
                  value={metrics.projects}
                  trend={metrics.projects > 0 ? "+1" : undefined}
                  trendUp
                  icon={<Layers size={22} />}
                  color="amber"
                  chartData={[3, 4, 4, 5, 5, metrics.projects || 6]}
                  subtext={t("common.dashboard.metrics.availableProjects")}
                />
              </div>

              <div className="grid h-auto grid-cols-1 gap-6 lg:h-[400px] lg:grid-cols-3">
                <div className="h-full lg:col-span-2">
                  <RevenueChart data={revenueData} t={t} />
                </div>
                <div className="h-full">
                  <LiveActivityFeed activities={activities} t={t} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
