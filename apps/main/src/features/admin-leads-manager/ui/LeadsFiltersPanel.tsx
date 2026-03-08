import { ChevronDown, Search } from "lucide-react";
import type { LeadsFilters } from "@/entities/crm/model/types";

type SourceOption = { value: string; label: string };

type LeadsFiltersPanelProps = {
  t: (key: string) => string;
  filterContainerRef: React.RefObject<HTMLDivElement>;
  isFilterPanelOpen: boolean;
  setIsFilterPanelOpen: (value: boolean) => void;
  searchTerm: string;
  filters: LeadsFilters;
  activeFiltersCount: number;
  draftSearchTerm: string;
  setDraftSearchTerm: (value: string) => void;
  draftFilters: LeadsFilters;
  setDraftFilters: (value: LeadsFilters) => void;
  handleApplyFilters: () => void;
  handleResetDraftFilters: () => void;
  filteredCount: number;
  sourceOptions: SourceOption[];
};

export const LeadsFiltersPanel = ({
  t,
  filterContainerRef,
  isFilterPanelOpen,
  setIsFilterPanelOpen,
  searchTerm,
  filters,
  activeFiltersCount,
  draftSearchTerm,
  setDraftSearchTerm,
  draftFilters,
  setDraftFilters,
  handleApplyFilters,
  handleResetDraftFilters,
  filteredCount,
  sourceOptions,
}: LeadsFiltersPanelProps) => {
  return (
    <div className="relative min-w-0 flex-1" ref={filterContainerRef}>
      <div className="group relative w-full max-w-3xl">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-hover:text-[var(--admin-primary)]"
        />
        <input
          type="text"
          placeholder={t("leads.filters.search")}
          onClick={() => setIsFilterPanelOpen(true)}
          readOnly
          value={
            searchTerm ||
            Object.values(filters).some((value) =>
              Array.isArray(value)
                ? value.length > 0
                : value && value !== "all",
            )
              ? t("leads.filters.searchPlaceholder")
              : ""
          }
          className="w-full cursor-pointer rounded-lg border border-transparent bg-slate-100 py-2 pl-10 pr-10 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-500 hover:border-slate-200 hover:bg-slate-50 focus:border-[var(--admin-primary)] focus:bg-white focus:ring-1 focus:ring-[color:var(--admin-primary)]"
        />
        {activeFiltersCount > 0 && (
          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-[var(--admin-primary)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--admin-text-on-primary)]">
            {activeFiltersCount}
          </div>
        )}
      </div>

      {isFilterPanelOpen && (
        <div className="absolute left-0 top-[45px] z-30 w-[800px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl duration-100 animate-in fade-in zoom-in-95">
          <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 lg:grid-cols-3">
            <input
              type="text"
              value={draftSearchTerm}
              onChange={(event) => setDraftSearchTerm(event.target.value)}
              placeholder={t("leads.filters.searchPlaceholder")}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--admin-primary)] lg:col-span-3"
              autoFocus
            />
            <div className="relative">
              <select
                value={draftFilters.source}
                onChange={(event) =>
                  setDraftFilters({
                    ...draftFilters,
                    source: event.target.value,
                  })
                }
                className={`h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--admin-primary)] ${
                  draftFilters.source === "all"
                    ? "text-slate-400"
                    : "text-slate-900"
                }`}
              >
                <option value="all">
                  {t("leads.filters.source")}: {t("leads.filters.allSources")}
                </option>
                {sourceOptions
                  .filter((option) => option.value !== "all")
                  .map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                <ChevronDown size={16} />
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder={t("leads.filters.budgetFrom")}
                value={draftFilters.minBudget}
                onChange={(event) =>
                  setDraftFilters({
                    ...draftFilters,
                    minBudget: event.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--admin-primary)]"
              />
              <span>-</span>
              <input
                type="number"
                placeholder={t("leads.filters.budgetTo")}
                value={draftFilters.maxBudget}
                onChange={(event) =>
                  setDraftFilters({
                    ...draftFilters,
                    maxBudget: event.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--admin-primary)]"
              />
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 p-4">
            <div className="text-xs text-slate-500">
              {t("leads.filters.found")}:{" "}
              <span className="font-bold text-slate-900">{filteredCount}</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleResetDraftFilters}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
              >
                {t("leads.filters.reset")}
              </button>
              <button
                onClick={handleApplyFilters}
                className="rounded-lg bg-[var(--admin-primary)] px-6 py-2 text-sm font-bold text-[var(--admin-text-on-primary)] shadow-sm transition-colors hover:bg-[var(--admin-primary-hover)] active:bg-[var(--admin-primary-active)]"
              >
                {t("leads.filters.apply")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
