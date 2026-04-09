import React from "react";
import { Ban } from "lucide-react";
import { Button } from "@gridix/ui";
import type { AgencyPartner } from "@/entities/agency-partner";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  partner: AgencyPartner;
  onUpdate: (id: string, data: Partial<AgencyPartner>) => void;
  readOnly?: boolean;
};

export const PartnerSettingsManagementSection: React.FC<Props> = ({
  partner,
  onUpdate,
  readOnly = false,
}) => {
  const { t } = useLanguage();

  return (
    <>
      <div className="border-t border-slate-100 pt-6">
        <h4 className="mb-4 text-sm font-bold text-slate-900">
          {t("partners.drawer.agentManagement")}
        </h4>
        {!readOnly && (
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                onUpdate(partner.id, {
                  status: partner.status === "blocked" ? "pending" : "blocked",
                  rejectionReason:
                    partner.status === "blocked"
                      ? undefined
                      : partner.rejectionReason,
                })
              }
              className="flex items-center gap-2 font-bold"
            >
              <Ban size={16} />{" "}
              {partner.status === "blocked"
                ? t("partners.drawer.unblock")
                : t("partners.drawer.block")}
            </Button>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 pt-6">
        <h4 className="mb-2 text-sm font-bold text-slate-900">
          {t("partners.drawer.projectAccess")}
        </h4>
        <div className="text-sm text-slate-600">
          {t("partners.drawer.projectAccessDescription")}
        </div>
      </div>
    </>
  );
};
