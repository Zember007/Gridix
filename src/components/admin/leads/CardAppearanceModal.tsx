import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Eye, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CardAppearanceConfig, CardField, LeadUser } from '@/types/crm';
import { getCardFieldOptions } from '@/constants/crm';
import { UserAvatar } from '@/components/admin/UserAvatar';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: CardAppearanceConfig;
  onSave: (newConfig: CardAppearanceConfig) => void;
  users: LeadUser[];
}

const PreviewCard: React.FC<{
  config: CardAppearanceConfig;
  users: LeadUser[];
  t: any;
}> = ({ config, users, t }) => {
  const previewLead = {
    name: 'Название сделки',
    project: 'Название проекта',
    price: 12345,
    tags: ['Тег 1', 'Тег 2'],
    assignedTo: users[2]?.id || 'u3',
    date: new Date().toISOString(),
  };

  const user = users.find((u) => u.id === previewLead.assignedTo);

  const renderField = (field: CardField, key: number) => {
    if (field === 'none')
      return (
        <div key={key} className="h-4 bg-slate-100 rounded w-full"></div>
      );
    let content: React.ReactNode = null;
    switch (field) {
      case 'name':
        content = (
          <span className="font-bold text-sm text-slate-800">
            {previewLead.name}
          </span>
        );
        break;
      case 'project':
        content = (
          <span className="text-xs text-slate-600">{previewLead.project}</span>
        );
        break;
      case 'price':
        content = (
          <span className="text-sm font-bold text-slate-900">
            ${previewLead.price.toLocaleString()}
          </span>
        );
        break;
      case 'tags':
        content = (
          <div className="flex flex-wrap gap-1">
            {previewLead.tags.map((t) => (
              <span
                key={t}
                className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded"
              >
                {t}
              </span>
            ))}
          </div>
        );
        break;
      case 'assignedTo':
        if (!user) return null;
        content = (
          <div className="flex items-center gap-1.5">
            <div
              className={`w-4 h-4 rounded-full ${user.color} text-white flex items-center justify-center text-[8px] font-bold`}
            >
              {user.initials}
            </div>
            <span className="text-xs">{user.name}</span>
          </div>
        );
        break;
    }
    return <div key={key} className="min-h-[1.25rem]">{content}</div>;
  };

  return (
    <div className="bg-white p-3 rounded-md border border-slate-200 shadow-sm flex flex-col gap-2 relative">
      <div className="absolute top-2 right-2 text-xs text-slate-400">
        {config.showDate && t('leads.cardAppearance.today')}
      </div>
      {config.showAvatar && (
        <UserAvatar name={previewLead.name} className="w-6 h-6 text-[10px]" />
      )}
      <div className="space-y-1.5">
        {config.fields.map((f, i) => renderField(f, i))}
      </div>
    </div>
  );
};

export const CardAppearanceModal: React.FC<Props> = ({
  isOpen,
  onClose,
  config,
  onSave,
  users,
}) => {
  const { t } = useTranslation();
  const [localConfig, setLocalConfig] =
    useState<CardAppearanceConfig>(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleFieldChange = (index: number, value: CardField) => {
    const newFields = [...localConfig.fields];
    newFields[index] = value;
    setLocalConfig((prev) => ({ ...prev, fields: newFields }));
  };

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
              <Eye size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              {t('leads.cardAppearance.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-900"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-y-auto">
          <div className="p-6 space-y-6 border-r border-slate-100 overflow-y-auto custom-scrollbar">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              {t('leads.cardAppearance.options')}
            </h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer">
                <span className="text-sm font-medium text-slate-800">
                  {t('leads.cardAppearance.showAvatar')}
                </span>
                <div
                  className={`relative w-10 h-6 rounded-full transition-colors ${
                    localConfig.showAvatar ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      localConfig.showAvatar ? 'translate-x-4' : ''
                    }`}
                  ></div>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={localConfig.showAvatar}
                    onChange={(e) =>
                      setLocalConfig((p) => ({
                        ...p,
                        showAvatar: e.target.checked,
                      }))
                    }
                  />
                </div>
              </label>
              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer">
                <span className="text-sm font-medium text-slate-800">
                  {t('leads.cardAppearance.showDate')}
                </span>
                <div
                  className={`relative w-10 h-6 rounded-full transition-colors ${
                    localConfig.showDate ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      localConfig.showDate ? 'translate-x-4' : ''
                    }`}
                  ></div>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={localConfig.showDate}
                    onChange={(e) =>
                      setLocalConfig((p) => ({
                        ...p,
                        showDate: e.target.checked,
                      }))
                    }
                  />
                </div>
              </label>
            </div>

            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 pt-4 border-t border-slate-100">
              {t('leads.cardAppearance.fieldsInCard')}
            </h3>
            <div className="space-y-3">
              {localConfig.fields.slice(0, 5).map((field, index) => (
                <div key={index} className="relative">
                  <select
                    value={field}
                    onChange={(e) =>
                      handleFieldChange(index, e.target.value as CardField)
                    }
                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500"
                  >
                    {getCardFieldOptions(t).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="p-6 bg-slate-50/50 flex flex-col justify-center">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 text-center">
              {t('leads.cardAppearance.preview')}
            </h3>
            <div className="w-full max-w-xs mx-auto">
              <PreviewCard config={localConfig} users={users} t={t} />
            </div>
          </div>
        </div>

        <div className="p-5 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            {t('leads.cardAppearance.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
          >
            {t('leads.cardAppearance.save')}
          </button>
        </div>
      </div>
    </div>
  );
};
