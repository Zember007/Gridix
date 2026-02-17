import React, { useState, useEffect } from "react";
import {
  X,
  Phone,
  MessageCircle,
  ChevronDown,
  Bell,
  Send,
  StickyNote,
  CheckCircle2,
  Pencil,
  Save,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { ExtendedLead, FunnelStage } from "@/entities/crm/model/types";
import { LeadTask, LeadUser, TaskType } from "@/entities/crm/model/types";
import {
  TaskComposer,
  TaskCard,
} from "@/components/admin/leads/TaskComponents";
import { UserAvatar } from "@/components/admin/UserAvatar";

interface Props {
  lead: ExtendedLead | null;
  funnelStages: FunnelStage[];
  onClose: () => void;
  onStatusChange: (id: string, s: string) => void;
  onUpdateLead: (id: string, data: Partial<ExtendedLead>) => void;
  onAddTask: (
    id: string,
    text: string,
    type: TaskType,
    date: string,
    time: string,
    assignedTo: LeadUser,
  ) => void;
  onCompleteTask: (lid: string, tid: string, res: string) => void;
  onToggleTask: (id: string, taskId: string) => void;
  onDeleteTask: (id: string, taskId: string) => void;
  onAddNote: (id: string, note: string) => void;
  onAddTag: (id: string, tag: string) => void;
  onRemoveTag: (id: string, tag: string) => void;
}

export const LeadDrawer: React.FC<Props> = ({
  lead,
  funnelStages,
  onClose,
  onStatusChange,
  onUpdateLead,
  onAddTask,
  onCompleteTask,
  onToggleTask,
  onDeleteTask,
  onAddNote,
  onAddTag,
  onRemoveTag,
}) => {
  const { t } = useTranslation();
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "history" | "tasks">(
    "info",
  );
  const [newTagText, setNewTagText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Edit State
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    price: "",
    project: "",
    source: "",
  });

  useEffect(() => {
    if (lead) {
      setEditForm({
        name: lead.name,
        phone: lead.phone,
        price: lead.price?.toString() || "",
        project: lead.project,
        source: lead.source || "",
      });
      setIsEditing(false);
    }
  }, [lead]);

  if (!lead) return null;

  const currentStage = funnelStages.find((s) => s.id === lead.status);
  const waLink = `https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`;

  // Group tasks logic
  const tasks = lead.tasks || [];
  const now = new Date();
  const overdueTasks = tasks.filter(
    (t) =>
      !t.completed && new Date(t.date).setHours(23, 59, 59) < now.getTime(),
  );
  const todayTasks = tasks.filter(
    (t) =>
      !t.completed && new Date(t.date).toDateString() === now.toDateString(),
  );
  const futureTasks = tasks.filter(
    (t) =>
      !t.completed &&
      new Date(t.date) > now &&
      new Date(t.date).toDateString() !== now.toDateString(),
  );
  const completedTasks = tasks.filter((t) => t.completed);

  const handleSaveEdit = () => {
    onUpdateLead(lead.id, {
      name: editForm.name,
      phone: editForm.phone,
      price: Number(editForm.price) || 0,
      project: editForm.project,
      source: editForm.source as any,
    });
    setIsEditing(false);
  };

  const renderTaskGroup = (
    title: string,
    groupTasks: LeadTask[],
    color: string,
  ) => {
    if (groupTasks.length === 0) return null;
    return (
      <div className="mb-4">
        <div
          className={`mb-2 text-xs font-bold uppercase tracking-wider ${color} flex items-center gap-2`}
        >
          {title}{" "}
          <span className="rounded-full bg-slate-100 px-1.5 text-[10px] text-slate-500">
            {groupTasks.length}
          </span>
        </div>
        <div className="space-y-2">
          {groupTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              leadId={lead.id}
              onComplete={onCompleteTask}
              onToggle={onToggleTask}
              onDelete={onDeleteTask}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-2xl duration-300 animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 bg-white px-6 py-5">
          <div className="mr-4 min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-3">
              <UserAvatar
                name={lead.name}
                className="h-10 w-10 shrink-0 text-sm shadow-sm ring-2 ring-slate-50"
              />
              <div className="min-w-0 flex-1">
                {isEditing ? (
                  <input
                    className="w-full rounded border border-slate-300 px-2 py-1 text-lg font-bold text-slate-900 outline-none focus:border-blue-500"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    autoFocus
                  />
                ) : (
                  <h2 className="truncate text-xl font-bold leading-tight text-slate-900">
                    {lead.name}
                  </h2>
                )}

                <div className="mt-1 flex items-center gap-2">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1 text-xs text-slate-400 transition-colors hover:text-blue-600"
                    >
                      <Pencil size={10} /> {t("leads.drawer.edit")}
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center gap-1 rounded bg-green-50 px-2 py-0.5 text-xs font-bold text-green-600 hover:text-green-700"
                    >
                      <Save size={12} /> {t("leads.drawer.save")}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="relative mt-3">
              {currentStage && (
                <button
                  onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                  className={`inline-flex items-center gap-2 rounded-lg border py-1 pl-2 pr-3 text-xs font-bold uppercase tracking-wider transition-all hover:shadow-sm bg-${currentStage.color}-50 text-${currentStage.color}-700 border-${currentStage.color}-200 hover:border-${currentStage.color}-300`}
                >
                  <div
                    className={`h-2 w-2 rounded-full bg-${currentStage.color}-500`}
                  ></div>
                  {currentStage.name}
                  <ChevronDown size={12} className="opacity-50" />
                </button>
              )}
              {isStatusMenuOpen && (
                <div className="absolute left-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-2xl animate-in fade-in zoom-in-95">
                  {funnelStages.map((stage) => (
                    <button
                      key={stage.id}
                      onClick={() => {
                        onStatusChange(lead.id, stage.id);
                        setIsStatusMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-3 border-l-2 border-transparent px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:border-blue-500 hover:bg-slate-50"
                    >
                      <div
                        className={`h-2.5 w-2.5 rounded-full bg-${stage.color}-500 shrink-0`}
                      ></div>
                      {stage.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex shrink-0 border-b border-slate-200 bg-white px-6">
          <button
            onClick={() => setActiveTab("info")}
            className={`flex-1 border-b-2 py-3 text-sm font-medium transition-colors ${activeTab === "info" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            {t("leads.drawer.info")}
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex-1 border-b-2 py-3 text-sm font-medium transition-colors ${activeTab === "tasks" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            {t("leads.drawer.tasks")}{" "}
            {tasks.filter((t) => !t.completed).length > 0 && (
              <span className="ml-1 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                {tasks.filter((t) => !t.completed).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 border-b-2 py-3 text-sm font-medium transition-colors ${activeTab === "history" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            {t("leads.drawer.history")}
          </button>
        </div>

        <div className="custom-scrollbar flex-1 space-y-5 overflow-y-auto bg-slate-50 p-6">
          {/* INFO TAB */}
          {activeTab === "info" && (
            <div className="space-y-6 duration-300 animate-in fade-in slide-in-from-bottom-2">
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`tel:${lead.phone}`}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
                >
                  <Phone size={16} /> {t("leads.drawer.call")}
                </a>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#20bd5a]"
                >
                  <MessageCircle size={16} /> {t("leads.drawer.whatsapp")}
                </a>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-50 bg-slate-50/30 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {t("leads.drawer.details")}
                  </h4>
                  {isEditing && (
                    <span className="animate-pulse text-[10px] font-bold text-blue-600">
                      {t("leads.drawer.editing")}
                    </span>
                  )}
                </div>
                {lead.partner && (
                  <div className="mx-4 mt-4 flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <div className="h-fit rounded-lg bg-blue-100 p-2 text-blue-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-blue-900">
                        Партнер: {lead.partner.name}
                      </h4>
                      <p className="mt-1 text-xs text-blue-700">
                        {lead.partner.email} • {lead.partner.phone}
                      </p>
                    </div>
                  </div>
                )}
                <div className="space-y-5 p-4">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      {t("leads.drawer.phone")}
                    </label>
                    {isEditing ? (
                      <input
                        className="w-full rounded border px-2 py-1 text-sm outline-none focus:border-blue-500"
                        value={editForm.phone}
                        onChange={(e) =>
                          setEditForm({ ...editForm, phone: e.target.value })
                        }
                      />
                    ) : (
                      <div className="select-all text-sm font-medium text-slate-900">
                        {lead.phone}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      {t("leads.drawer.project")}
                    </label>
                    {isEditing ? (
                      <input
                        className="w-full rounded border px-2 py-1 text-sm outline-none focus:border-blue-500"
                        value={editForm.project}
                        onChange={(e) =>
                          setEditForm({ ...editForm, project: e.target.value })
                        }
                      />
                    ) : (
                      <div className="text-sm font-medium text-slate-900">
                        {lead.project}
                      </div>
                    )}
                  </div>

                  {lead.apartment && (
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        {t("leads.drawer.apartment")}
                      </label>

                      <div className="text-sm font-medium text-slate-900">
                        {lead.apartment}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      {t("leads.drawer.budget")}
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        className="w-full rounded border px-2 py-1 font-mono text-sm outline-none focus:border-blue-500"
                        value={editForm.price}
                        onChange={(e) =>
                          setEditForm({ ...editForm, price: e.target.value })
                        }
                      />
                    ) : (
                      <div className="font-mono text-lg font-bold text-slate-900">
                        ${lead.price?.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <label className="mb-3 block text-xs font-bold uppercase tracking-wide text-slate-400">
                  {t("leads.drawer.tags")}
                </label>
                <div className="mb-3 flex flex-wrap gap-2">
                  {lead.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="group flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200"
                    >
                      {tag}
                      <button
                        onClick={() => onRemoveTag(lead.id, tag)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t("leads.drawer.addTag")}
                    value={newTagText}
                    onChange={(e) => setNewTagText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newTagText.trim()) {
                        onAddTag(lead.id, newTagText.trim());
                        setNewTagText("");
                      }
                    }}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TASKS TAB */}
          {activeTab === "tasks" && (
            <div className="space-y-6 duration-300 animate-in fade-in slide-in-from-bottom-2">
              <TaskComposer
                onAdd={(text, type, date, time, assignedTo) =>
                  onAddTask(lead.id, text, type, date, time, assignedTo)
                }
              />

              <div className="space-y-2">
                {tasks.length === 0 && (
                  <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-slate-400">
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-200">
                      <Bell size={20} className="text-slate-400" />
                    </div>
                    {t("leads.drawer.noPlannedTasks")}
                  </div>
                )}

                {renderTaskGroup(
                  t("leads.drawer.overdue"),
                  overdueTasks,
                  "text-red-500",
                )}
                {renderTaskGroup(
                  t("leads.drawer.today"),
                  todayTasks,
                  "text-amber-600",
                )}
                {renderTaskGroup(
                  t("leads.drawer.future"),
                  futureTasks,
                  "text-slate-500",
                )}

                {completedTasks.length > 0 && (
                  <div className="mt-8 border-t border-slate-200 pt-6">
                    <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                      {t("leads.drawer.completed")}{" "}
                      <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-600">
                        {completedTasks.length}
                      </span>
                    </div>
                    <div className="space-y-2 opacity-60 grayscale transition-all hover:grayscale-0">
                      {completedTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          leadId={lead.id}
                          onComplete={onCompleteTask}
                          onToggle={onToggleTask}
                          onDelete={onDeleteTask}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === "history" && (
            <div className="duration-300 animate-in fade-in slide-in-from-bottom-2">
              <div className="mb-6 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="relative">
                  <textarea
                    placeholder={t("leads.drawer.writeNote")}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                        onAddNote(lead.id, noteText);
                        setNoteText("");
                      }
                    }}
                    className="min-h-[60px] w-full resize-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                  <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                    <span className="text-[10px] font-medium text-slate-300">
                      {t("leads.drawer.ctrlEnterToSend")}
                    </span>
                    <button
                      onClick={() => {
                        if (noteText.trim()) {
                          onAddNote(lead.id, noteText);
                          setNoteText("");
                        }
                      }}
                      disabled={!noteText.trim()}
                      className="rounded-lg bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-blue-600 hover:text-white disabled:opacity-50 disabled:hover:bg-slate-100 disabled:hover:text-slate-500"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="relative space-y-6 pl-6">
                {/* Continuous Line */}
                <div className="absolute bottom-2 left-[11px] top-2 w-0.5 rounded-full bg-slate-200"></div>

                {lead.history?.map((item) => {
                  let icon = (
                    <div className="h-2 w-2 rounded-full bg-slate-400 ring-4 ring-slate-50"></div>
                  );
                  let containerClass = "bg-white border-slate-200";

                  if (item.type === "task_completion") {
                    icon = (
                      <div className="rounded-full bg-green-500 p-1 text-white shadow-sm ring-4 ring-slate-50">
                        <CheckCircle2 size={10} />
                      </div>
                    );
                    containerClass = "bg-green-50/50 border-green-100";
                  } else if (item.type === "note") {
                    icon = (
                      <div className="rounded-full bg-amber-400 p-1 text-white shadow-sm ring-4 ring-slate-50">
                        <StickyNote size={10} />
                      </div>
                    );
                    containerClass = "bg-amber-50/50 border-amber-100";
                  } else if (item.type === "automation") {
                    icon = (
                      <div className="h-2.5 w-2.5 rounded-full bg-blue-400 ring-4 ring-slate-50"></div>
                    );
                    containerClass = "bg-blue-50/30 border-blue-100";
                  } else if (item.type === "status_change") {
                    icon = (
                      <div className="h-2.5 w-2.5 rounded-full bg-slate-600 ring-4 ring-slate-50"></div>
                    );
                  }

                  return (
                    <div key={item.id} className="group relative">
                      <div className="absolute -left-[23px] top-3 z-10 flex items-center justify-center">
                        {icon}
                      </div>
                      <div className="mb-1 pl-1 text-[10px] font-medium text-slate-400">
                        {item.date}
                      </div>
                      <div
                        className={`rounded-xl border p-3.5 text-sm leading-relaxed text-slate-700 shadow-sm transition-shadow hover:shadow-md ${containerClass}`}
                      >
                        {item.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
