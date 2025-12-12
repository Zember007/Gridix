import React from 'react';
import { Building2, Calendar, ChevronRight, MessageCircle, Phone, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ExtendedLead, FunnelStage } from '@/types/crm';
import { UserAvatar } from '@/components/admin/UserAvatar';
import { LeadTask } from '@/types/crm';

const getRelativeDate = (dateStr: string, t: any) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return t('leads.list.today');
    if (diffDays === 2) return t('leads.list.yesterday');
    if (diffDays <= 7) return `${diffDays} ${t('leads.list.daysAgo')}`;
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const getTaskStatusInfo = (tasks?: LeadTask[]) => {
    if (!tasks || tasks.length === 0) return null;
    const activeTasks = tasks.filter(t => !t.completed).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (activeTasks.length === 0) return null;
    
    const task = activeTasks[0];
    const taskDate = new Date(task.date);
    const now = new Date();
    const isOverdue = taskDate.setHours(23,59,59,999) < now.getTime() && taskDate.toDateString() !== now.toDateString();
    const isToday = new Date().toDateString() === new Date(task.date).toDateString();

    return { task, isOverdue, isToday };
};

interface LeadsListProps {
    leads: ExtendedLead[];
    funnelStages: FunnelStage[];
    onSelect: (lead: ExtendedLead) => void;
    selectedIds: Set<string>;
    onToggleSelection: (id: string) => void;
    onToggleAll: () => void;
}

export const LeadsList: React.FC<LeadsListProps> = ({ leads, funnelStages, onSelect, selectedIds, onToggleSelection, onToggleAll }) => {
    const { t } = useTranslation();
    return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
        <div className="overflow-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10 shadow-sm text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                        <th className="px-4 py-3 w-10 border-b border-slate-200">
                            <div className="flex items-center justify-center">
                                <input 
                                    type="checkbox" 
                                    checked={leads.length > 0 && selectedIds.size === leads.length}
                                    onChange={onToggleAll}
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer transition-all" 
                                />
                            </div>
                        </th>
                        <th className="px-4 py-3 border-b border-slate-200">{t('leads.list.client')}</th>
                        <th className="px-4 py-3 border-b border-slate-200">{t('leads.list.status')}</th>
                        <th className="px-4 py-3 border-b border-slate-200">{t('leads.list.task')}</th>
                        <th className="px-4 py-3 border-b border-slate-200 hidden md:table-cell">{t('leads.list.project')}</th>
                        <th className="px-4 py-3 border-b border-slate-200 text-right">{t('leads.list.budget')}</th>
                        <th className="px-4 py-3 border-b border-slate-200 w-24"></th> 
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {leads.map((lead) => {
                        const stage = funnelStages.find(s => s.id === lead.status);
                        const statusLabel = stage?.name || t('leads.list.unknown');
                        const statusColor = stage?.color || 'slate';
                        const taskInfo = getTaskStatusInfo(lead.tasks);
                        const waLink = `https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`;

                        return (
                        <tr 
                            key={lead.id} 
                            onClick={() => onSelect(lead)} 
                            className={`group hover:bg-blue-50/40 cursor-pointer transition-all duration-200 ${selectedIds.has(lead.id) ? 'bg-blue-50' : ''}`}
                        >
                             <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-center">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIds.has(lead.id)}
                                        onChange={() => onToggleSelection(lead.id)}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                                    />
                                </div>
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <UserAvatar name={lead.name} className="w-9 h-9 text-xs shrink-0 shadow-sm ring-1 ring-slate-100" />
                                    <div className="min-w-0">
                                        <div className="font-bold text-slate-900 text-sm truncate group-hover:text-blue-600 transition-colors">{lead.name}</div>
                                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                            <Calendar size={10} /> {getRelativeDate(lead.date, t)}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex flex-col items-start gap-1">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-${statusColor}-100 text-${statusColor}-700 border border-${statusColor}-200`}>
                                        {statusLabel}
                                    </span>
                                    {lead.tags && lead.tags.length > 0 && (
                                        <div className="flex gap-1">
                                            {lead.tags.slice(0, 2).map(tag => (
                                                <span key={tag} className="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">#{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td className="px-4 py-3">
                                {taskInfo ? (
                                    <div className={`flex items-center gap-2 text-xs font-medium ${taskInfo.isOverdue ? 'text-red-600' : taskInfo.isToday ? 'text-amber-600' : 'text-slate-600'}`}>
                                        {taskInfo.isOverdue ? <AlertCircle size={14} className="shrink-0" /> : <Clock size={14} className="shrink-0" />}
                                        <span className="truncate max-w-[120px] md:max-w-[180px]">{taskInfo.task.text}</span>
                                    </div>
                                ) : (
                                    <span className="text-xs text-slate-300 italic flex items-center gap-1"><CheckCircle2 size={12}/> {t('leads.list.noTasks')}</span>
                                )}
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                                <div className="flex items-center gap-1.5">
                                    <div className="p-1 bg-slate-100 rounded text-slate-400">
                                        <Building2 size={12} />
                                    </div>
                                    <div className="text-sm text-slate-700 font-medium truncate max-w-[140px]">{lead.project}</div>
                                </div>
                                {lead.apartment && <div className="text-[10px] text-slate-400 pl-6">{lead.apartment}</div>}
                            </td>
                            <td className="px-4 py-3 text-right">
                                {lead.price ? (
                                    <div className="font-mono font-bold text-slate-900 text-sm">${lead.price.toLocaleString()}</div>
                                ) : (
                                    <span className="text-xs text-slate-300">—</span>
                                )}
                            </td>
                            <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                    <a 
                                        href={`tel:${lead.phone}`} 
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                        title={t('leads.list.call')}
                                    >
                                        <Phone size={16} />
                                    </a>
                                    <a 
                                        href={waLink} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                                        title={t('leads.list.whatsapp')}
                                    >
                                        <MessageCircle size={16} />
                                    </a>
                                    <button className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-colors">
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    )                    })}
                </tbody>
            </table>
        </div>
    </div>
    );
};