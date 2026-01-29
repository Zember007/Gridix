
import { useEffect, useState } from 'react';
import { supabase } from "@gridix/utils/api";
import { Bitrix24ProjectRow } from './Bitrix24ProjectRow';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface Project {
    id: string;
    name: string;
    created_at: string;
}

interface Bitrix24ProjectListProps {
    connection: any;
    open: boolean;
}

export const Bitrix24ProjectList = ({ connection, open }: Bitrix24ProjectListProps) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { activeWorkspaceId } = useWorkspace();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;
        if (!connection?.id) return;

        const ownerUserId = activeWorkspaceId ?? user?.id ?? null;
        if (!ownerUserId) return;

        const fetchProjects = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('projects')
                    .select('id, name, created_at')
                    .eq('user_id', ownerUserId)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setProjects(data || []);
            } catch (error) {
                console.error('Error fetching projects:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, [open, connection?.id, activeWorkspaceId, user?.id]);

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
                    <Bitrix24ProjectRow
                        key={project.id}
                        project={project}
                        connection={connection}
                    />
                ))}
            </div>
        </div>
    );
};
