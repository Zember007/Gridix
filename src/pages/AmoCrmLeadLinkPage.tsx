import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/shared/api/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguageNavigation } from '@/hooks/useLanguageNavigation';
import { useProjects } from '@/entities/project/queries/useProjects';

import { Button } from '@/shared/ui/button';
import { BindingStatusCard } from '@/components/amocrm-link/BindingStatusCard';
import { ProjectSelect } from '@/components/amocrm-link/ProjectSelect';
import { ApartmentChessboard } from '@/components/amocrm-link/ApartmentChessboard';
import { ObjectUnitSelect } from '@/components/amocrm-link/ObjectUnitSelect';
import type { Apartment } from '@/entities/apartment/model/types';

type BindingStatus =
  | { bound: false }
  | {
      bound: true;
      project: { id: string; slug: string | null; name: string | null; project_type: string | null } | null;
      apartment: { id: string; apartment_number: string | null } | null;
    };

export default function AmoCrmLeadLinkPage() {
  const { user } = useAuth();
  const { getPathWithLanguage } = useLanguageNavigation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const leadIdRaw = searchParams.get('lead_id');
  const amoLeadId = useMemo(() => {
    if (!leadIdRaw) return null;
    const n = Number(leadIdRaw);
    return Number.isFinite(n) ? n : null;
  }, [leadIdRaw]);

  const { projects, loading: projectsLoading, error: projectsError } = useProjects(
    user?.id ? { userId: user.id } : {},
  );

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const selectedProject = useMemo(
    () => (selectedProjectId ? projects.find(p => p.id === selectedProjectId) ?? null : null),
    [projects, selectedProjectId],
  );

  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);

  const bindingStatusQuery = useQuery({
    queryKey: ['amocrm', 'lead-binding-status', amoLeadId],
    enabled: typeof amoLeadId === 'number',
    queryFn: async (): Promise<BindingStatus> => {
      const { data, error } = await supabase.functions.invoke('amocrm-api', {
        body: {
          action: 'lead_binding_status',
          lead_id: amoLeadId,
        },
      });
      if (error) throw error;
      if (!data) throw new Error('Empty response');
      return data as BindingStatus;
    },
  });

  const bindMutation = useMutation({
    mutationFn: async () => {
      if (typeof amoLeadId !== 'number') throw new Error('Missing lead_id');
      if (!selectedProject) throw new Error('Select a project');
      if (!selectedApartment) throw new Error('Select an apartment');

      const { data, error } = await supabase.functions.invoke('amocrm-api', {
        body: {
          action: 'bind_lead_to_apartment',
          lead_id: amoLeadId,
          project_id: selectedProject.id,
          apartment_id: selectedApartment.id,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(String(data.error));
      return data as BindingStatus;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['amocrm', 'lead-binding-status', amoLeadId] });
    },
  });

  const bound = bindingStatusQuery.data && bindingStatusQuery.data.bound;

  const openProjectHref = useMemo(() => {
    if (!bindingStatusQuery.data || !('project' in bindingStatusQuery.data)) return null;
    const project = bindingStatusQuery.data.project;
    if (!project?.id) return null;
    const path = project.slug ? `/project/${project.slug}` : `/project/id/${project.id}`;
    return getPathWithLanguage(path);
  }, [bindingStatusQuery.data, getPathWithLanguage]);

  if (amoLeadId === null) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-2xl rounded-xl border bg-card p-6">
          <div className="text-lg font-semibold">Ошибка</div>
          <div className="mt-2 text-sm text-muted-foreground">Отсутствует или неверный query параметр `lead_id`.</div>
        </div>
      </div>
    );
  }

  if (bindingStatusQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-2xl rounded-xl border bg-card p-6">
          <div className="text-sm text-muted-foreground">Проверяем привязку лида…</div>
        </div>
      </div>
    );
  }

  if (bindingStatusQuery.isError) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-2xl rounded-xl border bg-card p-6">
          <div className="text-lg font-semibold">Ошибка</div>
          <div className="mt-2 text-sm text-muted-foreground">
            {bindingStatusQuery.error instanceof Error ? bindingStatusQuery.error.message : 'Не удалось загрузить статус привязки'}
          </div>
        </div>
      </div>
    );
  }

  if (bound) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-2xl">
          <BindingStatusCard status={bindingStatusQuery.data as Extract<BindingStatus, { bound: true }>} openProjectHref={openProjectHref} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-xl border bg-card p-6">
          <div className="flex flex-col gap-1">
            <div className="text-xl font-semibold">Привязать лид к проекту Gridix</div>
            <div className="text-sm text-muted-foreground">Выберите проект и объект (квартиру/юнит), к которому относится лид в amoCRM.</div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <div className="text-sm font-medium">Проект</div>
              <div className="mt-2">
                <ProjectSelect
                  projects={projects}
                  value={selectedProjectId}
                  onChange={(id) => {
                    setSelectedProjectId(id);
                    setSelectedApartment(null);
                  }}
                  disabled={projectsLoading}
                  error={projectsError}
                />
              </div>
              <div className="mt-6">
                <Button
                  className="w-full"
                  disabled={!selectedProject || !selectedApartment || bindMutation.isPending}
                  onClick={() => bindMutation.mutate()}
                >
                  {bindMutation.isPending ? 'Привязываем…' : 'Привязать'}
                </Button>
                {bindMutation.isError && (
                  <div className="mt-2 text-sm text-destructive">
                    {bindMutation.error instanceof Error ? bindMutation.error.message : 'Ошибка привязки'}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              {!selectedProject ? (
                <div className="rounded-xl border bg-background p-6 text-sm text-muted-foreground">
                  Сначала выберите проект.
                </div>
              ) : selectedProject.project_type === 'object' ? (
                <ObjectUnitSelect
                  key={selectedProject.id}
                  projectId={selectedProject.id}
                  selectedApartmentId={selectedApartment?.id ?? null}
                  onSelect={setSelectedApartment}
                />
              ) : (
                <ApartmentChessboard
                  key={selectedProject.id}
                  projectId={selectedProject.id}
                  selectedApartmentId={selectedApartment?.id ?? null}
                  onSelect={setSelectedApartment}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

























