
import { useEffect, useState, useRef } from 'react';
import { Button } from "@gridix/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@gridix/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@gridix/ui";
import { Switch } from "@gridix/ui";
import { Settings, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from "@gridix/utils/api";
import { useLanguage } from '@/contexts/LanguageContext';

interface CRMConnection {
    id: string;
}

interface Project {
    id: string;
    name: string;
}

interface Bitrix24ProjectRowProps {
    project: Project;
    connection: CRMConnection;
}

type ProjectBitrixSettings = {
    category_id: number | null;
    stage_id: string | null;
};

type BitrixCategory = { id: number; name: string };
type BitrixStage = { stageId: string; name: string };

export const Bitrix24ProjectRow = ({ project, connection }: Bitrix24ProjectRowProps) => {
    const { t } = useLanguage();
    const [projectSettings, setProjectSettings] = useState<ProjectBitrixSettings | null>(null);
    const [categories, setCategories] = useState<BitrixCategory[]>([]);
    const [stages, setStages] = useState<BitrixStage[]>([]);
    const [loading, setLoading] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [busy, setBusy] = useState(false);

    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const syncTimeoutRef = useRef<number | null>(null);

    const isConnected = !!projectSettings;

    const fetchState = async () => {
        setLoadingData(true);
        try {
            const { data, error } = await supabase.functions.invoke('bitrix-app', {
                body: { action: 'bitrix_get_state', project_id: project.id },
            });
            if (error) throw error;

            const nextPs = ((data as any)?.project_settings ?? null) as ProjectBitrixSettings | null;
            const nextCats = ((data as any)?.categories ?? []) as BitrixCategory[];
            const nextStages = ((data as any)?.stages ?? []) as BitrixStage[];

            setProjectSettings(nextPs);
            setCategories(Array.isArray(nextCats) ? nextCats : []);
            setStages(Array.isArray(nextStages) ? nextStages : []);
            setSelectedCategoryId(nextPs?.category_id ?? null);

        } catch (error) {
            console.error('Error fetching Bitrix state:', error);
        } finally {
            setLoadingData(false);
        }
    };

    // Initial load of state to show switch position
    useEffect(() => {
        fetchState();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleToggleActivation = async (enabled: boolean) => {
        if (enabled) {
            await attachToProject();
        } else {
            await detachFromProject();
        }
    };

    const attachToProject = async () => {
        setBusy(true);
        try {
            const { data, error } = await supabase.functions.invoke('bitrix-app', {
                body: { action: 'bitrix_attach_project', project_id: project.id },
            });
            if (error) throw error;
            if (!(data as any)?.success) throw new Error('Attach failed');
            toast.success(t('admin.bitrix24.attached'));
            await fetchState();
            setIsModalOpen(true); // Open modal to configure after attach
        } catch (e) {
            console.error(e);
            toast.error(t('admin.bitrix24.attachError'));
        } finally {
            setBusy(false);
        }
    };

    const detachFromProject = async () => {
        setBusy(true);
        try {
            const { data, error } = await supabase.functions.invoke('bitrix-app', {
                body: { action: 'bitrix_detach_project', project_id: project.id },
            });
            if (error) throw error;
            if (!(data as any)?.success) throw new Error('Detach failed');

            setProjectSettings(null);
            setCategories([]);
            setStages([]);
            setSelectedCategoryId(null);

            toast.success(t('admin.bitrix24.detached'));
        } catch (e) {
            console.error(e);
            toast.error(t('admin.bitrix24.detachError'));
        } finally {
            setBusy(false);
        }
    };

    const syncFunnel = async (categoryId: number) => {
        try {
            setBusy(true);
            const { data, error } = await supabase.functions.invoke('bitrix-app', {
                body: { action: 'bitrix_sync_funnel', project_id: project.id, category_id: categoryId },
            });
            if (error) throw error;
            if (!(data as any)?.success) throw new Error('Bitrix sync failed');

            const ss = ((data as any)?.stages ?? []) as BitrixStage[];
            setStages(Array.isArray(ss) ? ss : []);

            toast.success(t('admin.bitrix24.funnelSynced'));
        } catch (e) {
            console.error(e);
            toast.error(t('admin.bitrix24.syncError'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
            <div className="flex items-center gap-4 flex-1">
                <Switch
                    checked={isConnected}
                    onCheckedChange={handleToggleActivation}
                    disabled={loadingData || busy}
                />
                <div className="flex flex-col">
                    <span className="font-medium text-sm leading-none mb-1">{project.name}</span>
                    <div className="flex items-center gap-2">
                        {loadingData ? (
                            <span className="text-[10px] text-muted-foreground animate-pulse">Checking...</span>
                        ) : isConnected ? (
                            <span className="text-[10px] text-green-600 font-medium">Active</span>
                        ) : (
                            <span className="text-[10px] text-muted-foreground">Inactive</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Dialog open={isModalOpen} onOpenChange={(open) => {
                    setIsModalOpen(open);
                    if (open && categories.length === 0) fetchState();
                }}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" disabled={!isConnected}>
                            <Settings className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{project.name}</DialogTitle>
                            <DialogDescription>
                                {t('admin.bitrix24.configureProjectDesc') || 'Select the Bitrix24 funnel for this project.'}
                            </DialogDescription>
                        </DialogHeader>

                        {loadingData ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="grid gap-4 py-4 text-left">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t('admin.bitrix24.funnel')}</label>
                                    <Select
                                        value={typeof selectedCategoryId === 'number' ? String(selectedCategoryId) : ''}
                                        onValueChange={(v) => {
                                            const next = v ? Number(v) : null;
                                            setSelectedCategoryId(next);
                                            if (syncTimeoutRef.current) window.clearTimeout(syncTimeoutRef.current);
                                            if (typeof next === 'number') {
                                                syncTimeoutRef.current = window.setTimeout(() => void syncFunnel(next), 500);
                                            }
                                        }}
                                        disabled={busy}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('admin.bitrix24.selectFunnel')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[11px] text-muted-foreground">
                                        {busy ? t('common.saving') : stages.length > 0 ? `${stages.length} ${t('admin.bitrix24.statusesSynced')}` : t('admin.bitrix24.selectFunnelDesc')}
                                    </p>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsModalOpen(false)}>{t('common.close')}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};
