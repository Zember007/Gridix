import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FunnelTrigger, FunnelStage, LeadUser } from '@/entities/crm/model/types';
import { MoreVertical, Edit, Trash2, ArrowRight } from 'lucide-react';
import { getTriggerIcons } from '@/constants/crm';

interface FunnelTriggerCardProps {
  trigger: FunnelTrigger;
  stages: FunnelStage[];
  users: LeadUser[];
  onEdit: (trigger: FunnelTrigger) => void;
  onDelete: (triggerId: string) => void;
  onDragStart: (e: React.DragEvent, triggerId: string) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

const getEventDescription = (trigger: FunnelTrigger, t: (key: string) => string): React.ReactNode => {
  switch (trigger.event) {
    case 'on_stage_entry':
      return (
        <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
          {t('leads.triggers.onStageEntry')}
        </span>
      );
    case 'timer': {
      const delay = trigger.config?.delay || 1;
      const unit = trigger.config?.unit || 'minutes';
      const unitMap: Record<string, string> = {
        minutes: t('leads.triggers.minutes'),
        hours: t('leads.triggers.hours'),
        days: t('leads.triggers.days'),
      };
      const unitText = unitMap[unit] || unit;
      const throughText = t('leads.triggers.through');
      return (
        <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
          {throughText.replace('{delay}', String(delay)).replace('{unit}', unitText)}
        </span>
      );
    }
    case 'on_tag_add': {
      const tagName = trigger.config?.tagName;
      const tagText = t('leads.triggers.tag');
      return (
        <span className="text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
          {tagText.replace('{tagName}', tagName || '...')}
        </span>
      );
    }
    default:
      return <span className="text-slate-500">{t('leads.triggers.trigger')}</span>;
  }
};

export const FunnelTriggerCard: React.FC<FunnelTriggerCardProps> = ({
  trigger,
  stages,
  users,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  isDragging,
}) => {
  const { t } = useTranslation();
  const TRIGGER_ICONS = getTriggerIcons(t);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const iconConfig = TRIGGER_ICONS[trigger.icon] || TRIGGER_ICONS.task;
  const eventBadge = getEventDescription(trigger, t);

  const generatedSubtext = (() => {
    if (trigger.subtext) return trigger.subtext;
    const config = trigger.config;
    if (!config) return null;

    const assignedUser = users.find((u) => u.id === config.assignTo);

    switch (trigger.icon) {
      case 'task':
        return (
          <span className="flex flex-col">
            <span className="font-medium text-slate-900 truncate">
              "{config.taskText || t('leads.tasks.task')}"
            </span>
            {assignedUser && (
              <span className="text-[10px] text-slate-400 mt-0.5">
                {t('leads.tasks.responsible')} {assignedUser.name}
              </span>
            )}
          </span>
        );
      case 'notification':
        return (
          <span className="flex flex-col">
            <span className="font-medium text-slate-900 truncate">
              "{config.notificationText || t('leads.triggers.icons.notification')}"
            </span>
            {assignedUser && (
              <span className="text-[10px] text-slate-400 mt-0.5">
                {t('leads.tasks.recipient')} {assignedUser.name}
              </span>
            )}
          </span>
        );
      case 'status_change': {
        const targetStage = stages.find(
          (s) => s.id === config.targetStageId,
        );
        return (
          <span className="flex items-center gap-1 text-slate-700 font-medium">
            <ArrowRight size={12} /> {targetStage ? targetStage.name : '...'}
          </span>
        );
      }
      case 'add_tag':
        return (() => {
          const tags = Array.isArray(config.tagsToAdd)
            ? config.tagsToAdd
            : typeof config.tagsToAdd === 'string'
              ? config.tagsToAdd.split(',').map((s: string) => s.trim()).filter(Boolean)
              : [];
          const preview = tags.length ? tags.map((t: string) => `#${t}`).join(' ') : '...';
          return (
            <span className="font-medium text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              {preview}
            </span>
          );
        })();
      case 'apartment_status': {
        const status = config.apartmentStatus || 'reserved';
        return (
          <span className="font-medium text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
            {status}
          </span>
        );
      }
      default:
        return null;
    }
  })();

  return (
    <div
      draggable="true"
      onDragStart={(e) => onDragStart(e, trigger.id)}
      onDragEnd={onDragEnd}
      className={`relative group p-3 border rounded-xl bg-white hover:border-blue-300 cursor-grab transition-all shadow-sm ${
        isDragging
          ? 'opacity-50 rotate-2 border-blue-400'
          : 'border-slate-200'
      }`}
    >
      <div
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        ref={menuRef}
      >
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
        >
          <MoreVertical size={14} />
        </button>
        {isMenuOpen && (
          <div className="absolute top-full right-0 mt-1 w-32 bg-white rounded-lg shadow-xl border border-slate-100 z-30 py-1 animate-in fade-in zoom-in-95">
            <button
              onClick={() => {
                onEdit(trigger);
                setIsMenuOpen(false);
              }}
              className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
            >
              <Edit size={12} /> {t('leads.tasks.edit')}
            </button>
            <button
              onClick={() => {
                onDelete(trigger.id);
                setIsMenuOpen(false);
              }}
              className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
            >
              <Trash2 size={12} /> {t('leads.tasks.delete')}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-bold uppercase tracking-wide">
            {eventBadge}
          </div>
        </div>

        <div className="flex items-start gap-3 p-2 bg-slate-50 rounded-lg border border-slate-100">
          <div
            className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg ${iconConfig.color} bg-white shadow-sm border border-slate-100`}
          >
            {iconConfig.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">
              {iconConfig.label}
            </p>
            <div className="text-xs">
              {generatedSubtext || (
                <span className="text-slate-400 italic">{t('leads.tasks.noSettings')}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
