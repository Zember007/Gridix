import React from "react";
import { Download, FileText } from "lucide-react";
import type { SignedContract } from "../../model/usePartnerDrawerData";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  signedContracts: SignedContract[];
  signedContractsLoading: boolean;
};

export const PartnerSettingsContractsSection: React.FC<Props> = ({
  signedContracts,
  signedContractsLoading,
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-3 border-t border-slate-100 pt-6">
      <h4 className="text-sm font-bold text-slate-900">
        {t("partners.drawer.signedContracts")}
      </h4>
      {signedContractsLoading && (
        <div className="text-xs text-slate-500">
          {t("partners.drawer.loadingContracts")}
        </div>
      )}
      {!signedContractsLoading && signedContracts.length === 0 && (
        <div className="text-xs text-slate-500">
          {t("partners.drawer.noSignedContracts")}
        </div>
      )}
      {!signedContractsLoading &&
        signedContracts.map((sc, idx) => {
          const signedDate = sc.signed_at
            ? new Date(sc.signed_at).toLocaleString()
            : "—";
          const lang = sc.template_lang ? sc.template_lang.toUpperCase() : null;
          const isPdf = sc.signed_contract_mime === "application/pdf";
          const label = lang
            ? `${t("partners.drawer.contract")} (${lang})`
            : `${t("partners.drawer.contract")} ${idx + 1}`;

          const signedDownloadUrl =
            sc.signed_download_url ?? sc.signed_contract_path;

          return (
            <div
              key={sc.id}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3"
            >
              <div className="rounded-lg bg-[var(--admin-background-secondary)] p-2 text-[var(--admin-primary)]">
                <FileText size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-slate-900">
                  {label}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                    {isPdf ? "PDF" : "DOCX"}
                  </span>
                  {signedDate}
                </div>
              </div>
              {signedDownloadUrl && (
                <a
                  href={signedDownloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg p-2 text-[var(--admin-primary)] transition-colors hover:bg-[var(--admin-background-secondary)]"
                  title={t("partners.drawer.downloadContract")}
                >
                  <Download size={16} />
                </a>
              )}
            </div>
          );
        })}
    </div>
  );
};
