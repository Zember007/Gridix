
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from "@gridix/utils/api";
import { AmoCRMProjectRow } from './AmoCRMProjectRow';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface Project {
    id: string;
    name: string;
    created_at: string;
}

interface AmoCRMProjectListProps {
    connection: any;
    open: boolean;
}

export const AmoCRMProjectList = ({ connection, open }: AmoCRMProjectListProps) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { activeWorkspaceId } = useWorkspace();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);

    const [settingsByProjectId, setSettingsByProjectId] = useState<Record<string, any | null>>({});
    const [amoData, setAmoData] = useState<any | null>(null);

    const ownerUserId = activeWorkspaceId ?? user?.id ?? null;

    const projectIds = useMemo(() => projects.map((p) => p.id), [projects]);

    const refreshAllSettings = useCallback(async (ids: string[]) => {
        if (!connection?.id) return;
        if (!ids.length) {
            setSettingsByProjectId({});
            return;
        }

        const { data, error } = await supabase
            .from('project_crm_settings')
            .select('*')
            .eq('crm_connection_id', connection.id)
            .in('project_id', ids);

        if (error) throw error;

        const map: Record<string, any | null> = {};
        for (const id of ids) map[id] = null;
        for (const row of data ?? []) {
            if (row?.project_id) map[row.project_id] = row;
        }
        setSettingsByProjectId(map);
    }, [connection?.id]);

    const refreshProjectSettings = useCallback(async (projectId: string) => {
        if (!connection?.id || !projectId) return;
        const { data, error } = await supabase
            .from('project_crm_settings')
            .select('*')
            .eq('project_id', projectId)
            .eq('crm_connection_id', connection.id)
            .maybeSingle();

        if (error) throw error;
        setSettingsByProjectId((prev) => ({ ...prev, [projectId]: data ?? null }));
    }, [connection?.id]);

    useEffect(() => {
        if (!open) return;
        if (!ownerUserId) return;
        if (!connection?.id) return;

        const fetchAll = async () => {
            setLoading(true);
            try {
                const [projectsResp, amoResp] = await Promise.all([
                    supabase
                        .from('projects')
                        .select('id, name, created_at')
                        .eq('user_id', ownerUserId)
                        .order('created_at', { ascending: false }),
                    // Fetch pipelines/users once per modal open
                    supabase.functions.invoke('amocrm-api', { body: { action: 'fetch_data' } }),
                ]);

                if (projectsResp.error) throw projectsResp.error;
                const nextProjects = projectsResp.data ?? [];
                setProjects(nextProjects);

                if (amoResp.error) throw amoResp.error;
                setAmoData((amoResp.data as any)?.data ?? null);

                await refreshAllSettings(nextProjects.map((p: any) => p.id));
            } catch (error) {
                console.error('Error fetching AmoCRM projects/settings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, [open, ownerUserId, connection?.id, refreshAllSettings]);

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="text-center p-8 text-muted-foreground border rounded-lg border-dashed">
                {t('projectList.noProjects')}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="grid gap-3">
                {projects.map(project => (
                    <AmoCRMProjectRow
                        key={project.id}
                        project={project}
                        connection={connection}
                        amoData={amoData}
                        settings={settingsByProjectId[project.id] ?? null}
                        refreshSettings={() => refreshProjectSettings(project.id)}
                    />
                ))}
            </div>
        </div>
    );
};
