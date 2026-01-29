import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FunnelTrigger,
  FunnelStage,
  FunnelTriggerEvent,
  LeadUser,
} from '@/entities/crm/model/types';
import { getTriggerIcons } from '@/constants/crm';

interface FunnelTriggerEditorProps {
  trigger?: FunnelTrigger;
  stages: FunnelStage[];
  users: LeadUser[];
  onSave: (data: Omit<FunnelTrigger, 'id' | 'stageId'>) => void;
  onCancel: () => void;
}

const getEventOptions = (t: (key: string) => string): { value: FunnelTriggerEvent; label: string }[] => [
  { value: 'on_stage_entry', label: t('leads.triggers.onStageEntryOption') },
  { value: 'timer', label: t('leads.triggers.timerOption') },
  { value: 'on_tag_add', label: t('leads.triggers.onTagAddOption') },
];

export const FunnelTriggerEditor: React.FC<FunnelTriggerEditorProps> = ({
  trigger,
  stages,
  users,
  onSave,
  onCancel,
}) => {
  const { t } = useTranslation();
  const TRIGGER_ICONS = getTriggerIcons(t);
  const EVENT_OPTIONS = getEventOptions(t);
  const [event, setEvent] = useState<FunnelTriggerEvent>(
    trigger?.event || 'on_stage_entry',
  );
  const [description, setDescription] = useState(
    trigger?.description || t('leads.triggers.icons.apartmentStatus'),
  );
  const [icon, setIcon] = useState<FunnelTrigger['icon']>(
    trigger?.icon || 'apartment_status',
  );
  const [config, setConfig] = useState(trigger?.config || {});

  const handleSave = () => {
    if (!description.trim()) {
      alert(t('leads.triggers.descriptionRequired'));
      return;
    }

    let title = '';
    const selectedEvent = EVENT_OPTIONS.find((e) => e.value === event);
    if (selectedEvent) {
      title = selectedEvent.label;
      if (event === 'timer')
        title += ` (${config.delay || 1} ${config.unit || 'minutes'})`;
      if (event === 'on_tag_add' && config.tagName)
        title += ` ("${config.tagName}")`;
    }

    onSave({ title, description, subtext: '', icon, event, config });
  };

  const handleConfigChange = (key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleIconChange = (newIcon: FunnelTrigger['icon']) => {
    setIcon(newIcon);
    setDescription(TRIGGER_ICONS[newIcon].label);

    const newConfig = { ...config };
    delete newConfig.taskText;
    delete newConfig.assignTo;
    delete newConfig.targetStageId;
    delete newConfig.notificationText;
    delete newConfig.tagsToAdd;
    delete newConfig.apartmentStatus;

    setConfig(newConfig);
  };

  const renderActionConfigFields = () => {
    switch (icon) {
      case 'notification':
      case 'task': {
        const isTask = icon === 'task';
        const textPlaceholder = isTask ? t('leads.triggers.taskText') : t('leads.triggers.notificationText');
        const configKey = isTask ? 'taskText' : 'notificationText';
        return (
          <div className="space-y-2">
            <textarea
              placeholder={textPlaceholder}
              value={config[configKey] || ''}
              onChange={(e) => handleConfigChange(configKey, e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500 resize-none"
              rows={2}
            />
            <select
              value={config.assignTo || ''}
              onChange={(e) => handleConfigChange('assignTo', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-700 outline-none focus:border-blue-500"
            >
              <option value="" disabled>
                {t('leads.triggers.assignResponsible')}
              </option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        );
      }
      case 'distribution':
        return (
          <select
            value={config.assignTo || ''}
            onChange={(e) => handleConfigChange('assignTo', e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-700 outline-none focus:border-blue-500"
          >
            <option value="" disabled>
              {t('leads.triggers.assignResponsible')}
            </option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        );
      case 'status_change':
        return (
          <select
            value={config.targetStageId || ''}
            onChange={(e) =>
              handleConfigChange('targetStageId', e.target.value)
            }
            className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-700 outline-none focus:border-blue-500"
          >
            <option value="" disabled>
              {t('leads.triggers.selectStage')}
            </option>
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </select>
        );
      case 'add_tag': {
        const tagsToAddValue = Array.isArray(config.tagsToAdd)
          ? (config.tagsToAdd as string[]).join(', ')
          : (config.tagsToAdd || '');
        return (
          <input
            type="text"
            placeholder={t('leads.triggers.tagsToAddPlaceholder')}
            value={tagsToAddValue}
            onChange={(e) => {
              const raw = e.target.value;
              const parsed = raw
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
              handleConfigChange('tagsToAdd', parsed);
            }}
            className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500"
          />
        );
      }
      case 'apartment_status':
        return (
          <select
            value={config.apartmentStatus || 'reserved'}
            onChange={(e) => handleConfigChange('apartmentStatus', e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-sm text-gray-700 outline-none focus:border-blue-500"
          >
            <option value="reserved">{t('leads.triggers.apartmentStatusReserved')}</option>
            <option value="sold">{t('leads.triggers.apartmentStatusSold')}</option>
            <option value="available">{t('leads.triggers.apartmentStatusAvailable')}</option>
          </select>
        );
      default:
        return (
          <p className="text-xs text-center text-gray-400 p-4 bg-gray-50 rounded-md">
            {t('leads.triggers.noAdditionalSettings')}
          </p>
        );
    }
  };

  return (
    <div className="p-3 border-2 border-blue-400 rounded-lg bg-white shadow-lg space-y-3 animate-in fade-in duration-200">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
        {t('leads.triggers.whenToRun')}
      </span>


      <div className="h-px bg-gray-100 my-2"></div>

      {/* Action Section */}
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          {t('leads.triggers.whatToDo')}
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 mt-1">
          {(Object.keys(TRIGGER_ICONS) as Array<FunnelTrigger['icon']>).map(
            (iconKey) => (
              <button
                key={iconKey}
                onClick={() => handleIconChange(iconKey)}
                className={`flex items-center justify-center p-2 rounded-lg transition-all ${icon === iconKey
                    ? 'ring-2 ring-blue-500 ring-offset-1'
                    : ''
                  } ${TRIGGER_ICONS[iconKey].color}`}
                title={TRIGGER_ICONS[iconKey].label}
              >
                {TRIGGER_ICONS[iconKey].icon}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="space-y-2">
        <input
          type="text"
          placeholder={t('leads.triggers.description')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm font-semibold text-gray-800 outline-none focus:border-blue-500 shadow-sm"
        />
      </div>

      <div className="mt-1 p-1 bg-white rounded-md">
        {renderActionConfigFields()}
      </div>

      <div className="flex justify-end items-center gap-3 pt-3 border-t border-gray-100">
        <button
          onClick={onCancel}
          className="text-xs font-bold text-gray-500 hover:text-gray-800"
        >
          {t('leads.cancel')}
        </button>
        <button
          onClick={handleSave}
          className="text-xs font-bold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {t('leads.save')}
        </button>
      </div>
    </div>
  );
};
