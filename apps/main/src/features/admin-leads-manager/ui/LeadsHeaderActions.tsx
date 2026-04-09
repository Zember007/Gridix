import {
  FileDown,
  LayoutGrid,
  List as ListIcon,
  MoreHorizontal,
  Plus,
  Shuffle,
  SlidersHorizontal,
  Wrench,
} from "lucide-react";

type LeadsHeaderActionsProps = {
  t: (key: string) => string;
  filteredCount: number;
  totalLeadsSum: number;
  viewMode: "list" | "kanban";
  setViewMode: (value: "list" | "kanban") => void;
  settingsRef: React.RefObject<HTMLDivElement>;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (value: boolean) => void;
  onExportClick: () => void;
  setIsFunnelSetupMode: (value: boolean) => void;
  setIsCardAppearanceModalOpen: (value: boolean) => void;
  setIsDuplicateFinderOpen: (value: boolean) => void;
  setIsCreateModalOpen: (value: boolean) => void;
  readOnly?: boolean;
};

export const LeadsHeaderActions = ({
  t,
  filteredCount,
  totalLeadsSum,
  viewMode,
  setViewMode,
  settingsRef,
  isSettingsOpen,
  setIsSettingsOpen,
  onExportClick,
  setIsFunnelSetupMode,
  setIsCardAppearanceModalOpen,
  setIsDuplicateFinderOpen,
  setIsCreateModalOpen,
  readOnly = false,
}: LeadsHeaderActionsProps) => {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <div className="mr-4 hidden text-right leading-tight xl:block">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {filteredCount} {t("leads.stats.deals")}
        </div>
        <div className="text-sm font-bold text-slate-900">
          {totalLeadsSum.toLocaleString()} $
        </div>
      </div>

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

      <div className="relative" ref={settingsRef}>
        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className="rounded-lg border border-transparent p-2 text-slate-400 transition-colors hover:border-slate-200 hover:bg-slate-100 hover:text-slate-700"
        >
          <MoreHorizontal size={20} />
        </button>
        {isSettingsOpen && (
          <div className="absolute right-0 top-full z-30 mt-2 w-64 overflow-hidden rounded-lg border border-slate-100 bg-white py-1 shadow-xl duration-100 animate-in fade-in zoom-in-95">
            <button
              onClick={() => {
                onExportClick();
                setIsSettingsOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <FileDown size={16} /> {t("leads.settings.export")}
            </button>
            {!readOnly && (
              <>
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
              </>
            )}
          </div>
        )}
      </div>

      {!readOnly && (
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-[var(--admin-primary)] px-4 py-2 text-sm font-bold text-[var(--admin-text-on-primary)] shadow-sm transition-all hover:bg-[var(--admin-primary-hover)] active:scale-95 active:bg-[var(--admin-primary-active)]"
        >
          <Plus size={18} />
          {t("leads.createModal.title")}
        </button>
      )}
    </div>
  );
};
