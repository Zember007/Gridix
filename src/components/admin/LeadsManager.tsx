import React, { useRef, useEffect, useState } from 'react';
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
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LeadsList } from '@/components/admin/leads/LeadsList';
import { LeadsKanban } from '@/components/admin/leads/LeadsKanban';
import { LeadDrawer } from '@/components/admin/leads/LeadDrawer';
import { CreateLeadModal } from '@/components/admin/leads/CreateLeadModal';
import { FunnelSetup } from '@/components/admin/leads/FunnelSetup';
import { CardAppearanceModal } from '@/components/admin/leads/CardAppearanceModal';
import { ImportModal } from '@/components/admin/leads/ImportModal';
import { DuplicateFinderModal } from '@/components/admin/leads/DuplicateFinderModal';
import { useAdminLeadsData } from '@/hooks/useAdminLeadsData';
import { EmptyState } from '@/components/admin/EmptyState';
import { showToast } from '@/shared/lib/toast';
import type { LeadsFilters } from '@/entities/crm/model/types';
import { Button } from '@/shared/ui/button';

interface LeadsManagerProps {
  projectId?: string;
  showProjectColumn?: boolean;
}

const FilterChip: React.FC<{ label: string; onRemove: () => void }> = ({
  label,
  onRemove,
}) => (
  <div className="flex items-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium pl-2.5 pr-1 py-1 rounded-md transition-colors hover:bg-slate-200 shrink-0">
    <span>{label}</span>
    <button
      onClick={onRemove}
      className="p-0.5 rounded-full hover:bg-slate-300/50"
    >
      <X size={12} />
    </button>
  </div>
);

const getSourceOptions = (t: (key: string) => string): { value: string; label: string }[] => [
  { value: 'all', label: t('leads.filters.allSources') },
  { value: 'instagram', label: t('leads.sources.instagram') },
  { value: 'website', label: t('leads.sources.website') },
  { value: 'referral', label: t('leads.sources.referral') },
  { value: 'walk_in', label: t('leads.sources.walk_in') },
  { value: 'facebook', label: t('leads.sources.facebook') },
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
    handleAddFunnel,
    handleDeleteFunnel,
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
    handleDeleteAllTriggers,
    missingApartmentStatusFunnels,
    cardConfig,
    handleSaveCardConfig,
    MOCK_USERS,
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      source: 'all',
      minBudget: '',
      maxBudget: '',
      dateFrom: '',
      dateTo: '',
      stages: [],
      assignedTo: [],
    });
    setDraftSearchTerm('');
  };

  const handleExportCSV = () => {
    if (filteredAndSortedLeads.length === 0) {
      showToast(
        'info',
        t('leads.toast.nothingToExport.title'),
        t('leads.toast.nothingToExport.desc'),
      );
      return;
    }

    const headers = [
      'ID',
      'Name',
      'Phone',
      'Project',
      'Price',
      'Status',
      'Source',
      'Date',
    ];
    const rows = filteredAndSortedLeads.map((l) => {
      const statusName =
        funnelStages.find((s) => s.id === l.status)?.name || l.status;
      const safeName = l.name.replace(/"/g, '""');
      const safeProject = l.project.replace(/"/g, '""');

      return `"${l.id}","${safeName}","${l.phone}","${safeProject}",${l.price || 0},"${statusName}","${l.source}","${l.date}"`;
    });

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `leads_export_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(
      'success',
      t('leads.toast.exportDone.title'),
      t('leads.toast.exportDone.desc'),
    );
  };

  const renderHeader = () => {
    if (isFunnelSetupMode && activeFunnel) {
      return (
        <div className="flex items-center justify-between px-4 md:px-6 h-16 border-b border-slate-200 bg-white shrink-0 sticky top-0 z-20 gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-900 truncate">
              {t('leads.funnel.title')}: {activeFunnel?.name}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                handleResetFunnelSetup();
                setIsFunnelSetupMode(false);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
            >
              {t('leads.funnel.back')}
            </button>
            <button
              onClick={() => {
                handleSaveFunnelSetup();
                showToast(
                  'success',
                  t('leads.toast.funnelSaved.title'),
                  t('leads.toast.funnelSaved.desc'),
                );
                setIsFunnelSetupMode(false);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
            >
              {t('leads.funnel.save')}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="border-b border-slate-200 bg-white shrink-0 shadow-sm">
        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center h-16 px-6 gap-4">
          {/* Funnel Selector */}
          <div className="relative shrink-0" ref={funnelMenuRef}>
            <button
              onClick={() => setIsFunnelMenuOpen(!isFunnelMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 rounded-lg transition-all border border-transparent hover:border-slate-200 group max-w-[240px]"
            >
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide truncate">
                {activeFunnel?.name || t('leads.funnel.funnels')}
              </h2>
              <ChevronDown
                size={16}
                className={`text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
                  isFunnelMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {isFunnelMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-2xl border border-slate-100 z-30 overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 pb-2 mb-2 border-b border-slate-100">
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                    {t('leads.title')}
                  </h4>
                </div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar px-2">
                  {funnels.map((funnel) => (
                    <div
                      key={funnel.id}
                      className="group flex items-center justify-between w-full text-left p-2 text-sm rounded hover:bg-slate-50"
                    >
                      {editingFunnelId === funnel.id ? (
                        <>
                          <input
                            type="text"
                            value={editingFunnelName}
                            onChange={(e) =>
                              setEditingFunnelName(e.target.value)
                            }
                            className="flex-1 bg-white border border-blue-400 rounded px-2 py-1 text-sm outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveFunnel(funnel.id)}
                            className="p-1 text-green-500 hover:bg-green-100 rounded"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={handleCancelEditFunnel}
                            className="p-1 text-red-500 hover:bg-red-100 rounded"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <GripVertical
                              size={14}
                              className="text-slate-300 group-hover:text-slate-500 cursor-move"
                            />
                            <span
                              onClick={() => {
                                handleSelectFunnel(funnel.id);
                                setIsFunnelMenuOpen(false);
                              }}
                              className={`truncate cursor-pointer ${
                                activeFunnel?.id === funnel.id
                                  ? 'font-bold text-blue-600'
                                  : 'text-slate-700'
                              }`}
                            >
                              {funnel.name}
                            </span>
                          </div>
                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleStartEditFunnel(funnel)}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded"
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

          <div className="w-px h-6 bg-slate-200"></div>

          {/* Search Bar */}
          <div className="flex-1 min-w-0 relative" ref={filterContainerRef}>
            <div className="relative group w-full max-w-3xl">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors pointer-events-none"
              />
              <input
                type="text"
                placeholder={t('leads.filters.search')}
                onClick={() => setIsFilterPanelOpen(true)}
                readOnly
                value={
                  searchTerm ||
                  Object.values(filters).some((v) =>
                    Array.isArray(v) ? v.length > 0 : v && v !== 'all',
                  )
                    ? t('leads.filters.searchPlaceholder')
                    : ''
                }
                className="w-full pl-10 pr-10 py-2 bg-slate-100 hover:bg-slate-50 border border-transparent hover:border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 outline-none transition-all cursor-pointer font-medium"
              />
              {activeFiltersCount > 0 && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md pointer-events-none">
                  {activeFiltersCount}
                </div>
              )}
            </div>

            {/* Filter Dropdown */}
            {isFilterPanelOpen && (
              <div className="absolute top-[45px] left-0 w-[800px] bg-white rounded-xl shadow-2xl border border-slate-200 z-30 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <input
                    type="text"
                    value={draftSearchTerm}
                    onChange={(e) => setDraftSearchTerm(e.target.value)}
                    placeholder={t('leads.filters.searchPlaceholder')}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 lg:col-span-3"
                    autoFocus
                  />
                  <div>
                    <select
                      value={draftFilters.source}
                      onChange={(e) =>
                        setDraftFilters({ ...draftFilters, source: e.target.value })
                      }
                      className={`w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 h-10 ${
                        draftFilters.source === 'all'
                          ? 'text-slate-400'
                          : 'text-slate-900'
                      }`}
                    >
                      <option value="all">
                        {t('leads.filters.source')}: {t('leads.filters.allSources')}
                      </option>
                      {SOURCE_OPTIONS.filter((o) => o.value !== 'all').map(
                        (option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder={t('leads.filters.budgetFrom')}
                      value={draftFilters.minBudget}
                      onChange={(e) =>
                        setDraftFilters({
                          ...draftFilters,
                          minBudget: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                    <span>-</span>
                    <input
                      type="number"
                      placeholder={t('leads.filters.budgetTo')}
                      value={draftFilters.maxBudget}
                      onChange={(e) =>
                        setDraftFilters({
                          ...draftFilters,
                          maxBudget: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 border-t border-slate-200">
                  <div className="text-xs text-slate-500">
                    {t('leads.filters.found')}:{' '}
                    <span className="font-bold text-slate-900">
                      {filteredAndSortedLeads.length}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleResetDraftFilters}
                      className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      {t('leads.filters.reset')}
                    </button>
                    <button
                      onClick={handleApplyFilters}
                      className="px-6 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
                    >
                      {t('leads.filters.apply')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Stats */}
            <div className="text-right leading-tight mr-4 hidden xl:block">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {filteredAndSortedLeads.length} {t('leads.stats.deals')}
              </div>
              <div className="text-sm font-bold text-slate-900">
                {totalLeadsSum.toLocaleString()} $
              </div>
            </div>

            {/* View Switcher */}
            <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title={t('leads.list.selectAll')}
              >
                <ListIcon size={18} />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'kanban'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title={t('leads.kanban.createDeal')}
              >
                <LayoutGrid size={18} />
              </button>
            </div>

            {/* Settings Dropdown */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
              >
                <MoreHorizontal size={20} />
              </button>
              {isSettingsOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-100 z-30 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
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
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                  >
                    <FileDown size={16} /> {t('leads.settings.export')}
                  </button>
                  <div className="h-px bg-slate-100 my-1"></div>
                  <button
                    onClick={() => {
                      setIsFunnelSetupMode(true);
                      setIsSettingsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                  >
                    <SlidersHorizontal size={16} /> {t('leads.settings.funnelSetup')}
                  </button>
                  <button
                    onClick={() => {
                      setIsCardAppearanceModalOpen(true);
                      setIsSettingsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                  >
                    <Wrench size={16} /> {t('leads.settings.cardAppearance')}
                  </button>
                  <div className="h-px bg-slate-100 my-1"></div>
                  <button
                    onClick={() => {
                      setIsDuplicateFinderOpen(true);
                      setIsSettingsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                  >
                    <Shuffle size={16} /> {t('leads.settings.findDuplicates')}
                  </button>
                </div>
              )}
            </div>

            {/* New Deal Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2"
            >
              <Plus size={18} />
              {t('leads.createModal.title')}
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap px-4 lg:px-6 pb-3 pt-1 overflow-x-auto no-scrollbar">
            {filters.source !== 'all' && (
              <FilterChip
                label={`${t('leads.filters.source')}: ${
                  SOURCE_OPTIONS.find((o) => o.value === filters.source)?.label
                }`}
                onRemove={() => setFilters((f) => ({ ...f, source: 'all' }))}
              />
            )}
            {(filters.minBudget || filters.maxBudget) && (
              <FilterChip
                label={`${t('leads.filters.budgetFrom')}: ${filters.minBudget || '0'} - ${filters.maxBudget || '∞'}`}
                onRemove={() =>
                  setFilters((f) => ({ ...f, minBudget: '', maxBudget: '' }))
                }
              />
            )}
            <button
              onClick={resetFilters}
              className="text-xs text-slate-400 hover:text-red-500 hover:underline ml-2 transition-colors whitespace-nowrap"
            >
              {t('leads.filters.clearAll')}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen animate-in fade-in duration-500 bg-white">
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-xl shadow-2xl z-40 flex items-center gap-6 animate-in slide-in-from-bottom-4">
          <span className="text-sm font-medium">
            {selectedIds.size} {t('leads.toolbar.selected')}
          </span>
          <div className="h-4 w-px bg-slate-600"></div>

          <button className="flex items-center gap-2 hover:text-slate-300 transition-colors text-sm">
            <CheckCircle2 size={16} /> {t('leads.toolbar.changeStatus')}
          </button>

          <div className="relative" ref={assignMenuRef}>
            <button
              onClick={() => setIsAssignMenuOpen(!isAssignMenuOpen)}
              className="flex items-center gap-2 hover:text-slate-300 transition-colors text-sm"
            >
              <UserPlus size={16} /> {t('leads.toolbar.assign')}
            </button>
            {isAssignMenuOpen && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 bg-white text-slate-900 rounded-xl shadow-xl border border-slate-200 py-1 animate-in fade-in zoom-in-95 origin-bottom">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  {t('leads.toolbar.manager')}
                </div>
                {MOCK_USERS.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      handleMassAssign(user.id);
                      setIsAssignMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2"
                  >
                    <div className={`w-2 h-2 rounded-full ${user.color}`}></div>
                    {user.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleDeleteSelected}
            className="flex items-center gap-2 hover:text-red-400 transition-colors text-sm"
          >
            <Trash2 size={16} /> {t('leads.toolbar.delete')}
          </button>

          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-2 p-1 hover:bg-slate-700 rounded-full"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <main className="flex-1 overflow-y-auto bg-slate-100">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-sm text-slate-500">{t('leads.loading')}</p>
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
          <div className="p-4 h-full">
            {missingApartmentStatusFunnels.length > 0 && (
              <div className="mb-4 p-4 rounded-xl border border-amber-200 bg-amber-50 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-amber-900">
                      {t('leads.warnings.funnelTriggersTitle')}
                    </p>
                    <p className="text-xs text-amber-800 mt-1">
                      {t('leads.warnings.funnelTriggersDesc')}
                    </p>
                    <p className="text-xs text-amber-800 mt-2 truncate">
                      <span className="font-bold">
                        {t('leads.warnings.missingFunnels')}:
                      </span>{' '}
                      {missingApartmentStatusFunnels.map((f) => f.name).join(', ')}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsFunnelSetupMode(true)}
                    className="shrink-0 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors"
                  >
                    {t('leads.warnings.funnelTriggersCta')}
                  </button>
                </div>
              </div>
            )}
            {filteredAndSortedLeads.length === 0 ? (
              <EmptyState
                icon={Search}
                title={t('leads.emptyState.notFound')}
                description={t('leads.emptyState.tryChangingFilters')}
                action={{ label: t('leads.emptyState.resetFilters'), onClick: resetFilters }}
              />
            ) : viewMode === 'list' ? (
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
        className="lg:hidden fixed bottom-16 right-2 z-30 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-transform hover:scale-105 group"
        aria-label={t('leads.createModal.title')}
      >
        <Plus size={18} />
      </Button>
    </div>
  );
}
