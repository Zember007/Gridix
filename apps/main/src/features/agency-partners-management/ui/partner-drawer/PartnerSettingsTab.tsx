import React from "react";
import type { AgencyPartner } from "@/entities/agency-partner";
import type { SignedContract } from "../../model/usePartnerDrawerData";
import { PartnerSettingsReviewSection } from "./PartnerSettingsReviewSection";
import { PartnerSettingsManagementSection } from "./PartnerSettingsManagementSection";
import { PartnerSettingsSignatureSection } from "./PartnerSettingsSignatureSection";
import { PartnerSettingsContractsSection } from "./PartnerSettingsContractsSection";

type Props = {
  partner: AgencyPartner;
  onUpdate: (id: string, data: Partial<AgencyPartner>) => void;
  rejectionReasonDraft: string;
  setRejectionReasonDraft: React.Dispatch<React.SetStateAction<string>>;
  agreementSignedAt?: string;
  signatureUrl: string | null;
  signedContracts: SignedContract[];
  signedContractsLoading: boolean;
};

export const PartnerSettingsTab: React.FC<Props> = ({
  partner,
  onUpdate,
  rejectionReasonDraft,
  setRejectionReasonDraft,
  agreementSignedAt,
  signatureUrl,
  signedContracts,
  signedContractsLoading,
}) => {
  return (
    <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <PartnerSettingsReviewSection
        partner={partner}
        onUpdate={onUpdate}
        rejectionReasonDraft={rejectionReasonDraft}
        setRejectionReasonDraft={setRejectionReasonDraft}
      />

      <PartnerSettingsManagementSection partner={partner} onUpdate={onUpdate} />

      <PartnerSettingsSignatureSection
        partner={partner}
        agreementSignedAt={agreementSignedAt}
        signatureUrl={signatureUrl}
      />

      <PartnerSettingsContractsSection
        signedContracts={signedContracts}
        signedContractsLoading={signedContractsLoading}
      />
    </div>
  );
};
