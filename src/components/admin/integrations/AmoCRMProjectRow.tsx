
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Switch } from '@/shared/ui/switch';
import { Settings, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/shared/api/supabase';
import { useLanguage } from '@/contexts/LanguageContext';

interface CRMConnection {
    id: string;
}

interface Project {
    id: string;
    name: string;
}

interface AmoCRMProjectRowProps {
    project: Project;
    connection: CRMConnection;
    amoData: AmoCRMData | null;
    settings: ProjectCRMSettings | null;
    refreshSettings: () => Promise<void>;
}

interface ProjectCRMSettings {
    id?: string;
    pipeline_id?: number | null;
    status_id?: number | null;
    responsible_user_id?: number | null;
}

interface AmoCRMPipeline {
    id: number;
    name: string;
    statuses: { id: number; name: string; }[];
}

interface AmoCRMUser {
    id: number;
    name: string;
}

interface AmoCRMData {
    pipelines: AmoCRMPipeline[];
    users: AmoCRMUser[];
}

export const AmoCRMProjectRow = ({ project, connection, amoData, settings, refreshSettings }: AmoCRMProjectRowProps) => {
    const { t } = useLanguage();
    const [saving, setSaving] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form state
    const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
    const [selectedStatusId, setSelectedStatusId] = useState<string | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    const isActive = !!settings?.id;

    useEffect(() => {
        // Keep form state in sync with settings (bulk-loaded by parent)
        if (settings) {
            setSelectedPipelineId(settings.pipeline_id?.toString() ?? null);
            setSelectedStatusId(settings.status_id?.toString() ?? null);
            setSelectedUserId(settings.responsible_user_id?.toString() ?? null);
        } else {
            setSelectedPipelineId(null);
            setSelectedStatusId(null);
            setSelectedUserId(null);
        }
    }, [settings?.id, settings?.pipeline_id, settings?.status_id, settings?.responsible_user_id]);

    const handleToggleActivation = async (enabled: boolean) => {
        setSaving(true);
        try {
            if (enabled) {
                setIsModalOpen(true);
            } else {
                // Disabling = deleting the setting record
                const { error } = await supabase
                    .from('project_crm_settings')
                    .delete()
                    .eq('project_id', project.id)
                    .eq('crm_connection_id', connection.id);

                if (error) throw error;
                toast.success(t('amocrm.disabled'));
                await refreshSettings();
            }
        } catch (error) {
            console.error(error);
            toast.error(t('common.error'));
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        if (!selectedPipelineId) {
            toast.error(t('amocrm.selectPipelineRequired'));
            return;
        }
        setSaving(true);
        try {
            const { data: res, error } = await supabase.functions.invoke('amocrm-api', {
                body: {
                    project_id: project.id,
                    action: 'save_settings',
                    pipeline_id: parseInt(selectedPipelineId),
                    status_id: selectedStatusId ? parseInt(selectedStatusId) : null,
                    responsible_user_id: selectedUserId ? parseInt(selectedUserId) : null
                }
            });

            if (error) throw error;
            if (res?.success) {
                toast.success(t('amocrm.settingsSaveSuccess'));
                await refreshSettings();
                setIsModalOpen(false);
            } else {
                throw new Error(res?.message);
            }
        } catch (error) {
            console.error(error);
            toast.error(t('amocrm.settingsSaveError'));
        } finally {
            setSaving(false);
        }
    };

    const statuses = useMemo(
        () => amoData?.pipelines.find(p => p.id.toString() === selectedPipelineId)?.statuses || [],
        [amoData, selectedPipelineId]
    );

    return (
        <div className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
            <div className="flex items-center gap-4 flex-1">
                <Switch
                    checked={isActive}
                    onCheckedChange={handleToggleActivation}
                    disabled={saving}
                />
                <div className="flex flex-col">
                    <span className="font-medium text-sm leading-none mb-1">{project.name}</span>
                    <div className="flex items-center gap-2">
                        {isActive ? (
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
                }}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" disabled={!isActive}>
                            <Settings className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{project.name}</DialogTitle>
                            <DialogDescription>
                                {t('amocrm.configureProjectDesc') || 'Configure funnel and responsible user for this project.'}
                            </DialogDescription>
                        </DialogHeader>

                        {!amoData ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="grid gap-4 py-4 text-left">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t('amocrm.pipeline')}</label>
                                    <Select
                                        value={selectedPipelineId || ''}
                                        onValueChange={(v) => {
                                            setSelectedPipelineId(v);
                                            setSelectedStatusId(null);
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('amocrm.selectPipeline')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {amoData?.pipelines.map(p => (
                                                <SelectItem key={p.id} value={p.id.toString()}>
                                                    {p.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t('amocrm.responsible')}</label>
                                    <Select
                                        value={selectedUserId || 'none'}
                                        onValueChange={(v) => setSelectedUserId(v === 'none' ? null : v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('amocrm.selectResponsible')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">{t('amocrm.notSelected')}</SelectItem>
                                            {amoData?.users.map(u => (
                                                <SelectItem key={u.id} value={u.id.toString()}>
                                                    {u.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
                            <Button
                                onClick={handleSave}
                                disabled={saving || !selectedPipelineId || !amoData}
                                className="bg-[#4c8bf7] hover:bg-[#3b72d1]"
                            >
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t('common.save')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};
