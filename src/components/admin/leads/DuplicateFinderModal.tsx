import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  Merge,
  CheckCircle2,
  AlertTriangle,
  Phone,
} from 'lucide-react';
import { useTranslation } from 'node_modules/react-i18next';
import { ExtendedLead } from '@/types/crm';
import { showToast } from '@/lib/toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  leads: ExtendedLead[];
  onMerge: (masterId: string, duplicateIds: string[]) => void;
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
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number | null>(
    null,
  );

  const scanDuplicates = () => {
    setIsScanning(true);
    setTimeout(() => {
      const map = new Map<string, ExtendedLead[]>();

      leads.forEach((lead) => {
        const rawPhone = lead.phone.replace(/[^0-9]/g, '');
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
        showToast('info', t('leads.toast.duplicatesNotFound.title'), t('leads.toast.duplicatesNotFound.desc'));
    }, 1000);
  };

  useEffect(() => {
    if (isOpen) {
      scanDuplicates();
      setSelectedGroupIndex(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleMerge = (masterId: string) => {
    if (selectedGroupIndex === null) return;
    const group = groups[selectedGroupIndex];
    if (!group) return;
    const duplicateIds = group.leads
      .filter((l) => l.id !== masterId)
      .map((l) => l.id);

    onMerge(masterId, duplicateIds);

    const newGroups = [...groups];
    newGroups.splice(selectedGroupIndex, 1);
    setGroups(newGroups);
    setSelectedGroupIndex(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 text-amber-600 p-2 rounded-lg">
              <Merge size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {t('leads.duplicates.title')}
              </h2>
              <p className="text-xs text-slate-500">
                {isScanning
                  ? t('leads.duplicates.scanning')
                  : t('leads.duplicates.foundGroups', { count: groups.length })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar: List of Groups */}
          <div className="w-1/3 border-r border-slate-200 bg-slate-50 overflow-y-auto custom-scrollbar">
            {isScanning ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                <RefreshCw size={24} className="animate-spin" />
                <span className="text-sm">{t('leads.duplicates.searching')}</span>
              </div>
            ) : groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 p-6 text-center">
                <CheckCircle2 size={32} className="text-green-500" />
                <span className="text-sm font-medium text-slate-600">
                  {t('leads.duplicates.noDuplicates')}
                </span>
                <p className="text-xs">
                  {t('leads.duplicates.perfectOrder')}
                </p>
                <button
                  onClick={scanDuplicates}
                  className="text-xs text-blue-600 hover:underline mt-2"
                >
                  {t('leads.duplicates.scanAgain')}
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {groups.map((group, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedGroupIndex(idx)}
                    className={`w-full text-left p-4 hover:bg-white transition-colors relative ${
                      selectedGroupIndex === idx
                        ? 'bg-white shadow-inner border-l-4 border-l-blue-500'
                        : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-slate-800 text-sm">
                        +{group.key}
                      </span>
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {group.leads.length}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {group.leads.map((l) => l.name).join(', ')}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main Area: Comparison */}
          <div className="flex-1 bg-white overflow-y-auto custom-scrollbar p-6">
            {selectedGroupIndex !== null && groups[selectedGroupIndex] ? (
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                  <AlertTriangle size={16} className="text-amber-500" />
                  {t('leads.duplicates.selectMaster')}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {groups[selectedGroupIndex].leads.map((lead) => (
                    <div
                      key={lead.id}
                      className="border rounded-xl p-4 hover:border-blue-300 transition-all flex flex-col h-full relative group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                            {lead.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">
                              {lead.name}
                            </h4>
                            <p className="text-xs text-slate-500">
                              {t('leads.duplicates.created')}{' '}
                              {new Date(lead.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`text-[10px] px-2 py-1 rounded border font-medium ${
                            lead.status === 's6'
                              ? 'bg-green-50 border-green-200 text-green-700'
                              : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          {lead.status}
                        </div>
                      </div>

                      <div className="space-y-2 text-xs text-slate-600 mb-4 flex-1">
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
                            {t('leads.duplicates.project')} {lead.project}
                          </div>
                        )}
                        {lead.price && (
                          <div>
                            {t('leads.duplicates.budget')}{' '}
                            <span className="font-mono">
                              ${lead.price.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleMerge(lead.id)}
                        className="w-full py-2.5 mt-auto bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={14} /> {t('leads.duplicates.keepThis')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-300">
                <Merge size={48} className="mb-4 opacity-50" />
                <p className="text-sm">
                  {t('leads.duplicates.selectGroup')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
