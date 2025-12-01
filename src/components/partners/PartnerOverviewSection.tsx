import React, { useMemo, useState } from 'react';
import {
  Copy,
  ExternalLink,
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  MousePointerClick,
  UserCheck,
  PieChart,
  ArrowUpRight,
} from 'lucide-react';
import { IncomeChart } from './IncomeChart';
import { usePartner } from '@/hooks/usePartner';
import { usePartnerStats } from '@/hooks/usePartnerStats';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '../ui/badge';
import { useToast } from '@/hooks/use-toast';

export const PartnerOverviewSection: React.FC = () => {
  const { isPartner, partnerProfile } = usePartner();
  const { stats, loading } = usePartnerStats();
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const referralCode = partnerProfile?.partner_code ?? '—';
  const referralLink = `${window.location.origin}/${language}/auth/signup?ref=${referralCode}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: t('partners.linkCopied'),
        description: t('partners.linkCopiedDesc'),
      });
    } catch (error) {
      toast({
        title: t('partners.error'),
        description: t('partners.copyFailed'),
        variant: 'destructive',
      });
    }
  };

  const chartData = useMemo(
    () => [
      35, 42, 38, 45, 60, 55, 65, 70, 68, 75, 60, 50, 45, 55, 70, 85, 90, 80,
      75, 95, 110, 105, 115, 120, 110, 130, 145, 140, 155, 160,
    ],
    [],
  );

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
        label = 'Direct (Прямые)';
      } else if (source === 'youtube') {
        label = 'YouTube';
      } else if (source === 'telegram') {
        label = 'Telegram';
      } else if (source === 'instagram') {
        label = 'Instagram';
      } else if (source === 'facebook') {
        label = 'Facebook';
      } else if (source === 'blog') {
        label = 'Blog';
      } else if (source === 'email_newsletter') {
        label = 'Email newsletter';
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
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
              Динамика дохода
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Статистика заработка за последние 30 дней
            </p>
          </div>
          <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-green-100">
            <TrendingUp size={16} />
            +24.5% к прошлому месяцу
          </div>
        </div>

        <div className="h-64 w-full">
          <IncomeChart data={chartData} />
        </div>
      </div>

      {/* Funnel & sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <MousePointerClick size={20} className="text-gray-400" />
            Воронка конверсии
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
                    Переходы по ссылке
                  </div>
                  <div className="text-xs text-gray-500">
                  Уникальные клики по реферальной ссылке
                  </div>
                </div>
              </div>
              <div className="text-right">
              <div className="text-lg font-bold text-gray-900">
                {totalClicks}
              </div>
                <div className="text-xs text-green-600 font-medium flex items-center justify-end gap-1">
                  <ArrowUpRight size={12} /> +12%
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
                    Регистрации
                  </div>
                  <div className="text-xs text-gray-500">Конверсия 8.4%</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">12</div>
                <div className="text-xs text-green-600 font-medium flex items-center justify-end gap-1">
                  <ArrowUpRight size={12} /> +5%
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
                    Оплаты
                  </div>
                  <div className="text-xs text-gray-500">
                    Конверсия из рег. 8.3%
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">1</div>
                <div className="text-xs text-gray-400 font-medium">0%</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <PieChart size={20} className="text-gray-400" />
            Источники трафика
          </h3>
          {trafficStats.length === 0 ? (
            <p className="text-sm text-gray-400">
              Статистика источников появится после первых рефералов с UTM-метками.
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

      {/* Referral link */}
      <div className="bg-white rounded-xl p-5 md:p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          {t('partners.referralLink')}
        </h3>
        <p className="text-gray-500 text-sm mb-4">{t('partners.shareLink')}</p>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600 font-mono break-all sm:break-normal">
            {referralLink}
          </div>
          <div className="flex gap-2 sm:shrink-0">
            <button
              onClick={copyToClipboard}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-lg text-sm font-medium text-gray-700 transition-colors"
            >
              <Copy size={16} />
              {copied ? 'Скопировано' : 'Копировать'}
            </button>
            <a
              href={referralLink}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-lg text-sm font-medium text-gray-700 transition-colors"
            >
              <ExternalLink size={16} />
              {t('partners.open')}
            </a>
          </div>
        </div>
      </div>

      {/* Clients list */}
      {stats?.clients && stats.clients.length > 0 && (
        <div className="bg-white rounded-xl p-5 md:p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {t('partners.recentClients')}
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            {t('partners.recentClientsDesc')}
          </p>
          <div className="space-y-4">
            {stats.clients.slice(0, 5).map((client) => (
              <div
                key={client.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {client.user_profiles.full_name?.[0] ||
                        client.user_profiles.email?.[0]}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {client.user_profiles.full_name ||
                        client.user_profiles.email}
                    </div>
                    <div className="text-xs text-gray-400 sm:hidden mt-1">
                      {new Date(client.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {client.user_profiles.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                  <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                    {client.type === 'referral'
                      ? t('partners.referral')
                      : t('partners.support')}
                  </span>
                  <span className="text-sm text-gray-500 hidden sm:block">
                    {new Date(client.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="text-sm text-gray-400">
          Загрузка статистики партнёра…
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


