import React, { useMemo } from "react";
import {
  Copy,
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  MousePointerClick,
  UserCheck,
  PieChart,
  Link,
  UserPlus,
  Wallet,
  ArrowRight,
  Percent,
} from "lucide-react";
import { IncomeChart } from "./IncomeChart";
import { usePartner } from "../queries/usePartner";
import { usePartnerStats } from "../queries/usePartnerStats";
import { useLanguage } from "@gridix/utils/react";
import { Badge } from "@gridix/ui";

interface PartnerOverviewSectionProps {
  onNavigate?: (
    tab: "account" | "overview" | "referrals" | "clients" | "instructions",
  ) => void;
}

export const PartnerOverviewSection: React.FC<PartnerOverviewSectionProps> = ({
  onNavigate,
}) => {
  const { isPartner, partnerProfile } = usePartner();
  const { stats, loading } = usePartnerStats();
  const { language, t } = useLanguage();

  const referralCode = partnerProfile?.partner_code ?? "—";

  const incomeHistory = stats?.income_history ?? [];
  const chartData = incomeHistory.map((point) => point.amount);
  const chartDates = incomeHistory.map((point) => point.date);

  const trafficStats = useMemo(() => {
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-gray-800",
      "bg-purple-500",
    ];

    const formatSourceLabel = (source: string): string => {
      if (source === "direct") return t("partners.sourceDirect");
      if (source === "youtube") return "YouTube";
      if (source === "telegram") return "Telegram";
      if (source === "instagram") return "Instagram";
      if (source === "facebook") return "Facebook";
      if (source === "blog") return t("partners.sourceBlog");
      if (source === "email_newsletter") return t("partners.sourceEmail");
      return source.charAt(0).toUpperCase() + source.slice(1);
    };

    // Приоритет: traffic_by_source из кликов (partner_clicks), иначе — по клиентам (регистрациям)
    const bySource = stats?.traffic_by_source;
    if (bySource && bySource.length > 0) {
      const total = bySource.reduce((s, x) => s + x.count, 0);
      if (total === 0) return [];
      const entries = [...bySource]
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);
      return entries.map((item, index) => ({
        label: formatSourceLabel(item.source),
        percent: Math.round((item.count / total) * 100),
        color: colors[index] || "bg-gray-500",
      }));
    }

    const clients = stats?.clients || [];
    if (!clients.length) return [];

    const counts: Record<string, number> = {};
    let total = 0;
    for (const client of clients) {
      const rawSource = (client.utm_source || "").trim().toLowerCase();
      const source = rawSource || "direct";
      counts[source] = (counts[source] || 0) + 1;
      total += 1;
    }
    if (!total) return [];

    const entries = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    return entries.map(([source, count], index) => ({
      label: formatSourceLabel(source),
      percent: Math.round((count / total) * 100),
      color: colors[index] || "bg-gray-500",
    }));
  }, [stats?.traffic_by_source, stats?.clients, t]);

  const TRAFFIC_COLORS = [
    "bg-red-500",
    "bg-blue-500",
    "bg-gray-800",
    "bg-purple-500",
  ];

  const buildTrafficRows = useMemo(
    () =>
      (
        items: Array<{ source: string; count: number }>,
        formatLabel: (value: string) => string,
      ) => {
        if (!items.length) return [];
        const total = items.reduce((s, x) => s + x.count, 0);
        if (total === 0) return [];
        return [...items]
          .sort((a, b) => b.count - a.count)
          .slice(0, 4)
          .map((item, index) => ({
            label: formatLabel(item.source),
            percent: Math.round((item.count / total) * 100),
            color: TRAFFIC_COLORS[index] || "bg-gray-500",
          }));
      },
    [],
  );

  const formatUtmValue = (value: string): string => {
    if (value === "—" || !value) return t("partners.utmNotSet");
    return value
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const trafficMediumStats = useMemo(() => {
    const byMedium = stats?.traffic_by_medium;
    if (!byMedium?.length) return [];
    return buildTrafficRows(byMedium, formatUtmValue);
  }, [stats?.traffic_by_medium, buildTrafficRows, t]);

  const trafficCampaignStats = useMemo(() => {
    const byCampaign = stats?.traffic_by_campaign;
    if (!byCampaign?.length) return [];
    return buildTrafficRows(byCampaign, formatUtmValue);
  }, [stats?.traffic_by_campaign, buildTrafficRows, t]);

  if (!isPartner) {
    return null;
  }

  const totalClients = stats?.total_clients ?? 1;
  const referralClients = stats?.referral_clients ?? 0;
  const managedClients =
    stats?.managed_clients ?? Math.max(totalClients - referralClients, 0);
  const earned = stats?.total_earned ?? 0;
  const available = stats?.available_for_withdrawal ?? earned;
  const totalClicks = stats?.total_clicks ?? 0;
  const registrations =
    stats?.funnel_registrations ?? stats?.total_clients ?? 0;
  const payingClients = stats?.funnel_paying_clients ?? 0;
  const registrationsConversion =
    totalClicks > 0 ? Math.round((registrations / totalClicks) * 1000) / 10 : 0;
  const paymentsConversion =
    registrations > 0
      ? Math.round((payingClients / registrations) * 1000) / 10
      : 0;

  const totalIncome30d = incomeHistory.reduce(
    (sum, point) => sum + point.amount,
    0,
  );

  const referralCommission = stats?.commission_percentage_referral ?? null;

  if (loading && !stats) {
    return (
      <div className="animate-in fade-in space-y-6 duration-500">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:p-6"
            >
              <div className="mb-3 h-4 w-24 animate-pulse rounded bg-gray-200" />
              <div className="mb-2 h-8 w-20 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-2 h-5 w-40 animate-pulse rounded bg-gray-200" />
          <div className="mb-4 h-4 w-64 animate-pulse rounded bg-gray-100" />
          <div className="h-40 w-full animate-pulse rounded bg-gray-100" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 h-5 w-40 animate-pulse rounded bg-gray-200" />
            <div className="space-y-4">
              {[0, 1, 2].map((idx) => (
                <div
                  key={idx}
                  className="h-10 w-full animate-pulse rounded bg-gray-100"
                />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 h-5 w-40 animate-pulse rounded bg-gray-200" />
            <div className="space-y-3">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="h-4 w-full animate-pulse rounded bg-gray-100"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
          <div className="absolute top-5 right-5 text-gray-300 transition-colors group-hover:text-black">
            <Users size={20} />
          </div>
          <div>
            <div className="mb-1 text-sm font-semibold text-gray-500">
              {t("partners.totalClients")}
            </div>
            <div className="mb-2 text-3xl font-bold text-gray-900">
              {totalClients}
            </div>
            <div className="text-xs text-gray-400">
              {referralClients} {t("partners.referralClients")},{" "}
              {managedClients} {t("partners.managedClients")}
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
          <div className="absolute top-5 right-5 text-gray-300 transition-colors group-hover:text-green-600">
            <DollarSign size={20} />
          </div>
          <div>
            <div className="mb-1 text-sm font-semibold text-gray-500">
              {t("partners.earned")}
            </div>
            <div className="mb-2 text-3xl font-bold text-gray-900">
              ${earned.toFixed(2)}
            </div>
            <div className="text-xs text-gray-400">
              {t("partners.availableForWithdrawal")}: ${available.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
          <div className="absolute top-5 right-5 text-gray-300 transition-colors group-hover:text-green-600">
            <Percent size={20} />
          </div>
          <div>
            <div className="mb-1 text-sm font-semibold text-gray-500">
              {t("partners.referralCommission")}
            </div>
            <div className="mb-2 text-3xl font-bold text-gray-900">
              {referralCommission !== null ? `${referralCommission}%` : "—"}
            </div>
            <div className="mt-1 flex items-center gap-3">
              <Badge className="bg-gray-100 font-mono text-gray-800">
                {referralCode}
              </Badge>
              <button
                onClick={() => navigator.clipboard.writeText(referralCode)}
                className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-black"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Income Chart */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <Activity size={20} className="text-green-500" />
              {t("partners.incomeDynamics")}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {t("partners.incomeLast30d")}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-green-100 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700">
            <TrendingUp size={16} />
            {t("partners.income30d")}: ${totalIncome30d.toFixed(2)}
          </div>
        </div>

        <div className="h-[180px] w-full sm:h-[220px]">
          <IncomeChart
            data={chartData}
            dates={chartDates}
            language={language}
          />
        </div>
      </div>

      {/* Funnel & sources */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-900">
            <MousePointerClick size={20} className="text-gray-400" />
            {t("partners.funnelTitle")}
          </h3>
          <div className="relative space-y-6">
            <div className="absolute top-8 bottom-8 left-[19px] -z-10 w-0.5 bg-gray-100" />

            <div className="group flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-600 shadow-sm transition-transform group-hover:scale-110">
                  <MousePointerClick size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {t("partners.funnelClicks")}
                  </div>
                  <div className="text-xs text-gray-500">
                    {t("partners.funnelClicksDesc")}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {totalClicks}
                </div>
              </div>
            </div>

            <div className="group flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-purple-100 bg-purple-50 text-purple-600 shadow-sm transition-transform group-hover:scale-110">
                  <UserCheck size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {t("partners.funnelRegistrations")}
                  </div>
                  <div className="text-xs text-gray-500">
                    {totalClicks > 0
                      ? t("partners.funnelFromClicks", {
                          value: registrationsConversion,
                        })
                      : t("partners.funnelFromClicksEmpty")}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {registrations}
                </div>
              </div>
            </div>

            <div className="group flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-green-100 bg-green-50 text-green-600 shadow-sm transition-transform group-hover:scale-110">
                  <DollarSign size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {t("partners.funnelPayments")}
                  </div>
                  <div className="text-xs text-gray-500">
                    {registrations > 0
                      ? t("partners.funnelFromRegistrations", {
                          value: paymentsConversion,
                        })
                      : t("partners.funnelFromRegistrationsEmpty")}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {payingClients}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-900">
            <PieChart size={20} className="text-gray-400" />
            {t("partners.trafficTitle")}
          </h3>
          {trafficStats.length === 0 ? (
            <p className="text-sm text-gray-400">
              {t("partners.trafficEmpty")}
            </p>
          ) : (
            <div className="space-y-4">
              {trafficStats.map((row) => (
                <TrafficRow
                  key={row.label}
                  label={row.label}
                  percent={row.percent}
                  color={row.color}
                />
              ))}
            </div>
          )}
        </div>
        {trafficMediumStats.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-900">
              <PieChart size={20} className="text-gray-400" />
              {t("partners.trafficByMedium")}
            </h3>

            <div className="space-y-4">
              {trafficMediumStats.map((row) => (
                <TrafficRow
                  key={row.label}
                  label={row.label}
                  percent={row.percent}
                  color={row.color}
                />
              ))}
            </div>
          </div>
        )}
        {trafficCampaignStats.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-900">
              <PieChart size={20} className="text-gray-400" />
              {t("partners.trafficByCampaign")}
            </h3>
            <p className="text-sm text-gray-400">
              {t("partners.trafficEmpty")}
            </p>
            <div className="space-y-4">
              {trafficCampaignStats.map((row) => (
                <TrafficRow
                  key={row.label}
                  label={row.label}
                  percent={row.percent}
                  color={row.color}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick actions (навигация по вкладкам партнёрки) */}
      <div>
        <h3 className="mb-4 text-lg font-bold text-slate-900">
          {t("partners.quickActionsTitle")}
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div
            onClick={() => onNavigate && onNavigate("referrals")}
            className="group flex h-full cursor-pointer flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
              <Link size={20} />
            </div>
            <h4 className="mb-1 font-bold text-slate-900">
              {t("partners.quickActionsRefLinkTitle")}
            </h4>
            <p className="mb-4 flex-1 text-xs text-slate-500">
              {t("partners.quickActionsRefLinkDesc")}
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
              {t("partners.quickActionsRefLinkCta")} <ArrowRight size={12} />
            </div>
          </div>

          <div
            onClick={() => onNavigate && onNavigate("clients")}
            className="group flex h-full cursor-pointer flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-purple-300 hover:shadow-md"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white">
              <UserPlus size={20} />
            </div>
            <h4 className="mb-1 font-bold text-slate-900">
              {t("partners.quickActionsClientsTitle")}
            </h4>
            <p className="mb-4 flex-1 text-xs text-slate-500">
              {t("partners.quickActionsClientsDesc")}
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-purple-600">
              {t("partners.quickActionsClientsCta")} <ArrowRight size={12} />
            </div>
          </div>

          <div
            onClick={() => onNavigate && onNavigate("account")}
            className="group flex h-full cursor-pointer flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-green-300 hover:shadow-md"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600 transition-colors group-hover:bg-green-600 group-hover:text-white">
              <Wallet size={20} />
            </div>
            <h4 className="mb-1 font-bold text-slate-900">
              {t("partners.quickActionsAccountTitle")}
            </h4>
            <p className="mb-4 flex-1 text-xs text-slate-500">
              {t("partners.quickActionsAccountDesc")}
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-green-600">
              {t("partners.quickActionsAccountCta")} <ArrowRight size={12} />
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-sm text-gray-400">
          {t("partners.loadingStats")}
        </div>
      )}
    </div>
  );
};

const TrafficRow: React.FC<{
  label: string;
  percent: number;
  color: string;
}> = ({ label, percent, color }) => (
  <div>
    <div className="mb-2 flex items-center justify-between text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      <span className="font-bold text-gray-900">{percent}%</span>
    </div>
    <div className="h-2 w-full rounded-full bg-gray-100">
      <div
        className={`${color} h-2 rounded-full`}
        style={{ width: `${percent}%` }}
      />
    </div>
  </div>
);
