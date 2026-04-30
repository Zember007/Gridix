import React from "react";
import { ArrowUpDown, MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Skeleton,
} from "@gridix/ui";
import type { AgencyPartner, PartnerFilter } from "@/entities/agency-partner";
import { PartnerStatusBadge } from "@/entities/agency-partner";
import { UserAvatar } from "@/shared/ui/UserAvatar";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  partners: AgencyPartner[];
  filters: PartnerFilter;
  handleStatusFilterCycle: () => void;
  setSelectedPartner: (partner: AgencyPartner | null) => void;
  setPayoutTarget: (partner: AgencyPartner | null) => void;
  setPartnerToDelete: (partner: AgencyPartner | null) => void;
  approvePartner: (id: string) => Promise<void>;
  updatePartnerStatus: (
    id: string,
    status: AgencyPartner["status"],
    rejectionReason?: string,
  ) => Promise<void>;
  isManagerMode: boolean;
  readOnly?: boolean;
  loading?: boolean;
};

export const AgencyPartnersTable: React.FC<Props> = ({
  partners,
  filters,
  handleStatusFilterCycle,
  setSelectedPartner,
  setPayoutTarget,
  setPartnerToDelete,
  approvePartner,
  updatePartnerStatus,
  isManagerMode,
  readOnly = false,
  loading = false,
}) => {
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">{t("partners.table.agent")}</th>
                <th className="px-6 py-4">{t("partners.table.status")}</th>
                <th className="px-6 py-4 text-center">
                  {t("partners.table.rate")}
                </th>
                <th className="px-6 py-4 text-right">
                  {t("partners.table.leads")}
                </th>
                <th className="px-6 py-4 text-right">
                  {t("partners.table.balance")}
                </th>
                {!readOnly && <th className="w-12 px-6 py-4" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                      <div className="min-w-0 space-y-2">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-48 max-w-full" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Skeleton className="mx-auto h-7 w-12" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Skeleton className="ml-auto h-4 w-8" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Skeleton className="ml-auto h-4 w-16" />
                  </td>
                  {!readOnly && (
                    <td className="px-6 py-4 text-center">
                      <Skeleton className="mx-auto h-8 w-8 rounded-lg" />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (partners.length === 0) {
    return (
      <div className="text-sm text-slate-500">{t("partners.noPartners")}</div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-4">{t("partners.table.agent")}</th>
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
              {!readOnly && <th className="w-12 px-6 py-4"></th>}
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
                    <UserAvatar name={p.name} className="h-9 w-9 text-xs" />
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
                  <PartnerStatusBadge status={p.status} />
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
                {!readOnly && (
                  <td
                    className="px-6 py-4 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
                        >
                          <span className="sr-only">Actions</span>
                          <MoreHorizontal className="size-5" aria-hidden />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        {(p.status === "pending" ||
                          p.status === "needs_correction") && (
                          <DropdownMenuItem
                            onClick={() => approvePartner(p.id)}
                            className="font-bold text-green-600"
                          >
                            {t("partners.actions.approve")}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => setPayoutTarget(p)}>
                          {t("partners.actions.payout")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            updatePartnerStatus(
                              p.id,
                              p.status === "blocked" ? "pending" : "blocked",
                            )
                          }
                          className="text-red-600"
                        >
                          {p.status === "blocked"
                            ? t("partners.actions.unblock")
                            : t("partners.actions.block")}
                        </DropdownMenuItem>
                        {!isManagerMode && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setPartnerToDelete(p);
                            }}
                            className="text-red-600 focus:bg-red-50 focus:text-red-700"
                          >
                            <Trash2 className="mr-2 size-4" />
                            {t("partners.actions.delete")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
