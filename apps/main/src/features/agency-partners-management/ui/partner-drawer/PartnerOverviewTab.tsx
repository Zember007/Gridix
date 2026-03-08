import React from "react";
import {
  AlertTriangle,
  Clock,
  CreditCard,
  Mail,
  Phone,
  User,
} from "lucide-react";
import type { AgencyPartner } from "@/entities/agency-partner";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  partner: AgencyPartner;
};

export const PartnerOverviewTab: React.FC<Props> = ({ partner }) => {
  const { t } = useLanguage();

  const bankDetailsItems = [
    {
      label: t("agentApplication.bankName"),
      value: partner.bankDetails?.bank_name ?? "—",
      mono: false,
    },
    {
      label: t("agentApplication.ibanLabel"),
      value: partner.bankDetails?.iban ?? "—",
      mono: true,
    },
    {
      label: t("agentApplication.billingCurrency"),
      value: partner.bankDetails?.billing_currency ?? "—",
      mono: false,
    },
    {
      label: t("agentApplication.isVatPayer"),
      value:
        typeof partner.bankDetails?.is_vat_payer === "boolean"
          ? partner.bankDetails.is_vat_payer
            ? t("common.yes")
            : t("common.no")
          : "—",
      mono: false,
    },
  ];

  const hasStructuredBankDetails = bankDetailsItems.some(
    (item) => item.value !== "—",
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
          <div className="mb-1 text-xs font-bold uppercase text-slate-400">
            {t("partners.drawer.sales")}
          </div>
          <div className="font-mono text-2xl font-black text-slate-900">
            ${(partner.stats.totalRevenue / 1000).toFixed(0)}k
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
          <div className="mb-1 text-xs font-bold uppercase text-slate-400">
            {t("partners.drawer.deals")}
          </div>
          <div className="font-mono text-2xl font-black text-slate-900">
            {partner.stats.closedDeals} / {partner.stats.activeDeals}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
          <div className="mb-1 text-xs font-bold uppercase text-slate-400">
            {t("partners.drawer.balance")}
          </div>
          <div className="font-mono text-2xl font-black text-amber-600">
            ${partner.stats.commissionPending.toLocaleString()}
          </div>
        </div>
      </div>

      {partner.status === "needs_correction" && (
        <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-orange-700">
              <AlertTriangle size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-orange-900">
                {t("partners.drawer.needsCorrection")}
              </div>
              <div className="mt-1 whitespace-pre-wrap text-xs text-orange-800">
                {partner.rejectionReason ? partner.rejectionReason : "—"}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-bold text-slate-900">
          {t("partners.drawer.contactsAndDetails")}
        </h3>
        <div className="grid grid-cols-2 gap-y-4 text-center text-sm">
          <div>
            <div className="mb-0.5 text-xs text-slate-500">
              {t("partners.drawer.contactPerson")}
            </div>
            <div className="flex items-center justify-center gap-2 font-medium">
              <User size={14} /> {partner.contactPerson}
            </div>
          </div>
          <div>
            <div className="mb-0.5 text-xs text-slate-500">
              {t("partners.drawer.phone")}
            </div>
            <div className="flex items-center justify-center gap-2 font-medium">
              <Phone size={14} /> {partner.phone}
            </div>
          </div>
          <div>
            <div className="mb-0.5 text-xs text-slate-500">
              {t("partners.drawer.email")}
            </div>
            <div className="flex items-center justify-center gap-2 font-medium">
              <Mail size={14} /> {partner.email}
            </div>
          </div>
          <div>
            <div className="mb-0.5 text-xs text-slate-500">
              {t("partners.drawer.registrationDate")}
            </div>
            <div className="flex items-center justify-center gap-2 font-medium">
              <Clock size={14} />{" "}
              {new Date(partner.joinedAt).toLocaleDateString()}
            </div>
          </div>
          <div className="col-span-2 mt-4 border-t border-slate-100 pt-4 text-left">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <CreditCard size={14} className="text-blue-500" />
              {t("partners.drawer.bankDetails")}
            </div>
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              {bankDetailsItems.map((item) => (
                <div key={item.label}>
                  <div className="mb-0.5 text-[10px] font-bold uppercase text-slate-400">
                    {item.label}
                  </div>
                  <div
                    className={`text-sm font-semibold text-slate-900 ${item.mono ? "font-mono" : ""}`}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
            {!hasStructuredBankDetails && (
              <div className="mt-2 text-xs text-slate-500">
                {partner.bankDetails?.details ||
                  t("partners.drawer.noBankDetails")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
