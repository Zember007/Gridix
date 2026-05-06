import React, { useState, useRef, useEffect } from "react";
import {
  Phone,
  MessageCircle,
  Building2,
  AlertCircle,
  User,
  Calendar,
  MoreHorizontal,
  Ghost,
  Globe,
  Instagram,
  Facebook,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { LeadTask, LeadUser, LeadSource } from "@/entities/crm/model/types";
import {
  ExtendedLead,
  FunnelStage,
  CardAppearanceConfig,
} from "@/entities/crm/model/types";
import { useDragScroll } from "@/hooks/useDragScroll";
import { UnreadBadge } from "@/shared/ui/UnreadBadge";

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const getAvatarColor = (name: string) => {
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const UserAvatar: React.FC<{ name: string; className?: string }> = ({
  name,
  className = "w-8 h-8 text-xs",
}) => (
  <div
    className={`${className} rounded-full ${getAvatarColor(name)} flex items-center justify-center font-bold text-white shadow-sm ring-2 ring-white`}
  >
    {getInitials(name)}
  </div>
);

const getRelativeDate = (dateStr: string, t: any) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) return t("leads.list.today");
  if (diffDays === 2) return t("leads.list.yesterday");
  return `${diffDays} ${t("leads.list.daysAgo")}`;
};

const getTaskStatus = (tasks?: LeadTask[]) => {
  if (!tasks || tasks.length === 0) return null;
  const activeTasks = tasks
    .filter((t) => !t.completed)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  if (activeTasks.length === 0) return null;
  const nextTask = activeTasks[0];
  if (!nextTask) return null;
  const taskDate = new Date(nextTask.date);
  const now = new Date();
  const isOverdue =
    taskDate.setHours(23, 59, 59, 999) < now.getTime() &&
    taskDate.getDate() !== now.getDate();
  const isToday =
    new Date().toDateString() === new Date(nextTask.date).toDateString();
  return { nextTask, isOverdue, isToday };
};

const getSourceIcon = (source: LeadSource) => {
  switch (source) {
    case "instagram":
      return <Instagram size={12} className="text-purple-500" />;
    case "facebook":
      return <Facebook size={12} className="text-blue-600" />;
    case "website":
      return <Globe size={12} className="text-blue-400" />;
    case "referral":
      return <User size={12} className="text-green-600" />;
    default:
      return <User size={12} className="text-slate-400" />;
  }
};

function resolveKanbanStageId(
  lead: ExtendedLead,
  stages: FunnelStage[],
): string {
  const raw =
    (lead as { pipeline_stage_id?: string | null }).pipeline_stage_id ??
    lead.status ??
    "";
  if (raw && stages.some((s) => s.id === raw)) return raw;
  return stages[0]?.id ?? "";
}

// --- KANBAN CARD ---
const KanbanCard: React.FC<{
  lead: ExtendedLead;
  funnelStages: FunnelStage[];
  users: LeadUser[];
  cardConfig: CardAppearanceConfig;
  onSelect: (l: ExtendedLead) => void;
  onStatusChange: (id: string, s: string) => void;
  onDragStart: (e: React.DragEvent, leadId: string) => void;
  readOnly?: boolean;
}> = ({
  lead,
  funnelStages,
  users,
  cardConfig,
  onSelect,
  onStatusChange,
  onDragStart,
  readOnly = false,
}) => {
  const { t } = useTranslation();
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      )
        setIsStatusOpen(false);
    };
    if (isStatusOpen)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isStatusOpen]);

  const handleDragStartLocal = (e: React.DragEvent) => {
    if (readOnly) return;
    setIsDragging(true);
    onDragStart(e, lead.id);
    setTimeout(() => setIsDragging(false), 0);
  };

  const taskStatus = getTaskStatus(lead.tasks);

  // Dynamic styles for task
  let taskClasses = "bg-slate-50 text-slate-500 border-slate-100";
  if (taskStatus?.isOverdue)
    taskClasses = "bg-red-50 text-red-600 border-red-100 animate-pulse";
  else if (taskStatus?.isToday)
    taskClasses = "bg-amber-50 text-amber-600 border-amber-100";

  const tags = lead.tags || [];

  return (
    <div
      draggable={!readOnly}
      onDragStart={handleDragStartLocal}
      onDragEnd={() => setIsDragging(false)}
      onClick={() => onSelect(lead)}
      className={`hover:border-[var(--admin-primary)]/35 group relative flex max-w-[280px] cursor-pointer select-none flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md ${isDragging ? "border-[var(--admin-primary)]/50 z-50 rotate-2 scale-105 opacity-50 shadow-xl" : ""}`}
    >
      {!(lead as unknown as { read_at?: string | null }).read_at && (
        <UnreadBadge
          variant="dot"
          className="absolute left-3 top-3 shadow-sm ring-2 ring-white"
        />
      )}
      {/* Top Row: Client & Avatar */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {cardConfig.showAvatar && (
            <UserAvatar
              name={lead.name}
              className="h-8 w-8 shrink-0 text-[10px] shadow-sm"
            />
          )}
          <div className="min-w-0">
            <div className="max-w-[140px] truncate text-sm font-bold text-slate-800">
              {lead.name}
            </div>
            {(lead as unknown as { agent_id?: string | null }).agent_id && (
              <div className="mt-1">
                <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-800">
                  {t("partners.calculator.statusPartner")}
                </span>
              </div>
            )}
            {cardConfig.showDate && (
              <div className="mt-0.5 flex items-center gap-1.5">
                {/* Source Icon (Requested Feature) */}
                <div
                  className="rounded bg-slate-100 p-0.5"
                  title={`Source: ${lead.source || "unknown"}`}
                >
                  {getSourceIcon((lead.source as LeadSource) || "website")}
                </div>
                <div className="text-[10px] text-slate-400">
                  {getRelativeDate(lead.date, t)}
                </div>
              </div>
            )}
          </div>
        </div>

        {!readOnly && (
          <div
            className="relative"
            ref={dropdownRef}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsStatusOpen(!isStatusOpen)}
              className="rounded p-1.5 text-slate-400 opacity-0 transition-opacity hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100"
            >
              <MoreHorizontal size={16} />
            </button>
            {isStatusOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-slate-100 bg-white py-1 shadow-xl duration-100 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {t("leads.kanban.changeStage")}
                </div>
                {funnelStages.map((stage) => (
                  <button
                    type="button"
                    key={stage.id}
                    onClick={() => {
                      onStatusChange(lead.id, stage.id);
                      setIsStatusOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <div
                      className={`h-2 w-2 rounded-full bg-${stage.color}-500`}
                    ></div>
                    {stage.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hero: Budget */}
      <div>
        <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {t("leads.kanban.budget")}
        </div>
        <div className="text-sm font-black tracking-tight text-slate-900">
          ${lead.price ? lead.price.toLocaleString() : "0"}
        </div>
      </div>

      {/* Project & Tags */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          {lead.project_id ? (
            <>
              <div className="border-[var(--admin-primary)]/15 bg-[var(--admin-primary)]/5 flex max-w-full items-center gap-1 truncate rounded border p-1 text-[10px] font-bold uppercase tracking-wide text-[var(--admin-primary)]">
                <Building2 size={10} className="shrink-0" />
                <span className="truncate">{lead.project}</span>
              </div>
              {lead.apartment ? (
                <div className="flex max-w-full items-center gap-1 truncate rounded border border-slate-200 bg-slate-100 p-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  <span className="truncate">{lead.apartment}</span>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500"
                title={tag}
              >
                #{tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-[10px] font-bold text-slate-400">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer: Task & Contact Actions */}
      <div className="mt-1 flex items-center justify-between border-t border-slate-50 pt-3">
        {taskStatus && taskStatus.nextTask ? (
          <div
            className={`mr-2 flex flex-1 items-center gap-1.5 rounded-md border px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide ${taskClasses}`}
          >
            {taskStatus.isOverdue ? (
              <AlertCircle size={12} />
            ) : (
              <Calendar size={12} />
            )}
            <span
              className="max-w-[100px] truncate"
              title={taskStatus.nextTask.text}
            >
              {taskStatus.nextTask.text}
            </span>
          </div>
        ) : (
          <span className="px-2 text-[10px] italic text-slate-300">
            {t("leads.kanban.noTasks")}
          </span>
        )}

        <div className="flex shrink-0 gap-1">
          <a
            href={`tel:${lead.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="hover:border-[var(--admin-primary)]/25 rounded-md border border-transparent bg-slate-50 p-1.5 text-slate-400 transition-colors hover:bg-[var(--admin-background-secondary)] hover:text-[var(--admin-primary)]"
          >
            <Phone size={14} />
          </a>
          <a
            href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="rounded-md border border-transparent bg-slate-50 p-1.5 text-slate-400 transition-colors hover:border-green-200 hover:bg-green-50 hover:text-green-600"
          >
            <MessageCircle size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};

// --- MAIN KANBAN VIEW ---
export const LeadsKanban: React.FC<{
  leads: ExtendedLead[];
  funnelStages: FunnelStage[];
  users: LeadUser[];
  cardConfig: CardAppearanceConfig;
  onSelect: (lead: ExtendedLead) => void;
  onCreate: (l: Partial<ExtendedLead>) => void;
  onStatusChange: (id: string, s: string) => void;
  readOnly?: boolean;
}> = ({
  leads,
  funnelStages,
  users,
  cardConfig,
  onSelect,
  onCreate,
  onStatusChange,
  readOnly = false,
}) => {
  const { t } = useTranslation();
  const [quickName, setQuickName] = useState("");
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const { ref, ...scrollHandlers } = useDragScroll<HTMLDivElement>();

  const handleDrop = (e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    if (readOnly) return;
    const leadId = e.dataTransfer.getData("leadId");
    if (leadId) onStatusChange(leadId, statusId);
    setDragOverColumn(null);
  };

  const firstStageId = funnelStages[0]?.id;

  return (
    <div
      ref={ref}
      {...scrollHandlers}
      className="flex h-full flex-col space-y-6 md:cursor-grab md:select-none md:flex-row md:items-stretch md:gap-4 md:space-y-0 md:overflow-x-auto md:px-2 md:pb-4"
    >
      {funnelStages.map((stage) => {
        const columnLeads = leads.filter(
          (l) => resolveKanbanStageId(l, funnelStages) === stage.id,
        );
        const totalSum = columnLeads.reduce(
          (acc, lead) => acc + (lead.price || 0),
          0,
        );
        const isDropTarget = dragOverColumn === stage.id;

        return (
          <div
            key={stage.id}
            className={`flex w-full flex-col border-2 transition-all duration-200 md:w-[320px] md:min-w-[300px] ${isDropTarget ? "border-[var(--admin-primary)]/45 bg-[var(--admin-primary)]/[0.06] scale-[1.01] border-dashed" : "border-transparent bg-slate-100/50"}`}
            onDragOver={(e) => {
              if (readOnly) return;
              e.preventDefault();
              setDragOverColumn(stage.id);
            }}
            onDrop={(e) => handleDrop(e, stage.id)}
            onDragLeave={() => setDragOverColumn(null)}
          >
            <div className="sticky top-0 z-10 mb-2 flex flex-col gap-0.5 rounded-t-xl border-b border-slate-200/50 bg-slate-100/80 px-2.5 py-2 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                  <div
                    className={`h-2 w-2 shrink-0 rounded-full bg-${stage.color}-500`}
                  ></div>
                  <span className="truncate text-xs font-bold uppercase tracking-wide text-slate-700">
                    {stage.name}
                  </span>
                </div>
                <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-bold text-slate-600 shadow-sm">
                  {columnLeads.length}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between px-1">
                <div
                  className={`h-1 flex-1 rounded-full bg-${stage.color}-200 mr-3`}
                >
                  <div
                    className={`h-full rounded-full bg-${stage.color}-500`}
                    style={{ width: "40%" }}
                  ></div>
                </div>
                <span className="font-mono text-[10px] font-bold text-slate-500">
                  ${(totalSum / 1000).toFixed(1)}k
                </span>
              </div>
            </div>

            {stage.id === firstStageId && !readOnly && (
              <div className="mb-3 md:px-2">
                <input
                  type="text"
                  placeholder={t("leads.kanban.quickAdd")}
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && quickName.trim()) {
                      onCreate({ name: quickName.trim(), status: stage.id });
                      setQuickName("");
                    }
                  }}
                  className="w-full rounded-xl border-2 border-transparent bg-white px-4 py-3 text-sm shadow-sm outline-none transition-all placeholder:text-slate-400 hover:shadow-md focus:border-[var(--admin-primary)]"
                />
              </div>
            )}

            <div className="custom-scrollbar min-h-[150px] flex-1 space-y-3 overflow-y-auto pb-20 md:px-2">
              {columnLeads.map((lead) => (
                <KanbanCard
                  key={lead.id}
                  lead={lead}
                  funnelStages={funnelStages}
                  users={users}
                  cardConfig={cardConfig}
                  onSelect={onSelect}
                  onStatusChange={onStatusChange}
                  onDragStart={(e, id) => {
                    e.dataTransfer.setData("leadId", id);
                  }}
                  readOnly={readOnly}
                />
              ))}

              {columnLeads.length === 0 && !isDropTarget && (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-12 text-slate-300">
                  <Ghost size={32} className="mb-2 opacity-50" />
                  <span className="text-xs font-medium">
                    {t("leads.kanban.empty")}
                  </span>
                </div>
              )}

              {isDropTarget && (
                <div className="border-[var(--admin-primary)]/50 bg-[var(--admin-primary)]/[0.06] flex animate-pulse items-center justify-center rounded-xl border-2 border-dashed py-12">
                  <span className="text-xs font-bold uppercase tracking-wide text-[var(--admin-primary)]">
                    {t("leads.kanban.moveHere")}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
