import React from "react";
import {
  Building2,
  Calendar,
  ChevronRight,
  MessageCircle,
  Phone,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { ExtendedLead, FunnelStage } from "@/entities/crm/model/types";
import { LeadTask } from "@/entities/crm/model/types";
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
  if (diffDays <= 7) return `${diffDays} ${t("leads.list.daysAgo")}`;
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
};

const getTaskStatusInfo = (tasks?: LeadTask[]) => {
  if (!tasks || tasks.length === 0) return null;
  const activeTasks = tasks
    .filter((t) => !t.completed)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  if (activeTasks.length === 0) return null;

  const task = activeTasks[0];
  if (!task) return null;
  const taskDate = new Date(task.date);
  const now = new Date();
  const isOverdue =
    taskDate.setHours(23, 59, 59, 999) < now.getTime() &&
    taskDate.toDateString() !== now.toDateString();
  const isToday =
    new Date().toDateString() === new Date(task.date).toDateString();

  return { task, isOverdue, isToday };
};

interface LeadsListProps {
  leads: ExtendedLead[];
  funnelStages: FunnelStage[];
  onSelect: (lead: ExtendedLead) => void;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAll: () => void;
}

export const LeadsList: React.FC<LeadsListProps> = ({
  leads,
  funnelStages,
  onSelect,
  selectedIds,
  onToggleSelection,
  onToggleAll,
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="custom-scrollbar flex-1 overflow-auto">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-slate-50/90 text-xs font-bold uppercase tracking-wider text-slate-500 shadow-sm backdrop-blur-sm">
            <tr>
              <th className="w-10 border-b border-slate-200 px-4 py-3">
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={
                      leads.length > 0 && selectedIds.size === leads.length
                    }
                    onChange={onToggleAll}
                    className="h-4 w-4 cursor-pointer rounded border-slate-300 text-[var(--admin-primary)] transition-all focus:ring-[var(--admin-primary)]"
                  />
                </div>
              </th>
              <th className="border-b border-slate-200 px-4 py-3">
                {t("leads.list.client")}
              </th>
              <th className="border-b border-slate-200 px-4 py-3">
                {t("leads.list.status")}
              </th>
              <th className="border-b border-slate-200 px-4 py-3">
                {t("leads.list.task")}
              </th>
              <th className="hidden border-b border-slate-200 px-4 py-3 md:table-cell">
                {t("leads.list.project")}
              </th>
              <th className="border-b border-slate-200 px-4 py-3 text-right">
                {t("leads.list.budget")}
              </th>
              <th className="w-24 border-b border-slate-200 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((lead) => {
              const pipelineRaw =
                (
                  lead as {
                    pipeline_stage_id?: string | null;
                  }
                ).pipeline_stage_id ??
                lead.status ??
                null;
              const effectiveStageId =
                pipelineRaw && funnelStages.some((s) => s.id === pipelineRaw)
                  ? pipelineRaw
                  : (funnelStages[0]?.id ?? null);
              const stage = effectiveStageId
                ? funnelStages.find((s) => s.id === effectiveStageId)
                : undefined;
              const statusLabel = stage?.name || t("leads.list.stageUnset");
              const statusColor = stage?.color || "slate";
              const taskInfo = getTaskStatusInfo(lead.tasks);
              const waLink = `https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`;

              return (
                <tr
                  key={lead.id}
                  onClick={() => onSelect(lead)}
                  className={`hover:bg-[var(--admin-primary)]/[0.06] group cursor-pointer transition-all duration-200 ${selectedIds.has(lead.id) ? "bg-[var(--admin-primary)]/[0.08]" : ""}`}
                >
                  <td
                    className="px-4 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(lead.id)}
                        onChange={() => onToggleSelection(lead.id)}
                        className="h-4 w-4 cursor-pointer rounded border-slate-300 text-[var(--admin-primary)] focus:ring-[var(--admin-primary)]"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <UserAvatar
                          name={lead.name}
                          className="h-9 w-9 shrink-0 text-xs shadow-sm ring-1 ring-slate-100"
                        />
                        {!(lead as unknown as { read_at?: string | null })
                          .read_at && (
                          <UnreadBadge
                            variant="dot"
                            className="absolute -left-0.5 -top-0.5 shadow-sm ring-2 ring-white"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-slate-900 transition-colors group-hover:text-[var(--admin-primary)]">
                          {lead.name}
                        </div>
                        {(lead as unknown as { agent_id?: string | null })
                          .agent_id && (
                          <div className="mt-0.5">
                            <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-800">
                              {t("partners.calculator.statusPartner")}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Calendar size={10} /> {getRelativeDate(lead.date, t)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1">
                      <span
                        className={`inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-${statusColor}-100 text-${statusColor}-700 border border-${statusColor}-200`}
                      >
                        {statusLabel}
                      </span>
                      {lead.tags && lead.tags.length > 0 && (
                        <div className="flex gap-1">
                          {lead.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-400"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {taskInfo ? (
                      <div
                        className={`flex items-center gap-2 text-xs font-medium ${taskInfo.isOverdue ? "text-red-600" : taskInfo.isToday ? "text-amber-600" : "text-slate-600"}`}
                      >
                        {taskInfo.isOverdue ? (
                          <AlertCircle size={14} className="shrink-0" />
                        ) : (
                          <Clock size={14} className="shrink-0" />
                        )}
                        <span className="max-w-[120px] truncate md:max-w-[180px]">
                          {taskInfo.task.text}
                        </span>
                      </div>
                    ) : (
                      <span className="flex items-center gap-1 text-xs italic text-slate-300">
                        <CheckCircle2 size={12} /> {t("leads.list.noTasks")}
                      </span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    {lead.project_id ? (
                      <>
                        <div className="flex items-center gap-1.5">
                          <div className="rounded bg-slate-100 p-1 text-slate-400">
                            <Building2 size={12} />
                          </div>
                          <div className="max-w-[140px] truncate text-sm font-medium text-slate-700">
                            {lead.project}
                          </div>
                        </div>
                        {lead.apartment ? (
                          <div className="pl-6 text-[10px] text-slate-400">
                            {lead.apartment}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <span className="text-sm text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {lead.price ? (
                      <div className="font-mono text-sm font-bold text-slate-900">
                        ${lead.price.toLocaleString()}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex translate-x-2 transform items-center justify-end gap-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100">
                      <a
                        href={`tel:${lead.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:bg-[var(--admin-primary)]/[0.08] rounded-lg bg-slate-50 p-2 text-slate-400 transition-colors hover:text-[var(--admin-primary)]"
                        title={t("leads.list.call")}
                      >
                        <Phone size={16} />
                      </a>
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-lg bg-slate-50 p-2 text-slate-400 transition-colors hover:bg-green-50 hover:text-green-600"
                        title={t("leads.list.whatsapp")}
                      >
                        <MessageCircle size={16} />
                      </a>
                      <button className="rounded-lg bg-slate-50 p-2 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-900">
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
