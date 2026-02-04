import React, { useMemo } from "react";
import { Button, Input, PopoverContent, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@gridix/ui";
import type { PartnerFilter } from "./types";

interface Props {
  filters: PartnerFilter;
  setFilters: React.Dispatch<React.SetStateAction<PartnerFilter>>;
  onClose: () => void;
}

export function PartnerFiltersPanel({ filters, setFilters, onClose }: Props) {
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
          <div className="text-sm font-black text-slate-900">Фильтры</div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 ? (
              <Button variant="ghost" size="sm" onClick={reset} className="font-bold">
                Сбросить ({activeFiltersCount})
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" onClick={onClose} className="font-bold">
              Закрыть
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-slate-500 uppercase">Статус</div>
            <Select
              value={filters.status}
              onValueChange={(v) => setFilters((prev) => ({ ...prev, status: v as PartnerFilter["status"] }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="pending">Новые</SelectItem>
                <SelectItem value="needs_correction">Доработка</SelectItem>
                <SelectItem value="active">Активные</SelectItem>
                <SelectItem value="blocked">Блок</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-slate-500 uppercase">Тип</div>
            <Select
              value={filters.type}
              onValueChange={(v) => setFilters((prev) => ({ ...prev, type: v as PartnerFilter["type"] }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="agency">Агентство</SelectItem>
                <SelectItem value="individual">Частный</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-slate-500 uppercase">Комиссия от (%)</div>
            <Input
              type="number"
              value={typeof filters.minCommission === "number" ? String(filters.minCommission) : ""}
              onChange={(e) => {
                const v = e.target.value.trim();
                setFilters((prev) => ({ ...prev, minCommission: v ? Number(v) : undefined }));
              }}
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-slate-500 uppercase">Комиссия до (%)</div>
            <Input
              type="number"
              value={typeof filters.maxCommission === "number" ? String(filters.maxCommission) : ""}
              onChange={(e) => {
                const v = e.target.value.trim();
                setFilters((prev) => ({ ...prev, maxCommission: v ? Number(v) : undefined }));
              }}
              placeholder="10"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-slate-500 uppercase">Дата от</div>
            <Input
              type="date"
              value={filters.dateFrom ?? ""}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value || undefined }))}
            />
          </div>
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-slate-500 uppercase">Дата до</div>
            <Input
              type="date"
              value={filters.dateTo ?? ""}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value || undefined }))}
            />
          </div>
        </div>
      </div>
    </PopoverContent>
  );
}

