import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  Phone,
  MessageCircle,
  ChevronDown,
  StickyNote,
  CheckCircle2,
  Printer,
  Download,
  Trash2,
  Home,
  Sparkles,
  Unlink,
  PanelLeftClose,
  PanelLeftOpen,
  MoreHorizontal,
  Paperclip,
  Mail,
  FileText,
  Share2,
  Bell,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { UnitsChessboard } from "@gridix/ui";
import { showToast } from "@gridix/utils/lib";
import { supabase } from "@/shared/api/supabase";
import {
  ExtendedLead,
  FunnelStage,
  LeadPreferences,
} from "@/entities/crm/model/types";
import { LeadTask, LeadUser, TaskType } from "@/entities/crm/model/types";
import { TaskCard } from "./TaskComponents";
import { LeadDrawerDocumentsSection } from "./LeadDrawerDocumentsSection";

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
    className={`${className} flex items-center justify-center rounded-full ${getAvatarColor(name)} font-bold text-white shadow-sm ring-1 ring-slate-200`}
  >
    {getInitials(name)}
  </div>
);

interface LeadApartmentUnit {
  id: string;
  apartment_number: string | null;
  floor_number: number;
  status: string | null;
  price?: number | null;
  sub_project_id?: string | null;
}

const AccordionSection: React.FC<{
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, isOpen, onToggle, children }) => (
  <div className="border-b border-slate-100 last:border-0">
    <button
      type="button"
      onClick={onToggle}
      className="group flex w-full items-center justify-between py-3 text-left"
    >
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 transition-colors group-hover:text-slate-600">
        {title}
      </span>
      <ChevronDown
        size={14}
        className={`text-slate-300 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
      />
    </button>
    <div
      className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[800px] pb-4 opacity-100" : "max-h-0 opacity-0"}`}
    >
      {children}
    </div>
  </div>
);

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
  onDeleteLead: (id: string) => void;
  onExportLead: (lead: ExtendedLead) => void;
  projectOptions: Array<{ id: string; name: string }>;
  users: LeadUser[];
  readOnly?: boolean;
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
  onDeleteLead,
  onExportLead,
  projectOptions,
  users,
  readOnly = false,
}) => {
  const { t } = useTranslation();
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement>(null);

  const [showInfoPanel, setShowInfoPanel] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : true,
  );
  const [activeTab, setActiveTab] = useState<
    "history" | "tasks" | "object" | "ai" | "docs"
  >("history");
  const [newTagText, setNewTagText] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [units, setUnits] = useState<LeadApartmentUnit[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);

  const [expandedSections, setExpandedSections] = useState({
    siteInfo: true,
  });

  const [composerMode, setComposerMode] = useState<
    "message" | "email" | "note" | "task"
  >("message");
  const [composerText, setComposerText] = useState("");
  const [taskParams, setTaskParams] = useState({
    type: "call" as TaskType,
    date: new Date().toISOString().slice(0, 10),
    time: "10:00",
    assignedToId: "me",
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        headerMenuRef.current &&
        !headerMenuRef.current.contains(event.target as Node)
      ) {
        setIsHeaderMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setShowInfoPanel(true);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (lead) {
      setSelectedProjectId(lead.project_id || "");
      setComposerText("");
      setIsAddingTag(false);
      setNewTagText("");
    }
  }, [lead?.id]);

  useEffect(() => {
    if (activeTab !== "object" || !selectedProjectId) {
      setUnits([]);
      return;
    }

    let cancelled = false;
    const loadUnits = async () => {
      setUnitsLoading(true);
      const { data, error } = await supabase
        .from("apartments")
        .select(
          "id, apartment_number, floor_number, status, price, sub_project_id",
        )
        .eq("project_id", selectedProjectId)
        .order("floor_number", { ascending: false });

      if (cancelled) return;
      if (error) {
        console.error("Failed to load apartments for lead binding", error);
        setUnits([]);
      } else {
        setUnits((data || []) as LeadApartmentUnit[]);
      }
      setUnitsLoading(false);
    };
    void loadUnits();

    return () => {
      cancelled = true;
    };
  }, [activeTab, selectedProjectId]);

  const currentAssignedUser = useMemo(() => {
    if (taskParams.assignedToId === "me")
      return (
        users[0] ?? {
          id: "me",
          name: t("leads.drawer.composerAssigneeMe"),
          initials: "ME",
          color: "bg-blue-500",
        }
      );
    return (
      users.find((u) => u.id === taskParams.assignedToId) ??
      users[0] ?? {
        id: "me",
        name: t("leads.drawer.composerAssigneeMe"),
        initials: "ME",
        color: "bg-blue-500",
      }
    );
  }, [taskParams.assignedToId, users, t]);

  const patchPreferences = (patch: Partial<LeadPreferences>) => {
    if (!lead) return;
    onUpdateLead(lead.id, {
      preferences: {
        ...lead.preferences,
        ...patch,
      },
    });
  };

  if (!lead) return null;

  const pipelineStageRaw =
    (lead as { pipeline_stage_id?: string | null }).pipeline_stage_id ??
    lead.status ??
    null;
  const effectiveStageId =
    pipelineStageRaw && funnelStages.some((s) => s.id === pipelineStageRaw)
      ? pipelineStageRaw
      : (funnelStages[0]?.id ?? null);

  const currentStage = effectiveStageId
    ? funnelStages.find((s) => s.id === effectiveStageId)
    : undefined;
  const stageIndex =
    effectiveStageId !== null
      ? funnelStages.findIndex((s) => s.id === effectiveStageId)
      : -1;

  const waLink = `https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`;
  const tasks = lead.tasks || [];
  const now = new Date();
  const overdueTasks = tasks.filter(
    (tk) =>
      !tk.completed && new Date(tk.date).setHours(23, 59, 59) < now.getTime(),
  );
  const todayTasks = tasks.filter(
    (tk) =>
      !tk.completed && new Date(tk.date).toDateString() === now.toDateString(),
  );
  const futureTasks = tasks.filter(
    (tk) =>
      !tk.completed &&
      new Date(tk.date) > now &&
      new Date(tk.date).toDateString() !== now.toDateString(),
  );
  const completedTasks = tasks.filter((tk) => tk.completed);

  const bindProject = (projectId: string | null) => {
    setSelectedProjectId(projectId || "");
    onUpdateLead(lead.id, {
      project_id: projectId,
      apartment_id: null,
      sub_project_id: null,
    });
  };

  const bindApartment = (unit: LeadApartmentUnit) => {
    onUpdateLead(lead.id, {
      project_id: selectedProjectId || null,
      apartment_id: unit.id,
      sub_project_id: unit.sub_project_id || null,
      price:
        typeof lead.price === "number" && lead.price > 0
          ? lead.price
          : (unit.price ?? undefined),
    });
  };

  const handleShare = async () => {
    const shareData = {
      title: `${lead.name}`,
      text: t("leads.description"),
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast(
          "success",
          t("leads.toast.exportDone.title"),
          t("leads.actions.copy"),
        );
      }
    } catch {
      /* user cancelled */
    }
  };

  const handleComposerSend = () => {
    if (!composerText.trim()) return;
    if (composerMode === "task") {
      onAddTask(
        lead.id,
        composerText.trim(),
        taskParams.type,
        taskParams.date,
        taskParams.time,
        currentAssignedUser,
      );
    } else if (composerMode === "note") {
      onAddNote(lead.id, composerText.trim());
    } else if (composerMode === "email") {
      onAddNote(lead.id, `Email: ${composerText.trim()}`);
    } else {
      onAddNote(lead.id, `Message: ${composerText.trim()}`);
    }
    setComposerText("");
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
          className={`mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${color}`}
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
              readOnly={readOnly}
            />
          ))}
        </div>
      </div>
    );
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition-all focus:border-[var(--admin-primary)] focus:ring-2 focus:ring-[var(--admin-primary)]/15";

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-slate-900/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed inset-y-0 right-0 z-[70] flex w-full flex-col overflow-hidden rounded-l-2xl bg-white font-sans shadow-2xl duration-300 animate-in slide-in-from-right md:w-[95vw] xl:w-[1280px]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
      >
        {/* Header */}
        <div className="relative z-20 flex shrink-0 flex-col border-b border-slate-200 bg-white px-4 py-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <UserAvatar
                name={lead.name}
                className="h-8 w-8 shrink-0 text-[10px]"
              />
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-bold tracking-tight text-slate-900">
                    {lead.name}
                  </h2>
                  <div className="hidden items-center gap-0.5 sm:flex">
                    {funnelStages.map((stage, idx) => {
                      const isCompleted = idx < stageIndex;
                      const isCurrent = idx === stageIndex;
                      return (
                        <React.Fragment key={stage.id}>
                          <button
                            type="button"
                            disabled={readOnly}
                            onClick={() => onStatusChange(lead.id, stage.id)}
                            className={`h-1 w-4 rounded-full transition-all ${
                              isCompleted
                                ? "bg-[var(--admin-primary)]"
                                : isCurrent
                                  ? "bg-[var(--admin-primary)]/55 ring-[var(--admin-primary)]/25 ring-1"
                                  : "bg-slate-200 hover:bg-slate-300"
                            }`}
                            title={stage.name}
                          />
                          {idx < funnelStages.length - 1 && (
                            <div className="h-0.5 w-0.5 rounded-full bg-slate-200" />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                  {currentStage && (
                    <div className="relative">
                      <button
                        type="button"
                        disabled={readOnly}
                        onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                        className="flex items-center gap-0.5 rounded-full bg-[var(--admin-background-secondary)] px-2 py-0.5 text-[10px] font-medium text-[var(--admin-primary)] hover:bg-[var(--admin-background-hover)]"
                      >
                        {currentStage.name}
                        <ChevronDown size={10} />
                      </button>
                      {isStatusMenuOpen && !readOnly && (
                        <div className="absolute left-0 top-full z-50 mt-1 w-52 rounded-xl border border-slate-100 bg-white py-1 shadow-xl">
                          {funnelStages.map((stage) => (
                            <button
                              type="button"
                              key={stage.id}
                              onClick={() => {
                                onStatusChange(lead.id, stage.id);
                                setIsStatusMenuOpen(false);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                            >
                              <span
                                className={`h-2 w-2 rounded-full bg-${stage.color}-500`}
                              />
                              {stage.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {(lead.tags || []).map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600"
                    >
                      {tag}
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => onRemoveTag(lead.id, tag)}
                          className="hover:text-red-500"
                        >
                          <X size={8} />
                        </button>
                      )}
                    </span>
                  ))}
                  {!readOnly &&
                    (isAddingTag ? (
                      <input
                        autoFocus
                        value={newTagText}
                        onChange={(e) => setNewTagText(e.target.value)}
                        onBlur={() => {
                          if (newTagText.trim()) {
                            onAddTag(lead.id, newTagText.trim());
                            setNewTagText("");
                          }
                          setIsAddingTag(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newTagText.trim()) {
                            onAddTag(lead.id, newTagText.trim());
                            setNewTagText("");
                            setIsAddingTag(false);
                          }
                        }}
                        className="w-24 rounded border border-[var(--admin-primary)] px-1.5 py-0.5 text-[9px] font-bold outline-none"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsAddingTag(true)}
                        className="rounded border border-dashed border-slate-300 px-1.5 py-0.5 text-[9px] font-bold text-slate-400 hover:border-[var(--admin-primary)] hover:text-[var(--admin-primary)]"
                      >
                        +
                      </button>
                    ))}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={handleShare}
                className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100"
                title={t("leads.drawer.shareLead")}
              >
                <Share2 size={16} />
              </button>
              <div className="relative" ref={headerMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                >
                  <MoreHorizontal size={16} />
                </button>
                {isHeaderMenuOpen && (
                  <div className="absolute right-0 z-50 mt-1 w-48 origin-top-right rounded-xl border border-slate-100 bg-white py-1 shadow-xl animate-in fade-in zoom-in-95">
                    <button
                      type="button"
                      onClick={() => {
                        window.print();
                        setIsHeaderMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Printer size={14} /> {t("leads.drawer.print")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onExportLead(lead);
                        setIsHeaderMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Download size={14} /> {t("leads.drawer.export")}
                    </button>
                    {!readOnly && (
                      <>
                        <div className="my-1 h-px bg-slate-100" />
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteLead(lead.id);
                            setIsHeaderMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} /> {t("leads.drawer.deleteLocal")}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowInfoPanel((v) => !v)}
                className="hidden rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 md:inline-flex"
                title={
                  showInfoPanel
                    ? t("leads.drawer.panelHide")
                    : t("leads.drawer.panelShow")
                }
              >
                {showInfoPanel ? (
                  <PanelLeftClose size={16} />
                ) : (
                  <PanelLeftOpen size={16} />
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="no-scrollbar flex shrink-0 gap-4 overflow-x-auto border-b border-slate-200 bg-white px-4 text-xs font-medium">
          {(
            [
              ["history", t("leads.drawer.history")],
              ["tasks", t("leads.drawer.tasks")],
              ["object", t("leads.drawer.object")],
              ["ai", t("leads.drawer.aiSelection"), true] as const,
              ["docs", t("leads.drawer.documentation")],
            ] as const
          ).map(([tab, label, isAi]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex shrink-0 items-center gap-1 whitespace-nowrap border-b-2 py-2 transition-all ${
                activeTab === tab
                  ? "border-[var(--admin-primary)] font-semibold text-[var(--admin-primary)]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {isAi && (
                <Sparkles
                  size={12}
                  className={
                    activeTab === tab
                      ? "text-[var(--admin-primary)]"
                      : "text-slate-400"
                  }
                />
              )}
              {label}
              {tab === "tasks" &&
                tasks.filter((tk) => !tk.completed).length > 0 && (
                  <span className="ml-0.5 rounded-full bg-red-100 px-1 py-px text-[9px] font-bold text-red-600">
                    {tasks.filter((tk) => !tk.completed).length}
                  </span>
                )}
            </button>
          ))}
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden bg-slate-50">
          {/* Left sidebar */}
          <div
            className={`custom-scrollbar shrink-0 overflow-y-auto border-slate-200 bg-slate-50 transition-[width,opacity] duration-300 md:border-r ${showInfoPanel ? "w-full max-w-full opacity-100 md:w-[min(33%,400px)] md:min-w-[280px]" : "pointer-events-none w-0 overflow-hidden opacity-0 md:min-w-0 md:border-0"} `}
          >
            <div className="space-y-4 p-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {t("leads.drawer.contactsSection")}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {t("leads.drawer.clientName")}
                    </label>
                    <input
                      type="text"
                      disabled={readOnly}
                      value={lead.name}
                      onChange={(e) =>
                        onUpdateLead(lead.id, { name: e.target.value })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {t("leads.drawer.phone")}
                    </label>
                    <input
                      type="text"
                      disabled={readOnly}
                      value={lead.phone}
                      onChange={(e) =>
                        onUpdateLead(lead.id, { phone: e.target.value })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {t("leads.createModal.email")}
                    </label>
                    <input
                      type="email"
                      disabled={readOnly}
                      value={lead.email || ""}
                      onChange={(e) =>
                        onUpdateLead(lead.id, { email: e.target.value })
                      }
                      placeholder="—"
                      className={inputClass}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <a
                      href={`tel:${lead.phone}`}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                    >
                      <Phone size={14} /> {t("leads.drawer.call")}
                    </a>
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#25D366] py-2 text-[11px] font-bold text-white hover:bg-[#20bd5a]"
                    >
                      <MessageCircle size={14} /> {t("leads.drawer.whatsapp")}
                    </a>
                  </div>
                </div>
              </div>

              {lead.partner && (
                <div className="relative overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-white p-4 shadow-sm">
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[var(--admin-background-secondary)]" />
                  <h3 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--admin-primary)]">
                    {t("leads.list.client")}
                  </h3>
                  <p className="text-sm font-bold text-slate-900">
                    {lead.partner.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {[lead.partner.email, lead.partner.phone]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {t("leads.drawer.preferencesShort")}
                </h3>
                <div className="mb-3 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-2.5">
                    <div className="mb-0.5 text-[10px] font-medium text-slate-400">
                      {t("leads.drawer.budgetFromShort")}
                    </div>
                    <div className="flex items-center gap-0.5">
                      <span className="text-xs font-bold text-slate-900">
                        $
                      </span>
                      <input
                        type="number"
                        disabled={readOnly}
                        value={lead.preferences.budgetMin ?? ""}
                        onChange={(e) =>
                          patchPreferences({
                            budgetMin: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                        className="w-full border-none bg-transparent p-0 text-xs font-bold text-slate-900 outline-none focus:ring-0"
                      />
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2.5">
                    <div className="mb-0.5 text-[10px] font-medium text-slate-400">
                      {t("leads.drawer.budgetToShort")}
                    </div>
                    <div className="flex items-center gap-0.5">
                      <span className="text-xs font-bold text-slate-900">
                        $
                      </span>
                      <input
                        type="number"
                        disabled={readOnly}
                        value={lead.preferences.budgetMax ?? ""}
                        onChange={(e) =>
                          patchPreferences({
                            budgetMax: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                        className="w-full border-none bg-transparent p-0 text-xs font-bold text-slate-900 outline-none focus:ring-0"
                      />
                    </div>
                  </div>
                </div>
                <label className="mb-1 block text-[10px] font-medium text-slate-400">
                  {t("leads.drawer.locationsCommaHint")}
                </label>
                <input
                  type="text"
                  disabled={readOnly}
                  value={(lead.preferences.locations || []).join(", ")}
                  onChange={(e) =>
                    patchPreferences({
                      locations: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="mb-3 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-[var(--admin-primary)]"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {t("leads.cardFields.assignedTo")}
                </h3>
                <select
                  disabled={readOnly}
                  value={lead.assigned_to_user_id || lead.assignedTo || ""}
                  onChange={(e) =>
                    onUpdateLead(lead.id, {
                      assigned_to_user_id: e.target.value || null,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-[var(--admin-primary)]"
                >
                  <option value="">{t("leads.drawer.notAssignedShort")}</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {t("leads.drawer.budget")}
                </label>
                <input
                  type="number"
                  disabled={readOnly}
                  value={lead.price ?? ""}
                  onChange={(e) =>
                    onUpdateLead(lead.id, {
                      price: e.target.value ? Number(e.target.value) : 0,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm outline-none focus:border-[var(--admin-primary)]"
                />
                <p className="mt-2 text-[10px] text-slate-400">
                  {t("leads.drawer.project")}: {lead.project}
                  {lead.apartment ? ` · ${lead.apartment}` : ""}
                </p>
              </div>

              <AccordionSection
                title={t("leads.drawer.siteRequestInfo")}
                isOpen={expandedSections.siteInfo}
                onToggle={() =>
                  setExpandedSections((s) => ({ ...s, siteInfo: !s.siteInfo }))
                }
              >
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400">
                      {t("leads.preferences.interest")}
                    </span>
                    <input
                      disabled={readOnly}
                      value={lead.preferences.interest || ""}
                      onChange={(e) =>
                        patchPreferences({ interest: e.target.value })
                      }
                      className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 outline-none focus:border-[var(--admin-primary)]"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400">
                      {t("leads.preferences.requirements")}
                    </span>
                    <textarea
                      disabled={readOnly}
                      value={lead.preferences.requirements || ""}
                      onChange={(e) =>
                        patchPreferences({ requirements: e.target.value })
                      }
                      className="mt-1 min-h-16 w-full rounded border border-slate-200 px-2 py-1.5 outline-none focus:border-[var(--admin-primary)]"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400">
                      {t("leads.drawer.purposeLabel")}
                    </span>
                    <input
                      disabled={readOnly}
                      value={lead.preferences.purpose || ""}
                      onChange={(e) =>
                        patchPreferences({ purpose: e.target.value })
                      }
                      className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 outline-none focus:border-[var(--admin-primary)]"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400">
                      {t("leads.preferences.title")} (
                      {t("leads.notes.placeholder")})
                    </span>
                    <textarea
                      disabled={readOnly}
                      value={lead.preferences.siteComment || ""}
                      onChange={(e) =>
                        patchPreferences({ siteComment: e.target.value })
                      }
                      className="mt-1 min-h-14 w-full rounded border border-slate-200 px-2 py-1.5 outline-none focus:border-[var(--admin-primary)]"
                    />
                  </div>
                </div>
              </AccordionSection>
            </div>
          </div>

          {/* Main column */}
          <div className="relative flex min-w-0 flex-1 flex-col bg-[#FAFAFA]">
            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
              {activeTab === "history" && (
                <div className="relative space-y-6 pl-4 md:pl-6">
                  <div className="absolute bottom-2 left-[11px] top-6 w-px bg-slate-200" />
                  {lead.history?.map((item) => {
                    let icon = (
                      <div className="h-2 w-2 rounded-full bg-slate-400 ring-4 ring-[#FAFAFA]" />
                    );
                    let containerClass = "bg-white border-slate-200";
                    if (item.type === "task_completion") {
                      icon = (
                        <div className="rounded-full bg-green-500 p-1 text-white shadow-sm ring-4 ring-[#FAFAFA]">
                          <CheckCircle2 size={10} />
                        </div>
                      );
                      containerClass = "bg-green-50/50 border-green-100";
                    } else if (item.type === "note") {
                      icon = (
                        <div className="rounded-full bg-amber-400 p-1 text-white shadow-sm ring-4 ring-[#FAFAFA]">
                          <StickyNote size={10} />
                        </div>
                      );
                      containerClass = "bg-amber-50/50 border-amber-100";
                    } else if (item.type === "automation") {
                      icon = (
                        <div className="h-2.5 w-2.5 rounded-full bg-[var(--admin-info)] ring-4 ring-[#FAFAFA]" />
                      );
                      containerClass =
                        "bg-[var(--admin-info)]/[0.08] border-[var(--admin-border-light)]";
                    } else if (item.type === "status_change") {
                      icon = (
                        <div className="h-2.5 w-2.5 rounded-full bg-slate-600 ring-4 ring-[#FAFAFA]" />
                      );
                    }
                    return (
                      <div key={item.id} className="relative">
                        <div className="absolute -left-[19px] top-3 z-10 flex items-center justify-center">
                          {icon}
                        </div>
                        <div className="mb-1 text-[10px] font-medium text-slate-400">
                          {item.date}
                        </div>
                        <div
                          className={`rounded-xl border p-3 text-sm leading-relaxed text-slate-700 shadow-sm ${containerClass}`}
                        >
                          {item.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === "tasks" && (
                <div className="mx-auto max-w-2xl space-y-4">
                  {tasks.length === 0 && (
                    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center text-sm text-slate-400">
                      <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
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
                      <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                        {t("leads.drawer.completed")}
                      </div>
                      <div className="space-y-2 opacity-70">
                        {completedTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            leadId={lead.id}
                            onComplete={onCompleteTask}
                            onToggle={onToggleTask}
                            onDelete={onDeleteTask}
                            readOnly={readOnly}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "object" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {t("leads.drawer.project")}
                    </label>
                    <select
                      value={selectedProjectId}
                      onChange={(event) =>
                        bindProject(event.target.value || null)
                      }
                      disabled={readOnly}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--admin-primary)] disabled:opacity-60"
                    >
                      <option value="">{t("leads.filters.projectless")}</option>
                      {projectOptions.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {!readOnly && lead.apartment_id && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateLead(lead.id, {
                              apartment_id: null,
                              sub_project_id: null,
                            })
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                        >
                          <Unlink size={14} />{" "}
                          {t("leads.drawer.unbindApartment")}
                        </button>
                      )}
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => bindProject(null)}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                        >
                          <Home size={14} /> {t("leads.filters.projectless")}
                        </button>
                      )}
                    </div>
                  </div>
                  {selectedProjectId ? (
                    <UnitsChessboard
                      units={units}
                      labels={{
                        available: t("leads.object.available"),
                        booked: t("leads.object.booked"),
                        sold: t("leads.object.sold"),
                      }}
                      loading={unitsLoading}
                      loadingText={t("leads.loading")}
                      emptyText={t("leads.object.empty")}
                      selectedUnitId={lead.apartment_id}
                      onUnitClick={(unit) => {
                        if (!readOnly) bindApartment(unit);
                      }}
                    />
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                      {t("leads.object.projectlessHint")}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "ai" && (
                <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-[var(--admin-primary)]">
                    <Sparkles size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {t("leads.ai.title")}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {t("leads.ai.description")}
                  </p>
                </div>
              )}

              {activeTab === "docs" && (
                <LeadDrawerDocumentsSection
                  leadId={lead.id}
                  documents={lead.preferences.documents ?? []}
                  readOnly={readOnly}
                  onDocumentsChange={(nextDocs) =>
                    onUpdateLead(lead.id, {
                      preferences: {
                        ...lead.preferences,
                        documents: nextDocs,
                      },
                    })
                  }
                />
              )}

              {/* Settings tab paused — placeholder was here
              {activeTab === "settings" && (
                <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
                  {t("leads.drawer.settingsTabHint")}
                </div>
              )}
              */}
            </div>

            {/* Composer */}
            {!readOnly && (
              <div className="shrink-0 border-t border-slate-200 bg-white p-3">
                <div className="mx-auto max-w-3xl">
                  <div
                    className={`focus-within:ring-[var(--admin-primary)]/20 rounded-xl border bg-white shadow-sm transition-all focus-within:ring-2 ${
                      composerMode === "task"
                        ? "border-amber-200 focus-within:ring-amber-100"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex gap-3 border-b border-slate-100 px-3 pb-0 pt-2">
                      <button
                        type="button"
                        onClick={() => setComposerMode("message")}
                        className={`pb-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                          composerMode === "message"
                            ? "border-b-2 border-[var(--admin-primary)] text-[var(--admin-primary)]"
                            : "border-b-2 border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {t("leads.drawer.composerChat")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setComposerMode("email")}
                        className={`flex items-center gap-1 pb-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                          composerMode === "email"
                            ? "border-b-2 border-[var(--admin-primary)] text-[var(--admin-primary)]"
                            : "border-b-2 border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <Mail size={12} /> {t("leads.drawer.composerEmail")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setComposerMode("note")}
                        className={`flex items-center gap-1 pb-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                          composerMode === "note"
                            ? "border-b-2 border-[var(--admin-primary)] text-[var(--admin-primary)]"
                            : "border-b-2 border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <FileText size={12} /> {t("leads.drawer.composerNote")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setComposerMode("task")}
                        className={`flex items-center gap-1 pb-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                          composerMode === "task"
                            ? "border-b-2 border-amber-600 text-amber-600"
                            : "border-b-2 border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <CheckCircle2 size={12} />{" "}
                        {t("leads.drawer.composerTask")}
                      </button>
                    </div>
                    <div className="p-3">
                      {composerMode === "task" && (
                        <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-600">
                          <select
                            value={taskParams.type}
                            onChange={(e) =>
                              setTaskParams((p) => ({
                                ...p,
                                type: e.target.value as TaskType,
                              }))
                            }
                            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] outline-none"
                          >
                            <option value="call">Call</option>
                            <option value="meeting">Meeting</option>
                            <option value="message">Message</option>
                            <option value="payment">Payment</option>
                            <option value="other">Other</option>
                          </select>
                          <input
                            type="date"
                            value={taskParams.date}
                            onChange={(e) =>
                              setTaskParams((p) => ({
                                ...p,
                                date: e.target.value,
                              }))
                            }
                            className="rounded-md border border-slate-200 px-2 py-1 text-[11px] outline-none"
                          />
                          <input
                            type="time"
                            value={taskParams.time}
                            onChange={(e) =>
                              setTaskParams((p) => ({
                                ...p,
                                time: e.target.value,
                              }))
                            }
                            className="rounded-md border border-slate-200 px-2 py-1 text-[11px] outline-none"
                          />
                          <select
                            value={taskParams.assignedToId}
                            onChange={(e) =>
                              setTaskParams((p) => ({
                                ...p,
                                assignedToId: e.target.value,
                              }))
                            }
                            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] outline-none"
                          >
                            <option value="me">
                              {t("leads.drawer.composerAssigneeMe")}
                            </option>
                            {users.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <textarea
                        value={composerText}
                        onChange={(e) => setComposerText(e.target.value)}
                        onKeyDown={(e) => {
                          if (
                            (e.ctrlKey || e.metaKey) &&
                            e.key === "Enter" &&
                            composerText.trim()
                          ) {
                            e.preventDefault();
                            handleComposerSend();
                          }
                        }}
                        placeholder={
                          composerMode === "message"
                            ? t("leads.drawer.writeNote")
                            : composerMode === "email"
                              ? t("leads.createModal.email")
                              : composerMode === "note"
                                ? t("leads.drawer.writeNote")
                                : t("leads.drawer.addTask")
                        }
                        className="min-h-[36px] w-full resize-none border-none bg-transparent p-0 text-xs text-slate-900 outline-none placeholder:text-slate-400"
                        rows={2}
                      />
                      <div className="mt-2 flex items-center justify-between">
                        <button
                          type="button"
                          disabled={!composerText.trim()}
                          onClick={handleComposerSend}
                          className={`rounded-lg px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                            composerText.trim()
                              ? "bg-slate-100 text-slate-900 hover:bg-slate-200"
                              : "bg-slate-50 text-slate-400"
                          }`}
                        >
                          {composerMode === "task"
                            ? t("leads.drawer.composerCreateTask")
                            : composerMode === "note"
                              ? t("leads.drawer.composerSaveNote")
                              : t("leads.drawer.composerSend")}
                        </button>
                        <div className="flex items-center gap-2 text-slate-400">
                          <span className="hidden text-[10px] md:inline">
                            {t("leads.drawer.ctrlEnterToSend")}
                          </span>
                          <Paperclip size={14} className="opacity-40" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
