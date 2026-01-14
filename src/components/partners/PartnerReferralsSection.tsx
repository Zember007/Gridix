import React, { useEffect, useState, useMemo } from 'react';
import {
  Search,
  UserCheck,
  Calendar,
  Copy,
  Settings2,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  MousePointerClick,
  UserPlus,
  ArrowUpRight,
  QrCode,
  Send,
  MessageCircle,
  Download,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePartner } from '@/entities/partner/queries/usePartner';
import { usePartnerStats } from '@/entities/partner/queries/usePartnerStats';
import type { PartnerClient } from '@/entities/partner/model/types';

// Вкладка «Рефералы» — адаптирована из gridix-dashboard PartnerReferralsPage.
// Вся статистика и переходы здесь моковые по умолчанию.

export const PartnerReferralsSection: React.FC = () => {
  const { toast } = useToast();
  const { language, t } = useLanguage();
  const { partnerProfile } = usePartner();
  const { stats, loading } = usePartnerStats();

  const [copied, setCopied] = useState(false);
  const [showUtmBuilder, setShowUtmBuilder] = useState(false);
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const referralCode = partnerProfile?.partner_code || '5cac1e45';
  const baseUrl = `${window.location.origin}/${language}/auth/signup`;

  const [generatedLink, setGeneratedLink] = useState(
    `${baseUrl}?ref=${referralCode}`,
  );

  useEffect(() => {
    let url = `${baseUrl}?ref=${referralCode}`;
    if (utmSource.trim()) {
      url += `&utm_source=${encodeURIComponent(utmSource.trim())}`;
    }
    if (utmMedium.trim()) {
      url += `&utm_medium=${encodeURIComponent(utmMedium.trim())}`;
    }
    if (utmCampaign.trim()) {
      url += `&utm_campaign=${encodeURIComponent(utmCampaign.trim())}`;
    }
    setGeneratedLink(url);
  }, [baseUrl, referralCode, utmSource, utmMedium, utmCampaign]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: t('partners.linkCopied'),
        description: t('partners.linkCopiedDesc'),
      });
    } catch {
      toast({
        title: t('partners.error'),
        description: t('partners.copyFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleResetUtm = () => {
    setUtmSource('');
    setUtmMedium('');
    setUtmCampaign('');
    toast({
      title: t('partners.utmReset'),
    });
  };

  const handleShare = (platform: 'telegram' | 'whatsapp') => {
    const text = encodeURIComponent(t('partners.shareText'));
    const url = encodeURIComponent(generatedLink);

    if (platform === 'telegram') {
      window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
    }
  };

  const hasUtmParams = !!(utmSource || utmMedium || utmCampaign);

  const sourcePresets = [
    'telegram',
    'youtube',
    'instagram',
    'facebook',
    'blog',
    'email_newsletter',
  ];

  const referralClients = useMemo<PartnerClient[]>(
    () =>
      ((stats?.clients as PartnerClient[]) || []).filter(
        (client) => client.type === 'referral',
      ),
    [stats?.clients],
  );

  const totalClicks = stats?.total_clicks ?? 0;
  const registrations =
    stats?.funnel_registrations ?? referralClients.length ?? 0;
  const payingClients =
    stats?.funnel_paying_clients ??
    referralClients.filter((c) => c.subscription_status === 'active').length;

  const registrationsConversion =
    totalClicks > 0 ? Math.round((registrations / totalClicks) * 1000) / 10 : 0;
  const paymentsConversion =
    registrations > 0
      ? Math.round((payingClients / registrations) * 1000) / 10
      : 0;

  if (loading && !stats) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 md:p-6 border-b border-gray-100">
            <div className="h-5 w-48 bg-gray-200 rounded mb-2 animate-pulse" />
            <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="p-5 space-y-3">
            <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm"
            >
              <div className="h-4 w-24 bg-gray-200 rounded mb-3 animate-pulse" />
              <div className="h-7 w-16 bg-gray-200 rounded mb-2 animate-pulse" />
              <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="h-5 w-40 bg-gray-200 rounded mb-2 animate-pulse" />
            <div className="h-4 w-72 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="p-6 space-y-3">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="h-4 w-full bg-gray-100 rounded animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* QR modal */}
      {isQrModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsQrModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {t('partners.qrTitle')}
            </h3>
            <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-sm mb-6">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  generatedLink,
                )}`}
                alt="Referral QR Code"
                className="w-48 h-48"
              />
            </div>
            <p className="text-xs text-gray-500 text-center mb-6 px-4">
              {t('partners.qrDescription')}
            </p>
            <button
              onClick={() =>
                toast({
                  title: t('partners.qrDownloadTitle'),
                  description: t('partners.qrDownloadDesc'),
                })
              }
              className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold transition-colors"
            >
              <Download size={16} /> {t('partners.qrDownloadCta')}
            </button>
          </div>
        </div>
      )}

      {/* Реферальная ссылка */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 md:p-6 border-b border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {t('partners.referralLinkTitle')}
              </h3>
              <p className="text-gray-500 text-sm">
                {t('partners.referralLinkHint')}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleShare('telegram')}
                className="p-2 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors"
                title={t('partners.shareTelegramTitle')}
              >
                <Send size={18} />
              </button>
              <button
                onClick={() => handleShare('whatsapp')}
                className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                title={t('partners.shareWhatsAppTitle')}
              >
                <MessageCircle size={18} />
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600 font-mono break-all flex items-center gap-3 relative group">
              <LinkIcon size={16} className="text-gray-400 shrink-0" />
              <span className="truncate">{generatedLink}</span>
            </div>
            <div className="flex gap-2 sm:shrink-0">
              <button
                onClick={copyToClipboard}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold transition-colors shadow-sm partners_copy_link_usertour"
              >
                <Copy size={16} />
                {copied ? t('partners.copied') : t('partners.copy')}
              </button>
              <button
                onClick={() => setIsQrModalOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-lg text-slate-700 transition-colors"
                title={t('partners.qrShowTitle')}
              >
                <QrCode size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* UTM-конструктор */}
        <div className="bg-gray-50/50 px-5 py-3">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setShowUtmBuilder((v) => !v)}
              className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors partners_utm_toggle_usertour"
            >
              <Settings2 size={16} />
              {showUtmBuilder
                ? t('partners.utmHide')
                : t('partners.utmShow')}
              {showUtmBuilder ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>

            {showUtmBuilder && hasUtmParams && (
              <button
                onClick={handleResetUtm}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition-colors"
              >
                <RotateCcw size={12} /> {t('partners.utmResetButton')}
              </button>
            )}
          </div>

          {showUtmBuilder && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-200 pb-2">
              <div className="space-y-1 relative">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  {t('partners.utmSourceLabel')}
                </label>
                <input
                  type="text"
                  placeholder={t('partners.utmSourcePlaceholder')}
                  value={utmSource}
                  onChange={(e) => setUtmSource(e.target.value)}
                  list="utm-sources"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
                />
                <datalist id="utm-sources">
                  {sourcePresets.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
                <p className="text-[10px] text-gray-400">
                  {t('partners.utmSourceHint')}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  {t('partners.utmMediumLabel')}
                </label>
                <input
                  type="text"
                  placeholder={t('partners.utmMediumPlaceholder')}
                  value={utmMedium}
                  onChange={(e) => setUtmMedium(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
                />
                <p className="text-[10px] text-gray-400">
                  {t('partners.utmMediumHint')}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  {t('partners.utmCampaignLabel')}
                </label>
                <input
                  type="text"
                  placeholder={t('partners.utmCampaignPlaceholder')}
                  value={utmCampaign}
                  onChange={(e) => setUtmCampaign(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
                />
                <p className="text-[10px] text-gray-400">
                  {t('partners.utmCampaignHint')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Карточки статистики */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4 transition-all hover:shadow-md hover:border-blue-200 group">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <MousePointerClick size={24} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">
              {t('partners.statsClicks')}
            </p>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-2xl font-bold text-gray-900 leading-none">
                {totalClicks}
              </p>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 mb-0.5">
                <ArrowUpRight size={10} /> {registrationsConversion}%
              </span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              {t('partners.statsClicksLast30')}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4 transition-all hover:shadow-md hover:border-purple-200 group">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <UserPlus size={24} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">
              {t('partners.statsRegistrations')}
            </p>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-2xl font-bold text-gray-900 leading-none">
                {registrations}
              </p>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 mb-0.5">
                <ArrowUpRight size={10} /> {paymentsConversion}%
              </span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              {totalClicks > 0
                ? t('partners.statsFromClicks', {
                    value: registrationsConversion,
                  })
                : t('partners.statsFromClicksEmpty')}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4 transition-all hover:shadow-md hover:border-green-200 group">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <UserCheck size={24} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">
              {t('partners.statsActive')}
            </p>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-2xl font-bold text-gray-900 leading-none">
                {payingClients}
              </p>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 mb-0.5">
                —
              </span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              {registrations > 0
                ? t('partners.statsFromRegistrations', {
                    value: paymentsConversion,
                  })
                : t('partners.statsFromRegistrationsEmpty')}
            </p>
          </div>
        </div>
      </div>

      {/* Поиск по рефералам + таблица */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-lg font-bold text-gray-900">
          {t('partners.referralsListTitle')}
        </h2>
        <div className="relative w-full sm:w-72">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder={t('partners.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {t('partners.client') || 'Пользователь'}
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {t('partners.registrationDate') || 'Дата регистрации'}
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {t('partners.statusLabel') || 'Статус'}
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  {t('partners.income') || 'Доход'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {referralClients.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-6 text-sm text-gray-400 text-center"
                  >
                    {t('partners.noReferrals') || 'Пока нет рефералов'}
                  </td>
                </tr>
              )}
              {referralClients.slice(0, 20).map((client) => {
                const fullName = client.user_profiles.full_name || client.user_profiles.email;
                const initial =
                  fullName && fullName.trim().length > 0
                    ? fullName.trim()[0]?.toUpperCase()
                    : (client.user_profiles.email || '?')[0]?.toUpperCase();

                const statusLabel =
                  client.subscription_status === 'active'
                    ? t('partners.statusActive') || 'Активен'
                    : client.subscription_status === 'trialing'
                    ? t('partners.statusTrial') || 'Пробный период'
                    : client.subscription_status === 'expired'
                    ? t('partners.statusExpired') || 'Просрочена'
                    : t('partners.statusRegistered') || 'Зарегистрирован';

                const statusClass =
                  client.subscription_status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : client.subscription_status === 'trialing'
                    ? 'bg-purple-100 text-purple-800'
                    : client.subscription_status === 'expired'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-slate-100 text-slate-600';

                return (
                  <tr
                    key={client.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                          <span className="text-sm font-semibold">{initial}</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {fullName}
                          </div>
                          <div className="text-xs text-gray-400">
                            {client.utm_source
                              ? `Source: ${client.utm_source}`
                              : 'Source: Direct'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        {new Date(client.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-400">
                      {/* Доход по клиенту пока не считается отдельно */}
                      —
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 items-start">
        <div className="text-blue-500 mt-0.5">💡</div>
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">
            {t('partners.utmInfoTitle')}
          </p>
          <span>{t('partners.utmInfoText')}</span>
        </div>
      </div>
    </div>
  );
};


