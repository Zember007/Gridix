import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  status: string;
};

export const PartnerStatusBadge: React.FC<Props> = ({ status }) => {
  const { t } = useLanguage();
  const styles =
    {
      active: "bg-green-50 text-green-700 ring-green-600/20",
      pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
      blocked: "bg-red-50 text-red-700 ring-red-600/20",
      needs_correction: "bg-orange-50 text-orange-700 ring-orange-600/20",
    }[status] || "bg-slate-50 text-slate-700 ring-slate-600/20";

  const label =
    status === "active"
      ? t("partners.status.approved")
      : status === "pending"
        ? t("partners.status.pending")
        : status === "needs_correction"
          ? t("partners.status.needsCorrection")
          : status === "blocked"
            ? t("partners.status.blocked")
            : status;

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles}`}
    >
      {label}
    </span>
  );
};
