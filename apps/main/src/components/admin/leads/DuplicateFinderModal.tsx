import React, { useState, useEffect } from "react";
import {
  X,
  RefreshCw,
  Merge,
  CheckCircle2,
  AlertTriangle,
  Phone,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { ExtendedLead } from "@/entities/crm/model/types";
import { showToast } from "@gridix/utils/lib";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  leads: ExtendedLead[];
  onMerge: (masterId: string, duplicateIds: string[]) => Promise<void>;
}

interface DuplicateGroup {
  key: string;
  leads: ExtendedLead[];
}

export const DuplicateFinderModal: React.FC<Props> = ({
  isOpen,
  onClose,
  leads,
  onMerge,
}) => {
  const { t } = useTranslation();
  const [isScanning, setIsScanning] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number | null>(
    null,
  );

  const scanDuplicates = () => {
    setIsScanning(true);
    setTimeout(() => {
      const map = new Map<string, ExtendedLead[]>();

      leads.forEach((lead) => {
        const rawPhone = lead.phone.replace(/[^0-9]/g, "");
        const key = rawPhone.length > 6 ? rawPhone.slice(-9) : rawPhone;

        if (key) {
          if (!map.has(key)) map.set(key, []);
          map.get(key)?.push(lead);
        }
      });

      const duplicates: DuplicateGroup[] = [];
      map.forEach((groupLeads, key) => {
        if (groupLeads.length > 1) {
          duplicates.push({ key, leads: groupLeads });
        }
      });

      setGroups(duplicates);
      setIsScanning(false);
      if (duplicates.length === 0)
        showToast(
          "info",
          t("leads.toast.duplicatesNotFound.title"),
          t("leads.toast.duplicatesNotFound.desc"),
        );
    }, 1000);
  };

  useEffect(() => {
    if (isOpen) {
      scanDuplicates();
      setSelectedGroupIndex(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleMerge = async (masterId: string) => {
    if (selectedGroupIndex === null) return;
    const group = groups[selectedGroupIndex];
    if (!group) return;
    const duplicateIds = group.leads
      .filter((l) => l.id !== masterId)
      .map((l) => l.id);

    if (duplicateIds.length === 0) return;

    try {
      setIsMerging(true);
      await onMerge(masterId, duplicateIds);

      const newGroups = [...groups];
      newGroups.splice(selectedGroupIndex, 1);
      setGroups(newGroups);
      setSelectedGroupIndex(null);
    } catch {
      // Ошибка уже показывается в handleMergeLeads (toast).
      // Оставляем группу на месте, чтобы пользователь мог повторить попытку.
    } finally {
      setIsMerging(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm duration-200 animate-in fade-in">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50/50 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2 text-amber-600">
              <Merge size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {t("leads.duplicates.title")}
              </h2>
              <p className="text-xs text-slate-500">
                {isScanning
                  ? t("leads.duplicates.scanning")
                  : t("leads.duplicates.foundGroups", { count: groups.length })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isMerging}
            className="text-slate-400 transition-colors hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar: List of Groups */}
          <div className="custom-scrollbar w-1/3 overflow-y-auto border-r border-slate-200 bg-slate-50">
            {isScanning ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
                <RefreshCw size={24} className="animate-spin" />
                <span className="text-sm">
                  {t("leads.duplicates.searching")}
                </span>
              </div>
            ) : groups.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-slate-400">
                <CheckCircle2 size={32} className="text-green-500" />
                <span className="text-sm font-medium text-slate-600">
                  {t("leads.duplicates.noDuplicates")}
                </span>
                <p className="text-xs">{t("leads.duplicates.perfectOrder")}</p>
                <button
                  onClick={scanDuplicates}
                  className="mt-2 text-xs text-blue-600 hover:underline"
                >
                  {t("leads.duplicates.scanAgain")}
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {groups.map((group, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedGroupIndex(idx)}
                    className={`relative w-full p-4 text-left transition-colors hover:bg-white ${
                      selectedGroupIndex === idx
                        ? "border-l-4 border-l-blue-500 bg-white shadow-inner"
                        : ""
                    }`}
                  >
                    <div className="mb-1 flex items-start justify-between">
                      <span className="text-sm font-bold text-slate-800">
                        +{group.key}
                      </span>
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                        {group.leads.length}
                      </span>
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {group.leads.map((l) => l.name).join(", ")}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main Area: Comparison */}
          <div className="custom-scrollbar flex-1 overflow-y-auto bg-white p-6">
            {selectedGroupIndex !== null && groups[selectedGroupIndex] ? (
              <div className="space-y-6">
                <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
                  <AlertTriangle size={16} className="text-amber-500" />
                  {t("leads.duplicates.selectMaster")}
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {groups[selectedGroupIndex].leads.map((lead) => (
                    <div
                      key={lead.id}
                      className="group relative flex h-full flex-col rounded-xl border p-4 transition-all hover:border-blue-300"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-500">
                            {lead.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">
                              {lead.name}
                            </h4>
                            <p className="text-xs text-slate-500">
                              {t("leads.duplicates.created")}{" "}
                              {new Date(lead.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`rounded border px-2 py-1 text-[10px] font-medium ${
                            lead.status === "s6"
                              ? "border-green-200 bg-green-50 text-green-700"
                              : "border-slate-200 bg-slate-50 text-slate-600"
                          }`}
                        >
                          {lead.status}
                        </div>
                      </div>

                      <div className="mb-4 flex-1 space-y-2 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Phone size={12} /> {lead.phone}
                        </div>
                        {lead.email && (
                          <div className="flex items-center gap-2">
                            @{lead.email}
                          </div>
                        )}
                        {lead.project && (
                          <div className="font-medium text-slate-800">
                            {t("leads.duplicates.project")} {lead.project}
                          </div>
                        )}
                        {lead.price && (
                          <div>
                            {t("leads.duplicates.budget")}{" "}
                            <span className="font-mono">
                              ${lead.price.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => void handleMerge(lead.id)}
                        disabled={isMerging}
                        className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-blue-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-slate-100 disabled:hover:text-slate-700"
                      >
                        <CheckCircle2 size={14} />{" "}
                        {t("leads.duplicates.keepThis")}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-slate-300">
                <Merge size={48} className="mb-4 opacity-50" />
                <p className="text-sm">{t("leads.duplicates.selectGroup")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
