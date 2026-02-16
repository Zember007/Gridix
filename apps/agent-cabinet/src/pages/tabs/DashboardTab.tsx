import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@gridix/utils/api";
import { useWorkspace } from "@gridix/utils/react";
import {
  ArrowUpRight,
  ArrowDownRight,
  Handshake,
  Lock,
  Wallet,
  Activity,
  Zap,
  Layers,
} from "lucide-react";
import { ModuleHeader } from "@/shared/ui/ModuleHeader";
import { useLanguage } from "@/contexts/LanguageContext";

// --- WIDGETS ---

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: string | undefined;
  trendUp?: boolean;
  icon: React.ReactNode;
  color: string;
  chartData?: number[];
  subtext?: string | undefined;
}

const MetricCard = ({
  title,
  value,
  trend,
  trendUp = true,
  icon,
  color,
  chartData,
  subtext,
}: MetricCardProps) => {
  // Sparkline Logic
  const sparklinePath = useMemo(() => {
    if (!chartData || chartData.length === 0) return "";
    const max = Math.max(...chartData);
    const min = Math.min(...chartData);
    const range = max - min || 1;
    const width = 100;
    const height = 30;

    return chartData
      .map((val, i) => {
        const x = (i / (chartData.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
      })
      .join(" ");
  }, [chartData]);

  const bgColors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    purple: "bg-purple-50 text-purple-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] hover:shadow-lg hover:border-slate-300/80 transition-all duration-300 group relative overflow-hidden">
      <div className="flex justify-between items-start mb-3 relative z-10">
        <div
          className={`p-2.5 rounded-xl transition-transform group-hover:scale-110 ${bgColors[color] ?? bgColors.blue}`}
        >
          {icon}
        </div>
        {trend ? (
          <div
            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${
              trendUp ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
            }`}
          >
            {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trend}
          </div>
        ) : null}
      </div>

      <div className="relative z-10">
        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
        {subtext ? <p className="text-[10px] text-slate-400 mt-1 font-medium">{subtext}</p> : null}
      </div>

      {chartData && chartData.length > 1 && (
        <div className="absolute bottom-4 right-4 w-24 h-8 opacity-20 group-hover:opacity-50 transition-opacity">
          <svg width="100%" height="100%" viewBox="0 0 100 30" preserveAspectRatio="none" className="overflow-visible">
            <polyline
              points={sparklinePath}
              fill="none"
              stroke={trendUp ? "#10b981" : "#ef4444"}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

// Revenue Chart Component
const RevenueChart = ({ data, t }: { data: number[]; t: (key: string) => string }) => {
  const generatePath = (points: number[], width: number, height: number) => {
    if (points.length === 0) return "";
    const max = Math.max(...points) * 1.1 || 1;
    const coords = points.map((val, i) => ({
      x: (i / Math.max(points.length - 1, 1)) * width,
      y: height - (val / max) * height,
    }));

    const firstCoord = coords[0];
    if (!firstCoord) return "";
    let d = `M ${firstCoord.x},${firstCoord.y}`;
    for (let i = 1; i < coords.length; i++) {
      const curr = coords[i];
      const prev = coords[i - 1];
      if (!curr || !prev) continue;
      const cp1x = prev.x + (curr.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (curr.x - prev.x) / 2;
      const cp2y = curr.y;
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
    }
    return d;
  };

  const path = generatePath(data, 800, 250);
  const area = path ? `${path} L 800,250 L 0,250 Z` : "";

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm h-full relative overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-6 z-10">
        <div>
          <h3 className="font-bold text-slate-900 text-base">{t("common.dashboard.chart.title")}</h3>
          <p className="text-xs text-slate-500 mt-1">{t("common.dashboard.chart.subtitle")}</p>
        </div>
        <div className="bg-slate-50 p-1 rounded-lg border border-slate-100">
          <button type="button" className="px-3 py-1 bg-white shadow-sm rounded text-xs font-bold text-slate-800">
            2025
          </button>
        </div>
      </div>
      <div className="flex-1 relative w-full min-h-[200px]">
        <svg viewBox="0 0 800 250" className="w-full h-full overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Grid */}
          {[0, 50, 100, 150, 200].map((y) => (
            <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="#f1f5f9" strokeDasharray="4 4" />
          ))}
          <path d={area} fill="url(#revGradient)" />
          <path d={path} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-wider">
        {["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
    </div>
  );
};

// Live Activity Feed Component
interface ActivityItem {
  id: number;
  user: string;
  action: string;
  target: string;
  time: string;
  type: "success" | "info" | "warning";
}

const LiveActivityFeed = ({ activities, t }: { activities: ActivityItem[]; t: (key: string) => string }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center backdrop-blur-sm sticky top-0 z-10">
        <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
          <Activity size={18} className="text-blue-500" />
          {t("common.dashboard.activity.title")}
        </h3>
        <div className="flex items-center gap-2 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
          <span className="text-[10px] font-bold text-blue-700 uppercase">Live</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        {activities.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-400">{t("common.dashboard.activity.empty")}</div>
        ) : (
          activities.map((act) => (
            <div
              key={act.id}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group border border-transparent hover:border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm text-white ${
                    act.type === "success" ? "bg-green-500" : act.type === "info" ? "bg-blue-500" : "bg-amber-500"
                  }`}
                >
                  {act.user.charAt(0)}
                </div>
                <div>
                  <div className="text-xs text-slate-800 leading-none mb-1">
                    <span className="font-bold">{act.user}</span>{" "}
                    <span className="text-slate-500">{act.action}</span>
                  </div>
                  <div className="text-[10px] font-medium text-slate-900">{act.target}</div>
                </div>
              </div>
              <span className="ml-3 w-12 shrink-0 text-right text-[10px] leading-tight text-slate-400 break-words">{act.time}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export function DashboardTab() {
  const { t } = useLanguage();
  const { activeWorkspaceId, availableWorkspaces } = useWorkspace();
  const selected = availableWorkspaces.find((w) => w.id === activeWorkspaceId) ?? null;

  const dashboardQuery = useQuery({
    queryKey: ["agent_dashboard", activeWorkspaceId],
    enabled: !!activeWorkspaceId,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("agent-program", {
        body: { action: "get_agent_dashboard", application_id: activeWorkspaceId },
      });
      if (error) throw error;
      return data as Record<string, unknown>;
    },
  });

  const metrics = useMemo(() => {
    const d = dashboardQuery.data as Record<string, unknown> | undefined;
    return {
      leads: Number((d?.leads as Record<string, unknown>)?.count ?? 0),
      contacts: Number((d?.contacts as Record<string, unknown>)?.count ?? 0),
      paid: Number((d?.payouts as Record<string, unknown>)?.paid ?? 0),
      pending: Number((d?.payouts as Record<string, unknown>)?.pending ?? 0),
      projects: Number((d?.projects as Record<string, unknown>)?.count ?? 0),
    };
  }, [dashboardQuery.data]);

  // Generate mock revenue data based on real metrics
  const revenueData = useMemo(() => {
    const base = metrics.paid || 1000;
    return [
      base * 0.3,
      base * 0.5,
      base * 0.4,
      base * 0.7,
      base * 0.6,
      base,
    ];
  }, [metrics.paid]);

  // Generate activity feed from dashboard data
  const activities = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];
    if (metrics.leads > 0) {
      items.push({
        id: 1,
        user: t("common.dashboard.activity.system"),
        action: t("common.dashboard.activity.newLead"),
        target: `${metrics.leads} ${t("common.dashboard.activity.leadsLabel")}`,
        time: t("common.dashboard.activity.recent"),
        type: "info",
      });
    }
    if (metrics.paid > 0) {
      items.push({
        id: 2,
        user: t("common.dashboard.activity.system"),
        action: t("common.dashboard.activity.commissionPaid"),
        target: `$${metrics.paid.toLocaleString()}`,
        time: t("common.dashboard.activity.thisMonth"),
        type: "success",
      });
    }
    if (metrics.pending > 0) {
      items.push({
        id: 3,
        user: t("common.dashboard.activity.system"),
        action: t("common.dashboard.activity.pendingPayout"),
        target: `$${metrics.pending.toLocaleString()}`,
        time: t("common.dashboard.activity.inPipeline"),
        type: "warning",
      });
    }
    return items;
  }, [metrics, t]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
      <ModuleHeader
        title={t("common.dashboard.title")}
        subtitle={
          selected
            ? t("common.dashboard.subtitleWorkspace", { workspace: selected.label })
            : t("common.dashboard.subtitleNoWorkspace")
        }
        hideSearch
      />

      <div className="flex-1 overflow-visible md:overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {!activeWorkspaceId ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-3">
              <Lock size={18} className="text-slate-400" />
              <div>
                <div className="font-bold text-slate-900">{t("common.workspace.noActiveTitle")}</div>
                <div className="text-sm text-slate-600">{t("common.workspace.pickInSidebar")}</div>
              </div>
            </div>
          ) : dashboardQuery.isLoading ? (
            <div className="text-sm text-slate-500">{t("common.common.loading")}</div>
          ) : (
            <>
              {/* 1. Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title={t("common.dashboard.metrics.commissionPaid")}
                  value={`$${metrics.paid.toLocaleString()}`}
                  trend={metrics.paid > 0 ? "+15%" : undefined}
                  trendUp={true}
                  icon={<Wallet size={22} />}
                  color="emerald"
                  chartData={revenueData}
                />
                <MetricCard
                  title={t("common.dashboard.metrics.commissionPending")}
                  value={`$${metrics.pending.toLocaleString()}`}
                  trend={metrics.pending > 0 ? "+8%" : undefined}
                  trendUp={true}
                  icon={<Handshake size={22} />}
                  color="purple"
                  subtext={t("common.dashboard.metrics.projectsSubtext", { count: metrics.projects })}
                />
                <MetricCard
                  title={t("common.dashboard.metrics.leads")}
                  value={metrics.leads}
                  trend={metrics.leads > 0 ? "+4" : undefined}
                  trendUp={true}
                  icon={<Zap size={22} />}
                  color="blue"
                  chartData={[10, 12, 15, 14, 18, metrics.leads || 22]}
                  subtext={metrics.contacts ? t("common.dashboard.metrics.contactsSubtext", { count: metrics.contacts }) : undefined}
                />
                <MetricCard
                  title={t("common.dashboard.metrics.catalog")}
                  value={metrics.projects}
                  trend={metrics.projects > 0 ? "+1" : undefined}
                  trendUp={true}
                  icon={<Layers size={22} />}
                  color="amber"
                  chartData={[3, 4, 4, 5, 5, metrics.projects || 6]}
                  subtext={t("common.dashboard.metrics.availableProjects")}
                />
              </div>

              {/* 2. Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[400px]">
                <div className="lg:col-span-2 h-full">
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
