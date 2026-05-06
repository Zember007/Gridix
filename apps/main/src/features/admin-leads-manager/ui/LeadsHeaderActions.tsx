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
    <div className="flex shrink-0 items-center gap-3 sm:gap-4">
      <div className="hidden items-center gap-1 text-sm text-slate-500 lg:flex">
        <span>
          {filteredCount} {t("leads.stats.deals")}:
        </span>
        <span className="font-medium text-slate-700">
          {totalLeadsSum.toLocaleString()} $
        </span>
      </div>

      <div className="relative" ref={settingsRef}>
        <button
          type="button"
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100"
        >
          <MoreHorizontal size={18} />
        </button>
        {isSettingsOpen && (
          <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border border-slate-200 bg-white py-1 shadow-xl duration-100 animate-in fade-in zoom-in-95 md:w-56">
            <button
              type="button"
              onClick={() => {
                setViewMode("list");
                setIsSettingsOpen(false);
              }}
              className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-slate-50 ${viewMode === "list" ? "font-semibold text-slate-900" : "text-slate-700"}`}
            >
              <ListIcon size={16} /> {t("leads.views.list")}
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("kanban");
                setIsSettingsOpen(false);
              }}
              className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-slate-50 ${viewMode === "kanban" ? "font-semibold text-slate-900" : "text-slate-700"}`}
            >
              <LayoutGrid size={16} /> {t("leads.views.kanban")}
            </button>

            {!readOnly && (
              <>
                <div className="my-1 h-px bg-slate-100" />
                <button
                  type="button"
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
                  type="button"
                  onClick={() => {
                    setIsCardAppearanceModalOpen(true);
                    setIsSettingsOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Wrench size={16} /> {t("leads.settings.cardAppearance")}
                </button>
                <button
                  type="button"
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

            <div className="my-1 h-px bg-slate-100" />
            <button
              type="button"
              onClick={() => {
                onExportClick();
                setIsSettingsOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <FileDown size={16} /> {t("leads.settings.export")}
            </button>
          </div>
        )}
      </div>

      {!readOnly && (
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1 rounded-md bg-[var(--admin-primary)] px-3 py-1.5 text-sm font-bold text-[var(--admin-text-on-primary)] transition-colors hover:bg-[var(--admin-primary-hover)] sm:px-4"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">
            {t("leads.createModal.createDeal")}
          </span>
        </button>
      )}
    </div>
  );
};
