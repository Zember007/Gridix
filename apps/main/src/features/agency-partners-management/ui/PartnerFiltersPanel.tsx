import React, { useMemo } from "react";
import {
  Button,
  Input,
  PopoverContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gridix/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import type { PartnerFilter } from "@/entities/agency-partner";

interface Props {
  filters: PartnerFilter;
  setFilters: React.Dispatch<React.SetStateAction<PartnerFilter>>;
  onClose: () => void;
}

export function PartnerFiltersPanel({ filters, setFilters, onClose }: Props) {
  const { t, language } = useLanguage();

  const activeFiltersCount = useMemo(() => {
    return [
      filters.status !== "all",
      filters.type !== "all",
      typeof filters.minCommission === "number",
      typeof filters.maxCommission === "number",
      Boolean(filters.dateFrom),
      Boolean(filters.dateTo),
    ].filter(Boolean).length;
  }, [filters]);

  const reset = () => {
    setFilters((prev) => ({
      ...prev,
      status: "all",
      type: "all",
      minCommission: undefined,
      maxCommission: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    }));
  };

  return (
    <PopoverContent align="end" className="w-[380px]">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-black text-slate-900">
            {t("partners.filtersPanel.title")}
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={reset}
                className="font-bold"
              >
                {t("partners.filtersPanel.reset")} ({activeFiltersCount})
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="font-bold"
            >
              {t("partners.filtersPanel.close")}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase text-slate-500">
              {t("partners.filtersPanel.status")}
            </div>
            <Select
              value={filters.status}
              onValueChange={(v) =>
                setFilters((prev) => ({
                  ...prev,
                  status: v as PartnerFilter["status"],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("partners.filtersPanel.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("partners.filtersPanel.all")}
                </SelectItem>
                <SelectItem value="pending">
                  {t("partners.status.pending")}
                </SelectItem>
                <SelectItem value="needs_correction">
                  {t("partners.status.needsCorrection")}
                </SelectItem>
                <SelectItem value="active">
                  {t("partners.status.approved")}
                </SelectItem>
                <SelectItem value="blocked">
                  {t("partners.status.blocked")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase text-slate-500">
              {t("partners.filtersPanel.type")}
            </div>
            <Select
              value={filters.type}
              onValueChange={(v) =>
                setFilters((prev) => ({
                  ...prev,
                  type: v as PartnerFilter["type"],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("partners.filtersPanel.type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("partners.filtersPanel.all")}
                </SelectItem>
                <SelectItem value="agency">
                  {t("partners.drawer.typeAgency")}
                </SelectItem>
                <SelectItem value="individual">
                  {t("partners.drawer.typePrivateBroker")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase text-slate-500">
              {t("partners.filtersPanel.commissionFrom")}
            </div>
            <Input
              type="number"
              value={
                typeof filters.minCommission === "number"
                  ? String(filters.minCommission)
                  : ""
              }
              onChange={(e) => {
                const v = e.target.value.trim();
                setFilters((prev) => ({
                  ...prev,
                  minCommission: v ? Number(v) : undefined,
                }));
              }}
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase text-slate-500">
              {t("partners.filtersPanel.commissionTo")}
            </div>
            <Input
              type="number"
              value={
                typeof filters.maxCommission === "number"
                  ? String(filters.maxCommission)
                  : ""
              }
              onChange={(e) => {
                const v = e.target.value.trim();
                setFilters((prev) => ({
                  ...prev,
                  maxCommission: v ? Number(v) : undefined,
                }));
              }}
              placeholder="10"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase text-slate-500">
              {t("partners.filtersPanel.dateFrom")}
            </div>
            <Input
              type="date"
              lang={language}
              value={filters.dateFrom ?? ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  dateFrom: e.target.value || undefined,
                }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase text-slate-500">
              {t("partners.filtersPanel.dateTo")}
            </div>
            <Input
              type="date"
              lang={language}
              value={filters.dateTo ?? ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  dateTo: e.target.value || undefined,
                }))
              }
            />
          </div>
        </div>
      </div>
    </PopoverContent>
  );
}
