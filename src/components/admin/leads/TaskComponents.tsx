import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LeadTask, LeadUser, TaskType, MOCK_USERS } from '@/entities/crm/model/types';

export const getTaskTypes = (t: any): Record<
  TaskType,
  { label: string; icon: React.ReactNode; color: string }
> => ({
  call: {
    label: t('leads.tasks.types.call'),
    icon: <Phone size={14} />,
    color: 'text-green-600 bg-green-50',
  },
  meeting: {
    label: t('leads.tasks.types.meeting'),
    icon: <Briefcase size={14} />,
    color: 'text-amber-600 bg-amber-50',
  },
  message: {
    label: t('leads.tasks.types.message'),
    icon: <MessageCircle size={14} />,
    color: 'text-blue-600 bg-blue-50',
  },
  payment: {
    label: t('leads.tasks.types.payment'),
    icon: <Wallet size={14} />,
    color: 'text-emerald-600 bg-emerald-50',
  },
  other: {
    label: t('leads.tasks.types.other'),
    icon: <CheckSquare size={14} />,
    color: 'text-slate-600 bg-slate-50',
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
  const { t } = useTranslation();
  const TASK_TYPES = getTaskTypes(t);
  const [text, setText] = useState('');
  const [type, setType] = useState<TaskType>('call');
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [showDate, setShowDate] = useState(false);
  const [time, setTime] = useState('09:00');
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
    setText('');
    setType('call');
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setDate(d);
  };

  const formatDateLabel = (d: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return t('leads.tasks.today');
    if (d.toDateString() === tomorrow.toDateString()) return t('leads.tasks.tomorrow');
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-4 ring-4 ring-blue-50/50 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wide">
          <div className="bg-blue-100 text-blue-600 p-1 rounded-md">
            <Clock size={12} />
          </div>
          {t('leads.tasks.newTask')}
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-4">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={t('leads.tasks.example')}
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm font-medium"
          autoFocus
        />

        <div className="flex flex-wrap items-center gap-2">
          {/* Type Selector */}
          <div className="relative">
            <button
              onClick={() => setIsTypeOpen(!isTypeOpen)}
              className={`h-8 px-3 rounded-lg border border-slate-200 bg-white flex items-center gap-2 hover:border-blue-400 transition-colors ${TASK_TYPES[type].color.replace(
                'bg-',
                'text-',
              )}`}
            >
              {TASK_TYPES[type].icon}
              <span className="text-xs font-bold">{TASK_TYPES[type].label}</span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>

            {isTypeOpen && (
              <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-lg shadow-xl border border-slate-100 z-50 py-1 animate-in fade-in zoom-in-95">
                {(Object.keys(TASK_TYPES) as TaskType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setType(t);
                      setIsTypeOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                  >
                    <div className={`p-1 rounded ${TASK_TYPES[t].color}`}>
                      {TASK_TYPES[t].icon}
                    </div>
                    {TASK_TYPES[t].label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Presets */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setPresetDate(0)}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                formatDateLabel(date) === t('leads.tasks.today')
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t('leads.tasks.today')}
            </button>
            <button
              onClick={() => setPresetDate(1)}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                formatDateLabel(date) === t('leads.tasks.tomorrow')
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t('leads.tasks.tomorrow')}
            </button>
            <button
              onClick={() => setPresetDate(3)}
              className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                formatDateLabel(date) !== t('leads.tasks.today') &&
                formatDateLabel(date) !== t('leads.tasks.tomorrow')
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t('leads.tasks.plus3Days')}
            </button>
          </div>

          {/* Custom Date & Time */}
          <div className="relative flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 px-2 hover:border-blue-300 transition-colors">
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
                className="absolute top-full left-0 mt-2 z-50 p-2 bg-white border border-slate-200 rounded-lg shadow-xl"
                onChange={(e) => {
                  if (e.target.value) {
                    setDate(new Date(e.target.value));
                    setShowDate(false);
                  }
                }}
              />
            )}
            <div className="w-px h-3 bg-slate-200 mx-1" />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none w-10 text-center"
            />
          </div>

          {/* User Selector */}
          <div className="relative ml-auto">
            <button
              onClick={() => setIsUserOpen(!isUserOpen)}
              className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center hover:border-blue-300 transition-colors"
              title={assignedUser.name}
            >
              <div
                className={`w-6 h-6 rounded-full ${assignedUser.color} text-white flex items-center justify-center text-[10px] font-bold`}
              >
                {assignedUser.initials}
              </div>
            </button>

            {isUserOpen && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-100 z-50 py-1 animate-in fade-in zoom-in-95">
                {MOCK_USERS.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setAssignedUser(user);
                      setIsUserOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                  >
                    <div
                      className={`w-6 h-6 rounded-full ${user.color} text-white flex items-center justify-center text-[10px] font-bold`}
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

      <div className="flex justify-end pt-2 border-t border-slate-50">
        <button
          onClick={handleAdd}
          disabled={!text.trim()}
          className="flex items-center gap-2 px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <CheckCircle2 size={14} />
          {t('leads.tasks.addTask')}
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
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  leadId,
  onComplete,
  onToggle,
  onDelete,
}) => {
  const { t } = useTranslation();
  const TASK_TYPES = getTaskTypes(t);
  const [isCompleting, setIsCompleting] = useState(false);
  const [resultText, setResultText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleComplete = () => {
    if (!resultText.trim()) return;
    onComplete(leadId, task.id, resultText);
    setIsCompleting(false);
  };

  if (task.completed) {
    return (
      <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 opacity-75 hover:opacity-100 transition-opacity">
        <div className="text-green-500 bg-white rounded-full p-0.5">
          <CheckCircle2 size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-slate-500 line-through decoration-slate-300 truncate">
            {task.text}
          </div>
          {task.result && (
            <div className="no-underline text-xs text-slate-700 mt-1 font-medium bg-white border border-slate-200 px-2 py-1 rounded inline-block">
              {task.result}
            </div>
          )}
        </div>
        <button
          onClick={() => onToggle(leadId, task.id)}
          className="text-xs text-blue-500 hover:underline whitespace-nowrap"
        >
          {t('leads.tasks.return')}
        </button>
      </div>
    );
  }

  if (isCompleting) {
    return (
      <div className="bg-white border-2 border-blue-400 rounded-xl p-4 space-y-3 animate-in fade-in zoom-in-95 shadow-lg">
        <div className="flex justify-between items-center">
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            {t('leads.tasks.result')}
          </div>
          <button
            onClick={() => setIsCompleting(false)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        </div>
        <textarea
          className="w-full bg-slate-50 border border-blue-100 rounded-lg p-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-200 resize-none min-h-[80px]"
          placeholder={t('leads.tasks.whatHappened')}
          value={resultText}
          onChange={(e) => setResultText(e.target.value)}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={handleComplete}
            disabled={!resultText.trim()}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={14} /> {t('leads.tasks.completeTask')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all relative">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 p-2 rounded-lg ${TASK_TYPES[task.type].color} shrink-0`}>
          {TASK_TYPES[task.type].icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-slate-800 leading-snug">
            {task.text}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
              <Clock size={10} />
              {new Date(task.date).toLocaleString(undefined, {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
              {task.time && `, ${task.time}`}
            </div>

            {task.assignedTo && (
              <div className="flex items-center gap-1.5 ml-auto">
                <div
                  className={`w-5 h-5 rounded-full ${task.assignedTo.color} text-white flex items-center justify-center text-[9px] font-bold ring-1 ring-white shadow-sm`}
                >
                  {task.assignedTo.initials}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white pl-2 shadow-[-10px_0_10px_white]">
          <button
            onClick={() => setIsCompleting(true)}
            className="p-1.5 hover:bg-green-50 text-slate-400 hover:text-green-600 rounded-lg transition-colors"
            title="Выполнить"
          >
            <CheckCircle2 size={16} />
          </button>
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
            >
              <MoreVertical size={16} />
            </button>
            {isMenuOpen && (
              <div className="absolute top-full right-0 mt-1 w-28 bg-white rounded-lg shadow-xl border border-slate-100 z-20 py-1 animate-in fade-in zoom-in-95">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-600"
                >
                  <Edit size={12} /> {t('leads.tasks.edit')}
                </button>
                <button
                  onClick={() => onDelete(leadId, task.id)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <Trash2 size={12} /> {t('leads.tasks.delete')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

