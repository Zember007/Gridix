import React from "react";
import { FileText } from "lucide-react";
import type { AgencyPartner } from "@/entities/agency-partner";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  partner: AgencyPartner;
  agreementSignedAt?: string;
  signatureUrl: string | null;
};

export const PartnerSettingsSignatureSection: React.FC<Props> = ({
  partner,
  agreementSignedAt,
  signatureUrl,
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-3 border-t border-slate-100 pt-6">
      <h4 className="text-sm font-bold text-slate-900">
        {t("partners.drawer.signatureAndContract")}
      </h4>
      <div className="flex items-center gap-3">
        <div
          className={`rounded-lg p-2 ${partner.agreementSigned ? "bg-[var(--admin-background-secondary)] text-[var(--admin-primary)]" : "bg-slate-100 text-slate-400"}`}
        >
          <FileText size={18} />
        </div>
        <div className="text-sm">
          <div className="font-bold text-slate-900">
            {partner.agreementSigned
              ? t("partners.drawer.contractAccepted")
              : t("partners.drawer.contractNotAccepted")}
          </div>
          <div className="text-xs text-slate-500">
            {agreementSignedAt
              ? `${t("partners.drawer.dateLabel")}: ${new Date(agreementSignedAt).toLocaleString()}`
              : "—"}
          </div>
        </div>
      </div>
      {signatureUrl ? (
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="mb-2 text-xs text-slate-500">
            {t("partners.drawer.signature")}
          </div>
          <img src={signatureUrl} alt="Signature" className="max-h-32 w-auto" />
        </div>
      ) : (
        <div className="text-xs text-slate-500">
          {t("partners.drawer.noSignature")}
        </div>
      )}
    </div>
  );
};
