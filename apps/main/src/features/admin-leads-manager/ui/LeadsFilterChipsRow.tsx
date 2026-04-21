import type { LeadsFilters } from "@/entities/crm/model/types";
import { FilterChip } from "./FilterChip";

type SourceOption = { value: string; label: string };

type LeadsFilterChipsRowProps = {
  t: (key: string) => string;
  activeFiltersCount: number;
  filters: LeadsFilters;
  sourceOptions: SourceOption[];
  setFilters: (updater: (prev: LeadsFilters) => LeadsFilters) => void;
  resetFilters: () => void;
};

export const LeadsFilterChipsRow = ({
  t,
  activeFiltersCount,
  filters,
  sourceOptions,
  setFilters,
  resetFilters,
}: LeadsFilterChipsRowProps) => {
  if (activeFiltersCount <= 0) {
    return null;
  }

  return (
    <div className="no-scrollbar flex flex-wrap items-center gap-2 overflow-x-auto px-3 pb-3 pt-1 sm:px-6">
      {filters.source !== "all" && (
        <FilterChip
          label={`${t("leads.filters.source")}: ${
            sourceOptions.find((option) => option.value === filters.source)
              ?.label
          }`}
          onRemove={() => setFilters((prev) => ({ ...prev, source: "all" }))}
        />
      )}
      {(filters.minBudget || filters.maxBudget) && (
        <FilterChip
          label={`${t("leads.filters.budgetFrom")}: ${filters.minBudget || "0"} - ${filters.maxBudget || "∞"}`}
          onRemove={() =>
            setFilters((prev) => ({ ...prev, minBudget: "", maxBudget: "" }))
          }
        />
      )}
      <button
        onClick={resetFilters}
        className="ml-2 whitespace-nowrap text-xs text-slate-400 transition-colors hover:text-red-500 hover:underline"
      >
        {t("leads.filters.clearAll")}
      </button>
    </div>
  );
};
