
import React, { useState, useEffect } from 'react';
import { X, User, Phone, DollarSign, Globe, Tag, Plus, AlertTriangle, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LeadSource, ExtendedLead } from '@/types/crm';

interface CreateLeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (lead: Partial<ExtendedLead>) => void;
    leads: ExtendedLead[]; // Passed to check duplicates
}

export const CreateLeadModal: React.FC<CreateLeadModalProps> = ({ isOpen, onClose, onCreate, leads }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({ name: '', phone: '', price: '', source: 'walk_in' });
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [duplicateLead, setDuplicateLead] = useState<ExtendedLead | null>(null);

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            setFormData({ name: '', phone: '', price: '', source: 'walk_in' });
            setTags([]);
            setDuplicateLead(null);
        }
    }, [isOpen]);

    // Duplicate check logic
    useEffect(() => {
        const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
        if (cleanPhone.length > 5) {
            const found = leads.find(l => l.phone.replace(/[^0-9]/g, '').includes(cleanPhone));
            setDuplicateLead(found || null);
        } else {
            setDuplicateLead(null);
        }
    }, [formData.phone, leads]);

    if (!isOpen) return null;

    const handleAddTag = () => {
        if (tagInput.trim()) {
            setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <h3 className="text-lg font-bold text-slate-900">{t('leads.createModal.title')}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                    
                    {/* Name */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{t('leads.createModal.clientLabel')}</label>
                        <div className="relative group">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                <User size={18} />
                            </div>
                            <input 
                                type="text" 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-400 font-medium text-slate-900" 
                                placeholder={t('leads.createModal.namePlaceholder')} 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Phone & Duplicate Warning */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{t('leads.createModal.phone')}</label>
                        <div className="relative group">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                <Phone size={18} />
                            </div>
                            <input 
                                type="tel" 
                                className={`w-full bg-slate-50 border rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 font-medium text-slate-900 ${duplicateLead ? 'border-amber-300 bg-amber-50 focus:border-amber-500 focus:ring-1 focus:ring-amber-500' : 'border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500'}`}
                                placeholder={t('leads.createModal.phonePlaceholder')} 
                                value={formData.phone} 
                                onChange={e => setFormData({...formData, phone: e.target.value})} 
                            />
                        </div>
                        
                        {/* Duplicate Alert */}
                        {duplicateLead && (
                            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-1">
                                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <div className="text-xs font-bold text-amber-800 uppercase mb-1">{t('leads.createModal.duplicateFound')}</div>
                                    <p className="text-xs text-amber-700 leading-relaxed">
                                        {t('leads.createModal.duplicateExists', { name: duplicateLead.name })}
                                    </p>
                                    <button className="mt-2 text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1">
                                        {t('leads.createModal.goToCard')} <ArrowRight size={12} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Budget */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{t('leads.createModal.budgetLabel')}</label>
                            <div className="relative group">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors">
                                    <DollarSign size={18} />
                                </div>
                                <input 
                                    type="number" 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-green-500 focus:bg-white focus:ring-1 focus:ring-green-500 transition-all placeholder:text-slate-400 font-medium text-slate-900" 
                                    placeholder="0" 
                                    value={formData.price} 
                                    onChange={e => setFormData({...formData, price: e.target.value})} 
                                />
                            </div>
                        </div>

                        {/* Source */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{t('leads.createModal.sourceLabel')}</label>
                            <div className="relative group">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors pointer-events-none">
                                    <Globe size={18} />
                                </div>
                                <select 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-purple-500 focus:bg-white focus:ring-1 focus:ring-purple-500 transition-all text-slate-900 font-medium appearance-none cursor-pointer" 
                                    value={formData.source} 
                                    onChange={e => setFormData({...formData, source: e.target.value})}
                                >
                                    <option value="walk_in">{t('leads.sources.walk_in')}</option>
                                    <option value="instagram">{t('leads.sources.instagram')}</option>
                                    <option value="website">{t('leads.sources.website')}</option>
                                    <option value="facebook">{t('leads.sources.facebook')}</option>
                                    <option value="referral">{t('leads.sources.referral')}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    {/* Tags */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{t('leads.createModal.tagsLabel')}</label>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 min-h-[50px] flex flex-wrap gap-2 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-1 focus-within:ring-blue-500 transition-all cursor-text" onClick={() => document.getElementById('tag-input')?.focus()}>
                            {tags.map((tag, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-sm">
                                    {tag}
                                    <button onClick={(e) => { e.stopPropagation(); setTags(tags.filter((_, i) => i !== idx)); }} className="text-slate-400 hover:text-red-500 rounded-full p-0.5 hover:bg-red-50 transition-colors">
                                        <X size={12}/>
                                    </button>
                                </span>
                            ))}
                            <div className="flex-1 min-w-[100px] flex items-center gap-2 px-1">
                                <Tag size={16} className="text-slate-400 shrink-0" />
                                <input 
                                    id="tag-input"
                                    type="text" 
                                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 font-medium text-slate-900 h-8"
                                    placeholder={t('leads.createModal.tagPlaceholder')}
                                    value={tagInput}
                                    onChange={e => setTagInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
                    <button onClick={onClose} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm">
                        {t('leads.createModal.cancel')}
                    </button>
                    <button 
                        onClick={() => { 
                            onCreate({ 
                                name: formData.name, 
                                phone: formData.phone, 
                                price: Number(formData.price) || 0, 
                                source: formData.source as LeadSource,
                                tags: tags
                            }); 
                            setFormData({name:'',phone:'',price:'',source:'walk_in'}); 
                            setTags([]);
                        }} 
                        disabled={!formData.name.trim() || !!duplicateLead}
                        className="flex-[2] py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus size={18} />
                        {duplicateLead ? t('leads.createModal.duplicateNotAllowed') : t('leads.createModal.createDeal')}
                    </button>
                </div>
            </div>
        </div>
    );
};
