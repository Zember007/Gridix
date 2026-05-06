import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronDown, Filter, Search, X } from "lucide-react";
import type { FunnelStage, LeadUser } from "@/entities/crm/model/types";
import type { LeadsFilters } from "@/entities/crm/model/types";

type SourceOption = { value: string; label: string };
type ProjectOption = { id: string; name: string };

type StageMultiSelectProps = {
  stages: FunnelStage[];
  selected: string[];
  onChange: (selected: string[]) => void;
  stagesLabel: string;
};

function StageMultiSelect({
  stages,
  selected,
  onChange,
  stagesLabel,
}: StageMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (stageId: string) => {
    onChange(
      selected.includes(stageId)
        ? selected.filter((id) => id !== stageId)
        : [...selected, stageId],
    );
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-full items-center justify-between rounded border border-slate-200 bg-white px-2.5 py-1.5 text-left text-[11px] font-medium outline-none transition-colors hover:border-slate-300 focus:border-[var(--admin-primary)]"
      >
        <span
          className={selected.length > 0 ? "text-slate-800" : "text-slate-400"}
        >
          {selected.length > 0
            ? `${stagesLabel}: ${selected.length}`
            : stagesLabel}
        </span>
        {selected.length > 0 && (
          <span
            role="button"
            tabIndex={0}
            className="text-slate-400 hover:text-red-500"
            onClick={(e) => {
              e.stopPropagation();
              onChange([]);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.stopPropagation();
                onChange([]);
              }
            }}
          >
            <X size={10} />
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full z-[60] mt-1 max-h-60 w-full overflow-y-auto rounded border border-slate-100 bg-white py-1 shadow-xl">
          {stages.map((stage) => (
            <label
              key={stage.id}
              className="flex cursor-pointer items-center gap-2 px-2.5 py-1.5 transition-colors hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={selected.includes(stage.id)}
                onChange={() => handleSelect(stage.id)}
                className="h-3 w-3 rounded border-slate-300 text-[var(--admin-primary)] focus:ring-[var(--admin-primary)]"
              />
              <span className="text-[11px] text-slate-700">{stage.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

type ManagerMultiSelectProps = {
  users: LeadUser[];
  selected: string[];
  onChange: (selected: string[]) => void;
  managersPlaceholder: string;
};

function ManagerMultiSelect({
  users,
  selected,
  onChange,
  managersPlaceholder,
}: ManagerMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (userId: string) => {
    onChange(
      selected.includes(userId)
        ? selected.filter((id) => id !== userId)
        : [...selected, userId],
    );
  };

  const selectedUsers = users.filter((u) => selected.includes(u.id));

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex min-h-8 w-full items-center justify-between rounded border border-slate-200 bg-white px-2.5 py-1.5 text-left text-[11px] font-medium outline-none transition-colors hover:border-slate-300 focus:border-[var(--admin-primary)]"
      >
        <div className="flex flex-1 flex-wrap items-center gap-1">
          {selectedUsers.length > 0 ? (
            selectedUsers.map((user) => (
              <span
                key={user.id}
                className="flex items-center gap-1 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-700"
              >
                {user.name}
                <X
                  size={9}
                  className="cursor-pointer hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(user.id);
                  }}
                />
              </span>
            ))
          ) : (
            <span className="text-slate-400">{managersPlaceholder}</span>
          )}
        </div>
        <ChevronDown size={12} className="shrink-0 text-slate-400" />
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full z-[60] mt-1 max-h-60 w-full overflow-y-auto rounded border border-slate-100 bg-white py-1 shadow-xl">
          {users.map((user) => (
            <label
              key={user.id}
              className="flex cursor-pointer items-center gap-2 px-2.5 py-1.5 transition-colors hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={selected.includes(user.id)}
                onChange={() => handleSelect(user.id)}
                className="h-3 w-3 rounded border-slate-300 text-[var(--admin-primary)] focus:ring-[var(--admin-primary)]"
              />
              <span className="text-[11px] text-slate-700">{user.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

type DateRangePickerProps = {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  allTimeLabel: string;
  presetToday: string;
  presetYesterday: string;
  presetLast7: string;
  presetLast30: string;
  presetThisMonth: string;
  presetLastMonth: string;
};

function DateRangePicker({
  from,
  to,
  onChange,
  allTimeLabel,
  presetToday,
  presetYesterday,
  presetLast7,
  presetLast30,
  presetThisMonth,
  presetLastMonth,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const toISO = (date: Date) => date.toISOString().slice(0, 10);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const setPreset = (preset: string) => {
    const today = new Date();
    let newFrom = new Date(today);
    let newTo = new Date(today);
    if (preset === "yesterday") {
      newFrom.setDate(today.getDate() - 1);
      newTo.setDate(today.getDate() - 1);
    }
    if (preset === "7days") {
      newFrom.setDate(today.getDate() - 6);
    }
    if (preset === "30days") {
      newFrom.setDate(today.getDate() - 29);
    }
    if (preset === "this_month") {
      newFrom = new Date(today.getFullYear(), today.getMonth(), 1);
      newTo = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }
    if (preset === "last_month") {
      newFrom = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      newTo = new Date(today.getFullYear(), today.getMonth(), 0);
    }
    onChange(toISO(newFrom), toISO(newTo));
    setIsOpen(false);
  };

  const displayValue =
    from && to
      ? `${new Date(from).toLocaleDateString()} - ${new Date(to).toLocaleDateString()}`
      : allTimeLabel;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-full items-center justify-between rounded border border-slate-200 bg-white px-2.5 py-1.5 text-left text-[11px] font-medium outline-none transition-colors hover:border-slate-300 focus:border-[var(--admin-primary)]"
      >
        <div className="flex items-center gap-2">
          <Calendar size={12} className="text-slate-400" />
          <span className="text-slate-800">{displayValue}</span>
        </div>
        {(from || to) && (
          <span
            role="button"
            tabIndex={0}
            className="text-slate-400 hover:text-red-500"
            onClick={(e) => {
              e.stopPropagation();
              onChange("", "");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.stopPropagation();
                onChange("", "");
              }
            }}
          >
            <X size={10} />
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full z-[60] mt-1 flex w-64 flex-col gap-2 rounded border border-slate-100 bg-white p-2 shadow-xl">
          <div className="grid grid-cols-2 gap-1.5 text-[9px] font-medium">
            <button
              type="button"
              onClick={() => setPreset("today")}
              className="rounded bg-slate-50 p-1 text-center transition-colors hover:bg-slate-100"
            >
              {presetToday}
            </button>
            <button
              type="button"
              onClick={() => setPreset("yesterday")}
              className="rounded bg-slate-50 p-1 text-center transition-colors hover:bg-slate-100"
            >
              {presetYesterday}
            </button>
            <button
              type="button"
              onClick={() => setPreset("7days")}
              className="rounded bg-slate-50 p-1 text-center transition-colors hover:bg-slate-100"
            >
              {presetLast7}
            </button>
            <button
              type="button"
              onClick={() => setPreset("30days")}
              className="rounded bg-slate-50 p-1 text-center transition-colors hover:bg-slate-100"
            >
              {presetLast30}
            </button>
            <button
              type="button"
              onClick={() => setPreset("this_month")}
              className="rounded bg-slate-50 p-1 text-center transition-colors hover:bg-slate-100"
            >
              {presetThisMonth}
            </button>
            <button
              type="button"
              onClick={() => setPreset("last_month")}
              className="rounded bg-slate-50 p-1 text-center transition-colors hover:bg-slate-100"
            >
              {presetLastMonth}
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            <input
              type="date"
              value={from}
              onChange={(e) => onChange(e.target.value, to)}
              className="w-full rounded border border-slate-200 bg-slate-50 p-1 text-[10px] outline-none focus:border-[var(--admin-primary)]"
            />
            <span className="text-slate-400">-</span>
            <input
              type="date"
              value={to}
              onChange={(e) => onChange(from, e.target.value)}
              className="w-full rounded border border-slate-200 bg-slate-50 p-1 text-[10px] outline-none focus:border-[var(--admin-primary)]"
            />
          </div>
        </div>
      )}
    </div>
  );
}

type LeadsFiltersPanelProps = {
  t: (key: string) => string;
  filterContainerRef: React.RefObject<HTMLDivElement>;
  isFilterPanelOpen: boolean;
  setIsFilterPanelOpen: (value: boolean) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  activeFiltersCount: number;
  draftSearchTerm: string;
  setDraftSearchTerm: (value: string) => void;
  draftFilters: LeadsFilters;
  setDraftFilters: (value: LeadsFilters) => void;
  handleApplyFilters: () => void;
  handleResetDraftFilters: () => void;
  filteredCount: number;
  sourceOptions: SourceOption[];
  projectOptions: ProjectOption[];
  funnelStages: FunnelStage[];
  filterUsers: LeadUser[];
};

export const LeadsFiltersPanel = ({
  t,
  filterContainerRef,
  isFilterPanelOpen,
  setIsFilterPanelOpen,
  searchTerm,
  setSearchTerm,
  activeFiltersCount,
  draftSearchTerm,
  setDraftSearchTerm,
  draftFilters,
  setDraftFilters,
  handleApplyFilters,
  handleResetDraftFilters,
  filteredCount,
  sourceOptions,
  projectOptions,
  funnelStages,
  filterUsers,
}: LeadsFiltersPanelProps) => {
  return (
    <div
      className="relative flex min-w-0 flex-1 items-center gap-2"
      ref={filterContainerRef}
    >
      <div className="relative hidden min-w-0 flex-1 md:block md:max-w-md">
        <Search
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder={t("leads.filters.search")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-md border-none bg-slate-50 py-1.5 pl-9 pr-4 text-sm outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-slate-200"
        />
      </div>

      <button
        type="button"
        onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
        className="relative flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 md:px-3"
        title={t("leads.filters.title")}
      >
        <Filter size={14} className="text-slate-500" />
        <span className="hidden sm:inline">{t("leads.filters.title")}</span>
        {activeFiltersCount > 0 && (
          <span className="rounded bg-[var(--admin-primary)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--admin-text-on-primary)]">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {isFilterPanelOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full max-w-[min(100vw-2rem,600px)] origin-top-left border-b border-r border-slate-200 bg-white shadow-2xl duration-100 animate-in fade-in zoom-in-95 md:left-auto md:right-0 md:origin-top-right">
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
            <input
              type="text"
              value={draftSearchTerm}
              onChange={(event) => setDraftSearchTerm(event.target.value)}
              placeholder={t("leads.filters.searchPlaceholder")}
              className="w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium outline-none focus:border-[var(--admin-primary)] md:col-span-2"
              autoFocus
            />
            <DateRangePicker
              from={draftFilters.dateFrom}
              to={draftFilters.dateTo}
              onChange={(from, to) =>
                setDraftFilters({ ...draftFilters, dateFrom: from, dateTo: to })
              }
              allTimeLabel={t("leads.filters.allTime")}
              presetToday={t("leads.filters.presetToday")}
              presetYesterday={t("leads.filters.presetYesterday")}
              presetLast7={t("leads.filters.presetLast7")}
              presetLast30={t("leads.filters.presetLast30")}
              presetThisMonth={t("leads.filters.presetThisMonth")}
              presetLastMonth={t("leads.filters.presetLastMonth")}
            />
            <ManagerMultiSelect
              users={filterUsers}
              selected={draftFilters.assignedTo}
              onChange={(u) =>
                setDraftFilters({ ...draftFilters, assignedTo: u })
              }
              managersPlaceholder={t("leads.filters.managers")}
            />
            <StageMultiSelect
              stages={funnelStages}
              selected={draftFilters.stages}
              onChange={(s) => setDraftFilters({ ...draftFilters, stages: s })}
              stagesLabel={t("leads.filters.stages")}
            />
            <div>
              <select
                value={draftFilters.source}
                onChange={(event) =>
                  setDraftFilters({
                    ...draftFilters,
                    source: event.target.value,
                  })
                }
                className={`h-8 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium outline-none transition-colors hover:border-slate-300 focus:border-[var(--admin-primary)] ${
                  draftFilters.source === "all"
                    ? "text-slate-400"
                    : "text-slate-900"
                }`}
              >
                <option value="all">{t("leads.filters.source")}</option>
                {sourceOptions
                  .filter((option) => option.value !== "all")
                  .map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <select
                value={draftFilters.projectId}
                onChange={(event) =>
                  setDraftFilters({
                    ...draftFilters,
                    projectId: event.target.value,
                    projectless: event.target.value === "projectless",
                  })
                }
                className={`h-8 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium outline-none transition-colors hover:border-slate-300 focus:border-[var(--admin-primary)] ${
                  draftFilters.projectId === "all"
                    ? "text-slate-400"
                    : "text-slate-900"
                }`}
              >
                <option value="all">{t("leads.filters.allProjects")}</option>
                <option value="projectless">
                  {t("leads.filters.projectless")}
                </option>
                {projectOptions.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
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
                className="h-8 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium outline-none transition-colors hover:border-slate-300 focus:border-[var(--admin-primary)]"
              />
              <span className="text-slate-400">-</span>
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
                className="h-8 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium outline-none transition-colors hover:border-slate-300 focus:border-[var(--admin-primary)]"
              />
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 p-3">
            <div className="text-[10px] text-slate-500">
              {t("leads.filters.found")}:{" "}
              <span className="font-bold text-slate-900">{filteredCount}</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleResetDraftFilters}
                className="rounded px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
              >
                {t("leads.filters.reset")}
              </button>
              <button
                type="button"
                onClick={handleApplyFilters}
                className="rounded bg-[var(--admin-primary-hover)] px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--admin-text-on-primary)] shadow-sm transition-colors hover:bg-[var(--admin-primary-active)]"
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
