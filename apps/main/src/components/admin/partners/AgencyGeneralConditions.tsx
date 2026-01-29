import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Clock, Download, FileText, Percent, Trash2, Upload } from 'lucide-react';
import { toast } from "sonner";
import { Button } from "@gridix/ui";
import { Input } from "@gridix/ui";
import { Textarea } from "@gridix/ui";
import { supabase } from "@gridix/utils/api";
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export const AgencyGeneralConditions: React.FC = () => {
    const [settings, setSettings] = useState({
        defaultCommission: 4,
        leadLockDays: 30,
        payoutTerms: 'Выплата вознаграждения производится в течение 10 рабочих дней после поступления средств от клиента на счет застройщика. Валюта выплаты соответствует валюте договора.',
    });

    const [isEditing, setIsEditing] = useState(false);

    const { user } = useAuth();
    const { activeWorkspaceId, isManagerMode } = useWorkspace();
    const developerId = isManagerMode ? activeWorkspaceId : (user?.id ?? null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [contracts, setContracts] = useState<Array<{ name: string; path: string; url: string }>>([]);
    const [loadingContracts, setLoadingContracts] = useState(false);
    const [uploading, setUploading] = useState(false);

    const bucket = 'project-images';

    const basePath = useMemo(() => {
        if (!developerId) return null;
        return `agent-contracts/${developerId}`;
    }, [developerId]);

    const loadContracts = async () => {
        if (!basePath) {
            setContracts([]);
            return;
        }

        setLoadingContracts(true);
        try {
            const { data, error } = await supabase.storage
                .from(bucket)
                .list(basePath, { limit: 100, offset: 0, sortBy: { column: 'name', order: 'asc' } });

            if (error) throw error;

            const items = (data ?? [])
                .filter((f) => f.name.toLowerCase().endsWith('.pdf'))
                .map((f) => {
                    const path = `${basePath}/${f.name}`;
                    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
                    return { name: f.name, path, url: urlData.publicUrl };
                });

            setContracts(items);
        } catch (e) {
            console.error('Failed to load contracts', e);
            toast.error('Ошибка при загрузке договоров');
            setContracts([]);
        } finally {
            setLoadingContracts(false);
        }
    };

    useEffect(() => {
        void loadContracts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [basePath]);

    const handleSave = () => {
        setIsEditing(false);
        toast.success('Условия обновлены', {
            description: 'Новые правила применятся к новым партнерам'
        });
    };

    const handleUploadContracts = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        if (!basePath) {
            toast.error('Не удалось определить застройщика (workspace)');
            return;
        }

        setUploading(true);
        try {
            const safeName = (name: string) =>
                name
                    .trim()
                    .replace(/\s+/g, '_')
                    .replace(/[^a-zA-Z0-9._-]/g, '_')
                    .replace(/_+/g, '_');

            await Promise.all(
                Array.from(files).map(async (file) => {
                    if (!file.name.toLowerCase().endsWith('.pdf')) {
                        throw new Error('Только PDF файлы');
                    }
                    const fileName = safeName(file.name);
                    const path = `${basePath}/${fileName}`;
                    const { error: uploadError } = await supabase.storage
                        .from(bucket)
                        .upload(path, file, { upsert: true, contentType: 'application/pdf' });
                    if (uploadError) throw uploadError;
                }),
            );

            toast.success('Договоры загружены');
            await loadContracts();
        } catch (e) {
            console.error('Failed to upload contracts', e);
            toast.error(e instanceof Error ? e.message : 'Ошибка при загрузке договоров');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteContract = async (path: string) => {
        if (!confirm('Удалить договор?')) return;
        try {
            const { error } = await supabase.storage.from(bucket).remove([path]);
            if (error) throw error;
            toast.success('Договор удалён');
            await loadContracts();
        } catch (e) {
            console.error('Failed to delete contract', e);
            toast.error('Ошибка при удалении договора');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Header Banner */}
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold mb-1">Генеральные условия</h2>
                        <p className="text-indigo-200 text-sm max-w-xl">
                            Эти правила действуют по умолчанию для всех новых агентств и брокеров, подключающихся к вашей сети.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Rules */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-900 text-lg">Базовые параметры</h3>
                            {!isEditing ? (
                                <Button variant="ghost" onClick={() => setIsEditing(true)} className="text-sm font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors h-auto">
                                    Редактировать
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button variant="ghost" onClick={() => setIsEditing(false)} className="text-sm font-medium text-slate-500 hover:bg-slate-100 px-3 py-1.5 rounded-lg h-auto">Отмена</Button>
                                    <Button onClick={handleSave} className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg shadow-sm h-auto">Сохранить</Button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Комиссия по умолчанию</label>
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
                                <p className="text-xs text-slate-400 mt-1.5">Применяется, если не задано иное для конкретного партнера.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Срок защиты (Lead Lock)</label>
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
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium z-10">дней</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1.5">Период защиты клиента за партнером.</p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Регламент выплат</label>
                            <Textarea
                                disabled={!isEditing}
                                value={settings.payoutTerms}
                                onChange={e => setSettings({ ...settings, payoutTerms: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 min-h-[100px] focus:bg-white transition-all resize-none disabled:opacity-70 leading-relaxed"
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3 text-amber-800 text-sm">
                        <AlertCircle size={20} className="shrink-0 mt-0.5" />
                        <p>Изменение базовой комиссии не повлияет на уже подписанные индивидуальные договоры с партнерами.</p>
                    </div>
                </div>

                {/* Right Column: Documents */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
                        <h3 className="font-bold text-slate-900 text-lg mb-4">Документооборот</h3>

                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-4 flex-1">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Договоры (PDF)</h4>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="application/pdf"
                                multiple
                                className="hidden"
                                onChange={handleUploadContracts}
                            />

                            {loadingContracts ? (
                                <div className="text-xs text-slate-400">Загрузка...</div>
                            ) : contracts.length > 0 ? (
                                <div className="space-y-2">
                                    {contracts.map((c) => (
                                        <div key={c.path} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg group">
                                            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                                                <FileText size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold text-slate-900 truncate">{c.name}</div>
                                                <div className="text-xs text-slate-400">PDF</div>
                                            </div>
                                            <button
                                                onClick={() => window.open(c.url, '_blank')}
                                                className="p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                title="Скачать"
                                            >
                                                <Download size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteContract(c.path)}
                                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                title="Удалить"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-center">
                                    <Upload size={24} className="text-slate-300 mb-2" />
                                    <span className="text-xs text-slate-400">Загрузите PDF файлы договоров</span>
                                </div>
                            )}
                        </div>

                        <Button
                            variant="outline"
                            className="w-full h-11 transition-colors flex items-center justify-center gap-2"
                            disabled={!developerId || uploading}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload size={16} /> {uploading ? 'Загрузка...' : 'Загрузить'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
