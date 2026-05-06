import type { LeadsFilters } from "@/entities/crm/model/types";
import { FilterChip } from "./FilterChip";

type SourceOption = { value: string; label: string };
type ProjectOption = { id: string; name: string };

type LeadsFilterChipsRowProps = {
  t: (key: string) => string;
  activeFiltersCount: number;
  filters: LeadsFilters;
  sourceOptions: SourceOption[];
  projectOptions: ProjectOption[];
  setFilters: (updater: (prev: LeadsFilters) => LeadsFilters) => void;
  resetFilters: () => void;
};

export const LeadsFilterChipsRow = ({
  t,
  activeFiltersCount,
  filters,
  sourceOptions,
  projectOptions,
  setFilters,
  resetFilters,
}: LeadsFilterChipsRowProps) => {
  if (activeFiltersCount <= 0) {
    return null;
  }

  const projectLabel =
    filters.projectless || filters.projectId === "projectless"
      ? t("leads.filters.projectless")
      : filters.projectId !== "all"
        ? projectOptions.find((p) => p.id === filters.projectId)?.name ||
          filters.projectId
        : null;

  return (
    <div className="no-scrollbar flex flex-wrap items-center gap-2 border-b border-slate-100 bg-white px-4 py-2 sm:px-6">
      {filters.stages.length > 0 && (
        <FilterChip
          label={`${t("leads.filters.stages")}: ${filters.stages.length}`}
          onRemove={() => setFilters((prev) => ({ ...prev, stages: [] }))}
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
      {filters.source !== "all" && (
        <FilterChip
          label={`${t("leads.filters.source")}: ${sourceOptions.find((option) => option.value === filters.source)?.label}`}
          onRemove={() => setFilters((prev) => ({ ...prev, source: "all" }))}
        />
      )}
      {(filters.dateFrom || filters.dateTo) && (
        <FilterChip
          label={`${t("leads.filters.dateFrom")}: ${filters.dateFrom ? new Date(filters.dateFrom).toLocaleDateString() : "…"} - ${filters.dateTo ? new Date(filters.dateTo).toLocaleDateString() : "…"}`}
          onRemove={() =>
            setFilters((prev) => ({ ...prev, dateFrom: "", dateTo: "" }))
          }
        />
      )}
      {filters.assignedTo.length > 0 && (
        <FilterChip
          label={`${t("leads.filters.managers")}: ${filters.assignedTo.length}`}
          onRemove={() => setFilters((prev) => ({ ...prev, assignedTo: [] }))}
        />
      )}
      {projectLabel && (
        <FilterChip
          label={`${t("leads.drawer.project")}: ${projectLabel}`}
          onRemove={() =>
            setFilters((prev) => ({
              ...prev,
              projectId: "all",
              projectless: false,
            }))
          }
        />
      )}
      <button
        type="button"
        onClick={resetFilters}
        className="ml-1 whitespace-nowrap text-[9px] font-bold uppercase tracking-wider text-slate-400 transition-colors hover:text-red-500 hover:underline"
      >
        {t("leads.filters.clearAll")}
      </button>
    </div>
  );
};
