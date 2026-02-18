import React, { useRef, useEffect, useState } from "react";
import {
  Search,
  LayoutGrid,
  List as ListIcon,
  ChevronDown,
  MoreHorizontal,
  Plus,
  CheckCircle2,
  Trash2,
  X,
  Edit,
  Check,
  GripVertical,
  FileDown,
  SlidersHorizontal,
  Shuffle,
  Wrench,
  UserPlus,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { LeadsList } from "@/components/admin/leads/LeadsList";
import { LeadsKanban } from "@/components/admin/leads/LeadsKanban";
import { LeadDrawer } from "@/components/admin/leads/LeadDrawer";
import { CreateLeadModal } from "@/components/admin/leads/CreateLeadModal";
import { FunnelSetup } from "@/components/admin/leads/FunnelSetup";
import { CardAppearanceModal } from "@/components/admin/leads/CardAppearanceModal";
import { ImportModal } from "@/components/admin/leads/ImportModal";
import { DuplicateFinderModal } from "@/components/admin/leads/DuplicateFinderModal";
import { useAdminLeadsData } from "@/hooks/useAdminLeadsData";
import { EmptyState } from "@/components/admin/EmptyState";
import { showToast } from "@gridix/utils/lib";
import type { LeadsFilters } from "@/entities/crm/model/types";
import { Button } from "@gridix/ui";
import { UnreadBadge } from "@/shared/ui/UnreadBadge";
import Spinner from "@/shared/ui/Spinner";

interface LeadsManagerProps {
  projectId?: string;
  showProjectColumn?: boolean;
}

const FilterChip: React.FC<{ label: string; onRemove: () => void }> = ({
  label,
  onRemove,
}) => (
  <div className="flex shrink-0 items-center gap-1.5 rounded-md border border-slate-200 bg-slate-100 py-1 pl-2.5 pr-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200">
    <span>{label}</span>
    <button
      onClick={onRemove}
      className="rounded-full p-0.5 hover:bg-slate-300/50"
    >
      <X size={12} />
    </button>
  </div>
);

const getSourceOptions = (
  t: (key: string) => string,
): { value: string; label: string }[] => [
  { value: "all", label: t("leads.filters.allSources") },
  { value: "instagram", label: t("leads.sources.instagram") },
  { value: "website", label: t("leads.sources.website") },
  { value: "referral", label: t("leads.sources.referral") },
  { value: "walk_in", label: t("leads.sources.walk_in") },
  { value: "facebook", label: t("leads.sources.facebook") },
];

export function LeadsManager({
  projectId,
  showProjectColumn: _showProjectColumn = false,
}: LeadsManagerProps) {
  const { t } = useTranslation();
  const SOURCE_OPTIONS = getSourceOptions(t);

  const {
    viewMode,
    setViewMode,
    selectedLead,
    setSelectedLead,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    isFilterPanelOpen,
    setIsFilterPanelOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    isCreateModalOpen,
    setIsCreateModalOpen,
    selectedIds,
    setSelectedIds,
    filteredAndSortedLeads,
    totalLeadsSum,
    activeFiltersCount,
    resetFilters,
    toggleSelection,
    toggleAllSelection,
    handleCreateLead,
    handleStatusChange,
    handleAddTask,
    handleCompleteTask,
    handleToggleTask,
    handleDeleteTask,
    handleAddNote,
    handleAddTag,
    handleRemoveTag,
    handleDeleteSelected,
    handleMassAssign,
    handleUpdateLead,
    handleMergeLeads,
    handleImportLeads,
    funnels,
    activeFunnel,
    handleSelectFunnel,
    editingFunnelId,
    editingFunnelName,
    setEditingFunnelName,
    handleStartEditFunnel,
    handleSaveFunnel,
    handleCancelEditFunnel,
    funnelStages,
    funnelTriggers,
    handleUpdateStage,
    handleAddStage,
    handleDeleteStage,
    handleReorderStages,
    handleAddTrigger,
    handleUpdateTrigger,
    handleDeleteTrigger,
    handleReorderTrigger,
    handleSaveFunnelSetup,
    handleResetFunnelSetup,
    missingApartmentStatusFunnels,
    cardConfig,
    handleSaveCardConfig,
    MOCK_USERS,
    totalUnreadCount,
    unreadCountByFunnelId,
    isLoading,
  } = useAdminLeadsData(projectId ? { projectId } : undefined);

  const settingsRef = useRef<HTMLDivElement>(null);
  const funnelMenuRef = useRef<HTMLDivElement>(null);
  const filterContainerRef = useRef<HTMLDivElement>(null);
  const assignMenuRef = useRef<HTMLDivElement>(null);

  const [isFunnelMenuOpen, setIsFunnelMenuOpen] = useState(false);
  const [isFunnelSetupMode, setIsFunnelSetupMode] = useState(false);
  const [isCardAppearanceModalOpen, setIsCardAppearanceModalOpen] =
    useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDuplicateFinderOpen, setIsDuplicateFinderOpen] = useState(false);
  const [isAssignMenuOpen, setIsAssignMenuOpen] = useState(false);

  const [draftFilters, setDraftFilters] = useState<LeadsFilters>(filters);
  const [draftSearchTerm, setDraftSearchTerm] = useState(searchTerm);

  const FUNNEL_TRIGGERS_WARNING_DISMISSED_KEY =
    "admin_leads_warning_funnel_triggers_dismissed";
  const [
    isFunnelTriggersWarningDismissed,
    setIsFunnelTriggersWarningDismissed,
  ] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      )
        setIsSettingsOpen(false);
      if (
        funnelMenuRef.current &&
        !funnelMenuRef.current.contains(event.target as Node)
      )
        setIsFunnelMenuOpen(false);
      if (
        isFilterPanelOpen &&
        filterContainerRef.current &&
        !filterContainerRef.current.contains(event.target as Node)
      )
        setIsFilterPanelOpen(false);
      if (
        assignMenuRef.current &&
        !assignMenuRef.current.contains(event.target as Node)
      )
        setIsAssignMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFilterPanelOpen, setIsFilterPanelOpen, setIsSettingsOpen]);

  useEffect(() => {
    if (isFilterPanelOpen) {
      setDraftFilters(filters);
      setDraftSearchTerm(searchTerm);
    }
  }, [isFilterPanelOpen, filters, searchTerm]);

  const handleApplyFilters = () => {
    setFilters(draftFilters);
    setSearchTerm(draftSearchTerm);
    setIsFilterPanelOpen(false);
  };

  const handleResetDraftFilters = () => {
    setDraftFilters({
      source: "all",
      minBudget: "",
      maxBudget: "",
      dateFrom: "",
      dateTo: "",
      stages: [],
      assignedTo: [],
    });
    setDraftSearchTerm("");
  };

  const handleExportCSV = () => {
    if (filteredAndSortedLeads.length === 0) {
      showToast(
        "info",
        t("leads.toast.nothingToExport.title"),
        t("leads.toast.nothingToExport.desc"),
      );
      return;
    }

    const headers = [
      "ID",
      "Name",
      "Phone",
      "Project",
      "Price",
      "Status",
      "Source",
      "Date",
    ];
    const rows = filteredAndSortedLeads.map((l) => {
      const statusName =
        funnelStages.find((s) => s.id === l.status)?.name || l.status;
      const safeName = l.name.replace(/"/g, '""');
      const safeProject = l.project.replace(/"/g, '""');

      return `"${l.id}","${safeName}","${l.phone}","${safeProject}",${l.price || 0},"${statusName}","${l.source}","${l.date}"`;
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `leads_export_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(
      "success",
      t("leads.toast.exportDone.title"),
      t("leads.toast.exportDone.desc"),
    );
  };

  const renderHeader = () => {
    if (isFunnelSetupMode && activeFunnel) {
      return (
        <div className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 md:px-6">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold text-slate-900">
              {t("leads.funnel.title")}: {activeFunnel?.name}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                handleResetFunnelSetup();
                setIsFunnelSetupMode(false);
              }}
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
            >
              {t("leads.funnel.back")}
            </button>
            <button
              onClick={() => {
                handleSaveFunnelSetup();
                showToast(
                  "success",
                  t("leads.toast.funnelSaved.title"),
                  t("leads.toast.funnelSaved.desc"),
                );
                setIsFunnelSetupMode(false);
              }}
              className="rounded-lg bg-[var(--admin-primary)] px-4 py-2 text-sm font-bold text-[var(--admin-text-on-primary)] shadow-sm transition-colors hover:bg-[var(--admin-primary-hover)] active:bg-[var(--admin-primary-active)]"
            >
              {t("leads.funnel.save")}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="shrink-0 border-b border-slate-200 bg-white shadow-sm">
        {/* Desktop Layout */}
        <div className="hidden h-16 items-center gap-4 px-6 lg:flex">
          {/* Funnel Selector */}
          <div className="relative shrink-0" ref={funnelMenuRef}>
            <button
              onClick={() => setIsFunnelMenuOpen(!isFunnelMenuOpen)}
              className="group flex max-w-[240px] items-center gap-2 rounded-lg border border-transparent px-3 py-1.5 transition-all hover:border-slate-200 hover:bg-slate-100"
            >
              <h2 className="truncate text-sm font-bold uppercase tracking-wide text-slate-900">
                {activeFunnel?.name || t("leads.funnel.funnels")}
              </h2>
              {totalUnreadCount > 0 && (
                <UnreadBadge
                  variant="pulse"
                  count={totalUnreadCount}
                  className="shrink-0"
                />
              )}
              <ChevronDown
                size={16}
                className={`text-slate-400 transition-transform duration-200 group-hover:text-slate-600 ${
                  isFunnelMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isFunnelMenuOpen && (
              <div className="absolute left-0 top-full z-30 mt-2 w-72 overflow-hidden rounded-lg border border-slate-100 bg-white py-2 shadow-2xl duration-100 animate-in fade-in zoom-in-95">
                <div className="mb-2 border-b border-slate-100 px-3 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {t("leads.title")}
                  </h4>
                </div>
                <div className="custom-scrollbar max-h-60 overflow-y-auto px-2">
                  {funnels.map((funnel) => (
                    <div
                      key={funnel.id}
                      className="group flex w-full items-center justify-between rounded p-2 text-left text-sm hover:bg-slate-50"
                    >
                      {editingFunnelId === funnel.id ? (
                        <>
                          <input
                            type="text"
                            value={editingFunnelName}
                            onChange={(e) =>
                              setEditingFunnelName(e.target.value)
                            }
                            className="flex-1 rounded border border-[var(--admin-primary)] bg-white px-2 py-1 text-sm outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveFunnel(funnel.id)}
                            className="rounded p-1 text-green-500 hover:bg-green-100"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={handleCancelEditFunnel}
                            className="rounded p-1 text-red-500 hover:bg-red-100"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <GripVertical
                              size={14}
                              className="cursor-move text-slate-300 group-hover:text-slate-500"
                            />
                            <span
                              onClick={() => {
                                handleSelectFunnel(funnel.id);
                                setIsFunnelMenuOpen(false);
                              }}
                              className={`cursor-pointer truncate ${
                                activeFunnel?.id === funnel.id
                                  ? "font-bold text-[var(--admin-primary)]"
                                  : "text-slate-700"
                              }`}
                            >
                              {funnel.name}
                            </span>
                            {(unreadCountByFunnelId?.[funnel.id] || 0) > 0 && (
                              <UnreadBadge
                                variant="pulse"
                                count={unreadCountByFunnelId[funnel.id]}
                                className="ml-1 shrink-0"
                              />
                            )}
                          </div>
                          <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={() => handleStartEditFunnel(funnel)}
                              className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                            >
                              <Edit size={14} />
                            </button>
                            {/*  <button
                              onClick={() => handleDeleteFunnel(funnel.id)}
                              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-100 rounded"
                            >
                              <Trash2 size={14} />
                            </button> */}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                {/*     <div className="px-3 pt-2 mt-2 border-t border-slate-100 space-y-2">
                  <button
                    onClick={handleAddFunnel}
                    className="w-full text-left p-2 text-sm rounded hover:bg-slate-50 text-slate-500 hover:text-slate-800 flex items-center gap-2"
                  >
                    <Plus size={14} /> {t('leads.funnel.addFunnel')}
                  </button>
                  <button className="w-full text-left p-2 text-sm rounded hover:bg-slate-50 text-slate-500 hover:text-slate-800 flex items-center gap-2">
                    <Archive size={14} /> {t('leads.funnel.archived')}
                  </button>
                </div> */}
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-slate-200"></div>

          {/* Search Bar */}
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
                  Object.values(filters).some((v) =>
                    Array.isArray(v) ? v.length > 0 : v && v !== "all",
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

            {/* Filter Dropdown */}
            {isFilterPanelOpen && (
              <div className="absolute left-0 top-[45px] z-30 w-[800px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl duration-100 animate-in fade-in zoom-in-95">
                <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 lg:grid-cols-3">
                  <input
                    type="text"
                    value={draftSearchTerm}
                    onChange={(e) => setDraftSearchTerm(e.target.value)}
                    placeholder={t("leads.filters.searchPlaceholder")}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--admin-primary)] lg:col-span-3"
                    autoFocus
                  />
                  <div className={"relative"}>
                    <select
                      value={draftFilters.source}
                      onChange={(e) =>
                        setDraftFilters({
                          ...draftFilters,
                          source: e.target.value,
                        })
                      }
                      className={`h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--admin-primary)] ${
                        draftFilters.source === "all"
                          ? "text-slate-400"
                          : "text-slate-900"
                      }`}
                    >
                      <option value="all">
                        {t("leads.filters.source")}:{" "}
                        {t("leads.filters.allSources")}
                      </option>
                      {SOURCE_OPTIONS.filter((o) => o.value !== "all").map(
                        (option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ),
                      )}
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
                      onChange={(e) =>
                        setDraftFilters({
                          ...draftFilters,
                          minBudget: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--admin-primary)]"
                    />
                    <span>-</span>
                    <input
                      type="number"
                      placeholder={t("leads.filters.budgetTo")}
                      value={draftFilters.maxBudget}
                      onChange={(e) =>
                        setDraftFilters({
                          ...draftFilters,
                          maxBudget: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--admin-primary)]"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs text-slate-500">
                    {t("leads.filters.found")}:{" "}
                    <span className="font-bold text-slate-900">
                      {filteredAndSortedLeads.length}
                    </span>
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

          {/* Right Controls */}
          <div className="flex shrink-0 items-center gap-3">
            {/* Stats */}
            <div className="mr-4 hidden text-right leading-tight xl:block">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {filteredAndSortedLeads.length} {t("leads.stats.deals")}
              </div>
              <div className="text-sm font-bold text-slate-900">
                {totalLeadsSum.toLocaleString()} $
              </div>
            </div>

            {/* View Switcher */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`rounded-md p-1.5 transition-all ${
                  viewMode === "list"
                    ? "bg-white text-[var(--admin-primary)] shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
                title={t("leads.list.selectAll")}
              >
                <ListIcon size={18} />
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={`rounded-md p-1.5 transition-all ${
                  viewMode === "kanban"
                    ? "bg-white text-[var(--admin-primary)] shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
                title={t("leads.kanban.createDeal")}
              >
                <LayoutGrid size={18} />
              </button>
            </div>

            {/* Settings Dropdown */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="rounded-lg border border-transparent p-2 text-slate-400 transition-colors hover:border-slate-200 hover:bg-slate-100 hover:text-slate-700"
              >
                <MoreHorizontal size={20} />
              </button>
              {isSettingsOpen && (
                <div className="absolute right-0 top-full z-30 mt-2 w-64 overflow-hidden rounded-lg border border-slate-100 bg-white py-1 shadow-xl duration-100 animate-in fade-in zoom-in-95">
                  {/*    <button
                    onClick={() => {
                      setIsImportModalOpen(true);
                      setIsSettingsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                  >
                    <FileUp size={16} /> {t('leads.settings.import')}
                  </button> */}
                  <button
                    onClick={() => {
                      handleExportCSV();
                      setIsSettingsOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <FileDown size={16} /> {t("leads.settings.export")}
                  </button>
                  <div className="my-1 h-px bg-slate-100"></div>
                  <button
                    onClick={() => {
                      setIsFunnelSetupMode(true);
                      setIsSettingsOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <SlidersHorizontal size={16} />{" "}
                    {t("leads.settings.funnelSetup")}
                  </button>
                  <button
                    onClick={() => {
                      setIsCardAppearanceModalOpen(true);
                      setIsSettingsOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Wrench size={16} /> {t("leads.settings.cardAppearance")}
                  </button>
                  <div className="my-1 h-px bg-slate-100"></div>
                  <button
                    onClick={() => {
                      setIsDuplicateFinderOpen(true);
                      setIsSettingsOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Shuffle size={16} /> {t("leads.settings.findDuplicates")}
                  </button>
                </div>
              )}
            </div>

            {/* New Deal Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-[var(--admin-primary)] px-4 py-2 text-sm font-bold text-[var(--admin-text-on-primary)] shadow-sm transition-all hover:bg-[var(--admin-primary-hover)] active:scale-95 active:bg-[var(--admin-primary-active)]"
            >
              <Plus size={18} />
              {t("leads.createModal.title")}
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        {activeFiltersCount > 0 && (
          <div className="no-scrollbar flex flex-wrap items-center gap-2 overflow-x-auto px-4 pb-3 pt-1 lg:px-6">
            {filters.source !== "all" && (
              <FilterChip
                label={`${t("leads.filters.source")}: ${
                  SOURCE_OPTIONS.find((o) => o.value === filters.source)?.label
                }`}
                onRemove={() => setFilters((f) => ({ ...f, source: "all" }))}
              />
            )}
            {(filters.minBudget || filters.maxBudget) && (
              <FilterChip
                label={`${t("leads.filters.budgetFrom")}: ${filters.minBudget || "0"} - ${filters.maxBudget || "∞"}`}
                onRemove={() =>
                  setFilters((f) => ({ ...f, minBudget: "", maxBudget: "" }))
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
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen flex-col bg-[var(--admin-background)] duration-500 animate-in fade-in">
      <CreateLeadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateLead}
        leads={filteredAndSortedLeads}
      />
      <CardAppearanceModal
        isOpen={isCardAppearanceModalOpen}
        onClose={() => setIsCardAppearanceModalOpen(false)}
        config={cardConfig}
        onSave={handleSaveCardConfig}
        users={MOCK_USERS}
      />
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportLeads}
      />
      <DuplicateFinderModal
        isOpen={isDuplicateFinderOpen}
        onClose={() => setIsDuplicateFinderOpen(false)}
        leads={filteredAndSortedLeads}
        onMerge={handleMergeLeads}
      />

      {renderHeader()}

      {/* Selection Toolbar */}
      {selectedIds.size > 0 && !isFunnelSetupMode && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-6 rounded-xl bg-slate-800 px-6 py-3 text-white shadow-2xl animate-in slide-in-from-bottom-4">
          <span className="text-sm font-medium">
            {selectedIds.size} {t("leads.toolbar.selected")}
          </span>
          <div className="h-4 w-px bg-slate-600"></div>

          <button className="flex items-center gap-2 text-sm transition-colors hover:text-slate-300">
            <CheckCircle2 size={16} /> {t("leads.toolbar.changeStatus")}
          </button>

          <div className="relative" ref={assignMenuRef}>
            <button
              onClick={() => setIsAssignMenuOpen(!isAssignMenuOpen)}
              className="flex items-center gap-2 text-sm transition-colors hover:text-slate-300"
            >
              <UserPlus size={16} /> {t("leads.toolbar.assign")}
            </button>
            {isAssignMenuOpen && (
              <div className="absolute bottom-full left-1/2 mb-3 w-48 origin-bottom -translate-x-1/2 rounded-xl border border-slate-200 bg-white py-1 text-slate-900 shadow-xl animate-in fade-in zoom-in-95">
                <div className="border-b border-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {t("leads.toolbar.manager")}
                </div>
                {MOCK_USERS.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      handleMassAssign(user.id);
                      setIsAssignMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-slate-50"
                  >
                    <div className={`h-2 w-2 rounded-full ${user.color}`}></div>
                    {user.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleDeleteSelected}
            className="flex items-center gap-2 text-sm transition-colors hover:text-red-400"
          >
            <Trash2 size={16} /> {t("leads.toolbar.delete")}
          </button>

          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-2 rounded-full p-1 hover:bg-slate-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <main className="flex-1 overflow-y-auto bg-[var(--admin-background-secondary)]">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner size="md" />
          </div>
        ) : isFunnelSetupMode ? (
          <FunnelSetup
            stages={funnelStages}
            triggers={funnelTriggers}
            users={MOCK_USERS}
            onUpdateStage={handleUpdateStage}
            onAddStage={handleAddStage}
            onDeleteStage={handleDeleteStage}
            onReorderStage={handleReorderStages}
            onAddTrigger={handleAddTrigger}
            onUpdateTrigger={handleUpdateTrigger}
            onDeleteTrigger={handleDeleteTrigger}
            onReorderTrigger={handleReorderTrigger}
          />
        ) : (
          <div className="h-full p-4">
            {missingApartmentStatusFunnels.length > 0 &&
              !isFunnelTriggersWarningDismissed && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-1 justify-between gap-3 max-sm:flex-col">
                      <div>
                        <p className="text-sm font-extrabold text-amber-900">
                          {t("leads.warnings.funnelTriggersTitle")}
                        </p>
                        <p className="mt-2 text-xs text-amber-800 sm:truncate">
                          <span className="font-bold">
                            {t("leads.warnings.missingFunnels")}:
                          </span>{" "}
                          {missingApartmentStatusFunnels
                            .map((f) => f.name)
                            .join(", ")}
                        </p>
                      </div>
                      <button
                        onClick={() => setIsFunnelSetupMode(true)}
                        className="inline-flex h-full w-fit whitespace-nowrap rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-amber-700"
                      >
                        {t("leads.warnings.funnelTriggersCta")}
                      </button>
                    </div>
                    <div className="flex shrink-0 items-start gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsFunnelTriggersWarningDismissed(true);
                        }}
                        className="rounded-lg p-2 text-amber-800/70 transition-colors hover:bg-amber-100 hover:text-amber-900"
                        aria-label={t("common.hide") as string}
                        title={t("common.hide") as string}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            {filteredAndSortedLeads.length === 0 ? (
              <EmptyState
                icon={Search}
                title={t("leads.emptyState.notFound")}
                description={t("leads.emptyState.tryChangingFilters")}
                action={{
                  label: t("leads.emptyState.resetFilters"),
                  onClick: resetFilters,
                }}
              />
            ) : viewMode === "list" ? (
              <LeadsList
                leads={filteredAndSortedLeads}
                funnelStages={funnelStages}
                onSelect={setSelectedLead}
                selectedIds={selectedIds}
                onToggleSelection={toggleSelection}
                onToggleAll={toggleAllSelection}
              />
            ) : (
              <LeadsKanban
                leads={filteredAndSortedLeads}
                funnelStages={funnelStages}
                users={MOCK_USERS}
                cardConfig={cardConfig}
                onSelect={setSelectedLead}
                onCreate={handleCreateLead}
                onStatusChange={handleStatusChange}
              />
            )}
          </div>
        )}
      </main>

      <LeadDrawer
        lead={selectedLead}
        funnelStages={funnelStages}
        onClose={() => setSelectedLead(null)}
        onStatusChange={handleStatusChange}
        onUpdateLead={handleUpdateLead}
        onAddTask={handleAddTask}
        onCompleteTask={handleCompleteTask}
        onToggleTask={handleToggleTask}
        onDeleteTask={handleDeleteTask}
        onAddNote={handleAddNote}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
      />

      {/* Mobile FAB */}
      <Button
        variant="default"
        size="icon"
        onClick={() => setIsCreateModalOpen(true)}
        className="group fixed bottom-16 right-2 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--admin-primary)] text-[var(--admin-text-on-primary)] shadow-lg transition-transform hover:scale-105 hover:bg-[var(--admin-primary-hover)] active:bg-[var(--admin-primary-active)] lg:hidden"
        aria-label={t("leads.createModal.title")}
      >
        <Plus size={18} />
      </Button>
    </div>
  );
}
