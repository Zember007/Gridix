import React, { useState, useEffect } from "react";
import { X, CheckCircle, Eye, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  CardAppearanceConfig,
  CardField,
  LeadUser,
} from "@/entities/crm/model/types";
import { getCardFieldOptions } from "@/constants/crm";
import { UserAvatar } from "@/shared/ui/UserAvatar";

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
    name: "Название сделки",
    project: "Название проекта",
    price: 12345,
    tags: ["Тег 1", "Тег 2"],
    assignedTo: users[2]?.id || "u3",
    date: new Date().toISOString(),
  };

  const user = users.find((u) => u.id === previewLead.assignedTo);

  const renderField = (field: CardField, key: number) => {
    if (field === "none")
      return <div key={key} className="h-4 w-full rounded bg-slate-100"></div>;
    let content: React.ReactNode = null;
    switch (field) {
      case "name":
        content = (
          <span className="text-sm font-bold text-slate-800">
            {previewLead.name}
          </span>
        );
        break;
      case "project":
        content = (
          <span className="text-xs text-slate-600">{previewLead.project}</span>
        );
        break;
      case "price":
        content = (
          <span className="text-sm font-bold text-slate-900">
            ${previewLead.price.toLocaleString()}
          </span>
        );
        break;
      case "tags":
        content = (
          <div className="flex flex-wrap gap-1">
            {previewLead.tags.map((t) => (
              <span
                key={t}
                className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600"
              >
                {t}
              </span>
            ))}
          </div>
        );
        break;
      case "assignedTo":
        if (!user) return null;
        content = (
          <div className="flex items-center gap-1.5">
            <div
              className={`h-4 w-4 rounded-full ${user.color} flex items-center justify-center text-[8px] font-bold text-white`}
            >
              {user.initials}
            </div>
            <span className="text-xs">{user.name}</span>
          </div>
        );
        break;
    }
    return (
      <div key={key} className="min-h-[1.25rem]">
        {content}
      </div>
    );
  };

  return (
    <div className="relative flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-3 shadow-sm">
      <div className="absolute right-2 top-2 text-xs text-slate-400">
        {config.showDate && t("leads.cardAppearance.today")}
      </div>
      {config.showAvatar && (
        <UserAvatar name={previewLead.name} className="h-6 w-6 text-[10px]" />
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
  const [localConfig, setLocalConfig] = useState<CardAppearanceConfig>(config);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm duration-200 animate-in fade-in">
      <div className="flex max-h-[90vh] w-full max-w-4xl transform flex-col overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Eye size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              {t("leads.cardAppearance.title")}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-900"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-2">
          <div className="custom-scrollbar space-y-6 overflow-y-auto border-r border-slate-100 p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              {t("leads.cardAppearance.options")}
            </h3>
            <div className="space-y-4">
              <label className="flex cursor-pointer items-center justify-between rounded-lg bg-slate-50 p-3">
                <span className="text-sm font-medium text-slate-800">
                  {t("leads.cardAppearance.showAvatar")}
                </span>
                <div
                  className={`relative h-6 w-10 rounded-full transition-colors ${
                    localConfig.showAvatar ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                      localConfig.showAvatar ? "translate-x-4" : ""
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
              <label className="flex cursor-pointer items-center justify-between rounded-lg bg-slate-50 p-3">
                <span className="text-sm font-medium text-slate-800">
                  {t("leads.cardAppearance.showDate")}
                </span>
                <div
                  className={`relative h-6 w-10 rounded-full transition-colors ${
                    localConfig.showDate ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                      localConfig.showDate ? "translate-x-4" : ""
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

            <h3 className="border-t border-slate-100 pt-4 text-sm font-bold uppercase tracking-wider text-slate-500">
              {t("leads.cardAppearance.fieldsInCard")}
            </h3>
            <div className="space-y-3">
              {localConfig.fields.slice(0, 5).map((field, index) => (
                <div key={index} className="relative">
                  <select
                    value={field}
                    onChange={(e) =>
                      handleFieldChange(index, e.target.value as CardField)
                    }
                    className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500"
                  >
                    {getCardFieldOptions(t).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-center bg-slate-50/50 p-6">
            <h3 className="mb-4 text-center text-sm font-bold uppercase tracking-wider text-slate-500">
              {t("leads.cardAppearance.preview")}
            </h3>
            <div className="mx-auto w-full max-w-xs">
              <PreviewCard config={localConfig} users={users} t={t} />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-3 border-t border-slate-100 bg-white p-5">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
          >
            {t("leads.cardAppearance.cancel")}
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700"
          >
            {t("leads.cardAppearance.save")}
          </button>
        </div>
      </div>
    </div>
  );
};
