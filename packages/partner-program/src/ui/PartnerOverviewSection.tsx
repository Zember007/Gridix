import React, { useMemo } from 'react';
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
} from 'lucide-react';
import { IncomeChart } from './IncomeChart';
import { usePartner } from '../queries/usePartner';
import { usePartnerStats } from '../queries/usePartnerStats';
import { useLanguage } from '@gridix/utils/react';
import { Badge } from "@gridix/ui";

interface PartnerOverviewSectionProps {
  onNavigate?: (
    tab: 'account' | 'overview' | 'referrals' | 'clients' | 'instructions',
  ) => void;
}

export const PartnerOverviewSection: React.FC<PartnerOverviewSectionProps> = ({
  onNavigate,
}) => {
  const { isPartner, partnerProfile } = usePartner();
  const { stats, loading } = usePartnerStats();
  const { language, t } = useLanguage();

  const referralCode = partnerProfile?.partner_code ?? '—';

  const incomeHistory = stats?.income_history ?? [];
  const chartData = incomeHistory.map((point) => point.amount);
  const chartDates = incomeHistory.map((point) => point.date);

  const trafficStats = useMemo(() => {
    const clients = stats?.clients || [];
    if (!clients.length) return [];

    const counts: Record<string, number> = {};
    let total = 0;

    for (const client of clients) {
      const rawSource = (client.utm_source || '').trim().toLowerCase();
      const source = rawSource || 'direct';
      counts[source] = (counts[source] || 0) + 1;
      total += 1;
    }

    if (!total) return [];

    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-gray-800', 'bg-purple-500'];

    return entries.map(([source, count], index) => {
      let label = source;
      if (source === 'direct') {
        label = t('partners.sourceDirect');
      } else if (source === 'youtube') {
        label = 'YouTube';
      } else if (source === 'telegram') {
        label = 'Telegram';
      } else if (source === 'instagram') {
        label = 'Instagram';
      } else if (source === 'facebook') {
        label = 'Facebook';
      } else if (source === 'blog') {
        label = t('partners.sourceBlog');
      } else if (source === 'email_newsletter') {
        label = t('partners.sourceEmail');
      } else {
        label = source.charAt(0).toUpperCase() + source.slice(1);
      }

      const percent = Math.round((count / total) * 100);

      return {
        label,
        percent,
        color: colors[index] || 'bg-gray-500',
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
  const registrations = stats?.funnel_registrations ?? stats?.total_clients ?? 0;
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
  const partnerLevelTitle = stats?.partner_level ?? 'Bronze Partner';
  const nextLevelName = stats?.next_level_name ?? null;

  const levelProgress =
    nextLevelTarget && nextLevelTarget > 0
      ? Math.min(
          Math.round((totalProjectsLevel / nextLevelTarget) * 100),
          100,
        )
      : 100;

  if (loading && !stats) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 shadow-sm"
            >
              <div className="h-4 w-24 bg-gray-200 rounded mb-3 animate-pulse" />
              <div className="h-8 w-20 bg-gray-200 rounded mb-2 animate-pulse" />
              <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="h-5 w-40 bg-gray-200 rounded mb-2 animate-pulse" />
          <div className="h-4 w-64 bg-gray-100 rounded mb-4 animate-pulse" />
          <div className="h-40 w-full bg-gray-100 rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="h-5 w-40 bg-gray-200 rounded mb-4 animate-pulse" />
            <div className="space-y-4">
              {[0, 1, 2].map((idx) => (
                <div
                  key={idx}
                  className="h-10 w-full bg-gray-100 rounded animate-pulse"
                />
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="h-5 w-40 bg-gray-200 rounded mb-4 animate-pulse" />
            <div className="space-y-3">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="h-4 w-full bg-gray-100 rounded animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Gamification / Level Card */}
      <div className="bg-slate-900 bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-white/10 rounded-lg">
                <Award size={18} className="text-yellow-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t('partners.levelLabel')}
              </span>
            </div>
            <h2 className="text-2xl font-bold mb-1">
              {partnerLevelTitle}{' '}
              <span className="text-lg font-normal text-slate-400">
                {currentCommission !== null ? `(${currentCommission}%)` : ''}
              </span>
            </h2>
            {nextLevelName && clientsToNextLevel !== null && clientsToNextLevel > 0 ? (
              <p className="text-sm text-slate-300 max-w-lg">
                {t('partners.levelHintPrefix')}{' '}
                <span className="text-white font-bold">
                  {clientsToNextLevel}{' '}
                  {t('partners.levelHintProjects')}
                </span>
                ,{' '}
                <span className="text-yellow-400 font-bold">
                  {t('partners.levelHintReach', { level: nextLevelName })}
                </span>
                .
              </p>
            ) : (
              <p className="text-sm text-slate-300 max-w-lg">
                {t('partners.levelMax')}
              </p>
            )}
          </div>
          {nextLevelTarget && nextLevelTarget > 0 && (
            <div className="w-full lg:w-72 lg:shrink-0">
              <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-400 mb-2">
                <span>{t('partners.levelProgress')}</span>
                <span className="whitespace-nowrap">
                  {totalProjectsLevel} / {nextLevelTarget}{' '}
                  {t('partners.levelProjectsShort')}
                </span>
              </div>
              <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden border border-slate-600">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-5 right-5 text-gray-300 group-hover:text-black transition-colors">
            <Users size={20} />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-500 mb-1">
              {t('partners.totalClients')}
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {totalClients}
            </div>
            <div className="text-xs text-gray-400">
              {referralClients} {t('partners.referralClients')},{' '}
              {managedClients} {t('partners.managedClients')}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-5 right-5 text-gray-300 group-hover:text-green-600 transition-colors">
            <DollarSign size={20} />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-500 mb-1">
              {t('partners.earned')}
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              ${earned.toFixed(2)}
            </div>
            <div className="text-xs text-gray-400">
              {t('partners.availableForWithdrawal')}: $
              {available.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-5 right-5 text-gray-300 group-hover:text-black transition-colors">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-500 mb-1">
              {t('partners.partnerCode')}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <Badge className="bg-gray-100 text-gray-800 font-mono">
                {referralCode}
              </Badge>
              <button
                onClick={() => navigator.clipboard.writeText(referralCode)}
                className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-black transition-colors"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Income Chart */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Activity size={20} className="text-green-500" />
              {t('partners.incomeDynamics')}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {t('partners.incomeLast30d')}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-green-100">
            <TrendingUp size={16} />
            {t('partners.income30d')}: ${totalIncome30d.toFixed(2)}
          </div>
        </div>

        <div className="w-full h-[180px] sm:h-[220px]">
          <IncomeChart data={chartData} dates={chartDates} language={language} />
        </div>
      </div>

      {/* Funnel & sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <MousePointerClick size={20} className="text-gray-400" />
            {t('partners.funnelTitle')}
          </h3>
          <div className="space-y-6 relative">
            <div className="absolute left-[19px] top-8 bottom-8 w-0.5 bg-gray-100 -z-10" />

            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                  <MousePointerClick size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {t('partners.funnelClicks')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {t('partners.funnelClicksDesc')}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {totalClicks}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-sm group-hover:scale-110 transition-transform">
                  <UserCheck size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {t('partners.funnelRegistrations')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {totalClicks > 0
                      ? t('partners.funnelFromClicks', {
                          value: registrationsConversion,
                        })
                      : t('partners.funnelFromClicksEmpty')}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {registrations}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-green-600 shadow-sm group-hover:scale-110 transition-transform">
                  <DollarSign size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {t('partners.funnelPayments')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {registrations > 0
                      ? t('partners.funnelFromRegistrations', {
                          value: paymentsConversion,
                        })
                      : t('partners.funnelFromRegistrationsEmpty')}
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

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <PieChart size={20} className="text-gray-400" />
            {t('partners.trafficTitle')}
          </h3>
          {trafficStats.length === 0 ? (
            <p className="text-sm text-gray-400">
              {t('partners.trafficEmpty')}
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
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          {t('partners.quickActionsTitle')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => onNavigate && onNavigate('referrals')}
            className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group flex flex-col h-full"
          >
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Link size={20} />
            </div>
            <h4 className="font-bold text-slate-900 mb-1">
              {t('partners.quickActionsRefLinkTitle')}
            </h4>
            <p className="text-xs text-slate-500 mb-4 flex-1">
              {t('partners.quickActionsRefLinkDesc')}
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
              {t('partners.quickActionsRefLinkCta')}{' '}
              <ArrowRight size={12} />
            </div>
          </div>

          <div
            onClick={() => onNavigate && onNavigate('clients')}
            className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group flex flex-col h-full"
          >
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <UserPlus size={20} />
            </div>
            <h4 className="font-bold text-slate-900 mb-1">
              {t('partners.quickActionsClientsTitle')}
            </h4>
            <p className="text-xs text-slate-500 mb-4 flex-1">
              {t('partners.quickActionsClientsDesc')}
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-purple-600">
              {t('partners.quickActionsClientsCta')}{' '}
              <ArrowRight size={12} />
            </div>
          </div>

          <div
            onClick={() => onNavigate && onNavigate('account')}
            className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-green-300 hover:shadow-md transition-all cursor-pointer group flex flex-col h-full"
          >
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-600 group-hover:text-white transition-colors">
              <Wallet size={20} />
            </div>
            <h4 className="font-bold text-slate-900 mb-1">
              {t('partners.quickActionsAccountTitle')}
            </h4>
            <p className="text-xs text-slate-500 mb-4 flex-1">
              {t('partners.quickActionsAccountDesc')}
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-green-600">
              {t('partners.quickActionsAccountCta')}{' '}
              <ArrowRight size={12} />
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-sm text-gray-400">
          {t('partners.loadingStats')}
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
    <div className="flex justify-between items-center text-sm mb-2">
      <span className="font-medium text-gray-700">{label}</span>
      <span className="text-gray-900 font-bold">{percent}%</span>
    </div>
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div className={`${color} h-2 rounded-full`} style={{ width: `${percent}%` }} />
    </div>
  </div>
);
