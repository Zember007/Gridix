import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAdminLeadsData } from "@/hooks/useAdminLeadsData";
import { showToast } from "@gridix/utils/lib";
import { Button } from "@gridix/ui";
import { exportLeadsCsv } from "../lib/exportLeadsCsv";
import { useLeadsManagerUiState } from "../model/useLeadsManagerUiState";
import { LeadsManagerHeader } from "./LeadsManagerHeader";
import { LeadsSelectionToolbar } from "./LeadsSelectionToolbar";
import { LeadsManagerContent } from "./LeadsManagerContent";
import { LeadsManagerModals } from "./LeadsManagerModals";
import { LeadsManagerDrawer } from "./LeadsManagerDrawer";
import { useAdminAccess } from "@/entities/admin-access";

interface LeadsManagerProps {
  projectId?: string;
  showProjectColumn?: boolean;
}

export function LeadsManager({
  projectId,
  showProjectColumn: _showProjectColumn = false,
}: LeadsManagerProps) {
  const { t } = useTranslation();
  const adminAccess = useAdminAccess();
  const canUseMassActions = projectId
    ? (adminAccess?.canUseMassActions(projectId) ?? false)
    : (adminAccess?.canUseMassActions() ?? false);

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

  const {
    settingsRef,
    funnelMenuRef,
    filterContainerRef,
    assignMenuRef,
    isFunnelMenuOpen,
    setIsFunnelMenuOpen,
    isFunnelSetupMode,
    setIsFunnelSetupMode,
    isCardAppearanceModalOpen,
    setIsCardAppearanceModalOpen,
    isImportModalOpen,
    setIsImportModalOpen,
    isDuplicateFinderOpen,
    setIsDuplicateFinderOpen,
    isAssignMenuOpen,
    setIsAssignMenuOpen,
    draftFilters,
    setDraftFilters,
    draftSearchTerm,
    setDraftSearchTerm,
    isFunnelTriggersWarningDismissed,
    setIsFunnelTriggersWarningDismissed,
    handleResetDraftFilters,
  } = useLeadsManagerUiState({
    filters,
    searchTerm,
    isFilterPanelOpen,
    setIsFilterPanelOpen,
    setIsSettingsOpen,
  });

  const handleApplyFilters = () => {
    setFilters(draftFilters);
    setSearchTerm(draftSearchTerm);
    setIsFilterPanelOpen(false);
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

    exportLeadsCsv({
      leads: filteredAndSortedLeads.map((lead) => ({
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        project: lead.project,
        price: lead.price,
        status: lead.status,
        source: lead.source,
        date: lead.date,
      })),
      funnelStages: funnelStages.map((stage) => ({
        id: stage.id,
        name: stage.name,
      })),
    });

    showToast(
      "success",
      t("leads.toast.exportDone.title"),
      t("leads.toast.exportDone.desc"),
    );
  };

  return (
    <div className="flex h-screen flex-col bg-[var(--admin-background)] duration-500 animate-in fade-in">
      <LeadsManagerModals
        isCreateModalOpen={isCreateModalOpen}
        setIsCreateModalOpen={setIsCreateModalOpen}
        handleCreateLead={handleCreateLead}
        filteredAndSortedLeads={filteredAndSortedLeads}
        isCardAppearanceModalOpen={isCardAppearanceModalOpen}
        setIsCardAppearanceModalOpen={setIsCardAppearanceModalOpen}
        cardConfig={cardConfig}
        handleSaveCardConfig={handleSaveCardConfig}
        users={MOCK_USERS}
        isImportModalOpen={isImportModalOpen}
        setIsImportModalOpen={setIsImportModalOpen}
        handleImportLeads={handleImportLeads}
        isDuplicateFinderOpen={isDuplicateFinderOpen}
        setIsDuplicateFinderOpen={setIsDuplicateFinderOpen}
        handleMergeLeads={handleMergeLeads}
      />

      <LeadsManagerHeader
        t={t}
        isFunnelSetupMode={isFunnelSetupMode}
        activeFunnel={activeFunnel}
        handleResetFunnelSetup={handleResetFunnelSetup}
        handleSaveFunnelSetup={handleSaveFunnelSetup}
        onFunnelSaved={() =>
          showToast(
            "success",
            t("leads.toast.funnelSaved.title"),
            t("leads.toast.funnelSaved.desc"),
          )
        }
        setIsFunnelSetupMode={setIsFunnelSetupMode}
        funnelMenuRef={funnelMenuRef}
        filterContainerRef={filterContainerRef}
        settingsRef={settingsRef}
        isFunnelMenuOpen={isFunnelMenuOpen}
        setIsFunnelMenuOpen={setIsFunnelMenuOpen}
        funnels={funnels}
        editingFunnelId={editingFunnelId}
        editingFunnelName={editingFunnelName}
        setEditingFunnelName={setEditingFunnelName}
        handleSaveFunnel={handleSaveFunnel}
        handleCancelEditFunnel={handleCancelEditFunnel}
        handleSelectFunnel={handleSelectFunnel}
        unreadCountByFunnelId={unreadCountByFunnelId}
        handleStartEditFunnel={handleStartEditFunnel}
        totalUnreadCount={totalUnreadCount}
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
        filteredCount={filteredAndSortedLeads.length}
        totalLeadsSum={totalLeadsSum}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isSettingsOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        onExportClick={handleExportCSV}
        setIsCardAppearanceModalOpen={setIsCardAppearanceModalOpen}
        setIsDuplicateFinderOpen={setIsDuplicateFinderOpen}
        setIsCreateModalOpen={setIsCreateModalOpen}
        setFilters={setFilters}
        resetFilters={resetFilters}
      />

      {!isFunnelSetupMode && canUseMassActions && (
        <LeadsSelectionToolbar
          t={t}
          selectedCount={selectedIds.size}
          users={MOCK_USERS}
          assignMenuRef={assignMenuRef}
          isAssignMenuOpen={isAssignMenuOpen}
          setIsAssignMenuOpen={setIsAssignMenuOpen}
          handleMassAssign={handleMassAssign}
          handleDeleteSelected={handleDeleteSelected}
          clearSelection={() => setSelectedIds(new Set())}
        />
      )}

      <LeadsManagerContent
        t={t}
        isLoading={isLoading}
        isFunnelSetupMode={isFunnelSetupMode}
        funnelStages={funnelStages}
        funnelTriggers={funnelTriggers}
        users={MOCK_USERS}
        onUpdateStage={handleUpdateStage}
        onAddStage={handleAddStage}
        onDeleteStage={handleDeleteStage}
        onReorderStage={handleReorderStages}
        onAddTrigger={handleAddTrigger}
        onUpdateTrigger={handleUpdateTrigger}
        onDeleteTrigger={handleDeleteTrigger}
        onReorderTrigger={handleReorderTrigger}
        missingApartmentStatusFunnels={missingApartmentStatusFunnels}
        isFunnelTriggersWarningDismissed={isFunnelTriggersWarningDismissed}
        setIsFunnelSetupMode={setIsFunnelSetupMode}
        setIsFunnelTriggersWarningDismissed={
          setIsFunnelTriggersWarningDismissed
        }
        filteredAndSortedLeads={filteredAndSortedLeads}
        resetFilters={resetFilters}
        viewMode={viewMode}
        setSelectedLead={setSelectedLead}
        selectedIds={selectedIds}
        toggleSelection={toggleSelection}
        toggleAllSelection={toggleAllSelection}
        cardConfig={cardConfig}
        handleCreateLead={handleCreateLead}
        handleStatusChange={handleStatusChange}
      />

      <LeadsManagerDrawer
        selectedLead={selectedLead}
        funnelStages={funnelStages}
        setSelectedLead={setSelectedLead}
        handleStatusChange={handleStatusChange}
        handleUpdateLead={handleUpdateLead}
        handleAddTask={handleAddTask}
        handleCompleteTask={handleCompleteTask}
        handleToggleTask={handleToggleTask}
        handleDeleteTask={handleDeleteTask}
        handleAddNote={handleAddNote}
        handleAddTag={handleAddTag}
        handleRemoveTag={handleRemoveTag}
      />

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
