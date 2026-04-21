import React, { useEffect, useState, useMemo } from "react";
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
} from "lucide-react";
import { useToast } from "@gridix/ui";
import { useLanguage } from "@gridix/utils/react";
import { usePartner } from "../queries/usePartner";
import { usePartnerStats } from "../queries/usePartnerStats";
import type { PartnerClient } from "../model/types";

// Вкладка «Рефералы» — адаптирована из gridix-dashboard PartnerReferralsPage.
// Вся статистика и переходы здесь моковые по умолчанию.

export const PartnerReferralsSection: React.FC = () => {
  const { toast } = useToast();
  const { language, t } = useLanguage();
  const { partnerProfile } = usePartner();
  const { stats, loading } = usePartnerStats();

  const [copied, setCopied] = useState(false);
  const [showUtmBuilder, setShowUtmBuilder] = useState(false);
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const referralCode = partnerProfile?.partner_code || "5cac1e45";
  const ssoBase = (import.meta as any).env?.VITE_SSO_URL as string | undefined;
  const baseOrigin =
    ssoBase && typeof ssoBase === "string" && ssoBase.length > 0
      ? ssoBase.replace(/\/$/, "")
      : window.location.origin;
  const baseUrl = `${baseOrigin}/${language}/auth/signup`;

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
        title: t("partners.linkCopied"),
        description: t("partners.linkCopiedDesc"),
      });
    } catch {
      toast({
        title: t("partners.error"),
        description: t("partners.copyFailed"),
        variant: "destructive",
      });
    }
  };

  const handleResetUtm = () => {
    setUtmSource("");
    setUtmMedium("");
    setUtmCampaign("");
    toast({
      title: t("partners.utmReset"),
    });
  };

  const handleShare = (platform: "telegram" | "whatsapp") => {
    const text = encodeURIComponent(t("partners.shareText"));
    const url = encodeURIComponent(generatedLink);

    if (platform === "telegram") {
      window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank");
    } else {
      window.open(`https://wa.me/?text=${text}%20${url}`, "_blank");
    }
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(generatedLink)}`;

  const handleQrDownload = async () => {
    try {
      const res = await fetch(qrImageUrl);
      if (!res.ok) throw new Error("Failed to fetch QR image");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "referral-qr.png";
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: t("partners.qrDownloadTitle"),
        description: t("partners.qrDownloadDesc"),
      });
    } catch {
      toast({
        title: t("partners.error"),
        description: t("partners.qrDownloadDesc"),
        variant: "destructive",
      });
    }
  };

  const hasUtmParams = !!(utmSource || utmMedium || utmCampaign);

  const sourcePresets = [
    "telegram",
    "youtube",
    "instagram",
    "facebook",
    "blog",
    "email_newsletter",
  ];

  const referralClients = useMemo<PartnerClient[]>(
    () =>
      ((stats?.clients as PartnerClient[]) || []).filter(
        (client) => client.type === "referral",
      ),
    [stats?.clients],
  );

  const totalClicks = stats?.total_clicks ?? 0;
  const registrations =
    stats?.funnel_registrations ?? referralClients.length ?? 0;
  const payingClients =
    stats?.funnel_paying_clients ??
    referralClients.filter((c) => c.subscription_status === "active").length;

  const registrationsConversion =
    totalClicks > 0 ? Math.round((registrations / totalClicks) * 1000) / 10 : 0;
  const paymentsConversion =
    registrations > 0
      ? Math.round((payingClients / registrations) * 1000) / 10
      : 0;

  if (loading && !stats) {
    return (
      <div className="animate-in fade-in space-y-6 duration-500">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-4 md:p-6">
            <div className="mb-2 h-5 w-48 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-64 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="space-y-3 p-4 md:p-5">
            <div className="h-10 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-10 w-full animate-pulse rounded bg-gray-100" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-6"
            >
              <div className="mb-3 h-4 w-24 animate-pulse rounded bg-gray-200" />
              <div className="mb-2 h-7 w-16 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-28 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-4">
            <div className="mb-2 h-5 w-40 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-72 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="space-y-3 p-4 md:p-6">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="h-4 w-full animate-pulse rounded bg-gray-100"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      {/* QR modal */}
      {isQrModalOpen && (
        <div
          className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm duration-200"
          onClick={() => setIsQrModalOpen(false)}
        >
          <div
            className="relative flex w-full max-w-sm flex-col items-center rounded-xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            <h3 className="mb-4 text-lg font-bold text-gray-900">
              {t("partners.qrTitle")}
            </h3>
            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <img
                src={qrImageUrl}
                alt="Referral QR Code"
                className="h-48 w-48"
              />
            </div>
            <p className="mb-6 px-4 text-center text-xs text-gray-500">
              {t("partners.qrDescription")}
            </p>
            <button
              onClick={handleQrDownload}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800"
            >
              <Download size={16} /> {t("partners.qrDownloadCta")}
            </button>
          </div>
        </div>
      )}

      {/* Реферальная ссылка */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-4 md:p-6">
          <div className="mb-4 flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
            <div>
              <h3 className="mb-1 text-lg font-bold text-gray-900">
                {t("partners.referralLinkTitle")}
              </h3>
              <p className="text-sm text-gray-500">
                {t("partners.referralLinkHint")}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleShare("telegram")}
                className="rounded-lg bg-blue-50 p-2 text-blue-500 transition-colors hover:bg-blue-100"
                title={t("partners.shareTelegramTitle")}
              >
                <Send size={18} />
              </button>
              <button
                onClick={() => handleShare("whatsapp")}
                className="rounded-lg bg-green-50 p-2 text-green-600 transition-colors hover:bg-green-100"
                title={t("partners.shareWhatsAppTitle")}
              >
                <MessageCircle size={18} />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="group relative flex flex-1 items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 font-mono text-sm break-all text-gray-600">
              <LinkIcon size={16} className="shrink-0 text-gray-400" />
              <span className="truncate">{generatedLink}</span>
            </div>
            <div className="flex gap-2 sm:shrink-0">
              <button
                onClick={copyToClipboard}
                className="partners_copy_link_usertour flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-slate-800 sm:flex-none"
              >
                <Copy size={16} />
                {copied ? t("partners.copied") : t("partners.copy")}
              </button>
              <button
                onClick={() => setIsQrModalOpen(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-slate-700 transition-colors hover:border-gray-300 hover:bg-gray-50 sm:flex-none"
                title={t("partners.qrShowTitle")}
              >
                <QrCode size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* UTM-конструктор */}
        <div className="bg-gray-50/50 px-4 py-3 md:px-5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowUtmBuilder((v) => !v)}
              className="partners_utm_toggle_usertour flex items-center gap-2 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
            >
              <Settings2 size={16} />
              {showUtmBuilder ? t("partners.utmHide") : t("partners.utmShow")}
              {showUtmBuilder ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>

            {showUtmBuilder && hasUtmParams && (
              <button
                onClick={handleResetUtm}
                className="flex items-center gap-1 text-xs text-slate-500 transition-colors hover:text-red-500"
              >
                <RotateCcw size={12} /> {t("partners.utmResetButton")}
              </button>
            )}
          </div>

          {showUtmBuilder && (
            <div className="animate-in slide-in-from-top-2 mt-4 grid grid-cols-1 gap-4 pb-2 duration-200 sm:grid-cols-3">
              <div className="relative space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  {t("partners.utmSourceLabel")}
                </label>
                <input
                  type="text"
                  placeholder={t("partners.utmSourcePlaceholder")}
                  value={utmSource}
                  onChange={(e) => setUtmSource(e.target.value)}
                  list="utm-sources"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm transition-all outline-none focus:border-blue-500"
                />
                <datalist id="utm-sources">
                  {sourcePresets.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
                <p className="text-[10px] text-gray-400">
                  {t("partners.utmSourceHint")}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  {t("partners.utmMediumLabel")}
                </label>
                <input
                  type="text"
                  placeholder={t("partners.utmMediumPlaceholder")}
                  value={utmMedium}
                  onChange={(e) => setUtmMedium(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm transition-all outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-gray-400">
                  {t("partners.utmMediumHint")}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  {t("partners.utmCampaignLabel")}
                </label>
                <input
                  type="text"
                  placeholder={t("partners.utmCampaignPlaceholder")}
                  value={utmCampaign}
                  onChange={(e) => setUtmCampaign(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm transition-all outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-gray-400">
                  {t("partners.utmCampaignHint")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Карточки статистики */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="group flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md md:p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110">
            <MousePointerClick size={24} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">
              {t("partners.statsClicks")}
            </p>
            <div className="mt-1 flex items-end gap-2">
              <p className="text-2xl leading-none font-bold text-gray-900">
                {totalClicks}
              </p>
              <span className="mb-0.5 flex items-center gap-0.5 rounded-md bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-600">
                <ArrowUpRight size={10} /> {registrationsConversion}%
              </span>
            </div>
            <p className="mt-1 text-[10px] text-gray-400">
              {t("partners.statsClicksLast30")}
            </p>
          </div>
        </div>

        <div className="group flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-purple-200 hover:shadow-md md:p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 transition-transform group-hover:scale-110">
            <UserPlus size={24} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">
              {t("partners.statsRegistrations")}
            </p>
            <div className="mt-1 flex items-end gap-2">
              <p className="text-2xl leading-none font-bold text-gray-900">
                {registrations}
              </p>
              <span className="mb-0.5 flex items-center gap-0.5 rounded-md bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-600">
                <ArrowUpRight size={10} /> {paymentsConversion}%
              </span>
            </div>
            <p className="mt-1 text-[10px] text-gray-400">
              {totalClicks > 0
                ? t("partners.statsFromClicks", {
                    value: registrationsConversion,
                  })
                : t("partners.statsFromClicksEmpty")}
            </p>
          </div>
        </div>

        <div className="group flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-green-200 hover:shadow-md md:p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600 transition-transform group-hover:scale-110">
            <UserCheck size={24} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">
              {t("partners.statsActive")}
            </p>
            <div className="mt-1 flex items-end gap-2">
              <p className="text-2xl leading-none font-bold text-gray-900">
                {payingClients}
              </p>
              <span className="mb-0.5 flex items-center gap-0.5 rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500">
                —
              </span>
            </div>
            <p className="mt-1 text-[10px] text-gray-400">
              {registrations > 0
                ? t("partners.statsFromRegistrations", {
                    value: paymentsConversion,
                  })
                : t("partners.statsFromRegistrationsEmpty")}
            </p>
          </div>
        </div>
      </div>

      {/* Поиск по рефералам + таблица */}
      <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row">
        <h2 className="text-lg font-bold text-gray-900">
          {t("partners.referralsListTitle")}
        </h2>
        <div className="relative w-full sm:w-72">
          <Search
            size={18}
            className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder={t("partners.searchPlaceholder")}
            className="w-full rounded-lg border border-gray-200 py-2 pr-4 pl-10 text-sm transition-all outline-none focus:border-black focus:ring-1 focus:ring-black"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  {t("partners.client") || "Пользователь"}
                </th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  {t("partners.registrationDate") || "Дата регистрации"}
                </th>
                <th className="px-6 py-4 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  {t("partners.statusLabel") || "Статус"}
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  {t("partners.income") || "Доход"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {referralClients.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-6 text-center text-sm text-gray-400"
                  >
                    {t("partners.noReferrals") || "Пока нет рефералов"}
                  </td>
                </tr>
              )}
              {referralClients.slice(0, 20).map((client) => {
                const fullName =
                  client.user_profiles.full_name || client.user_profiles.email;
                const initial =
                  fullName && fullName.trim().length > 0
                    ? fullName.trim()[0]?.toUpperCase()
                    : (client.user_profiles.email || "?")[0]?.toUpperCase();

                const statusLabel =
                  client.subscription_status === "active"
                    ? t("partners.statusActive") || "Активен"
                    : client.subscription_status === "trialing"
                      ? t("partners.statusTrial") || "Пробный период"
                      : client.subscription_status === "expired"
                        ? t("partners.statusExpired") || "Просрочена"
                        : t("partners.statusRegistered") || "Зарегистрирован";

                const statusClass =
                  client.subscription_status === "active"
                    ? "bg-green-100 text-green-800"
                    : client.subscription_status === "trialing"
                      ? "bg-purple-100 text-purple-800"
                      : client.subscription_status === "expired"
                        ? "bg-red-100 text-red-800"
                        : "bg-slate-100 text-slate-600";

                return (
                  <tr
                    key={client.id}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                          <span className="text-sm font-semibold">
                            {initial}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {fullName}
                          </div>
                          <div className="text-xs text-gray-400">
                            {client.utm_source
                              ? `Source: ${client.utm_source}`
                              : "Source: Direct"}
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
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-400">
                      {/* Доход по клиенту пока не считается отдельно */}—
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
        <div className="mt-0.5 text-blue-500">💡</div>
        <div className="text-sm text-blue-800">
          <p className="mb-1 font-semibold">{t("partners.utmInfoTitle")}</p>
          <span>{t("partners.utmInfoText")}</span>
        </div>
      </div>
    </div>
  );
};
