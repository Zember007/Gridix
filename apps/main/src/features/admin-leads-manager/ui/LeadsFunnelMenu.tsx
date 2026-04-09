import { Check, ChevronDown, Edit, GripVertical, X } from "lucide-react";
import { UnreadBadge } from "@/shared/ui/UnreadBadge";

type Funnel = { id: string; name: string };

type LeadsFunnelMenuProps = {
  t: (key: string) => string;
  funnelMenuRef: React.RefObject<HTMLDivElement>;
  isFunnelMenuOpen: boolean;
  setIsFunnelMenuOpen: (value: boolean) => void;
  activeFunnel: Funnel | null;
  totalUnreadCount: number;
  funnels: Funnel[];
  editingFunnelId: string | null;
  editingFunnelName: string;
  setEditingFunnelName: (value: string) => void;
  handleSaveFunnel: (id: string) => void;
  handleCancelEditFunnel: () => void;
  handleSelectFunnel: (id: string) => void;
  unreadCountByFunnelId: Record<string, number>;
  handleStartEditFunnel: (funnel: Funnel) => void;
  readOnly?: boolean;
};

export const LeadsFunnelMenu = ({
  t,
  funnelMenuRef,
  isFunnelMenuOpen,
  setIsFunnelMenuOpen,
  activeFunnel,
  totalUnreadCount,
  funnels,
  editingFunnelId,
  editingFunnelName,
  setEditingFunnelName,
  handleSaveFunnel,
  handleCancelEditFunnel,
  handleSelectFunnel,
  unreadCountByFunnelId,
  handleStartEditFunnel,
  readOnly = false,
}: LeadsFunnelMenuProps) => {
  return (
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
                      onChange={(e) => setEditingFunnelName(e.target.value)}
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
                    {!readOnly && (
                      <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => handleStartEditFunnel(funnel)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                        >
                          <Edit size={14} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
