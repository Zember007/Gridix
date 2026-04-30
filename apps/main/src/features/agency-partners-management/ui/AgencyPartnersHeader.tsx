import React from "react";
import {
  FileDown,
  LayoutList,
  Link as LinkIcon,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Button, Input, PageHeader } from "@gridix/ui";
import type { AgencyPartner, PartnerFilter } from "@/entities/agency-partner";
import { useLanguage } from "@/contexts/LanguageContext";
import { exportAgencyPartnersXLSX } from "../lib/export-agency-partners-xlsx";

type Props = {
  activeTab: "list" | "conditions";
  setActiveTab: React.Dispatch<React.SetStateAction<"list" | "conditions">>;
  setIsInviteModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  filters: PartnerFilter;
  setFilters: React.Dispatch<React.SetStateAction<PartnerFilter>>;
  pendingRequests: number;
  partners: AgencyPartner[];
  partnersLoading: boolean;
  readOnly?: boolean;
};

export const AgencyPartnersHeader: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  setIsInviteModalOpen,
  filters,
  setFilters,
  pendingRequests,
  partners,
  partnersLoading,
  readOnly = false,
}) => {
  const { t } = useLanguage();

  const handleExport = () => exportAgencyPartnersXLSX(partners, t);

  const headerActions =
    activeTab === "list" ? (
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full md:w-[340px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <Input
            placeholder={t("partners.searchPlaceholder")}
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            className="h-10 border-slate-200 bg-white pl-10"
          />
        </div>

        {!readOnly && (
          <Button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex h-10 items-center gap-2 bg-[var(--admin-primary)] px-4 font-bold text-[var(--admin-text-on-primary)] shadow-sm hover:bg-[var(--admin-primary-hover)] active:bg-[var(--admin-primary-active)]"
          >
            <LinkIcon size={18} /> {t("partners.invite")}
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={partnersLoading || partners.length === 0}
          className="h-10 shrink-0 gap-2 border-slate-200 bg-white px-4 font-bold text-slate-900 hover:bg-slate-50"
        >
          <FileDown size={16} />
          {t("partners.agencyExport.exportBtn")}
        </Button>
      </div>
    ) : (
      <div className="flex flex-wrap items-center gap-3">
        {!readOnly && (
          <Button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex h-10 items-center gap-2 bg-[var(--admin-primary)] px-4 font-bold text-[var(--admin-text-on-primary)] shadow-sm hover:bg-[var(--admin-primary-hover)] active:bg-[var(--admin-primary-active)]"
          >
            <LinkIcon size={18} /> {t("partners.invite")}
          </Button>
        )}
      </div>
    );

  return (
    <>
      <PageHeader
        title={t("partners.agencyNetwork")}
        description={t("partners.agencyNetworkDesc")}
        actions={headerActions}
      />

      <div className="z-10 mt-6 rounded-lg border-b border-slate-200 bg-white">
        <div className="no-scrollbar flex gap-6 overflow-x-auto px-4">
          <button
            onClick={() => {
              setActiveTab("list");
              setFilters((f) => ({ ...f, status: "all" }));
            }}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 py-3 text-sm font-bold transition-colors ${activeTab === "list" ? "border-[var(--admin-primary)] text-[var(--admin-primary)]" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            <LayoutList size={16} /> {t("partners.tabs.list")}
            {pendingRequests > 0 && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setFilters((prev) => ({
                    ...prev,
                    status: prev.status === "pending" ? "all" : "pending",
                  }));
                  setActiveTab("list");
                }}
                className={`cursor-pointer rounded-full px-1.5 py-0.5 text-[10px] transition-transform hover:scale-105 ${filters.status === "pending" ? "bg-amber-500 text-white" : "bg-amber-100 text-amber-700"}`}
                title={t("partners.showPendingOnly")}
              >
                {pendingRequests}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("conditions")}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 py-3 text-sm font-bold transition-colors ${activeTab === "conditions" ? "border-[var(--admin-primary)] text-[var(--admin-primary)]" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            <ShieldCheck size={16} /> {t("partners.tabs.conditions")}
          </button>
        </div>
      </div>
    </>
  );
};
