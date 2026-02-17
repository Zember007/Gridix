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
  Award,
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
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-gray-800",
      "bg-purple-500",
    ];

    return entries.map(([source, count], index) => {
      let label = source;
      if (source === "direct") {
        label = t("partners.sourceDirect");
      } else if (source === "youtube") {
        label = "YouTube";
      } else if (source === "telegram") {
        label = "Telegram";
      } else if (source === "instagram") {
        label = "Instagram";
      } else if (source === "facebook") {
        label = "Facebook";
      } else if (source === "blog") {
        label = t("partners.sourceBlog");
      } else if (source === "email_newsletter") {
        label = t("partners.sourceEmail");
      } else {
        label = source.charAt(0).toUpperCase() + source.slice(1);
      }

      const percent = Math.round((count / total) * 100);

      return {
        label,
        percent,
        color: colors[index] || "bg-gray-500",
      };
    });
  }, [stats?.clients]);

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

  // Текущая комиссия партнёра: сначала реферальная, затем управляемая
  const currentCommission =
    stats?.commission_percentage_referral ??
    stats?.commission_percentage_managed ??
    null;

  // Данные по уровням и прогрессу приходят из Supabase функции (вся логика на бэкенде)
  const totalProjectsLevel =
    stats?.total_projects ?? stats?.active_clients ?? payingClients;
  const nextLevelTarget = stats?.next_level_required_active_clients ?? null;
  const clientsToNextLevel = stats?.clients_to_next_level ?? null;
  const partnerLevelTitle = stats?.partner_level ?? "Bronze Partner";
  const nextLevelName = stats?.next_level_name ?? null;

  const levelProgress =
    nextLevelTarget && nextLevelTarget > 0
      ? Math.min(Math.round((totalProjectsLevel / nextLevelTarget) * 100), 100)
      : 100;

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
      {/* Gamification / Level Card */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white shadow-lg">
        <div className="pointer-events-none absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-white/5 blur-3xl"></div>
        <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <div className="rounded-lg bg-white/10 p-1.5">
                <Award size={18} className="text-yellow-400" />
              </div>
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                {t("partners.levelLabel")}
              </span>
            </div>
            <h2 className="mb-1 text-2xl font-bold">
              {partnerLevelTitle}{" "}
              <span className="text-lg font-normal text-slate-400">
                {currentCommission !== null ? `(${currentCommission}%)` : ""}
              </span>
            </h2>
            {nextLevelName &&
            clientsToNextLevel !== null &&
            clientsToNextLevel > 0 ? (
              <p className="max-w-lg text-sm text-slate-300">
                {t("partners.levelHintPrefix")}{" "}
                <span className="font-bold text-white">
                  {clientsToNextLevel} {t("partners.levelHintProjects")}
                </span>
                ,{" "}
                <span className="font-bold text-yellow-400">
                  {t("partners.levelHintReach", { level: nextLevelName })}
                </span>
                .
              </p>
            ) : (
              <p className="max-w-lg text-sm text-slate-300">
                {t("partners.levelMax")}
              </p>
            )}
          </div>
          {nextLevelTarget && nextLevelTarget > 0 && (
            <div className="w-full md:w-64">
              <div className="mb-2 flex justify-between text-xs font-semibold text-slate-400">
                <span>{t("partners.levelProgress")}</span>
                <span>
                  {totalProjectsLevel} / {nextLevelTarget}{" "}
                  {t("partners.levelProjectsShort")}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full border border-slate-600 bg-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  style={{ width: `${levelProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
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
          <div className="absolute top-5 right-5 text-gray-300 transition-colors group-hover:text-black">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="mb-1 text-sm font-semibold text-gray-500">
              {t("partners.partnerCode")}
            </div>
            <div className="mt-2 flex items-center gap-3">
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

        <div className="w-full">
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
