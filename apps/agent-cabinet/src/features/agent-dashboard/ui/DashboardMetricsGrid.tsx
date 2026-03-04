import { Handshake, Layers, Wallet, Zap } from "lucide-react";
import { useLanguage } from "@/shared/lib/language";
import { MetricCard, type DashboardMetrics } from "@/entities/dashboard";

type Props = {
  metrics: DashboardMetrics;
  revenueData: number[];
};

export function DashboardMetricsGrid({ metrics, revenueData }: Props) {
  const { t } = useLanguage();

  return (
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
  );
}
