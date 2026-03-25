import React from "react";
import {
  LayoutList,
  Link as LinkIcon,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Button, Input } from "@gridix/ui";
import type { PartnerFilter } from "@/entities/agency-partner";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  activeTab: "list" | "conditions";
  setActiveTab: React.Dispatch<React.SetStateAction<"list" | "conditions">>;
  setIsInviteModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  filters: PartnerFilter;
  setFilters: React.Dispatch<React.SetStateAction<PartnerFilter>>;
  pendingRequests: number;
};

export const AgencyPartnersHeader: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  setIsInviteModalOpen,
  filters,
  setFilters,
  pendingRequests,
}) => {
  const { t } = useLanguage();

  return (
    <>
      <div className="relative">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {t("partners.agencyNetwork")}
            </h1>
            <p className="mt-1 max-w-[700px] text-sm text-slate-500">
              {t("partners.agencyNetworkSubtitle")}
            </p>
          </div>

          {activeTab === "list" ? (
            <div className="flex flex-wrap items-center gap-3">
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

              <Button
                onClick={() => setIsInviteModalOpen(true)}
                className="flex h-10 items-center gap-2 bg-[var(--admin-primary)] px-4 font-bold text-[var(--admin-text-on-primary)] shadow-sm hover:bg-[var(--admin-primary-hover)] active:bg-[var(--admin-primary-active)]"
              >
                <LinkIcon size={18} /> {t("partners.invite")}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setIsInviteModalOpen(true)}
                className="flex h-10 items-center gap-2 bg-[var(--admin-primary)] px-4 font-bold text-[var(--admin-text-on-primary)] shadow-sm hover:bg-[var(--admin-primary-hover)] active:bg-[var(--admin-primary-active)]"
              >
                <LinkIcon size={18} /> {t("partners.invite")}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="sticky top-[72px] z-10 mt-6 border-b border-slate-200 bg-white">
        <div className="no-scrollbar flex gap-6 overflow-x-auto">
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
