import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  Edit,
  Trash2,
  MoreVertical,
  Calendar,
  ChevronDown,
  Wallet,
  MessageCircle,
  Briefcase,
  Phone,
  CheckSquare,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  LeadTask,
  LeadUser,
  TaskType,
  MOCK_USERS,
} from "@/entities/crm/model/types";

export const getTaskTypes = (
  t: any,
): Record<
  TaskType,
  { label: string; icon: React.ReactNode; color: string }
> => ({
  call: {
    label: t("leads.tasks.types.call"),
    icon: <Phone size={14} />,
    color: "text-green-600 bg-green-50",
  },
  meeting: {
    label: t("leads.tasks.types.meeting"),
    icon: <Briefcase size={14} />,
    color: "text-amber-600 bg-amber-50",
  },
  message: {
    label: t("leads.tasks.types.message"),
    icon: <MessageCircle size={14} />,
    color: "text-blue-600 bg-blue-50",
  },
  payment: {
    label: t("leads.tasks.types.payment"),
    icon: <Wallet size={14} />,
    color: "text-emerald-600 bg-emerald-50",
  },
  other: {
    label: t("leads.tasks.types.other"),
    icon: <CheckSquare size={14} />,
    color: "text-slate-600 bg-slate-50",
  },
});

interface TaskComposerProps {
  onAdd: (
    text: string,
    type: TaskType,
    date: string,
    time: string,
    assignedTo: LeadUser,
  ) => void;
}

export const TaskComposer: React.FC<TaskComposerProps> = ({ onAdd }) => {
  const { t, i18n } = useTranslation();
  const TASK_TYPES = getTaskTypes(t);
  const [text, setText] = useState("");
  const [type, setType] = useState<TaskType>("call");
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [showDate, setShowDate] = useState(false);
  const [time, setTime] = useState("09:00");
  const [assignedUser, setAssignedUser] = useState<LeadUser>(MOCK_USERS[0]!);
  const [isUserOpen, setIsUserOpen] = useState(false);

  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setDate(d);
  }, []);

  const setPresetDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setDate(d);
    setShowDate(false);
  };

  const handleAdd = () => {
    if (!text.trim()) return;
    onAdd(text, type, date.toISOString(), time, assignedUser);
    setText("");
    setType("call");
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setDate(d);
  };

  const formatDateLabel = (d: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString())
      return t("leads.tasks.today");
    if (d.toDateString() === tomorrow.toDateString())
      return t("leads.tasks.tomorrow");
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  };

  return (
    <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm ring-4 ring-blue-50/50 transition-all">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <div className="rounded-md bg-blue-100 p-1 text-blue-600">
            <Clock size={12} />
          </div>
          {t("leads.tasks.newTask")}
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder={t("leads.tasks.example")}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          autoFocus
        />

        <div className="flex flex-wrap items-center gap-2">
          {/* Type Selector */}
          <div className="relative">
            <button
              onClick={() => setIsTypeOpen(!isTypeOpen)}
              className={`flex h-8 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 transition-colors hover:border-blue-400 ${TASK_TYPES[
                type
              ].color.replace("bg-", "text-")}`}
            >
              {TASK_TYPES[type].icon}
              <span className="text-xs font-bold">
                {TASK_TYPES[type].label}
              </span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>

            {isTypeOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 w-40 rounded-lg border border-slate-100 bg-white py-1 shadow-xl animate-in fade-in zoom-in-95">
                {(Object.keys(TASK_TYPES) as TaskType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setType(t);
                      setIsTypeOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <div className={`rounded p-1 ${TASK_TYPES[t].color}`}>
                      {TASK_TYPES[t].icon}
                    </div>
                    {TASK_TYPES[t].label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Presets */}
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            <button
              onClick={() => setPresetDate(0)}
              className={`rounded px-2 py-1 text-[10px] font-bold transition-colors ${
                formatDateLabel(date) === t("leads.tasks.today")
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:bg-slate-200 hover:text-slate-700"
              }`}
            >
              {t("leads.tasks.today")}
            </button>
            <button
              onClick={() => setPresetDate(1)}
              className={`rounded px-2 py-1 text-[10px] font-bold transition-colors ${
                formatDateLabel(date) === t("leads.tasks.tomorrow")
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:bg-slate-200 hover:text-slate-700"
              }`}
            >
              {t("leads.tasks.tomorrow")}
            </button>
            <button
              onClick={() => setPresetDate(3)}
              className={`rounded px-2 py-1 text-[10px] font-bold transition-colors ${
                formatDateLabel(date) !== t("leads.tasks.today") &&
                formatDateLabel(date) !== t("leads.tasks.tomorrow")
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:bg-slate-200 hover:text-slate-700"
              }`}
            >
              {t("leads.tasks.plus3Days")}
            </button>
          </div>

          {/* Custom Date & Time */}
          <div className="relative flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 px-2 transition-colors hover:border-blue-300">
            <button
              onClick={() => setShowDate(!showDate)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700"
            >
              <Calendar size={12} className="text-slate-400" />
              {formatDateLabel(date)}
            </button>
            {showDate && (
              <input
                type="date"
                lang={i18n.language}
                className="absolute left-0 top-full z-50 mt-2 rounded-lg border border-slate-200 bg-white p-2 shadow-xl"
                onChange={(e) => {
                  if (e.target.value) {
                    setDate(new Date(e.target.value));
                    setShowDate(false);
                  }
                }}
              />
            )}
            <div className="mx-1 h-3 w-px bg-slate-200" />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-10 bg-transparent text-center text-xs font-bold text-slate-700 outline-none"
            />
          </div>

          {/* User Selector */}
          <div className="relative ml-auto">
            <button
              onClick={() => setIsUserOpen(!isUserOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-100 transition-colors hover:border-blue-300"
              title={assignedUser.name}
            >
              <div
                className={`h-6 w-6 rounded-full ${assignedUser.color} flex items-center justify-center text-[10px] font-bold text-white`}
              >
                {assignedUser.initials}
              </div>
            </button>

            {isUserOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-slate-100 bg-white py-1 shadow-xl animate-in fade-in zoom-in-95">
                {MOCK_USERS.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setAssignedUser(user);
                      setIsUserOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <div
                      className={`h-6 w-6 rounded-full ${user.color} flex items-center justify-center text-[10px] font-bold text-white`}
                    >
                      {user.initials}
                    </div>
                    {user.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end border-t border-slate-50 pt-2">
        <button
          onClick={handleAdd}
          disabled={!text.trim()}
          className="flex items-center gap-2 rounded-lg bg-slate-900 px-6 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckCircle2 size={14} />
          {t("leads.tasks.addTask")}
        </button>
      </div>
    </div>
  );
};

interface TaskCardProps {
  task: LeadTask;
  leadId: string;
  onComplete: (lid: string, tid: string, res: string) => void;
  onToggle: (lid: string, tid: string) => void;
  onDelete: (lid: string, tid: string) => void;
  readOnly?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  leadId,
  onComplete,
  onToggle,
  onDelete,
  readOnly = false,
}) => {
  const { t } = useTranslation();
  const TASK_TYPES = getTaskTypes(t);
  const [isCompleting, setIsCompleting] = useState(false);
  const [resultText, setResultText] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (readOnly) {
      setIsCompleting(false);
      setIsMenuOpen(false);
    }
  }, [readOnly]);

  const handleComplete = () => {
    if (!resultText.trim()) return;
    onComplete(leadId, task.id, resultText);
    setIsCompleting(false);
  };

  if (task.completed) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 opacity-75 transition-opacity hover:opacity-100">
        <div className="rounded-full bg-white p-0.5 text-green-500">
          <CheckCircle2 size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm text-slate-500 line-through decoration-slate-300">
            {task.text}
          </div>
          {task.result && (
            <div className="mt-1 inline-block rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 no-underline">
              {task.result}
            </div>
          )}
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={() => onToggle(leadId, task.id)}
            className="whitespace-nowrap text-xs text-blue-500 hover:underline"
          >
            {t("leads.tasks.return")}
          </button>
        )}
      </div>
    );
  }

  if (isCompleting && !readOnly) {
    return (
      <div className="space-y-3 rounded-xl border-2 border-blue-400 bg-white p-4 shadow-lg animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
            {t("leads.tasks.result")}
          </div>
          <button
            onClick={() => setIsCompleting(false)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        </div>
        <textarea
          className="min-h-[80px] w-full resize-none rounded-lg border border-blue-100 bg-slate-50 p-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-blue-200"
          placeholder={t("leads.tasks.whatHappened")}
          value={resultText}
          onChange={(e) => setResultText(e.target.value)}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={handleComplete}
            disabled={!resultText.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            <CheckCircle2 size={14} /> {t("leads.tasks.completeTask")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 rounded-lg p-2 ${TASK_TYPES[task.type].color} shrink-0`}
        >
          {TASK_TYPES[task.type].icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold leading-snug text-slate-800">
            {task.text}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-500">
              <Clock size={10} />
              {new Date(task.date).toLocaleString(undefined, {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
              {task.time && `, ${task.time}`}
            </div>

            {task.assignedTo && (
              <div className="ml-auto flex items-center gap-1.5">
                <div
                  className={`h-5 w-5 rounded-full ${task.assignedTo.color} flex items-center justify-center text-[9px] font-bold text-white shadow-sm ring-1 ring-white`}
                >
                  {task.assignedTo.initials}
                </div>
              </div>
            )}
          </div>
        </div>

        {!readOnly && (
          <div className="absolute right-2 top-2 flex items-center gap-1 bg-white pl-2 opacity-0 shadow-[-10px_0_10px_white] transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => setIsCompleting(true)}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-green-50 hover:text-green-600"
              title="Выполнить"
            >
              <CheckCircle2 size={16} />
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <MoreVertical size={16} />
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 top-full z-20 mt-1 w-28 rounded-lg border border-slate-100 bg-white py-1 shadow-xl animate-in fade-in zoom-in-95">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-600 hover:bg-slate-50"
                  >
                    <Edit size={12} /> {t("leads.tasks.edit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(leadId, task.id)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={12} /> {t("leads.tasks.delete")}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
