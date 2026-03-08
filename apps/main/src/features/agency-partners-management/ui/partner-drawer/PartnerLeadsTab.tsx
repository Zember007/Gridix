import React from "react";
import { Mail, Phone, Search } from "lucide-react";
import { Input } from "@gridix/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import type { PartnerLeadRow } from "../../model/usePartnerDrawerData";

type Props = {
  isLoading: boolean;
  leads: PartnerLeadRow[];
  filteredLeads: PartnerLeadRow[];
  leadsSearch: string;
  setLeadsSearch: React.Dispatch<React.SetStateAction<string>>;
};

export const PartnerLeadsTab: React.FC<Props> = ({
  isLoading,
  leads,
  filteredLeads,
  leadsSearch,
  setLeadsSearch,
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center">
          <div>
            <div className="text-sm font-bold text-slate-900">
              {t("partners.drawer.partnerLeads")}
            </div>
            <div className="text-xs text-slate-500">
              {t("partners.drawer.totalLeads")}:{" "}
              <span className="font-mono font-bold text-slate-700">
                {leads.length}
              </span>
            </div>
          </div>
          <div className="relative w-full md:max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <Input
              placeholder={t("partners.drawer.searchLeadsPlaceholder")}
              value={leadsSearch}
              onChange={(e) => setLeadsSearch(e.target.value)}
              className="h-10 border-slate-200 bg-slate-50 pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">{t("partners.drawer.thClient")}</th>
                <th className="px-6 py-4">{t("partners.drawer.thProject")}</th>
                <th className="px-6 py-4">
                  {t("partners.drawer.thApartment")}
                </th>
                <th className="px-6 py-4">{t("partners.drawer.thStatus")}</th>
                <th className="px-6 py-4 text-right">
                  {t("partners.drawer.thDate")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-slate-400"
                  >
                    {t("partners.drawer.loadingLeads")}
                  </td>
                </tr>
              )}

              {!isLoading && filteredLeads.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-slate-400"
                  >
                    {t("partners.drawer.noLeadsFound")}
                  </td>
                </tr>
              )}

              {!isLoading &&
                filteredLeads.map((l) => {
                  const rec = l as Record<string, unknown>;
                  const projectObj =
                    rec.projects && typeof rec.projects === "object"
                      ? (rec.projects as Record<string, unknown>)
                      : null;
                  const projectName = String(projectObj?.name ?? "—");
                  const apt =
                    rec.apartments && typeof rec.apartments === "object"
                      ? (rec.apartments as Record<string, unknown>)
                      : null;
                  const apartmentLabel = apt?.apartment_number
                    ? `#${String(apt.apartment_number)}${apt?.area ? ` (${String(apt.area)} m²)` : ""}`
                    : "—";
                  const status = (l.pipeline_stage_id ??
                    l.status ??
                    "—") as string;
                  const date = l.created_at
                    ? new Date(l.created_at).toLocaleDateString()
                    : "—";

                  return (
                    <tr
                      key={l.id}
                      className="transition-colors hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <div className="min-w-0">
                          <div className="max-w-[240px] truncate text-sm font-bold text-slate-900">
                            {l.name || t("partners.drawer.noName")}
                          </div>
                          <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <Phone size={12} className="text-slate-400" />{" "}
                              {l.phone || "—"}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Mail size={12} className="text-slate-400" />{" "}
                              {l.email || "—"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {projectName}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {apartmentLabel}
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-sm text-slate-700">
                        {date}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
