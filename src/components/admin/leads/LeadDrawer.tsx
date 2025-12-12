
import React, { useState, useEffect } from 'react';
import { X, Phone, MessageCircle, ChevronDown, Bell, Send, StickyNote, CheckCircle2, Pencil, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ExtendedLead, FunnelStage } from '@/types/crm';
import { LeadTask, LeadUser, TaskType } from '@/types/crm';
import { TaskComposer, TaskCard } from '@/components/admin/leads/TaskComponents';
import { UserAvatar } from '@/components/admin/UserAvatar';

interface Props {
    lead: ExtendedLead | null; 
    funnelStages: FunnelStage[];
    onClose: () => void; 
    onStatusChange: (id: string, s: string) => void;
    onUpdateLead: (id: string, data: Partial<ExtendedLead>) => void;
    onAddTask: (id: string, text: string, type: TaskType, date: string, time: string, assignedTo: LeadUser) => void;
    onCompleteTask: (lid: string, tid: string, res: string) => void;
    onToggleTask: (id: string, taskId: string) => void;
    onDeleteTask: (id: string, taskId: string) => void;
    onAddNote: (id: string, note: string) => void;
    onAddTag: (id: string, tag: string) => void;
    onRemoveTag: (id: string, tag: string) => void;
}

export const LeadDrawer: React.FC<Props> = ({ lead, funnelStages, onClose, onStatusChange, onUpdateLead, onAddTask, onCompleteTask, onToggleTask, onDeleteTask, onAddNote, onAddTag, onRemoveTag }) => {
    const { t } = useTranslation();
    const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'history' | 'tasks'>('info');
    const [newTagText, setNewTagText] = useState('');
    const [noteText, setNoteText] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    
    // Edit State
    const [editForm, setEditForm] = useState({ name: '', phone: '', price: '', project: '', source: '' });

    useEffect(() => {
        if (lead) {
            setEditForm({
                name: lead.name,
                phone: lead.phone,
                price: lead.price?.toString() || '',
                project: lead.project,
                source: lead.source
            });
            setIsEditing(false);
        }
    }, [lead]);

    if (!lead) return null;
    
    const currentStage = funnelStages.find(s => s.id === lead.status);
    const waLink = `https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`;

    // Group tasks logic
    const tasks = lead.tasks || [];
    const now = new Date();
    const overdueTasks = tasks.filter(t => !t.completed && new Date(t.date).setHours(23,59,59) < now.getTime());
    const todayTasks = tasks.filter(t => !t.completed && new Date(t.date).toDateString() === now.toDateString());
    const futureTasks = tasks.filter(t => !t.completed && new Date(t.date) > now && new Date(t.date).toDateString() !== now.toDateString());
    const completedTasks = tasks.filter(t => t.completed);

    const handleSaveEdit = () => {
        onUpdateLead(lead.id, {
            name: editForm.name,
            phone: editForm.phone,
            price: Number(editForm.price) || 0,
            project: editForm.project,
            source: editForm.source as any
        });
        setIsEditing(false);
    };

    const renderTaskGroup = (title: string, groupTasks: LeadTask[], color: string) => {
        if (groupTasks.length === 0) return null;
        return (
            <div className="mb-4">
                <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${color} flex items-center gap-2`}>
                    {title} <span className="bg-slate-100 px-1.5 rounded-full text-[10px] text-slate-500">{groupTasks.length}</span>
                </div>
                <div className="space-y-2">
                    {groupTasks.map(task => (
                        <TaskCard 
                            key={task.id} 
                            task={task} 
                            leadId={lead.id} 
                            onComplete={onCompleteTask} 
                            onToggle={onToggleTask}
                            onDelete={onDeleteTask}
                        />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm" onClick={onClose}></div>
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col border-l border-slate-200">
                
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-white shrink-0">
                    <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-3 mb-2">
                             <UserAvatar name={lead.name} className="w-10 h-10 text-sm shrink-0 shadow-sm ring-2 ring-slate-50" />
                             <div className="min-w-0 flex-1">
                                {isEditing ? (
                                    <input 
                                        className="text-lg font-bold text-slate-900 border border-slate-300 rounded px-2 py-1 w-full outline-none focus:border-blue-500"
                                        value={editForm.name}
                                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                                        autoFocus
                                    />
                                ) : (
                                    <h2 className="text-xl font-bold text-slate-900 truncate leading-tight">{lead.name}</h2>
                                )}
                                
                                <div className="flex items-center gap-2 mt-1">
                                    {!isEditing ? (
                                        <button onClick={() => setIsEditing(true)} className="text-xs text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors">
                                            <Pencil size={10} /> {t('leads.drawer.edit')}
                                        </button>
                                    ) : (
                                        <button onClick={handleSaveEdit} className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1 font-bold bg-green-50 px-2 py-0.5 rounded">
                                            <Save size={12} /> {t('leads.drawer.save')}
                                        </button>
                                    )}
                                </div>
                             </div>
                        </div>
                        
                        <div className="relative mt-3">
                            {currentStage && (
                                <button 
                                    onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                                    className={`inline-flex items-center gap-2 pl-2 pr-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all hover:shadow-sm bg-${currentStage.color}-50 text-${currentStage.color}-700 border-${currentStage.color}-200 hover:border-${currentStage.color}-300`}
                                >
                                    <div className={`w-2 h-2 rounded-full bg-${currentStage.color}-500`}></div>
                                    {currentStage.name}
                                    <ChevronDown size={12} className="opacity-50" />
                                </button>
                            )}
                            {isStatusMenuOpen && (
                                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95">
                                    {funnelStages.map(stage => (
                                        <button 
                                            key={stage.id}
                                            onClick={() => { onStatusChange(lead.id, stage.id); setIsStatusMenuOpen(false); }}
                                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-3 text-slate-700 border-l-2 border-transparent hover:border-blue-500 transition-colors"
                                        >
                                            <div className={`w-2.5 h-2.5 rounded-full bg-${stage.color}-500 shrink-0`}></div>
                                            {stage.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
                </div>
                
                {/* Tabs */}
                <div className="flex border-b border-slate-200 px-6 shrink-0 bg-white">
                    <button 
                        onClick={() => setActiveTab('info')} 
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        {t('leads.drawer.info')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('tasks')} 
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'tasks' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        {t('leads.drawer.tasks')} {tasks.filter(t => !t.completed).length > 0 && <span className="ml-1 bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold">{tasks.filter(t => !t.completed).length}</span>}
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')} 
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        {t('leads.drawer.history')}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-5 custom-scrollbar">
                    {/* INFO TAB */}
                    {activeTab === 'info' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                             <div className="grid grid-cols-2 gap-3">
                                <a href={`tel:${lead.phone}`} className="flex items-center justify-center gap-2 bg-white border border-slate-200 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all">
                                    <Phone size={16} /> {t('leads.drawer.call')}
                                </a>
                                <a href={waLink} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#20bd5a] shadow-sm transition-all">
                                    <MessageCircle size={16} /> {t('leads.drawer.whatsapp')}
                                </a>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('leads.drawer.details')}</h4>
                                    {isEditing && <span className="text-[10px] text-blue-600 font-bold animate-pulse">{t('leads.drawer.editing')}</span>}
                                </div>
                                <div className="p-4 space-y-5">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">{t('leads.drawer.phone')}</label>
                                        {isEditing ? (
                                            <input 
                                                className="w-full text-sm border rounded px-2 py-1 outline-none focus:border-blue-500"
                                                value={editForm.phone}
                                                onChange={e => setEditForm({...editForm, phone: e.target.value})}
                                            />
                                        ) : (
                                            <div className="font-medium text-slate-900 text-sm select-all">{lead.phone}</div>
                                        )}
                                    </div>
                                     <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">{t('leads.drawer.project')}</label>
                                        {isEditing ? (
                                            <input 
                                                className="w-full text-sm border rounded px-2 py-1 outline-none focus:border-blue-500"
                                                value={editForm.project}
                                                onChange={e => setEditForm({...editForm, project: e.target.value})}
                                            />
                                        ) : (
                                            <div className="font-medium text-slate-900 text-sm">{lead.project}</div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">{t('leads.drawer.budget')}</label>
                                        {isEditing ? (
                                            <input 
                                                type="number"
                                                className="w-full text-sm border rounded px-2 py-1 outline-none focus:border-blue-500 font-mono"
                                                value={editForm.price}
                                                onChange={e => setEditForm({...editForm, price: e.target.value})}
                                            />
                                        ) : (
                                            <div className="font-mono font-bold text-slate-900 text-lg">${lead.price?.toLocaleString()}</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-3">{t('leads.drawer.tags')}</label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {lead.tags?.map(tag => (
                                        <span key={tag} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 group transition-colors hover:bg-slate-200">
                                            {tag}
                                            <button onClick={() => onRemoveTag(lead.id, tag)} className="text-slate-400 hover:text-red-500"><X size={12}/></button>
                                        </span>
                                    ))}
                                </div>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder={t('leads.drawer.addTag')} 
                                        value={newTagText}
                                        onChange={(e) => setNewTagText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && newTagText.trim()) {
                                                onAddTag(lead.id, newTagText.trim());
                                                setNewTagText('');
                                            }
                                        }}
                                        className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TASKS TAB */}
                    {activeTab === 'tasks' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                            
                            <TaskComposer onAdd={(text, type, date, time, assignedTo) => onAddTask(lead.id, text, type, date, time, assignedTo)} />

                            <div className="space-y-2">
                                {tasks.length === 0 && (
                                    <div className="text-center text-slate-400 text-sm py-8 flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mb-2">
                                            <Bell size={20} className="text-slate-400"/>
                                        </div>
                                        {t('leads.drawer.noPlannedTasks')}
                                    </div>
                                )}
                                
                                {renderTaskGroup(t('leads.drawer.overdue'), overdueTasks, 'text-red-500')}
                                {renderTaskGroup(t('leads.drawer.today'), todayTasks, 'text-amber-600')}
                                {renderTaskGroup(t('leads.drawer.future'), futureTasks, 'text-slate-500')}
                                
                                {completedTasks.length > 0 && (
                                    <div className="mt-8 pt-6 border-t border-slate-200">
                                        <div className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-400 flex items-center gap-2">
                                            {t('leads.drawer.completed')} <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full text-[10px]">{completedTasks.length}</span>
                                        </div>
                                         <div className="space-y-2 opacity-60 grayscale hover:grayscale-0 transition-all">
                                            {completedTasks.map(task => (
                                                <TaskCard 
                                                    key={task.id} 
                                                    task={task} 
                                                    leadId={lead.id} 
                                                    onComplete={onCompleteTask} 
                                                    onToggle={onToggleTask}
                                                    onDelete={onDeleteTask}
                                                />
                                            ))}
                                         </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* HISTORY TAB */}
                    {activeTab === 'history' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                             
                             <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm mb-6">
                                 <div className="relative">
                                     <textarea 
                                        placeholder={t('leads.drawer.writeNote')}
                                        value={noteText}
                                        onChange={(e) => setNoteText(e.target.value)}
                                        onKeyDown={(e) => { if((e.ctrlKey || e.metaKey) && e.key === 'Enter') { onAddNote(lead.id, noteText); setNoteText(''); }}}
                                        className="w-full text-sm text-slate-900 placeholder:text-slate-400 resize-none outline-none min-h-[60px] bg-transparent"
                                     />
                                     <div className="flex justify-between items-center mt-2 border-t border-slate-100 pt-2">
                                         <span className="text-[10px] text-slate-300 font-medium">{t('leads.drawer.ctrlEnterToSend')}</span>
                                         <button 
                                            onClick={() => { if(noteText.trim()) { onAddNote(lead.id, noteText); setNoteText(''); }}}
                                            disabled={!noteText.trim()}
                                            className="bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-500 p-2 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-slate-100 disabled:hover:text-slate-500"
                                        >
                                             <Send size={16} />
                                         </button>
                                     </div>
                                 </div>
                             </div>

                             <div className="relative pl-6 space-y-6">
                                {/* Continuous Line */}
                                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-200 rounded-full"></div>

                                {lead.history?.map((item) => {
                                    let icon = <div className="w-2 h-2 bg-slate-400 rounded-full ring-4 ring-slate-50"></div>;
                                    let containerClass = 'bg-white border-slate-200';
                                    
                                    if (item.type === 'task_completion') {
                                        icon = <div className="bg-green-500 p-1 rounded-full ring-4 ring-slate-50 text-white shadow-sm"><CheckCircle2 size={10} /></div>;
                                        containerClass = 'bg-green-50/50 border-green-100';
                                    } else if (item.type === 'note') {
                                        icon = <div className="bg-amber-400 p-1 rounded-full ring-4 ring-slate-50 text-white shadow-sm"><StickyNote size={10} /></div>;
                                        containerClass = 'bg-amber-50/50 border-amber-100';
                                    } else if (item.type === 'automation') {
                                        icon = <div className="w-2.5 h-2.5 bg-blue-400 rounded-full ring-4 ring-slate-50"></div>;
                                        containerClass = 'bg-blue-50/30 border-blue-100';
                                    } else if (item.type === 'status_change') {
                                        icon = <div className="w-2.5 h-2.5 bg-slate-600 rounded-full ring-4 ring-slate-50"></div>;
                                    }

                                    return (
                                        <div key={item.id} className="relative group">
                                            <div className="absolute -left-[23px] top-3 flex items-center justify-center z-10">
                                                {icon}
                                            </div>
                                            <div className="text-[10px] text-slate-400 mb-1 font-medium pl-1">
                                                {item.date}
                                            </div>
                                            <div className={`text-sm text-slate-700 p-3.5 rounded-xl border shadow-sm leading-relaxed transition-shadow hover:shadow-md ${containerClass}`}>
                                                {item.text}
                                            </div>
                                        </div>
                                    );
                                })}
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
