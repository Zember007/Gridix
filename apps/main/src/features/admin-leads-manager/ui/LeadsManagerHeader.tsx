import type { LeadsFilters } from "@/entities/crm/model/types";
import { getSourceOptions } from "../lib/getSourceOptions";
import { LeadsFilterChipsRow } from "./LeadsFilterChipsRow";
import { LeadsFiltersPanel } from "./LeadsFiltersPanel";
import { LeadsFunnelMenu } from "./LeadsFunnelMenu";
import { LeadsHeaderActions } from "./LeadsHeaderActions";

type Funnel = { id: string; name: string };

export type LeadsManagerHeaderProps = {
  t: (key: string) => string;
  isFunnelSetupMode: boolean;
  activeFunnel: Funnel | null;
  handleResetFunnelSetup: () => void;
  handleSaveFunnelSetup: () => void;
  onFunnelSaved: () => void;
  setIsFunnelSetupMode: (value: boolean) => void;
  funnelMenuRef: React.RefObject<HTMLDivElement>;
  filterContainerRef: React.RefObject<HTMLDivElement>;
  settingsRef: React.RefObject<HTMLDivElement>;
  isFunnelMenuOpen: boolean;
  setIsFunnelMenuOpen: (value: boolean) => void;
  funnels: Funnel[];
  editingFunnelId: string | null;
  editingFunnelName: string;
  setEditingFunnelName: (value: string) => void;
  handleSaveFunnel: (id: string) => void;
  handleCancelEditFunnel: () => void;
  handleSelectFunnel: (id: string) => void;
  unreadCountByFunnelId: Record<string, number>;
  handleStartEditFunnel: (funnel: Funnel) => void;
  totalUnreadCount: number;
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
  totalLeadsSum: number;
  viewMode: "list" | "kanban";
  setViewMode: (value: "list" | "kanban") => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (value: boolean) => void;
  onExportClick: () => void;
  setIsCardAppearanceModalOpen: (value: boolean) => void;
  setIsDuplicateFinderOpen: (value: boolean) => void;
  setIsCreateModalOpen: (value: boolean) => void;
  setFilters: (updater: (prev: LeadsFilters) => LeadsFilters) => void;
  resetFilters: () => void;
  readOnly?: boolean;
};

export const LeadsManagerHeader = ({
  t,
  isFunnelSetupMode,
  activeFunnel,
  handleResetFunnelSetup,
  handleSaveFunnelSetup,
  onFunnelSaved,
  setIsFunnelSetupMode,
  funnelMenuRef,
  filterContainerRef,
  settingsRef,
  isFunnelMenuOpen,
  setIsFunnelMenuOpen,
  funnels,
  editingFunnelId,
  editingFunnelName,
  setEditingFunnelName,
  handleSaveFunnel,
  handleCancelEditFunnel,
  handleSelectFunnel,
  unreadCountByFunnelId,
  handleStartEditFunnel,
  totalUnreadCount,
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
  totalLeadsSum,
  viewMode,
  setViewMode,
  isSettingsOpen,
  setIsSettingsOpen,
  onExportClick,
  setIsCardAppearanceModalOpen,
  setIsDuplicateFinderOpen,
  setIsCreateModalOpen,
  setFilters,
  resetFilters,
  readOnly = false,
}: LeadsManagerHeaderProps) => {
  const sourceOptions = getSourceOptions(t);

  if (isFunnelSetupMode && activeFunnel) {
    return (
      <div className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-3 sm:px-6">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold text-slate-900">
            {t("leads.funnel.title")}: {activeFunnel.name}
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
          {!readOnly && (
            <button
              onClick={() => {
                handleSaveFunnelSetup();
                onFunnelSaved();
                setIsFunnelSetupMode(false);
              }}
              className="rounded-lg bg-[var(--admin-primary)] px-4 py-2 text-sm font-bold text-[var(--admin-text-on-primary)] shadow-sm transition-colors hover:bg-[var(--admin-primary-hover)] active:bg-[var(--admin-primary-active)]"
            >
              {t("leads.funnel.save")}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="shrink-0 border-b border-slate-200 bg-white shadow-sm">
      <div className="hidden h-16 items-center gap-4 px-6 lg:flex">
        <LeadsFunnelMenu
          t={t}
          funnelMenuRef={funnelMenuRef}
          isFunnelMenuOpen={isFunnelMenuOpen}
          setIsFunnelMenuOpen={setIsFunnelMenuOpen}
          activeFunnel={activeFunnel}
          totalUnreadCount={totalUnreadCount}
          funnels={funnels}
          editingFunnelId={editingFunnelId}
          editingFunnelName={editingFunnelName}
          setEditingFunnelName={setEditingFunnelName}
          handleSaveFunnel={handleSaveFunnel}
          handleCancelEditFunnel={handleCancelEditFunnel}
          handleSelectFunnel={handleSelectFunnel}
          unreadCountByFunnelId={unreadCountByFunnelId}
          handleStartEditFunnel={handleStartEditFunnel}
          readOnly={readOnly}
        />

        <div className="h-6 w-px bg-slate-200"></div>

        <LeadsFiltersPanel
          t={t}
          filterContainerRef={filterContainerRef}
          isFilterPanelOpen={isFilterPanelOpen}
          setIsFilterPanelOpen={setIsFilterPanelOpen}
          searchTerm={searchTerm}
          filters={filters}
          activeFiltersCount={activeFiltersCount}
          draftSearchTerm={draftSearchTerm}
          setDraftSearchTerm={setDraftSearchTerm}
          draftFilters={draftFilters}
          setDraftFilters={setDraftFilters}
          handleApplyFilters={handleApplyFilters}
          handleResetDraftFilters={handleResetDraftFilters}
          filteredCount={filteredCount}
          sourceOptions={sourceOptions}
        />

        <LeadsHeaderActions
          t={t}
          filteredCount={filteredCount}
          totalLeadsSum={totalLeadsSum}
          viewMode={viewMode}
          setViewMode={setViewMode}
          settingsRef={settingsRef}
          isSettingsOpen={isSettingsOpen}
          setIsSettingsOpen={setIsSettingsOpen}
          onExportClick={onExportClick}
          setIsFunnelSetupMode={setIsFunnelSetupMode}
          setIsCardAppearanceModalOpen={setIsCardAppearanceModalOpen}
          setIsDuplicateFinderOpen={setIsDuplicateFinderOpen}
          setIsCreateModalOpen={setIsCreateModalOpen}
          readOnly={readOnly}
        />
      </div>

      <LeadsFilterChipsRow
        t={t}
        activeFiltersCount={activeFiltersCount}
        filters={filters}
        sourceOptions={sourceOptions}
        setFilters={setFilters}
        resetFilters={resetFilters}
      />
    </div>
  );
};
