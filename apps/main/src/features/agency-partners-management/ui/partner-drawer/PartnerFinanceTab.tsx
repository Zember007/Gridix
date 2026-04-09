import React from "react";
import { Button } from "@gridix/ui";
import type { AgencyPartner } from "@/entities/agency-partner";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  partner: AgencyPartner;
  onPayout: (partner: AgencyPartner) => void;
  readOnly?: boolean;
};

export const PartnerFinanceTab: React.FC<Props> = ({
  partner,
  onPayout,
  readOnly = false,
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-slate-900">
            {t("partners.drawer.commission")}
          </div>
          <div className="text-xs text-slate-500">
            {t("partners.drawer.commissionResetHint")}
          </div>
        </div>
        {!readOnly && (
          <Button
            type="button"
            onClick={() => onPayout(partner)}
            className="h-10 bg-amber-600 font-bold text-white shadow-sm transition-colors hover:bg-amber-700"
          >
            {t("partners.drawer.markAsPaid")}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-1 text-xs font-bold uppercase text-slate-400">
            {t("partners.drawer.pendingPayout")}
          </div>
          <div className="font-mono text-2xl font-black text-amber-600">
            ${partner.stats.commissionPending.toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-1 text-xs font-bold uppercase text-slate-400">
            {t("partners.drawer.paidOut")}
          </div>
          <div className="font-mono text-2xl font-black text-slate-900">
            ${partner.stats.commissionPaid.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};
