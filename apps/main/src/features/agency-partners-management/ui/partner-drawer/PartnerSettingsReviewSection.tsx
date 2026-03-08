import React from "react";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@gridix/ui";
import type { AgencyPartner } from "@/entities/agency-partner";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  partner: AgencyPartner;
  onUpdate: (id: string, data: Partial<AgencyPartner>) => void;
  rejectionReasonDraft: string;
  setRejectionReasonDraft: React.Dispatch<React.SetStateAction<string>>;
};

export const PartnerSettingsReviewSection: React.FC<Props> = ({
  partner,
  onUpdate,
  rejectionReasonDraft,
  setRejectionReasonDraft,
}) => {
  const { t } = useLanguage();

  return (
    <div>
      <h4 className="mb-3 text-sm font-bold text-slate-900">
        {t("partners.drawer.applicationReview")}
      </h4>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={() => onUpdate(partner.id, { status: "active" })}
          className="bg-green-600 font-bold text-white hover:bg-green-700"
        >
          <CheckCircle2 size={16} /> {t("partners.drawer.activate")}
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            onUpdate(partner.id, {
              status: "pending",
              rejectionReason: undefined,
            })
          }
          className="font-bold"
        >
          <Clock size={16} /> {t("partners.drawer.returnToPending")}
        </Button>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-bold text-slate-700">
          {t("partners.drawer.correctionReasonLabel")}
        </label>
        <textarea
          value={rejectionReasonDraft}
          onChange={(e) => setRejectionReasonDraft(e.target.value)}
          rows={3}
          className="focus:ring-[var(--admin-primary)]/20 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2"
          placeholder={t("partners.drawer.correctionReasonPlaceholder")}
        />
        <div className="mt-2 flex gap-3">
          <Button
            variant="outline"
            onClick={() =>
              onUpdate(partner.id, {
                status: "needs_correction",
                rejectionReason: rejectionReasonDraft,
              })
            }
            className="font-bold"
          >
            <AlertTriangle size={16} /> {t("partners.drawer.sendForCorrection")}
          </Button>
        </div>
      </div>
    </div>
  );
};
