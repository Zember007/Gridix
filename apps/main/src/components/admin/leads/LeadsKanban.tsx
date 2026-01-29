
import React, { useState, useRef, useEffect } from 'react';
import { Phone, MessageCircle, Building2, AlertCircle, User, Calendar, MoreHorizontal, Ghost, Globe, Instagram, Facebook } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LeadTask, LeadUser, LeadSource } from '@/entities/crm/model/types';
import { ExtendedLead, FunnelStage, CardAppearanceConfig } from '@/entities/crm/model/types';
import { useDragScroll } from '@/hooks/useDragScroll';
import { UserAvatar } from '@/components/admin/UserAvatar';
import { UnreadBadge } from '@/shared/ui/UnreadBadge';

const getRelativeDate = (dateStr: string, t: any) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return t('leads.list.today');
    if (diffDays === 2) return t('leads.list.yesterday');
    return `${diffDays} ${t('leads.list.daysAgo')}`;
};
 
const getTaskStatus = (tasks?: LeadTask[]) => {
    if (!tasks || tasks.length === 0) return null;
    const activeTasks = tasks.filter(t => !t.completed).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (activeTasks.length === 0) return null;
    const nextTask = activeTasks[0];
    if (!nextTask) return null;
    const taskDate = new Date(nextTask.date);
    const now = new Date();
    const isOverdue = taskDate.setHours(23,59,59,999) < now.getTime() && taskDate.getDate() !== now.getDate();
    const isToday = new Date().toDateString() === new Date(nextTask.date).toDateString();
    return { nextTask, isOverdue, isToday };
};

const getSourceIcon = (source: LeadSource) => {
    switch(source) {
        case 'instagram': return <Instagram size={12} className="text-purple-500" />;
        case 'facebook': return <Facebook size={12} className="text-blue-600" />;
        case 'website': return <Globe size={12} className="text-blue-400" />;
        case 'referral': return <User size={12} className="text-green-600" />;
        default: return <User size={12} className="text-slate-400" />;
    }
}

// --- KANBAN CARD ---
const KanbanCard: React.FC<{ 
    lead: ExtendedLead;
    funnelStages: FunnelStage[];
    users: LeadUser[];
    cardConfig: CardAppearanceConfig;
    onSelect: (l: ExtendedLead) => void; 
    onStatusChange: (id: string, s: string) => void;
    onDragStart: (e: React.DragEvent, leadId: string) => void;
}> = ({ lead, funnelStages, users, cardConfig, onSelect, onStatusChange, onDragStart }) => {
    const { t } = useTranslation();
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsStatusOpen(false);
        };
        if (isStatusOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isStatusOpen]);

    const handleDragStartLocal = (e: React.DragEvent) => {
        setIsDragging(true);
        onDragStart(e, lead.id);
        setTimeout(() => setIsDragging(false), 0); 
    }

    const taskStatus = getTaskStatus(lead.tasks);

    // Dynamic styles for task
    let taskClasses = "bg-slate-50 text-slate-500 border-slate-100";
    if (taskStatus?.isOverdue) taskClasses = "bg-red-50 text-red-600 border-red-100 animate-pulse";
    else if (taskStatus?.isToday) taskClasses = "bg-amber-50 text-amber-600 border-amber-100";

    const tags = lead.tags || [];

    return (
        <div 
            draggable={true}
            onDragStart={handleDragStartLocal}
            onDragEnd={() => setIsDragging(false)}
            onClick={() => onSelect(lead)}
            className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all group relative select-none flex flex-col gap-3 ${isDragging ? 'opacity-50 rotate-2 scale-105 shadow-xl border-blue-400 z-50' : ''}`}
        >
            {!((lead as unknown as { read_at?: string | null }).read_at) && (
                <UnreadBadge
                    variant="dot"
                    className="absolute top-3 left-3 shadow-sm ring-2 ring-white"
                />
            )}
            {/* Top Row: Client & Avatar */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    {cardConfig.showAvatar && <UserAvatar name={lead.name} className="w-8 h-8 text-[10px] shrink-0 shadow-sm" />}
                    <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-800 truncate max-w-[140px]">{lead.name}</div>
                        {(lead as unknown as { agent_id?: string | null }).agent_id && (
                            <div className="mt-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-amber-100 text-amber-800 border border-amber-200">
                                {t('partners.calculator.statusPartner')}
                                </span>
                            </div>
                        )}
                        {cardConfig.showDate && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                                {/* Source Icon (Requested Feature) */}
                                <div className="p-0.5 bg-slate-100 rounded" title={`Source: ${lead.source || 'unknown'}`}>
                                    {getSourceIcon((lead.source as LeadSource) || 'website')}
                                </div>
                                <div className="text-[10px] text-slate-400">{getRelativeDate(lead.date, t)}</div>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="relative" ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setIsStatusOpen(!isStatusOpen)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600">
                        <MoreHorizontal size={16} />
                    </button>
                    {isStatusOpen && (
                        <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
                            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('leads.kanban.changeStage')}</div>
                            {funnelStages.map(stage => (
                                <button key={stage.id} onClick={() => { onStatusChange(lead.id, stage.id); setIsStatusOpen(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700">
                                    <div className={`w-2 h-2 rounded-full bg-${stage.color}-500`}></div>
                                    {stage.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Hero: Budget */}
            <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t('leads.kanban.budget')}</div>
                <div className="text-xl font-black text-slate-900 tracking-tight">
                    ${lead.price ? lead.price.toLocaleString() : '0'}
                </div>
            </div>

            {/* Project & Tags */}
            <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                    <div className="bg-blue-50 text-blue-700 p-1 rounded text-[10px] font-bold uppercase border border-blue-100 tracking-wide truncate max-w-full flex items-center gap-1">
                        <Building2 size={10} className="shrink-0"/>
                        <span className="truncate">{lead.project}</span>
                    </div>
                    {lead.apartment && (
                        <div className="bg-slate-100 text-slate-500 p-1 rounded text-[10px] font-bold uppercase border border-slate-200 tracking-wide truncate max-w-full flex items-center gap-1">
                            <span className="truncate">{lead.apartment}</span>
                        </div>
                    )}
                </div>                
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {tags.slice(0, 3).map((tag) => (
                            <span
                                key={tag}
                                className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded-md px-2 py-0.5"
                                title={tag}
                            >
                                #{tag}
                            </span>
                        ))}
                        {tags.length > 3 && (
                            <span className="text-[10px] font-bold text-slate-400">
                                +{tags.length - 3}
                            </span>
                        )}
                    </div>
                )}
            </div>
            
            {/* Footer: Task & Contact Actions */}
            <div className="flex justify-between items-center pt-3 mt-1 border-t border-slate-50">
                {taskStatus && taskStatus.nextTask ? (
                     <div className={`flex-1 mr-2 flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${taskClasses}`}>
                        {taskStatus.isOverdue ? <AlertCircle size={12} /> : <Calendar size={12} />}
                        <span className="truncate max-w-[100px]" title={taskStatus.nextTask.text}>{taskStatus.nextTask.text}</span>
                    </div>
                ) : (
                    <span className="text-[10px] text-slate-300 italic px-2">{t('leads.kanban.noTasks')}</span>
                )}

                 <div className="flex gap-1 shrink-0">
                    <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()} className="p-1.5 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-md transition-colors border border-transparent hover:border-blue-200"><Phone size={14} /></a>
                    <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="p-1.5 bg-slate-50 hover:bg-green-50 text-slate-400 hover:text-green-600 rounded-md transition-colors border border-transparent hover:border-green-200"><MessageCircle size={14} /></a>
                </div>
            </div>
        </div>
    );
};

// --- MAIN KANBAN VIEW ---
export const LeadsKanban: React.FC<{ 
    leads: ExtendedLead[];
    funnelStages: FunnelStage[];
    users: LeadUser[];
    cardConfig: CardAppearanceConfig;
    onSelect: (lead: ExtendedLead) => void; 
    onCreate: (l: Partial<ExtendedLead>) => void; 
    onStatusChange: (id: string, s: string) => void;
}> = ({ leads, funnelStages, users, cardConfig, onSelect, onCreate, onStatusChange }) => {
    const { t } = useTranslation();
    const [quickName, setQuickName] = useState('');
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
    const { ref, ...scrollHandlers } = useDragScroll<HTMLDivElement>();

    const handleDrop = (e: React.DragEvent, statusId: string) => {
        e.preventDefault();
        const leadId = e.dataTransfer.getData('leadId');
        if (leadId) onStatusChange(leadId, statusId);
        setDragOverColumn(null);
    }

    const firstStageId = funnelStages[0]?.id;



    return (
        <div 
            ref={ref}
            {...scrollHandlers}
            className="flex flex-col md:flex-row md:gap-4 md:overflow-x-auto pb-4 md:items-stretch md:cursor-grab md:select-none space-y-6 md:space-y-0 h-full px-2"
        >
            {funnelStages.map(stage => {
                const columnLeads = leads.filter(l => l.status === stage.id);
                const totalSum = columnLeads.reduce((acc, lead) => acc + (lead.price || 0), 0);
                const isDropTarget = dragOverColumn === stage.id;

                return (
                    <div 
                        key={stage.id} 
                        className={`w-full md:min-w-[300px] md:w-[320px]  flex flex-col rounded-xl transition-all duration-200 border-2 ${isDropTarget ? 'bg-blue-50/50 border-blue-300 border-dashed scale-[1.01]' : 'bg-slate-100/50 border-transparent'}`}
                        onDragOver={(e) => { e.preventDefault(); setDragOverColumn(stage.id); }}
                        onDrop={(e) => handleDrop(e, stage.id)}
                        onDragLeave={() => setDragOverColumn(null)}
                    >
                        <div className="p-3 mb-2 flex flex-col gap-1 border-b border-slate-200/50 bg-slate-100/80 backdrop-blur-md rounded-t-xl sticky top-0 z-10">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className={`w-2 h-2 rounded-full shrink-0 bg-${stage.color}-500`}></div>
                                    <span className="font-bold text-slate-700 text-sm uppercase tracking-wide truncate">{stage.name}</span>
                                </div>
                                <span className="bg-white px-2 py-0.5 rounded-md text-xs font-bold text-slate-600 border border-slate-200 shadow-sm">{columnLeads.length}</span>
                            </div>
                            <div className="flex justify-between items-center mt-1 px-1">
                                <div className={`h-1 flex-1 rounded-full bg-${stage.color}-200 mr-3`}>
                                    <div className={`h-full rounded-full bg-${stage.color}-500`} style={{ width: '40%' }}></div>
                                </div>
                                <span className="text-[10px] text-slate-500 font-bold font-mono">${(totalSum / 1000).toFixed(1)}k</span>
                            </div>
                        </div>

                        {stage.id === firstStageId && (
                            <div className="mb-3 px-2">
                                <input 
                                    type="text" 
                                    placeholder={t('leads.kanban.quickAdd')} 
                                    value={quickName}
                                    onChange={(e) => setQuickName(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && quickName.trim()) { onCreate({ name: quickName.trim(), status: stage.id }); setQuickName(''); } }}
                                    className="w-full bg-white border-2 border-transparent focus:border-blue-500 rounded-xl px-4 py-3 text-sm outline-none shadow-sm hover:shadow-md transition-all placeholder:text-slate-400"
                                />
                            </div>
                        )}

                        <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar px-2 pb-20 min-h-[150px]">
                            {columnLeads.map(lead => (
                                <KanbanCard 
                                    key={lead.id} 
                                    lead={lead} 
                                    funnelStages={funnelStages} 
                                    users={users}
                                    cardConfig={cardConfig}
                                    onSelect={onSelect} 
                                    onStatusChange={onStatusChange} 
                                    onDragStart={(e, id) => { e.dataTransfer.setData('leadId', id); }} 
                                />
                            ))}
                            
                            {columnLeads.length === 0 && !isDropTarget && (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-300 border-2 border-dashed border-slate-200 rounded-xl">
                                    <Ghost size={32} className="mb-2 opacity-50" />
                                    <span className="text-xs font-medium">{t('leads.kanban.empty')}</span>
                                </div>
                            )}

                            {isDropTarget && (
                                <div className="flex items-center justify-center py-12 bg-blue-100/50 border-2 border-dashed border-blue-400 rounded-xl animate-pulse">
                                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">{t('leads.kanban.moveHere')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
