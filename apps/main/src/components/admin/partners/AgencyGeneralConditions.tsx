import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Check, Clock, Download, FileText, PenTool, Percent, ShieldCheck, Trash2, Upload, FileEdit, ExternalLink, Printer, Link as LinkIcon, MoreVertical, File as FileIcon, GripVertical, Braces, Save } from 'lucide-react';
import { toast } from "sonner";
import { Button } from "@gridix/ui";
import { Input } from "@gridix/ui";
import { Textarea } from "@gridix/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@gridix/ui";
import { supabase } from "@gridix/utils/api";
import { ADMIN_THEME, getAdminThemeVariables } from "@gridix/utils/lib";
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import mammoth from 'mammoth';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
// Vite: import worker as URL
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { FunctionsError } from '@supabase/supabase-js';

GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

// Available variables for the contract (labelKey = partners.generalConditions.contractVars*)
const CONTRACT_VARIABLE_KEYS: Array<{ key: string; labelKey: string }> = [
    { key: '{{agent.full_name}}', labelKey: 'contractVarsAgentFullName' },
    { key: '{{agent.person_type}}', labelKey: 'contractVarsAgentPersonType' },
    { key: '{{agent.company_name}}', labelKey: 'contractVarsAgentCompanyName' },
    { key: '{{agent.company_type}}', labelKey: 'contractVarsAgentCompanyType' },
    { key: '{{agent.tax_id}}', labelKey: 'contractVarsAgentTaxId' },
    { key: '{{agent.legal_address}}', labelKey: 'contractVarsAgentLegalAddress' },
    { key: '{{agent.registered_office}}', labelKey: 'contractVarsAgentRegisteredOffice' },
    { key: '{{agent.represented_by_name}}', labelKey: 'contractVarsAgentRepresentedByName' },
    { key: '{{agent.represented_by_title}}', labelKey: 'contractVarsAgentRepresentedByTitle' },
    { key: '{{agent.email}}', labelKey: 'contractVarsAgentEmail' },
    { key: '{{agent.phone}}', labelKey: 'contractVarsAgentPhone' },
    { key: '{{date.today}}', labelKey: 'contractVarsDateToday' },
    { key: '{{commission_rate}}', labelKey: 'contractVarsCommissionRate' },
    { key: '{{program.default_commission_rate}}', labelKey: 'contractVarsProgramDefaultCommissionRate' },
    { key: '{{program.payout_terms}}', labelKey: 'contractVarsProgramPayoutTerms' },
    { key: '{{program.products_description}}', labelKey: 'contractVarsProgramProductsDescription' },
    { key: '{{program.territory}}', labelKey: 'contractVarsProgramTerritory' },
    { key: '{{program.exclusivity}}', labelKey: 'contractVarsProgramExclusivity' },
    { key: '{{program.agreement_effective_date}}', labelKey: 'contractVarsProgramAgreementEffectiveDate' },
    { key: '{{program.agreement_end_date}}', labelKey: 'contractVarsProgramAgreementEndDate' },
    { key: '{{program.force_majeure_weeks}}', labelKey: 'contractVarsProgramForceMajeureWeeks' },
    { key: '{{program.originals_count}}', labelKey: 'contractVarsProgramOriginalsCount' },
    { key: '{{{signatures.developer_stamp}}}', labelKey: 'contractVarsDeveloperStamp' },
    { key: '{{{signatures.developer}}}', labelKey: 'contractVarsDeveloperSignature' },
    { key: '{{{signatures.agent}}}', labelKey: 'contractVarsAgentSignature' },
    { key: '{{developer.company_name}}', labelKey: 'contractVarsDeveloperCompany' },
    { key: '{{developer.full_name}}', labelKey: 'contractVarsDeveloperFullName' },
    { key: '{{developer.company_type}}', labelKey: 'contractVarsDeveloperCompanyType' },
    { key: '{{developer.tax_id}}', labelKey: 'contractVarsDeveloperTaxId' },
    { key: '{{developer.legal_address}}', labelKey: 'contractVarsDeveloperLegalAddress' },
    { key: '{{developer.registered_office}}', labelKey: 'contractVarsDeveloperRegisteredOffice' },
    { key: '{{developer.represented_by_name}}', labelKey: 'contractVarsDeveloperRepresentedByName' },
    { key: '{{developer.represented_by_title}}', labelKey: 'contractVarsDeveloperRepresentedByTitle' },
    { key: '{{developer.email}}', labelKey: 'contractVarsDeveloperEmail' },
    { key: '{{developer.phone}}', labelKey: 'contractVarsDeveloperPhone' },
    { key: '{{partner_name}}', labelKey: 'contractVarsPartnerName' },
    { key: '{{partner_id}}', labelKey: 'contractVarsPartnerId' },
    { key: '{{company_name}}', labelKey: 'contractVarsCompanyName' },
    { key: '{{tax_id}}', labelKey: 'contractVarsTaxId' },
    { key: '{{address}}', labelKey: 'contractVarsAddress' },
    { key: '{{date_text}}', labelKey: 'contractVarsDateText' },
    { key: '{{{sign_image}}}', labelKey: 'contractVarsSignImage' },
];

type Template = {
    id: number;
    name: string;
    lang: string;
    content_html: string | null;
    storage_path: string;
    created_at: string;
    updated_at: string;
    url: string | null;
    date: string;
};

const escapeHtml = (s: string) =>
    s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

async function extractPdfToHtml(arrayBuffer: ArrayBuffer): Promise<string> {
    const pdf = await getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const pages: string[] = [];

    // Group text items into lines by Y coordinate, then join by X order.
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const items = (textContent.items as Array<any>)
            .map((it) => {
                const str = String(it.str ?? '').trimEnd();
                const t = Array.isArray(it.transform) ? it.transform : null;
                // transform: [a, b, c, d, e, f] where e=x, f=y
                const x = t ? Number(t[4]) : 0;
                const y = t ? Number(t[5]) : 0;
                return { str, x, y };
            })
            .filter((it) => it.str.length > 0);

        // Sort by y desc, then x asc
        items.sort((a, b) => (b.y - a.y) || (a.x - b.x));

        const lines: Array<{ y: number; parts: Array<{ x: number; str: string }> }> = [];
        const yTolerance = 2.5;

        for (const it of items) {
            const last = lines[lines.length - 1];
            if (!last || Math.abs(last.y - it.y) > yTolerance) {
                lines.push({ y: it.y, parts: [{ x: it.x, str: it.str }] });
            } else {
                last.parts.push({ x: it.x, str: it.str });
            }
        }

        const htmlLines = lines
            .map((ln) => {
                ln.parts.sort((a, b) => a.x - b.x);
                // Join with spaces; collapse multi-spaces later
                const text = ln.parts.map((p) => p.str).join(' ').replace(/\s{2,}/g, ' ').trim();
                return text ? `<p>${escapeHtml(text)}</p>` : `<p><br/></p>`;
            })
            .join('');

        pages.push(htmlLines || `<p><br/></p>`);
    }

    // Separate pages
    return pages.join('<hr/>');
}

type TFunction = (key: string) => string;

/** Extract Google Docs document ID from a docs.google.com URL */
function getGoogleDocId(link: string): string | null {
    const trimmed = link.trim();
    const match = trimmed.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
    return match?.[1] ?? null;
}

/** Build Google Docs export URL for DOCX (doc must be shared "Anyone with the link can view") */
function getGoogleDocExportUrl(docId: string): string {
    return `https://docs.google.com/document/d/${docId}/export?format=docx`;
}

const GoogleDocsImportModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onImport: (url: string, name: string) => Promise<void>;
    t: TFunction;
}> = ({ isOpen, onClose, onImport, t }) => {
    const [url, setUrl] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleImport = async () => {
        if (!url?.trim() || !name?.trim()) return;
        setIsLoading(true);
        try {
            await onImport(url.trim(), name.trim());
            onClose();
            setUrl('');
            setName('');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('partners.generalConditions.googleImportTitle')}</DialogTitle>
                </DialogHeader>
                <div className="p-6 space-y-4">
                    <div className="bg-[var(--admin-background-secondary)] text-[var(--admin-text-secondary)] p-3 rounded-lg text-sm border border-[var(--admin-border)] flex gap-2">
                        <AlertCircle size={16} className="shrink-0 mt-0.5 text-[var(--admin-info)]"/>
                        <p>{t('partners.generalConditions.googleImportHint')}</p>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">{t('partners.generalConditions.templateNameLabel')}</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder={t('partners.generalConditions.templateNamePlaceholder')} 
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[var(--admin-primary)] text-sm"
                            autoFocus
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">{t('partners.generalConditions.documentLinkLabel')}</label>
                        <div className="relative">
                            <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                            <input 
                                type="url" 
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                placeholder={t('partners.generalConditions.documentLinkPlaceholder')} 
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-[var(--admin-primary)] text-sm"
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>{t('partners.generalConditions.cancel')}</Button>
                    <Button 
                        onClick={handleImport} 
                        disabled={!url || !name || isLoading}
                    >
                        {isLoading ? t('partners.generalConditions.importing') : t('partners.generalConditions.importBtn')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const TemplateEditorModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    template: Template | null;
    onSave: (id: number, content: string, lang: string) => void;
    isLoading: boolean;
    t: TFunction;
}> = ({ isOpen, onClose, template, onSave, isLoading, t }) => {
    const [content, setContent] = useState('');
    const [lang, setLang] = useState<string>('RU');
    const quillRef = useRef<ReactQuill>(null);

    useEffect(() => {
        if (isOpen && template?.content_html) {
            setContent(template.content_html);
        } else if (isOpen) {
            setContent('');
        }
        if (isOpen && template?.lang) setLang(template.lang);
    }, [isOpen, template]);

    // Setup drag & drop handlers on Quill editor
    useEffect(() => {
        if (!isOpen || !quillRef.current) return;
        
        const quill = quillRef.current.getEditor();
        const editorElement = quill.root;

        const syncContentFromQuill = () => {
            // Keep React state in sync after programmatic edits (insertText via API)
            // This fixes "variables visible but not saved/exported".
            setContent(quill.root.innerHTML);
        };
        
        const handleDrop = (e: DragEvent) => {
            e.preventDefault();
            const variable = e.dataTransfer?.getData('text/plain');
            if (variable) {
                const range = quill.getSelection(true);
                const index = range ? range.index : quill.getLength();
                quill.insertText(index, variable, { 'bold': true, 'color': 'var(--admin-primary)' });
                quill.setSelection({ index: index + variable.length, length: 0 });
                // Quill API edits don't always propagate to controlled ReactQuill value automatically
                requestAnimationFrame(syncContentFromQuill);
            }
        };

        const handleDragOver = (e: DragEvent) => {
            e.preventDefault();
            if (e.dataTransfer) {
                e.dataTransfer.dropEffect = 'copy';
            }
        };

        editorElement.addEventListener('drop', handleDrop);
        editorElement.addEventListener('dragover', handleDragOver);

        return () => {
            editorElement.removeEventListener('drop', handleDrop);
            editorElement.removeEventListener('dragover', handleDragOver);
        };
    }, [isOpen]);

    const insertVariable = (variable: string) => {
        const quill = quillRef.current?.getEditor();
        if (!quill) return;
        
        const range = quill.getSelection(true);
        const index = range ? range.index : quill.getLength();
        quill.insertText(index, variable, { 'bold': true, 'color': 'var(--admin-primary)' });
        quill.setSelection({ index: index + variable.length, length: 0 } as any);
        requestAnimationFrame(() => setContent(quill.root.innerHTML));
    };

    const handleSave = () => {
        if (template) {
            onSave(template.id, content, lang);
        }
        onClose();
    };

    const handleDragStart = (e: React.DragEvent, variable: string) => {
        e.dataTransfer.setData('text/plain', variable);
        e.dataTransfer.effectAllowed = 'copy';
    };


    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl h-[85vh] flex flex-col bg-[#F0F2F5] p-0">
                <DialogHeader className="px-6 pt-6 pb-0">
                    <div className="flex items-center justify-between gap-4">
                        <DialogTitle>{t('partners.generalConditions.editorTitle')}: {template?.name || t('partners.generalConditions.newTemplate')}</DialogTitle>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500">{t('partners.generalConditions.language')}</span>
                            <select
                                value={lang}
                                onChange={(e) => setLang(e.target.value)}
                                className="h-9 px-2 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700"
                            >
                                <option value="RU">RU</option>
                                <option value="EN">EN</option>
                            </select>
                        </div>
                    </div>
                </DialogHeader>
                <div className="flex-1 flex overflow-hidden">
                    {/* Editor Canvas */}
                    <div className="flex-1 p-8 flex justify-center">
                        <div className="w-[210mm] h-full bg-white shadow-lg relative flex flex-col p-8 overflow-hidden">
                            {isLoading ? (
                                <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
                                    {t('partners.generalConditions.loadingDocument')}
                                </div>
                            ) : (
                                <ReactQuill
                                    ref={quillRef}
                                    theme="snow"
                                    value={content}
                                    onChange={setContent}
                                    modules={{
                                        toolbar: [
                                            [{ 'header': [1, 2, 3, false] }],
                                            ['bold', 'italic', 'underline', 'strike'],
                                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                            [{ 'align': [] }],
                                            ['clean']
                                        ]
                                    }}
                                    placeholder={t('partners.generalConditions.editorPlaceholder')}
                                    className="flex-1 w-full flex flex-col min-h-0
                                      [&_.ql-toolbar]:sticky [&_.ql-toolbar]:top-0 [&_.ql-toolbar]:z-20
                                      [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:px-0 [&_.ql-toolbar]:bg-white
                                      [&_.ql-toolbar]:pb-3 [&_.ql-toolbar]:mb-3 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-slate-200
                                      [&_.ql-container]:border-0 [&_.ql-container]:flex-1 [&_.ql-container]:min-h-0 [&_.ql-container]:overflow-hidden
                                      [&_.ql-editor]:p-0 [&_.ql-editor]:w-full [&_.ql-editor]:max-w-full
                                      [&_.ql-editor]:overflow-y-auto [&_.ql-editor]:overflow-x-hidden
                                      [&_.ql-editor]:whitespace-normal [&_.ql-editor]:break-words [&_.ql-editor]:[overflow-wrap:anywhere]
                                      [&_.ql-editor_img]:max-w-full [&_.ql-editor_img]:h-auto
                                      [&_.ql-editor_table]:w-full [&_.ql-editor_table]:max-w-full [&_.ql-editor_table]:table-fixed
                                      [&_.ql-editor_td]:break-words [&_.ql-editor_th]:break-words
                                      [&_.ql-editor_pre]:whitespace-pre-wrap"
                                />
                            )}
                        </div>
                    </div>

                    {/* Sidebar Variables */}
                    <div className="w-72 bg-white border-l border-slate-200 p-0 flex flex-col z-10 shadow-xl">
                        <div className="p-4 border-b border-slate-100 bg-slate-50">
                            <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                <Braces size={16} className="text-[var(--admin-primary)]"/>
                                {t('partners.generalConditions.variables')}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">{t('partners.generalConditions.variablesHint')}</p>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {CONTRACT_VARIABLE_KEYS.map(v => (
                                <button
                                    key={v.key}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, v.key)}
                                    onClick={() => insertVariable(v.key)}
                                    className="w-full text-left p-3 rounded-xl bg-white border border-slate-200 hover:border-[var(--admin-primary)] hover:shadow-md transition-all group relative overflow-hidden cursor-grab active:cursor-grabbing"
                                >
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 opacity-0 group-hover:opacity-100">
                                        <GripVertical size={14} />
                                    </div>
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 group-hover:bg-[var(--admin-primary)] transition-colors"></div>
                                    <div className="text-xs font-bold text-slate-700 group-hover:text-[var(--admin-primary)]">{t(`partners.generalConditions.${v.labelKey}`)}</div>
                                    <div className="text-[10px] font-mono text-slate-400 mt-1 bg-slate-50 px-1.5 py-0.5 rounded w-fit">{v.key}</div>
                                </button>
                            ))}
                        </div>
                        
                        <div className="p-4 border-t border-slate-200 bg-slate-50">
                             <div className="text-[10px] text-slate-400 mb-2 text-center flex items-center justify-center gap-1">
                                <GripVertical size={12}/> {t('partners.generalConditions.dragDropHint')}
                             </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-4 border-t border-slate-200 bg-white shrink-0">
                    <Button variant="ghost" onClick={onClose}>{t('partners.generalConditions.cancel')}</Button>
                    <Button onClick={handleSave} className="flex items-center gap-2" disabled={isLoading}>
                        <Save size={18}/> {t('partners.generalConditions.saveAndClose')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export const AgencyGeneralConditions: React.FC = () => {
    const { t } = useLanguage();

    useEffect(() => {
        const themeVariables = getAdminThemeVariables(ADMIN_THEME);
        Object.entries(themeVariables).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value);
        });
    }, []);

    const [activeTab, setActiveTab] = useState<'rules' | 'templates' | 'signature'>('rules');
    const [settings, setSettings] = useState({
        defaultCommission: 4,
        leadLockDays: 30,
        payoutTerms: 'Выплата вознаграждения производится в течение 10 рабочих дней после поступления средств от клиента на счет застройщика. Валюта выплаты соответствует валюте договора.',
        productsDescription: '',
        territory: '',
        exclusivity: 'non-exclusive' as 'exclusive' | 'non-exclusive',
        agreementEffectiveDate: '',
        agreementEndDate: '',
        forceMajeureWeeks: 8,
        originalsCount: 2,
        developerCompanyType: '',
        developerRegisteredOffice: '',
        developerRepresentativeName: '',
        developerRepresentativeTitle: '',
        developerSignaturePath: null as string | null,
        developerStampPath: null as string | null,
    });

    const [isEditing, setIsEditing] = useState(false);
    const [loadingSettings, setLoadingSettings] = useState(false);

    const { user } = useAuth();
    const { activeWorkspaceId, isManagerMode } = useWorkspace();
    const developerId = isManagerMode ? activeWorkspaceId : (user?.id ?? null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [contracts, setContracts] = useState<Array<{ name: string; path: string; url: string }>>([]);
    const [loadingContracts, setLoadingContracts] = useState(false);
    const [uploading, setUploading] = useState(false);
    
    // Templates state
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [isEditorLoading, setIsEditorLoading] = useState(false);
    const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
    const [isGoogleImportOpen, setIsGoogleImportOpen] = useState(false);

    const bucket = 'project-files';
    const imagesBucket = 'project-images';
    const signatureInputRef = useRef<HTMLInputElement>(null);
    const stampInputRef = useRef<HTMLInputElement>(null);
    const [savingImages, setSavingImages] = useState<{ signature: boolean; stamp: boolean }>({ signature: false, stamp: false });

    const basePath = useMemo(() => {
        if (!developerId) return null;
        return `agent-contracts/${developerId}`;
    }, [developerId]);

    const loadContracts = async () => {
        if (!developerId) {
            setContracts([]);
            return;
        }

        setLoadingContracts(true);
        try {
            const { data, error } = await supabase.functions.invoke('agent-program', {
                body: { action: 'list_developer_contracts', developer_user_id: developerId },
            });
            if (error) throw error;
            const items = (data?.contracts ?? []) as Array<{ name: string; path: string; url: string }>;

            setContracts(items);
        } catch (e) {
            console.error('Failed to load contracts', e);
            toast.error(t('partners.generalConditions.errorLoadContracts'));
            setContracts([]);
        } finally {
            setLoadingContracts(false);
        }
    };

    const loadTemplates = async () => {
        if (!developerId) {
            setTemplates([]);
            return;
        }

        setLoadingTemplates(true);
        try {
            const { data, error } = await supabase.functions.invoke('agent-program', {
                body: { action: 'list_contract_templates', developer_user_id: developerId },
            });
            if (error) throw error;
            const items = (data?.templates ?? []) as Template[];
            setTemplates(items);
        } catch (e) {
            console.error('Failed to load templates', e);
            toast.error(t('partners.generalConditions.errorLoadTemplates'));
            setTemplates([]);
        } finally {
            setLoadingTemplates(false);
        }
    };

    useEffect(() => {
        void loadContracts();
        void loadTemplates();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [developerId]);

    // Close menus on click outside
    useEffect(() => {
        const closeMenu = () => setMenuOpenId(null);
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
    }, []);

    useEffect(() => {
        const loadSettings = async () => {
            if (!developerId) return;
            setLoadingSettings(true);
            try {
                const { data, error } = await supabase.functions.invoke('agent-program', {
                    body: { action: 'get_agent_program_settings', developer_user_id: developerId },
                });
                if (error) throw error;
                const s = data?.settings ?? null;
                if (s) {
                    setSettings((prev) => ({
                        ...prev,
                        defaultCommission: typeof s.default_commission_rate === 'number' ? s.default_commission_rate : prev.defaultCommission,
                        leadLockDays: typeof s.lead_lock_days === 'number' ? s.lead_lock_days : prev.leadLockDays,
                        payoutTerms: typeof s.payout_terms === 'string' && s.payout_terms ? s.payout_terms : prev.payoutTerms,
                        productsDescription: typeof s.products_description === 'string' ? s.products_description : prev.productsDescription,
                        territory: typeof s.territory === 'string' ? s.territory : prev.territory,
                        exclusivity: (s.exclusivity === 'exclusive' || s.exclusivity === 'non-exclusive') ? s.exclusivity : prev.exclusivity,
                        agreementEffectiveDate: typeof s.agreement_effective_date === 'string' ? s.agreement_effective_date : prev.agreementEffectiveDate,
                        agreementEndDate: typeof s.agreement_end_date === 'string' ? s.agreement_end_date : prev.agreementEndDate,
                        forceMajeureWeeks: typeof s.force_majeure_weeks === 'number' ? s.force_majeure_weeks : prev.forceMajeureWeeks,
                        originalsCount: typeof s.originals_count === 'number' ? s.originals_count : prev.originalsCount,
                        developerCompanyType: typeof s.developer_company_type === 'string' ? s.developer_company_type : prev.developerCompanyType,
                        developerRegisteredOffice: typeof s.developer_registered_office === 'string' ? s.developer_registered_office : prev.developerRegisteredOffice,
                        developerRepresentativeName: typeof s.developer_representative_name === 'string' ? s.developer_representative_name : prev.developerRepresentativeName,
                        developerRepresentativeTitle: typeof s.developer_representative_title === 'string' ? s.developer_representative_title : prev.developerRepresentativeTitle,
                        developerSignaturePath: typeof s.developer_signature_path === 'string' ? s.developer_signature_path : null,
                        developerStampPath: typeof s.developer_stamp_path === 'string' ? s.developer_stamp_path : null,
                    }));
                }
            } catch (e) {
                console.error('Failed to load agent program settings', e);
                toast.error(t('partners.generalConditions.errorLoadSettings'));
            } finally {
                setLoadingSettings(false);
            }
        };
        void loadSettings();
    }, [developerId, t]);

    const saveSettingsPatch = useCallback(async (patch: Record<string, unknown>) => {
        if (!developerId) return;
        const { data, error } = await supabase.functions.invoke('agent-program', {
            body: {
                action: 'update_agent_program_settings',
                developer_user_id: developerId,
                ...patch,
            },
        });
        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Failed to save settings');
    }, [developerId]);

    const handleSave = async () => {
        if (!developerId) return;
        try {
            setLoadingSettings(true);
            await saveSettingsPatch({
                default_commission_rate: settings.defaultCommission,
                lead_lock_days: settings.leadLockDays,
                payout_terms: settings.payoutTerms,
                products_description: settings.productsDescription || null,
                territory: settings.territory || null,
                exclusivity: settings.exclusivity,
                agreement_effective_date: settings.agreementEffectiveDate || null,
                agreement_end_date: settings.agreementEndDate || null,
                force_majeure_weeks: settings.forceMajeureWeeks,
                originals_count: settings.originalsCount,
                developer_company_type: settings.developerCompanyType || null,
                developer_registered_office: settings.developerRegisteredOffice || null,
                developer_representative_name: settings.developerRepresentativeName || null,
                developer_representative_title: settings.developerRepresentativeTitle || null,
            });
            setIsEditing(false);
            toast.success(t('partners.generalConditions.conditionsUpdated'), { description: t('partners.generalConditions.conditionsUpdatedDesc') });
        } catch (e: unknown) {
            console.error('Failed to save agent program settings', e);
            toast.error(e instanceof Error ? e.message : t('partners.generalConditions.errorSaveConditions'));
        } finally {
            setLoadingSettings(false);
        }
    };

    const handleUploadContracts = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        if (!developerId) {
            toast.error(t('partners.generalConditions.errorDeveloperUnknown'));
            return;
        }

        setUploading(true);
        try {
            for (const file of Array.from(files)) {
                const lower = file.name.toLowerCase();
                if (!lower.endsWith('.docx') && !lower.endsWith('.pdf')) {
                    toast.error(t('partners.generalConditions.onlyDocxPdf'));
                    continue;
                }
                const fd = new FormData();
                fd.set('action', 'upload_developer_contract');
                fd.set('developer_user_id', developerId);
                fd.set('file', file);
                const { data, error } = await supabase.functions.invoke('agent-program', {
                    body: fd,
                });
                if (error) throw error;
                if (!data?.success) throw new Error(data?.error || 'Upload failed');
            }

            toast.success(t('partners.generalConditions.contractsUploaded'));
            await loadContracts();
            await loadTemplates();
        } catch (e) {
            console.error('Failed to upload contracts', e);
            toast.error(e instanceof Error ? e.message : t('partners.generalConditions.errorUploadContracts'));
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteContract = async (path: string) => {
        if (!confirm(t('partners.generalConditions.confirmDeleteContract'))) return;
        try {
            const { data, error } = await supabase.functions.invoke('agent-program', {
                body: { action: 'delete_developer_contract', developer_user_id: developerId, path },
            });
            if (error) throw error;
            if (!data?.success) throw new Error(data?.error || 'Delete failed');
            toast.success(t('partners.generalConditions.contractDeleted'));
            await loadContracts();
            await loadTemplates();
        } catch (e) {
            console.error('Failed to delete contract', e);
            toast.error(t('partners.generalConditions.errorDeleteContract'));
        }
    };

    const assetsBasePath = useMemo(() => {
        if (!developerId) return null;
        return `agency-assets/${developerId}`;
    }, [developerId]);

    const signatureUrl = useMemo(() => {
        if (!settings.developerSignaturePath) return null;
        return supabase.storage.from(imagesBucket).getPublicUrl(settings.developerSignaturePath).data.publicUrl;
    }, [settings.developerSignaturePath]);

    const stampUrl = useMemo(() => {
        if (!settings.developerStampPath) return null;
        return supabase.storage.from(imagesBucket).getPublicUrl(settings.developerStampPath).data.publicUrl;
    }, [settings.developerStampPath]);

    const handleUploadImage = async (type: 'signature' | 'stamp', file: globalThis.File) => {
        if (!assetsBasePath) throw new Error(t('partners.generalConditions.errorDeveloperUnknown'));
        if (file.type !== 'image/png') throw new Error(t('partners.generalConditions.onlyPng'));

        const path = `${assetsBasePath}/${type}.png`;

        setSavingImages((prev) => ({ ...prev, [type]: true }));
        try {
            const fd = new FormData();
            fd.set('action', 'upload_developer_asset');
            fd.set('developer_user_id', String(developerId ?? ''));
            fd.set('asset_type', type);
            fd.set('file', file);
            const { data, error } = await supabase.functions.invoke('agent-program', { body: fd });
            if (error) throw error;
            if (!data?.success) throw new Error(data?.error || 'Upload failed');

            setSettings((prev) =>
                type === 'signature'
                    ? { ...prev, developerSignaturePath: String(data?.path ?? path) }
                    : { ...prev, developerStampPath: String(data?.path ?? path) },
            );
            toast.success(type === 'signature' ? t('partners.generalConditions.signatureSaved') : t('partners.generalConditions.stampSaved'));
        } finally {
            setSavingImages((prev) => ({ ...prev, [type]: false }));
        }
    };

    const handleClearImage = async (type: 'signature' | 'stamp') => {
        setSavingImages((prev) => ({ ...prev, [type]: true }));
        try {
            const { data, error } = await supabase.functions.invoke('agent-program', {
                body: { action: 'clear_developer_asset', developer_user_id: developerId, asset_type: type },
            });
            if (error) throw error;
            if (!data?.success) throw new Error(data?.error || 'Clear failed');
            setSettings((prev) =>
                type === 'signature'
                    ? { ...prev, developerSignaturePath: null }
                    : { ...prev, developerStampPath: null },
            );
            toast.success(type === 'signature' ? t('partners.generalConditions.signatureRemoved') : t('partners.generalConditions.stampRemoved'));
        } finally {
            setSavingImages((prev) => ({ ...prev, [type]: false }));
        }
    };

    const handleTemplateSave = async (id: number, content: string, lang: string) => {
        if (!developerId) return;
        const template = templates.find((t) => t.id === id);
        if (!template) {
            toast.error(t('partners.generalConditions.templateNotFound'));
            return;
        }
        try {
            const { data, error } = await supabase.functions.invoke('agent-program', {
                body: {
                    action: 'save_contract_template',
                    developer_user_id: developerId,
                    id,
                    content_html: content,
                    name: template.name,
                    lang,
                },
            });
            if (error) throw error;
            if (!data?.success) throw new Error(data?.error || 'Failed to save template');
            toast.success(t('partners.generalConditions.templateUpdated'));
            await loadTemplates();
        } catch (e) {
            console.error('Failed to save template', e);
            toast.error(t('partners.generalConditions.errorSaveTemplate'));
        }
    };

    const handleDeleteTemplate = async (id: number) => {
        if (!confirm(t('partners.generalConditions.confirmDeleteTemplate'))) return;
        if (!developerId) return;
        try {
            const { data, error } = await supabase.functions.invoke('agent-program', {
                body: { action: 'delete_contract_template', developer_user_id: developerId, id },
            });
            if (error) throw error;
            if (!data?.success) throw new Error(data?.error || 'Delete failed');
            toast.success(t('partners.generalConditions.templateDeleted'));
            await loadTemplates();
        } catch (e) {
            console.error('Failed to delete template', e);
            toast.error(t('partners.generalConditions.errorDeleteTemplate'));
        }
    };

    const handleDownload = async (template: Template, format?: 'docx' | 'pdf') => {
        if (!developerId) return;
        try {
            const { data, error } = await supabase.functions.invoke('agent-program', {
                body: {
                    action: 'get_contract_template_download_url',
                    developer_user_id: developerId,
                    id: template.id,
                    format,
                },
            });
            if (error) throw error;
            if (!data?.success || !data?.url) throw new Error(data?.error || 'Не удалось получить ссылку скачивания');
            window.open(String(data.url), '_blank');
        } catch (e) {
            console.error('Failed to get download url', e);
            const maybe = e as FunctionsError | Error;
            toast.error(maybe?.message || t('partners.generalConditions.errorDownload'));
        }
    };

    const handleGoogleDocsImport = async (url: string, name: string) => {
        if (!developerId) {
            toast.error(t('partners.generalConditions.errorDeveloperUnknown'));
            return;
        }
        const docId = getGoogleDocId(url);
        if (!docId) {
            toast.error(t('partners.generalConditions.googleImportInvalidLink'));
            return;
        }
        const exportUrl = getGoogleDocExportUrl(docId);
        let arrayBuffer: ArrayBuffer;
        try {
            let res = await fetch(exportUrl, { mode: 'cors', credentials: 'omit' });
            if (!res.ok) {
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(exportUrl)}`;
                res = await fetch(proxyUrl);
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            arrayBuffer = await res.arrayBuffer();
            if (arrayBuffer.byteLength === 0) throw new Error('Empty response');
        } catch (e) {
            console.error('Google Docs fetch failed', e);
            toast.error(t('partners.generalConditions.googleImportComingSoon'));
            return;
        }
        const safeName = name
            .replace(/\s+/g, '_')
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .replace(/_+/g, '_') || 'imported';
        const fileName = safeName.toLowerCase().endsWith('.docx') ? safeName : `${safeName}.docx`;
        const file = new File([arrayBuffer], fileName, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        try {
            const fd = new FormData();
            fd.set('action', 'upload_developer_contract');
            fd.set('developer_user_id', developerId);
            fd.set('file', file);
            const { data, error } = await supabase.functions.invoke('agent-program', { body: fd });
            if (error) throw error;
            if (!data?.success) throw new Error((data?.error as string) || 'Upload failed');
            toast.success(t('partners.generalConditions.contractsUploaded'));
            await loadTemplates();
        } catch (e) {
            console.error('Upload after Google Docs import failed', e);
            toast.error(e instanceof Error ? e.message : t('partners.generalConditions.errorUploadContracts'));
        }
    };

    const openTemplateEditor = async (template: Template) => {
        setEditingTemplate(template);
        setIsEditorLoading(true);
        try {
            if (!developerId) throw new Error(t('partners.generalConditions.errorDeveloperUnknown'));

            // If we already have editable HTML saved, use it as the source of truth.
            if (template.content_html) {
                setEditingTemplate((prev) => (prev ? { ...prev, content_html: template.content_html } : prev));
                return;
            }

            const lower = template.name.toLowerCase();
            if (lower.endsWith('.docx')) {
                // Fetch fresh DOCX and convert to HTML for editing.
                const { data: urlData, error: urlErr } = await supabase.functions.invoke('agent-program', {
                    body: {
                        action: 'get_contract_template_download_url',
                        developer_user_id: developerId,
                        id: template.id,
                        format: 'docx',
                    },
                });
                if (urlErr) throw urlErr;
                const url = String(urlData?.url ?? '');
                if (!url) throw new Error('URL шаблона не найден');

                const response = await fetch(url, { cache: 'no-store' });
                if (!response.ok) throw new Error('Не удалось загрузить файл');
                const arrayBuffer = await response.arrayBuffer();
                const result = await mammoth.convertToHtml({ arrayBuffer });
                setEditingTemplate((prev) => (prev ? { ...prev, content_html: result.value } : prev));
            } else if (lower.endsWith('.pdf')) {
                const { data: urlData, error: urlErr } = await supabase.functions.invoke('agent-program', {
                    body: {
                        action: 'get_contract_template_download_url',
                        developer_user_id: developerId,
                        id: template.id,
                        format: 'pdf',
                    },
                });
                if (urlErr) throw urlErr;
                const url = String(urlData?.url ?? '');
                if (!url) throw new Error('URL шаблона не найден');

                const response = await fetch(url, { cache: 'no-store' });
                if (!response.ok) throw new Error('Не удалось загрузить PDF');
                const arrayBuffer = await response.arrayBuffer();
                const html = await extractPdfToHtml(arrayBuffer);
                setEditingTemplate((prev) => (prev ? { ...prev, content_html: html } : prev));
            } else {
                throw new Error('Неподдерживаемый формат шаблона');
            }
        } catch (e) {
            console.error('Failed to open template editor', e);
            toast.error(t('partners.generalConditions.errorOpenTemplate'));
        } finally {
            setIsEditorLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <TemplateEditorModal 
                isOpen={!!editingTemplate} 
                onClose={() => setEditingTemplate(null)} 
                template={editingTemplate}
                onSave={handleTemplateSave}
                isLoading={isEditorLoading}
                t={t}
            />

            <GoogleDocsImportModal 
                isOpen={isGoogleImportOpen}
                onClose={() => setIsGoogleImportOpen(false)}
                onImport={handleGoogleDocsImport}
                t={t}
            />

            {/* Header Banner */}
            <div className="bg-[var(--admin-primary)] rounded-2xl p-6 text-[var(--admin-text-on-primary)] relative overflow-hidden shadow-lg">
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold mb-1">{t('partners.generalConditions.title')}</h2>
                        <p className="opacity-90 text-sm max-w-xl">
                            {t('partners.generalConditions.subtitle')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-4 md:px-0">
                <div className="flex gap-6 overflow-x-auto no-scrollbar border-b border-slate-200 bg-white ">
                    <button
                        onClick={() => setActiveTab('rules')}
                        className={`py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'rules' ? 'border-[var(--admin-primary)] text-[var(--admin-primary)]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        <ShieldCheck size={16} /> {t('partners.generalConditions.tabRules')}
                    </button>
                    <button
                        onClick={() => setActiveTab('templates')}
                        className={`py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'templates' ? 'border-[var(--admin-primary)] text-[var(--admin-primary)]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        <FileText size={16} /> {t('partners.generalConditions.tabTemplates')}
                    </button>
                    <button
                        onClick={() => setActiveTab('signature')}
                        className={`py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'signature' ? 'border-[var(--admin-primary)] text-[var(--admin-primary)]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        <PenTool size={16} /> {t('partners.generalConditions.tabSignature')}
                    </button>
                </div>
            </div>

            {activeTab === 'rules' && (
                <div className="flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-900 text-lg">{t('partners.generalConditions.basicParams')}</h3>
                            {!isEditing ? (
                                <Button variant="ghost" onClick={() => setIsEditing(true)} className="text-sm font-bold text-[var(--admin-primary)] hover:bg-[var(--admin-background-hover)] px-3 py-1.5 rounded-lg transition-colors h-auto">
                                    {t('partners.generalConditions.edit')}
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button variant="ghost" onClick={() => setIsEditing(false)} className="text-sm font-medium text-slate-500 hover:bg-slate-100 px-3 py-1.5 rounded-lg h-auto">{t('partners.generalConditions.cancel')}</Button>
                                    <Button onClick={handleSave} className="text-sm font-bold text-[var(--admin-text-on-primary)] bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-hover)] px-3 py-1.5 rounded-lg shadow-sm h-auto">{t('partners.generalConditions.save')}</Button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('partners.generalConditions.defaultCommission')}</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10">
                                        <Percent size={16} />
                                    </div>
                                    <Input
                                        type="number"
                                        disabled={!isEditing}
                                        value={settings.defaultCommission}
                                        onChange={e => setSettings({ ...settings, defaultCommission: Number(e.target.value) })}
                                        className="w-full pl-9 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white transition-all disabled:opacity-70 h-12"
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-1.5">{t('partners.generalConditions.defaultCommissionHint')}</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('partners.generalConditions.leadLock')}</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10">
                                        <Clock size={16} />
                                    </div>
                                    <Input
                                        type="number"
                                        disabled={!isEditing}
                                        value={settings.leadLockDays}
                                        onChange={e => setSettings({ ...settings, leadLockDays: Number(e.target.value) })}
                                        className="w-full pl-9 pr-12 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white transition-all disabled:opacity-70 h-12"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium z-10">{t('partners.generalConditions.days')}</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1.5">{t('partners.generalConditions.leadLockHint')}</p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('partners.generalConditions.payoutTerms')}</label>
                            <Textarea
                                disabled={!isEditing}
                                value={settings.payoutTerms}
                                onChange={e => setSettings({ ...settings, payoutTerms: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 min-h-[100px] focus:bg-white transition-all resize-none disabled:opacity-70 leading-relaxed"
                            />
                        </div>

                        <div className="mt-6">
                            <div className="flex items-center justify-between gap-4 mb-3">
                                <h4 className="font-bold text-slate-900 text-sm">{t('partners.generalConditions.contractPlaceholders')}</h4>
                                <span className="text-[10px] text-slate-400">{t('partners.generalConditions.contractPlaceholdersHint')}</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('partners.generalConditions.territory')}</label>
                                    <Input
                                        type="text"
                                        disabled={!isEditing}
                                        value={settings.territory}
                                        onChange={(e) => setSettings({ ...settings, territory: e.target.value })}
                                        placeholder={t('partners.generalConditions.territoryPlaceholder')}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white transition-all disabled:opacity-70 h-12"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('partners.generalConditions.exclusivity')}</label>
                                    <select
                                        disabled={!isEditing}
                                        value={settings.exclusivity}
                                        onChange={(e) => setSettings({ ...settings, exclusivity: e.target.value as 'exclusive' | 'non-exclusive' })}
                                        className="w-full h-12 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white transition-all disabled:opacity-70"
                                    >
                                        <option value="non-exclusive">{t('partners.generalConditions.exclusivityNonExclusive')}</option>
                                        <option value="exclusive">{t('partners.generalConditions.exclusivityExclusive')}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('partners.generalConditions.principalCompanyType')}</label>
                                    <Input
                                        type="text"
                                        disabled={!isEditing}
                                        value={settings.developerCompanyType}
                                        onChange={(e) => setSettings({ ...settings, developerCompanyType: e.target.value })}
                                        placeholder={t('partners.generalConditions.principalCompanyTypePlaceholder')}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white transition-all disabled:opacity-70 h-12"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('partners.generalConditions.principalRegisteredOffice')}</label>
                                    <Input
                                        type="text"
                                        disabled={!isEditing}
                                        value={settings.developerRegisteredOffice}
                                        onChange={(e) => setSettings({ ...settings, developerRegisteredOffice: e.target.value })}
                                        placeholder={t('partners.generalConditions.principalRegisteredOfficePlaceholder')}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white transition-all disabled:opacity-70 h-12"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('partners.generalConditions.principalRepresentedByName')}</label>
                                    <Input
                                        type="text"
                                        disabled={!isEditing}
                                        value={settings.developerRepresentativeName}
                                        onChange={(e) => setSettings({ ...settings, developerRepresentativeName: e.target.value })}
                                        placeholder={t('partners.generalConditions.principalRepresentedByNamePlaceholder')}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white transition-all disabled:opacity-70 h-12"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('partners.generalConditions.principalRepresentedByTitle')}</label>
                                    <Input
                                        type="text"
                                        disabled={!isEditing}
                                        value={settings.developerRepresentativeTitle}
                                        onChange={(e) => setSettings({ ...settings, developerRepresentativeTitle: e.target.value })}
                                        placeholder={t('partners.generalConditions.principalRepresentedByTitlePlaceholder')}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white transition-all disabled:opacity-70 h-12"
                                    />
                                </div>
                            </div>

                            <div className="mt-6">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('partners.generalConditions.productsDescription')}</label>
                                <Textarea
                                    disabled={!isEditing}
                                    value={settings.productsDescription}
                                    onChange={(e) => setSettings({ ...settings, productsDescription: e.target.value })}
                                    placeholder={t('partners.generalConditions.productsDescriptionPlaceholder')}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 min-h-[90px] focus:bg-white transition-all resize-none disabled:opacity-70 leading-relaxed"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('partners.generalConditions.agreementEffectiveDate')}</label>
                                    <Input
                                        type="text"
                                        disabled={!isEditing}
                                        value={settings.agreementEffectiveDate}
                                        onChange={(e) => setSettings({ ...settings, agreementEffectiveDate: e.target.value })}
                                        placeholder={t('partners.generalConditions.agreementEffectiveDatePlaceholder')}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white transition-all disabled:opacity-70 h-12"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('partners.generalConditions.agreementEndDate')}</label>
                                    <Input
                                        type="text"
                                        disabled={!isEditing}
                                        value={settings.agreementEndDate}
                                        onChange={(e) => setSettings({ ...settings, agreementEndDate: e.target.value })}
                                        placeholder={t('partners.generalConditions.agreementEndDatePlaceholder')}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white transition-all disabled:opacity-70 h-12"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('partners.generalConditions.forceMajeureWeeks')}</label>
                                    <Input
                                        type="number"
                                        disabled={!isEditing}
                                        value={settings.forceMajeureWeeks}
                                        onChange={(e) => setSettings({ ...settings, forceMajeureWeeks: Number(e.target.value) })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white transition-all disabled:opacity-70 h-12"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('partners.generalConditions.originalsCount')}</label>
                                    <Input
                                        type="number"
                                        disabled={!isEditing}
                                        value={settings.originalsCount}
                                        onChange={(e) => setSettings({ ...settings, originalsCount: Number(e.target.value) })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white transition-all disabled:opacity-70 h-12"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3 text-amber-800 text-sm">
                        <AlertCircle size={20} className="shrink-0 mt-0.5" />
                        <p>{t('partners.generalConditions.alertCommission')}</p>
                    </div>
                </div>
            )}

            {activeTab === 'templates' && (
                <div className="space-y-4">
                    <div className="bg-[var(--admin-background-secondary)] border border-[var(--admin-border)] rounded-xl p-4 flex gap-3">
                        <AlertCircle size={20} className="text-[var(--admin-primary)] shrink-0 mt-0.5"/>
                        <div className="text-xs text-[var(--admin-text-secondary)]">
                            <p className="font-bold mb-1">{t('partners.generalConditions.templatesHowTitle')}</p>
                            <p>{t('partners.generalConditions.templatesHowText')}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm ">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">{t('partners.generalConditions.tableFileName')}</th>
                                    <th className="px-6 py-4">{t('partners.generalConditions.tableLang')}</th>
                                    <th className="px-6 py-4">{t('partners.generalConditions.tableDate')}</th>
                                    <th className="px-6 py-4 text-right">{t('partners.generalConditions.tableActions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loadingTemplates ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-4 text-center text-xs text-slate-400">{t('partners.generalConditions.loading')}</td>
                                    </tr>
                                ) : templates.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-4 text-center text-xs text-slate-400">{t('partners.generalConditions.noTemplates')}</td>
                                    </tr>
                                ) : (
                                    templates.map((tmpl) => (
                                        <tr key={tmpl.id} className="hover:bg-slate-50 group">
                                            <td className="px-6 py-4 flex items-center gap-3">
                                                <div className="p-2 bg-slate-100 text-slate-500 rounded-lg">
                                                    <FileText size={18}/>
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">{tmpl.name}</div>
                                                    <div className="text-xs text-slate-400">
                                                        {tmpl.name.toLowerCase().endsWith('.pdf') ? t('partners.generalConditions.pdfDocument') : t('partners.generalConditions.wordDocument')}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600">{tmpl.lang}</span></td>
                                            <td className="px-6 py-4 text-slate-500">{tmpl.date}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 relative">
                                                <button 
                                                    onClick={() => void openTemplateEditor(tmpl)} 
                                                        className="p-2 text-slate-400 hover:text-[var(--admin-primary)] hover:bg-[var(--admin-background-hover)] rounded-lg transition-colors border border-transparent hover:border-[var(--admin-border)]"
                                                        title={t('partners.generalConditions.editInEditor')}
                                                    >
                                                        <FileEdit size={16}/>
                                                    </button>
                                                    
                                                    {/* Actions Dropdown */}
                                                    <div className="relative">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === tmpl.id ? null : tmpl.id); }}
                                                            className={`p-2 rounded-lg transition-colors ${menuOpenId === tmpl.id ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'}`}
                                                        >
                                                            <MoreVertical size={16}/>
                                                        </button>
                                                        {menuOpenId === tmpl.id && (
                                                            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-xl border border-slate-100 z-20 py-1 animate-in fade-in zoom-in-95">
                                                                <button onClick={() => void handleDownload(tmpl, 'docx')} className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-slate-700 hover:bg-slate-50">
                                                                    <Download size={14} className="text-[var(--admin-primary)]"/> {t('partners.generalConditions.downloadDocx')}
                                                                </button>
                                                                <button onClick={() => void handleDownload(tmpl, 'pdf')} className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-slate-700 hover:bg-slate-50">
                                                                    <Printer size={14} className="text-red-500"/> {t('partners.generalConditions.downloadPdf')}
                                                                </button>
                                                                <div className="h-px bg-slate-100 my-1"></div>
                                                                <button onClick={() => handleDeleteTemplate(tmpl.id)} className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-red-600 hover:bg-red-50">
                                                                    <Trash2 size={14}/> {t('partners.generalConditions.delete')}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        
                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept=".docx,.pdf"
                                onChange={handleUploadContracts}
                            />
                            
                            <button 
                                onClick={() => setIsGoogleImportOpen(true)}
                                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 hover:border-slate-300 transition-colors"
                            >
                                <ExternalLink size={16}/> {t('partners.generalConditions.importGoogleDocs')}
                            </button>
                            
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 bg-[var(--admin-primary)] text-[var(--admin-text-on-primary)] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[var(--admin-primary-hover)] transition-colors shadow-sm"
                            >
                                <FileIcon size={16}/> {t('partners.generalConditions.uploadFile')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'signature' && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
                        <PenTool size={18} className="text-[var(--admin-primary)]" /> {t('partners.generalConditions.signatureAndStamp')}
                    </h3>

                    <input
                        ref={signatureInputRef}
                        type="file"
                        accept="image/png,.png"
                        className="hidden"
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                                await handleUploadImage('signature', file);
                            } catch (err) {
                                console.error('signature upload failed', err);
                                toast.error(err instanceof Error ? err.message : t('partners.generalConditions.errorUploadSignature'));
                            } finally {
                                if (signatureInputRef.current) signatureInputRef.current.value = '';
                            }
                        }}
                    />
                    <input
                        ref={stampInputRef}
                        type="file"
                        accept="image/png,.png"
                        className="hidden"
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                                await handleUploadImage('stamp', file);
                            } catch (err) {
                                console.error('stamp upload failed', err);
                                toast.error(err instanceof Error ? err.message : t('partners.generalConditions.errorUploadStamp'));
                            } finally {
                                if (stampInputRef.current) stampInputRef.current.value = '';
                            }
                        }}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <div className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                                <PenTool size={14} /> {t('partners.generalConditions.signatureDirector')}
                            </div>
                            <div className="aspect-video bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center relative overflow-hidden group">
                                {signatureUrl ? (
                                    <>
                                        <img src={signatureUrl} alt="Signature" className="h-full object-contain p-4 mix-blend-multiply" />
                                        <button
                                            onClick={() => void handleClearImage('signature')}
                                            disabled={savingImages.signature}
                                            className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                                            title={t('partners.generalConditions.remove')}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => signatureInputRef.current?.click()}
                                        disabled={savingImages.signature}
                                        className="flex flex-col items-center gap-2 text-slate-400 hover:text-[var(--admin-primary)] transition-colors disabled:opacity-50"
                                    >
                                        <Upload size={24} />
                                        <span className="text-xs font-bold uppercase">{t('partners.generalConditions.uploadPng')}</span>
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-slate-400 mt-2">{t('partners.generalConditions.signatureHint')}</p>
                        </div>

                        <div>
                            <div className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                                <Check size={14} /> {t('partners.generalConditions.stampCompany')}
                            </div>
                            <div className="aspect-video bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center relative overflow-hidden group">
                                {stampUrl ? (
                                    <>
                                        <img src={stampUrl} alt="Stamp" className="h-full object-contain p-4 mix-blend-multiply opacity-80" />
                                        <button
                                            onClick={() => void handleClearImage('stamp')}
                                            disabled={savingImages.stamp}
                                            className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                                            title={t('partners.generalConditions.remove')}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => stampInputRef.current?.click()}
                                        disabled={savingImages.stamp}
                                        className="flex flex-col items-center gap-2 text-slate-400 hover:text-[var(--admin-primary)] transition-colors disabled:opacity-50"
                                    >
                                        <Upload size={24} />
                                        <span className="text-xs font-bold uppercase">{t('partners.generalConditions.uploadPng')}</span>
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-slate-400 mt-2">{t('partners.generalConditions.stampHint')}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
