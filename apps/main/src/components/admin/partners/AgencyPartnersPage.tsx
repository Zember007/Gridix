import React, { useMemo, useState } from "react";
import {
  ArrowUpDown,
  DollarSign,
  Handshake,
  LayoutList,
  Link as LinkIcon,
  MoreHorizontal,
  Search,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { useAgencyPartners } from "./useAgencyPartners";
import { PartnerInviteModal } from "./PartnerInviteModal";
import { PartnerDrawer } from "./PartnerDrawer";
import { PartnerPayoutModal } from "./PartnerPayoutModal";
import { AgencyGeneralConditions } from "./AgencyGeneralConditions";
import { AgencyPartner } from "./types";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
} from "@gridix/ui";
import { UserAvatar } from "@/components/admin/UserAvatar";
import { useLanguage } from "@/contexts/LanguageContext";

export const AgencyPartnersPage: React.FC = () => {
  const { t } = useLanguage();
  const {
    partners,
    filters,
    setFilters,
    approvePartner,
    updatePartnerStatus,
    updatePartnerCommission,
    markPaid,
    stats,
    developerId,
  } = useAgencyPartners();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<AgencyPartner | null>(
    null,
  );
  const [payoutTarget, setPayoutTarget] = useState<AgencyPartner | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "conditions">("list");

  const handleStatusFilterCycle = () => {
    const cycle: Array<NonNullable<typeof filters.status>> = [
      "all",
      "pending",
      "needs_correction",
      "active",
      "blocked",
    ];
    const current = (filters.status ?? "all") as NonNullable<
      typeof filters.status
    >;
    const currentIndex = cycle.indexOf(current);
    const next = cycle[(currentIndex + 1) % cycle.length] ?? "all";
    setFilters((prev) => ({ ...prev, status: next }));
  };

  const StatusBadge = ({ status }: { status: string }) => {
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

  const handlePartnerUpdate = (id: string, data: Partial<AgencyPartner>) => {
    if (data.commissionRate) updatePartnerCommission(id, data.commissionRate);
    if (data.status) {
      const nextStatus = data.status as AgencyPartner["status"];
      const current = selectedPartner?.id === id ? selectedPartner : null;
      if (
        nextStatus === "active" &&
        (current?.status === "pending" ||
          current?.status === "needs_correction")
      ) {
        approvePartner(id);
      } else {
        updatePartnerStatus(
          id,
          nextStatus,
          nextStatus === "needs_correction" ? data.rejectionReason : undefined,
        );
      }
    }
  };

  return (
    <div className="flex flex-col">
      <PartnerInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
      <PartnerPayoutModal
        isOpen={!!payoutTarget}
        onClose={() => setPayoutTarget(null)}
        partner={payoutTarget}
        onPayout={async (_amount) => {
          // MVP: we mark all pending payouts as paid (existing behavior)
          if (!payoutTarget) return;
          await markPaid(payoutTarget.id);
        }}
      />

      <PartnerDrawer
        partner={selectedPartner}
        onClose={() => setSelectedPartner(null)}
        onUpdate={handlePartnerUpdate}
        onPayout={(partner: AgencyPartner) => {
          setSelectedPartner(null);
          setPayoutTarget(partner);
        }}
        developerId={developerId}
      />

      <div className="relative">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {t("partners.title")}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {t("partners.subtitle")}
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

              {/*          <Popover open={isFilterPanelOpen} onOpenChange={setIsFilterPanelOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="font-bold flex items-center gap-2">
                                        <Filter size={16} />
                                        {t('partners.filters')}
                                        {activeFiltersCount > 0 ? (
                                            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--admin-primary)] text-[var(--admin-text-on-primary)]">
                                                {activeFiltersCount}
                                            </span>
                                        ) : null}
                                    </Button>
                                </PopoverTrigger>
                                <PartnerFiltersPanel
                                    filters={filters}
                                    setFilters={setFilters}
                                    onClose={() => setIsFilterPanelOpen(false)}
                                />
                            </Popover> */}

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
            {stats.pendingRequests > 0 && (
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
                {stats.pendingRequests}
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

      <div className="flex-1">
        <div className="py-6">
          {activeTab === "list" && (
            <>
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="rounded-lg bg-slate-100 p-3 text-[var(--admin-primary)]">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500">
                      {t("partners.stats.totalPartners")}
                    </p>
                    <p className="text-xl font-bold text-slate-900">
                      {stats.totalPartners}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="rounded-lg bg-green-50 p-3 text-green-600">
                    <Handshake size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500">
                      {t("partners.stats.active")}
                    </p>
                    <p className="text-xl font-bold text-slate-900">
                      {stats.activePartners}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="rounded-lg bg-purple-50 p-3 text-purple-600">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500">
                      {t("partners.stats.salesVolume")}
                    </p>
                    <p className="text-xl font-bold text-slate-900">
                      ${(stats.totalSalesVolume / 1000000).toFixed(1)}M
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="rounded-lg bg-amber-50 p-3 text-amber-600">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500">
                      {t("partners.stats.pendingPayout")}
                    </p>
                    <p className="text-xl font-bold text-slate-900">
                      ${stats.totalPendingCommission.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {partners.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-6 py-4">
                            {t("partners.table.agent")}
                          </th>
                          <th
                            className="group cursor-pointer px-6 py-4 transition-colors hover:bg-slate-100"
                            onClick={handleStatusFilterCycle}
                            title={t("partners.clickToFilter")}
                          >
                            <div className="flex items-center gap-1">
                              {t("partners.table.status")}
                              <ArrowUpDown
                                size={12}
                                className={`text-slate-400 ${filters.status !== "all" ? "text-[var(--admin-primary)]" : "opacity-0 group-hover:opacity-100"}`}
                              />
                              {filters.status !== "all" && (
                                <span className="rounded bg-slate-200 px-1.5 text-[9px] text-slate-700">
                                  {String(filters.status).slice(0, 3)}
                                </span>
                              )}
                            </div>
                          </th>
                          <th className="px-6 py-4 text-center">
                            {t("partners.table.rate")}
                          </th>
                          <th className="px-6 py-4 text-right">
                            {t("partners.table.leads")}
                          </th>
                          <th className="px-6 py-4 text-right">
                            {t("partners.table.balance")}
                          </th>
                          <th className="w-12 px-6 py-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {partners.map((p) => (
                          <tr
                            key={p.id}
                            onClick={() => setSelectedPartner(p)}
                            className="group cursor-pointer transition-colors hover:bg-slate-50"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <UserAvatar
                                  name={p.name}
                                  className="h-9 w-9 text-xs"
                                />
                                <div className="min-w-0">
                                  <div className="truncate font-bold text-slate-900 transition-colors group-hover:text-[var(--admin-primary)]">
                                    {p.name}
                                  </div>
                                  <div className="truncate text-xs text-slate-500">
                                    {p.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge status={p.status} />
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-700">
                                {p.commissionRate}%
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="font-medium text-slate-900">
                                {p.stats.totalLeads}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="font-mono font-bold text-slate-900">
                                ${p.stats.commissionPending.toLocaleString()}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {t("partners.table.accrued")}
                              </div>
                            </td>
                            <td
                              className="px-6 py-4 text-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600">
                                    <span className="sr-only">Actions</span>
                                    <MoreHorizontal
                                      className="size-5"
                                      aria-hidden
                                    />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-56"
                                >
                                  {(p.status === "pending" ||
                                    p.status === "needs_correction") && (
                                    <DropdownMenuItem
                                      onClick={() => approvePartner(p.id)}
                                      className="font-bold text-green-600"
                                    >
                                      {t("partners.actions.approve")}
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setPayoutTarget(p);
                                    }}
                                  >
                                    {t("partners.actions.payout")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      updatePartnerStatus(
                                        p.id,
                                        p.status === "blocked"
                                          ? "pending"
                                          : "blocked",
                                      )
                                    }
                                    className="text-red-600"
                                  >
                                    {p.status === "blocked"
                                      ? t("partners.actions.unblock")
                                      : t("partners.actions.block")}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500">
                  {t("partners.noPartners")}
                </div>
              )}
            </>
          )}

          {activeTab === "conditions" && <AgencyGeneralConditions />}
        </div>
      </div>
    </div>
  );
};
