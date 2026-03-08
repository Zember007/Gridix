import { CheckCircle2, Trash2, UserPlus, X } from "lucide-react";

type User = {
  id: string;
  name: string;
  color: string;
};

type LeadsSelectionToolbarProps = {
  t: (key: string) => string;
  selectedCount: number;
  users: User[];
  assignMenuRef: React.RefObject<HTMLDivElement>;
  isAssignMenuOpen: boolean;
  setIsAssignMenuOpen: (value: boolean) => void;
  handleMassAssign: (userId: string) => void;
  handleDeleteSelected: () => void;
  clearSelection: () => void;
};

export const LeadsSelectionToolbar = ({
  t,
  selectedCount,
  users,
  assignMenuRef,
  isAssignMenuOpen,
  setIsAssignMenuOpen,
  handleMassAssign,
  handleDeleteSelected,
  clearSelection,
}: LeadsSelectionToolbarProps) => {
  if (selectedCount <= 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-6 rounded-xl bg-slate-800 px-6 py-3 text-white shadow-2xl animate-in slide-in-from-bottom-4">
      <span className="text-sm font-medium">
        {selectedCount} {t("leads.toolbar.selected")}
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
            {users.map((user) => (
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
        onClick={clearSelection}
        className="ml-2 rounded-full p-1 hover:bg-slate-700"
      >
        <X size={16} />
      </button>
    </div>
  );
};
