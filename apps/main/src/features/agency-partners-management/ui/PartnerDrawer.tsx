import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  FileText,
  X,
} from "lucide-react";
import type { AgencyPartner } from "@/entities/agency-partner";
import { Button } from "@gridix/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import { PartnerDrawerTabs, type PartnerDrawerTab } from "./PartnerDrawerTabs";
import { PartnerOverviewTab } from "./partner-drawer/PartnerOverviewTab";
import { PartnerLeadsTab } from "./partner-drawer/PartnerLeadsTab";
import { PartnerFinanceTab } from "./partner-drawer/PartnerFinanceTab";
import { PartnerSettingsTab } from "./partner-drawer/PartnerSettingsTab";
import { usePartnerDrawerData } from "../model/usePartnerDrawerData";

type Props = {
  partner: AgencyPartner | null;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<AgencyPartner>) => void;
  onPayout: (partner: AgencyPartner) => void;
  developerId?: string | null;
};

export const PartnerDrawer: React.FC<Props> = ({
  partner,
  onClose,
  onUpdate,
  onPayout,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<PartnerDrawerTab>("overview");
  const [leadsSearch, setLeadsSearch] = useState("");
  const [rejectionReasonDraft, setRejectionReasonDraft] = useState("");
  const partnerId = partner?.id ?? null;

  useEffect(() => {
    setRejectionReasonDraft(partner?.rejectionReason ?? "");
  }, [partnerId, partner?.rejectionReason]);

  const {
    partnerLeadsQuery,
    filteredPartnerLeads,
    applicationDetailsQuery,
    signatureUrl,
    signedContractsQuery,
  } = usePartnerDrawerData({ partnerId, activeTab, leadsSearch });

  if (!partner) return null;

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    pending: "bg-amber-100 text-amber-700",
    needs_correction: "bg-orange-100 text-orange-700",
    blocked: "bg-red-100 text-red-700",
  };

  const StatusIcon = {
    active: CheckCircle2,
    pending: Clock,
    needs_correction: AlertTriangle,
    blocked: Ban,
  }[partner.status];

  const tabLabels: Record<PartnerDrawerTab, string> = {
    overview: t("partners.drawer.tabOverview"),
    leads: t("partners.drawer.tabLeads"),
    finance: t("partners.drawer.tabFinance"),
    settings: t("partners.drawer.tabSettings"),
  };

  const statusLabel = t(`partners.drawer.status_${partner.status}`);
  const typeLabel =
    partner.type === "agency"
      ? t("partners.drawer.typeAgency")
      : t("partners.drawer.typePrivateBroker");

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-4xl flex-col border-l border-slate-200 bg-white shadow-2xl duration-300 animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50/50 p-6">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-bold shadow-sm ${partner.type === "agency" ? "bg-purple-100 text-purple-600" : "bg-[var(--admin-background-secondary)] text-[var(--admin-text-primary)]"}`}
            >
              {partner.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {partner.name}
              </h2>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold uppercase ${statusColors[partner.status] ?? ""}`}
                >
                  {StatusIcon && <StatusIcon size={12} />} {statusLabel}
                </span>
                <span className="text-sm text-slate-500">•</span>
                <span className="text-sm font-medium text-slate-500">
                  {typeLabel}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <PartnerDrawerTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabLabels={tabLabels}
        />

        <div className="custom-scrollbar flex-1 overflow-y-auto bg-slate-50 p-6">
          {activeTab === "overview" && <PartnerOverviewTab partner={partner} />}
          {activeTab === "leads" && (
            <PartnerLeadsTab
              isLoading={partnerLeadsQuery.isLoading}
              leads={partnerLeadsQuery.data ?? []}
              filteredLeads={filteredPartnerLeads}
              leadsSearch={leadsSearch}
              setLeadsSearch={setLeadsSearch}
            />
          )}
          {activeTab === "finance" && (
            <PartnerFinanceTab partner={partner} onPayout={onPayout} />
          )}
          {activeTab === "settings" && (
            <PartnerSettingsTab
              partner={partner}
              onUpdate={onUpdate}
              rejectionReasonDraft={rejectionReasonDraft}
              setRejectionReasonDraft={setRejectionReasonDraft}
              agreementSignedAt={
                applicationDetailsQuery.data?.agreement_signed_at
                  ? String(applicationDetailsQuery.data.agreement_signed_at)
                  : undefined
              }
              signatureUrl={signatureUrl}
              signedContracts={signedContractsQuery.data ?? []}
              signedContractsLoading={signedContractsQuery.isLoading}
            />
          )}
        </div>
      </div>
    </>
  );
};
