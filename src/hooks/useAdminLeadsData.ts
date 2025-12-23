import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared/api/supabase';
import { useLeads, Lead as DbLead, LeadFilters as DbLeadFilters } from '@/entities/lead/queries/useLeads';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { getManagerProjectIds } from '@/hooks/useManagerProjectIds';
import { showToast } from '@/shared/lib/toast';
import {
  ExtendedLead,
  LeadsFilters,
  SortOption,
  Funnel,
  FunnelStage,
  FunnelTrigger,
  LeadTask,
  LeadUser,
  CardAppearanceConfig,
  MOCK_USERS,
  TaskType,
} from '@/entities/crm/model/types';

// Map DB lead to ExtendedLead used by UI
function mapDbLeadToExtended(dbLead: DbLead): ExtendedLead {
  const projectName = dbLead.projects?.name || 'Не указан';
  const apt = dbLead.apartments;

  const apartment = apt
    ? `№${apt.apartment_number}${apt.area ? ` (${apt.area}м²)` : ''}`
    : undefined;

  const price = apt?.price ?? undefined;

  const crmStatus = {
    connected: !!dbLead.amocrm_lead_id,
    systemName: dbLead.amocrm_lead_id ? 'AmoCRM' : undefined,
    lastSync: dbLead.amocrm_sent_at || undefined,
    id: dbLead.amocrm_lead_id ? String(dbLead.amocrm_lead_id) : undefined,
  };

  const anyLead = dbLead as DbLead & {
    pipeline_stage_id?: string | null;
    assigned_to_user_id?: string | null;
    tags?: string[] | null;
  };
  const pipelineStageId = anyLead.pipeline_stage_id;
  const assignedToUserId = anyLead.assigned_to_user_id;
  const tags = anyLead.tags || [];

  return {
    ...dbLead,
    // For UI, use pipeline stage id as status (separate from integration status in DB)
    status: pipelineStageId || dbLead.status || null,
    project: projectName,
    apartment,
    price,
    crmStatus,
    date: dbLead.created_at,
    history: [],
    tasks: [],
    assignedTo: assignedToUserId || undefined,
    tags,
  } as ExtendedLead;
}

export function useAdminLeadsData(filtersOverride?: DbLeadFilters) {
  const { activeWorkspaceId, isManagerMode } = useWorkspace();
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { leads: dbLeads, loading: leadsLoading } = useLeads(filtersOverride);

  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [selectedLead, setSelectedLead] = useState<ExtendedLead | null>(null);
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [activeFunnelId, setActiveFunnelId] = useState<string | null>(null);
  const [funnelStages, setFunnelStages] = useState<FunnelStage[]>([]);
  const [funnelTriggers, setFunnelTriggers] = useState<FunnelTrigger[]>([]);

  const [editingFunnelId, setEditingFunnelId] = useState<string | null>(null);
  const [editingFunnelName, setEditingFunnelName] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filters, setFilters] = useState<LeadsFilters>({
    source: 'all',
    minBudget: '',
    maxBudget: '',
    dateFrom: '',
    dateTo: '',
    stages: [],
    assignedTo: [],
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('date_desc');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [cardConfig, setCardConfig] = useState<CardAppearanceConfig>({
    showAvatar: true,
    showDate: true,
    fields: ['name', 'assignedTo', 'price', 'project', 'tags'],
  }); // reserved for future automations

  // Load funnels for current owner (developer/workspace)
  const funnelsQuery = useQuery({
    queryKey: ['crm_funnels', activeWorkspaceId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_funnels')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []).map(d => ({ id: d.id, name: d.name })) as Funnel[];
    },
  });

  const funnelAutomationComplianceQuery = useQuery({
    queryKey: ['crm_funnel_triggers', 'apartment_status_compliance', user?.id],
    enabled: !!user && !!funnelsQuery.data && funnelsQuery.data.length > 0,
    queryFn: async () => {
      const funnelIds = (funnelsQuery.data || []).map((f) => f.id);
      if (funnelIds.length === 0) return [] as Array<{ id: string; name: string }>;

      const { data: triggers, error } = await supabase
        .from('crm_funnel_triggers')
        .select('funnel_id, icon, config')
        .in('funnel_id', funnelIds);

      if (error) throw error;

      const byFunnel = new Map<string, { reserved: boolean; sold: boolean }>();
      funnelIds.forEach((id) => byFunnel.set(id, { reserved: false, sold: false }));

      (triggers || []).forEach((tr) => {
        if (tr.icon !== 'apartment_status') return;
        const cfg = (tr.config as Record<string, unknown>) || {};
        const status = String((cfg as any).apartmentStatus || 'reserved');
        const entry = byFunnel.get(tr.funnel_id);
        if (!entry) return;
        if (status === 'reserved') entry.reserved = true;
        if (status === 'sold') entry.sold = true;
      });

      const funnelNameById = new Map((funnelsQuery.data || []).map((f) => [f.id, f.name]));

      return funnelIds
        .filter((id) => {
          const entry = byFunnel.get(id); 
          return !entry || !(entry.reserved && entry.sold);
        })
        .map((id) => ({ id, name: funnelNameById.get(id) || id }));
    },
  });

  useEffect(() => {
    const data = funnelsQuery.data;
    if (data && data.length > 0) {
      setFunnels(data);
      if (!activeFunnelId) {
        // Try to load from localStorage first
        try {
          const savedFunnelId = localStorage.getItem('admin_active_funnel_id');
          if (savedFunnelId && data.some((f) => f.id === savedFunnelId)) {
            setActiveFunnelId(savedFunnelId);
          } else if (data[0]) {
            setActiveFunnelId(data[0].id);
          }
        } catch (error) {
          console.error('Failed to load active funnel from localStorage', error);
          if (data[0]) {
            setActiveFunnelId(data[0].id);
          }
        }
      }
    }
  }, [funnelsQuery.data, activeFunnelId]);

  // Load stages and triggers for active funnel
  useEffect(() => {
    if (!activeFunnelId) return;

    const load = async () => {
      const [{ data: stages }, { data: triggers }] = await Promise.all([
        supabase
          .from('crm_funnel_stages')
          .select('*')
          .eq('funnel_id', activeFunnelId)
          .order('order_index', { ascending: true }),
        supabase
          .from('crm_funnel_triggers')
          .select('*')
          .eq('funnel_id', activeFunnelId)
          .order('stage_id', { ascending: true })
          .order('order_index', { ascending: true }),
      ]);

      setFunnelStages(
        (stages || []).map((s) => ({ id: s.id, name: s.name, color: s.color }))
      );
      setFunnelTriggers(
        (triggers || []).map((t) => ({
          id: t.id,
          stageId: t.stage_id,
          event: t.event,
          icon: t.icon as FunnelTrigger['icon'],
          title: t.title,
          description: t.description,
          config: (t.config as Record<string, unknown>) || {},
        }))
      );
    };

    load();
  }, [activeFunnelId]);

  // Map DB leads to extended leads with computed fields
  const leads: ExtendedLead[] = useMemo(
    () => dbLeads.map(mapDbLeadToExtended),
    [dbLeads]
  );

  const filteredAndSortedLeads = useMemo(() => {
    const result = leads.filter((lead) => {
      const matchesSearch =
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.project.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSource =
        filters.source === 'all' || lead.source === filters.source;

      const price = lead.price || 0;
      const minB = filters.minBudget ? Number(filters.minBudget) : 0;
      const maxB = filters.maxBudget ? Number(filters.maxBudget) : Infinity;
      const matchesBudget = price >= minB && price <= maxB;

      let matchesDate = true;
      const leadDate = new Date(lead.date);
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (leadDate < fromDate) matchesDate = false;
      }
      if (matchesDate && filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (leadDate > toDate) matchesDate = false;
      }

      const matchesStages =
        filters.stages.length === 0 ||
        (lead.status && typeof lead.status === 'string' && filters.stages.includes(lead.status));

      const matchesAssignedTo =
        filters.assignedTo.length === 0 ||
        (lead.assignedTo && filters.assignedTo.includes(lead.assignedTo));

      return (
        matchesSearch &&
        matchesSource &&
        matchesBudget &&
        matchesDate &&
        matchesStages &&
        matchesAssignedTo
      );
    });

    return result.sort((a, b) => {
      if (sortOption === 'date_desc')
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortOption === 'date_asc')
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortOption === 'price_desc') return (b.price || 0) - (a.price || 0);
      if (sortOption === 'price_asc') return (a.price || 0) - (b.price || 0);
      return 0;
    });
  }, [
    leads,
    searchTerm,
    sortOption,
    filters.source,
    filters.minBudget,
    filters.maxBudget,
    filters.dateFrom,
    filters.dateTo,
    filters.stages,
    filters.assignedTo,
  ]);

  const totalLeadsSum = useMemo(
    () => leads.reduce((acc, lead) => acc + (lead.price || 0), 0),
    [leads]
  );

  const activeFiltersCount = [
    filters.source !== 'all',
    filters.minBudget !== '',
    filters.maxBudget !== '',
    filters.dateFrom !== '',
    filters.dateTo !== '',
    filters.stages.length > 0,
    filters.assignedTo.length > 0,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setFilters({
      source: 'all',
      minBudget: '',
      maxBudget: '',
      dateFrom: '',
      dateTo: '',
      stages: [],
      assignedTo: [],
    });
    setSearchTerm('');
  };

  // --- Card appearance persistence (localStorage for now) ---
  const loadCardConfiguration = useCallback(() => {
    try {
      const savedConfig = localStorage.getItem('card_appearance_config');
      if (savedConfig) {
        setCardConfig(JSON.parse(savedConfig));
      }
    } catch (error) {
      console.error('Failed to load card configuration', error);
    }
  }, []);

  useEffect(() => {
    loadCardConfiguration();
  }, [loadCardConfiguration]);

  const handleSaveCardConfig = (newConfig: CardAppearanceConfig) => {
    try {
      localStorage.setItem('card_appearance_config', JSON.stringify(newConfig));
      setCardConfig(newConfig);
    } catch (error) {
      console.error('Failed to save card configuration', error);
    }
  };

  // --- Mutations (create/update lead, tasks, history, tags, assignee) ---

  const createLeadMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('leads')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(payload as any)
        .select('*')
        .single();
      if (error) throw error;
      return data as DbLead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      console.debug('updateLeadMutation', id, data);
      const shouldSyncWithAmo = Object.prototype.hasOwnProperty.call(data, 'pipeline_stage_id') ||
        Object.prototype.hasOwnProperty.call(data, 'name');

      if (shouldSyncWithAmo) {
        const { data: fnData, error: fnError } = await supabase.functions.invoke('amocrm-api', {
          body: {
            action: 'update_lead',
            lead_id: id,
            data,
          },
        });
        if (fnError) throw fnError;
        if (fnData?.error) throw new Error(fnData.error);
        return;
      }

      const { error } = await supabase.from('leads').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const handleCreateLead = async (newLeadData: Partial<ExtendedLead>) => {
    if (!newLeadData.name) {
      showToast('error', t('leads.toast.error.title'), t('leads.toast.error.missingFields'));
      return;
    }

    if (!user) {
      showToast('error', t('leads.toast.error.title'), t('leads.toast.error.notAuthenticated'));
      return;
    }

    let projectId: string | null = null;

    // Get accessible project based on user role
    if (isManagerMode && activeWorkspaceId) {
      // Manager mode: get accessible projects for this developer
      const accessibleProjectIds = await getManagerProjectIds(user.id, activeWorkspaceId);
      if (accessibleProjectIds.length === 0) {
        showToast('error', t('leads.toast.error.title'), t('leads.toast.error.noAccessToProjects'));
        return;
      }
      projectId = accessibleProjectIds[0] || null;
    } else {
      // Owner mode: get user's own projects
      const { data: userProjects, error: projectsError } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (projectsError || !userProjects) {
        showToast('error', t('leads.toast.error.title'), t('leads.toast.error.noProjects'));
        console.error('No projects found', projectsError);
        return;
      }
      projectId = userProjects.id;
    }

    if (!projectId) {
      showToast('error', t('leads.toast.error.title'), t('leads.toast.error.noProjects'));
      return;
    }

    // Get first apartment for the project
    const { data: apartments, error: apartmentsError } = await supabase
      .from('apartments')
      .select('id')
      .eq('project_id', projectId)
      .limit(1)
      .maybeSingle();

    if (apartmentsError || !apartments) {
      showToast('error', t('leads.toast.error.title'), t('leads.toast.error.noApartments'));
      console.error('No apartments found', apartmentsError);
      return;
    }

    const firstStageId = funnelStages[0]?.id;

    const payload: Record<string, unknown> = {
      name: newLeadData.name.trim(),
      email: newLeadData.email?.trim() || '',
      phone: newLeadData.phone?.trim() || '',
      project_id: projectId,
      apartment_id: apartments.id,
      source: newLeadData.source || 'admin',
      status: 'saved_only',
      pipeline_stage_id: firstStageId || null,
      tags: newLeadData.tags || [],
    };

    try {
      await createLeadMutation.mutateAsync(payload);
      setIsCreateModalOpen(false);
      showToast('success', t('leads.toast.leadCreated.title'), t('leads.toast.leadCreated.desc'));
    } catch (error) {
      console.error('Failed to create lead', error);
      showToast('error', t('leads.toast.error.title'), t('leads.toast.error.createFailed'));
    }
  };

  const handleUpdateLead = async (leadId: string, data: Partial<ExtendedLead>) => {
    const dbPatch: Record<string, unknown> = {};

    if (data.name !== undefined) dbPatch.name = data.name;
    if (data.email !== undefined) dbPatch.email = data.email;
    if (data.phone !== undefined) dbPatch.phone = data.phone;
    if (data.notes !== undefined) dbPatch.notes = data.notes;

    await updateLeadMutation.mutateAsync({ id: leadId, data: dbPatch });
  };

  const handleStatusChange = async (leadId: string, newStageId: string) => {
    await updateLeadMutation.mutateAsync({
      id: leadId,
      data: { pipeline_stage_id: newStageId },
    });
  };

  const handleAddTask = useCallback(
    (
      leadId: string,
      text: string,
      type: TaskType,
      date: string,
      time: string,
      assignedTo: LeadUser,
    ) => {
      // For now, client-side only; can be wired to lead_tasks later
      // This keeps API compatible with existing UI
      if (!selectedLead || selectedLead.id !== leadId) return;
      const newTask: LeadTask = {
        id: `t_${Date.now()}`,
        text,
        date,
        time,
        type,
        completed: false,
        assignedTo,
      };
      const updated = {
        ...selectedLead,
        tasks: [...(selectedLead.tasks || []), newTask],
      };
      setSelectedLead(updated);
    },
    [selectedLead]
  );

  const handleCompleteTask = () => {
    /* placeholder – will be wired to lead_tasks table if needed */
  };
  const handleToggleTask = () => { };
  const handleDeleteTask = () => { };

  const handleAddNote = () => {
    // UI-level only for now; server-side history can be added later
  };

  const handleAddTag = async (leadId: string, tag: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    const currentTags = lead.tags || [];
    if (currentTags.includes(tag)) return; // Tag already exists

    const updatedTags = [...currentTags, tag];
    try {
      await updateLeadMutation.mutateAsync({
        id: leadId,
        data: { tags: updatedTags },
      });
    } catch (error) {
      console.error('Failed to add tag', error);
      showToast('error', t('leads.toast.error.title'), t('leads.toast.error.addTagFailed'));
    }
  };

  const handleRemoveTag = async (leadId: string, tagToRemove: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    const currentTags = lead.tags || [];
    const updatedTags = currentTags.filter((t) => t !== tagToRemove);
    try {
      await updateLeadMutation.mutateAsync({
        id: leadId,
        data: { tags: updatedTags },
      });
    } catch (error) {
      console.error('Failed to remove tag', error);
      showToast('error', t('leads.toast.error.title'), t('leads.toast.error.removeTagFailed'));
    }
  };

  const handleDeleteSelected = () => {
    console.log('Delete selected not implemented yet', Array.from(selectedIds));
  };

  const handleMassAssign = (assignedToId: string) => {
    console.log('Mass assign to', assignedToId, Array.from(selectedIds));
  };

  const handleMergeLeads = async (masterId: string, duplicateIds: string[]) => {
    if (duplicateIds.length === 0) return;

    const masterLead = leads.find((l) => l.id === masterId);
    if (!masterLead) {
      showToast('error', t('leads.toast.error.title'), t('leads.toast.error.masterNotFound'));
      return;
    }

    const duplicateLeads = leads.filter((l) => duplicateIds.includes(l.id));

    try {
      // 1. Merge Tags - collect all unique tags
      const allTags = new Set<string>(masterLead.tags || []);
      duplicateLeads.forEach((d) => {
        d.tags?.forEach((tag) => allTags.add(tag));
      });

      // 2. Merge Notes - combine notes if they exist
      const notes = [masterLead.notes, ...duplicateLeads.map((d) => d.notes)]
        .filter((n): n is string => !!n)
        .join('\n\n---\n\n');

      // 3. Update master lead with merged data
      const updateData: Record<string, unknown> = {
        tags: Array.from(allTags),
      };
      if (notes) {
        updateData.notes = notes;
      }

      await updateLeadMutation.mutateAsync({
        id: masterId,
        data: updateData,
      });

      // 4. Delete duplicate leads
      const { error } = await supabase
        .from('leads')
        .delete()
        .in('id', duplicateIds);

      if (error) {
        console.error('Failed to delete duplicate leads', error);
        showToast('error', t('leads.toast.error.title'), t('leads.toast.error.mergeFailed'));
        throw error;
      }

      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['leads'] });

      showToast('success', t('leads.toast.mergeSuccess.title'), t('leads.toast.mergeSuccess.desc', { count: duplicateIds.length }));
    } catch (error) {
      console.error('Failed to merge leads', error);
      showToast('error', t('leads.toast.error.title'), t('leads.toast.error.mergeFailed'));
    }
  };

  const handleImportLeads = () => {
    console.log('Import leads not implemented yet');
  };

  const handleSelectFunnel = (id: string) => {
    setActiveFunnelId(id);
    try {
      localStorage.setItem('admin_active_funnel_id', id);
    } catch (error) {
      console.error('Failed to save active funnel to localStorage', error);
    }
  };

  const handleAddFunnel = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('crm_funnels')
      .insert({ user_id: user.id, name: 'Новая воронка' })
      .select('*')
      .single();
    if (error) {
      console.error(error);
      return;
    }
    const newFunnel = { id: data.id, name: data.name };
    setFunnels((prev) => [...prev, newFunnel]);
    setEditingFunnelId(data.id);
    setEditingFunnelName(data.name);
  };

  const handleDeleteFunnel = async (id: string) => {
    await supabase.from('crm_funnels').delete().eq('id', id);
    setFunnels((prev) => prev.filter((f) => f.id !== id));
  };

  const handleStartEditFunnel = (funnel: Funnel) => {
    setEditingFunnelId(funnel.id);
    setEditingFunnelName(funnel.name);
  };

  const handleSaveFunnel = async (id: string) => {
    await supabase
      .from('crm_funnels')
      .update({ name: editingFunnelName })
      .eq('id', id);
    setFunnels((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name: editingFunnelName } : f))
    );
    setEditingFunnelId(null);
  };

  const handleCancelEditFunnel = () => setEditingFunnelId(null);

  const handleUpdateStage = async (stageId: string, updates: Partial<FunnelStage>) => {
    // Persist to Supabase
    const dbPatch: Record<string, unknown> = {};
    if (updates.name !== undefined) dbPatch.name = updates.name;
    if (updates.color !== undefined) dbPatch.color = updates.color;

    if (Object.keys(dbPatch).length > 0) {
      const { error } = await supabase
        .from('crm_funnel_stages')
        .update(dbPatch)
        .eq('id', stageId);
      if (error) {
        console.error('Failed to update funnel stage', error);
      }
    }

    // Update local state
    setFunnelStages((stages) =>
      stages.map((s) => (s.id === stageId ? { ...s, ...updates } : s))
    );
  };

  const handleAddStage = async (insertAfterId: string) => {
    if (!activeFunnelId) return;

    const baseStages = [...funnelStages];
    const targetIndex = baseStages.findIndex((s) => s.id === insertAfterId);
    const insertIndex = targetIndex === -1 ? baseStages.length : targetIndex + 1;

    // Compute order_index so that we keep stages in order
    const { error, data } = await supabase
      .from('crm_funnel_stages')
      .insert({
        funnel_id: activeFunnelId,
        name: 'Новый этап',
        color: 'slate',
        order_index: insertIndex,
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('Failed to add funnel stage', error);
      return;
    }

    const newStage: FunnelStage = {
      id: data.id,
      name: data.name,
      color: data.color,
    };

    // Insert into local array at requested position
    const newStages = [...baseStages];
    newStages.splice(insertIndex, 0, newStage);

    // Re-normalize order_index for all stages in this funnel
    await Promise.all(
      newStages.map((stage, index) =>
        supabase
          .from('crm_funnel_stages')
          .update({ order_index: index })
          .eq('id', stage.id),
      ),
    );

    setFunnelStages(newStages);
  };

  const handleDeleteStage = async (stageId: string) => {
    // Delete triggers for this stage first (foreign key)
    const { error: triggersError } = await supabase
      .from('crm_funnel_triggers')
      .delete()
      .eq('stage_id', stageId);
    if (triggersError) {
      console.error('Failed to delete triggers for stage', triggersError);
    }

    const { error: stageError } = await supabase
      .from('crm_funnel_stages')
      .delete()
      .eq('id', stageId);
    if (stageError) {
      console.error('Failed to delete funnel stage', stageError);
    }

    setFunnelStages((stages) => stages.filter((s) => s.id !== stageId));
    setFunnelTriggers((triggers) =>
      triggers.filter((t) => t.stageId !== stageId)
    );
  };

  const handleReorderStages = async (draggedId: string, targetId: string) => {
    const draggedIndex = funnelStages.findIndex((s) => s.id === draggedId);
    const targetIndex = funnelStages.findIndex((s) => s.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;

    const newStages = [...funnelStages];
    const [draggedItem] = newStages.splice(draggedIndex, 1);
    if (draggedItem) {
      newStages.splice(targetIndex, 0, draggedItem);
    }

    // Persist new order_index for all stages
    await Promise.all(
      newStages.map((stage, index) =>
        supabase
          .from('crm_funnel_stages')
          .update({ order_index: index })
          .eq('id', stage.id),
      ),
    );

    setFunnelStages(newStages);
  };

  const handleAddTrigger = async (
    stageId: string,
    triggerData: Omit<FunnelTrigger, 'id' | 'stageId'>,
  ) => {
    if (!activeFunnelId) return;

    const { data, error } = await supabase
      .from('crm_funnel_triggers')
      .insert({
        funnel_id: activeFunnelId,
        stage_id: stageId,
        event: triggerData.event,
        icon: triggerData.icon,
        title: triggerData.title,
        description: triggerData.description,
        config: triggerData.config || {},
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('Failed to add funnel trigger', error);
      return;
    }

    const newTrigger: FunnelTrigger = {
      id: data.id,
      stageId,
      event: data.event,
      icon: data.icon as FunnelTrigger['icon'],
      title: data.title,
      description: data.description,
      config: (data.config as Record<string, unknown>) || {},
    };

    setFunnelTriggers((prev) => [...prev, newTrigger]);
  };

  const handleUpdateTrigger = async (
    triggerId: string,
    updates: Partial<Omit<FunnelTrigger, 'id' | 'stageId'>>,
  ) => {
    const dbPatch: Record<string, unknown> = {};
    if (updates.event !== undefined) dbPatch.event = updates.event;
    if (updates.icon !== undefined) dbPatch.icon = updates.icon;
    if (updates.title !== undefined) dbPatch.title = updates.title;
    if (updates.description !== undefined) dbPatch.description = updates.description;
    if (updates.config !== undefined) dbPatch.config = updates.config;

    if (Object.keys(dbPatch).length > 0) {
      const { error } = await supabase
        .from('crm_funnel_triggers')
        .update(dbPatch)
        .eq('id', triggerId);
      if (error) {
        console.error('Failed to update funnel trigger', error);
      }
    }

    setFunnelTriggers((prev) =>
      prev.map((t) => (t.id === triggerId ? { ...t, ...updates } : t))
    );
  };

  const handleDeleteTrigger = async (triggerId: string) => {
    const { error } = await supabase
      .from('crm_funnel_triggers')
      .delete()
      .eq('id', triggerId);
    if (error) {
      console.error('Failed to delete funnel trigger', error);
    }

    setFunnelTriggers((prev) => prev.filter((t) => t.id !== triggerId));
  };

  const handleDeleteAllTriggers = async (funnelId: string) => {
    const { error } = await supabase
      .from('crm_funnel_triggers')
      .delete()
      .eq('funnel_id', funnelId);
    if (error) {
      console.error('Failed to delete all triggers for funnel', error);
    }

    if (activeFunnelId === funnelId) {
      setFunnelTriggers([]);
    }
  };

  const handleReorderTrigger = (
    draggedTriggerId: string,
    targetTriggerId: string | null,
    targetStageId: string,
  ) => {
    let computedNext: FunnelTrigger[] | null = null;
    let computedStageIds: string[] = [];

    setFunnelTriggers((prevTriggers) => {
      const draggedTrigger = prevTriggers.find((t) => t.id === draggedTriggerId);
      if (!draggedTrigger) return prevTriggers;

      const fromStageId = draggedTrigger.stageId;
      const stageIds = new Set<string>([fromStageId, targetStageId]);

      const triggersWithoutDragged = prevTriggers.filter((t) => t.id !== draggedTriggerId);
      const updatedDraggedTrigger = { ...draggedTrigger, stageId: targetStageId };

      let next: FunnelTrigger[];
      if (targetTriggerId === null) {
        const otherStageTriggers = triggersWithoutDragged.filter(
          (t) => t.stageId !== targetStageId,
        );
        const targetStageTriggers = triggersWithoutDragged.filter(
          (t) => t.stageId === targetStageId,
        );
        next = [...otherStageTriggers, ...targetStageTriggers, updatedDraggedTrigger];
      } else {
        const targetIndex = triggersWithoutDragged.findIndex(
          (t) => t.id === targetTriggerId,
        );
        if (targetIndex === -1) return prevTriggers;

        next = [...triggersWithoutDragged];
        next.splice(targetIndex, 0, updatedDraggedTrigger);
      }

      computedNext = next;
      computedStageIds = Array.from(stageIds);
      return next;
    });

    // Persist stage_id + order_index for affected stages (best-effort)
    (async () => {
      try {
        if (!computedNext || computedStageIds.length === 0) return;

        const updates: Array<{ id: string; stage_id: string; order_index: number }> = [];
        computedStageIds.forEach((sid) => {
          const stageTriggers = computedNext!.filter((t) => t.stageId === sid);
          stageTriggers.forEach((t, idx) => {
            updates.push({ id: t.id, stage_id: sid, order_index: idx });
          });
        });

        if (updates.length > 0) {
          await supabase.from('crm_funnel_triggers').upsert(updates, {
            onConflict: 'id',
          });
        }
      } catch (e) {
        console.error('Failed to persist trigger reorder', e);
      }
    })();
  };

  const handleSaveFunnelSetup = async () => {
    // Just re-sync stages and triggers from Supabase to be sure everything is persisted
    if (!activeFunnelId) return;

    const [{ data: stages }, { data: triggers }] = await Promise.all([
      supabase
        .from('crm_funnel_stages')
        .select('*')
        .eq('funnel_id', activeFunnelId)
        .order('order_index', { ascending: true }),
      supabase
        .from('crm_funnel_triggers')
        .select('*')
        .eq('funnel_id', activeFunnelId)
        .order('stage_id', { ascending: true })
        .order('order_index', { ascending: true }),
    ]);

    setFunnelStages(
      (stages || []).map((s) => ({ id: s.id, name: s.name, color: s.color }))
    );
    setFunnelTriggers(
      (triggers || []).map((t) => ({
        id: t.id,
        stageId: t.stage_id,
        event: t.event,
        icon: t.icon as FunnelTrigger['icon'],
        title: t.title,
        description: t.description,
        config: (t.config as Record<string, unknown>) || {},
      }))
    );
  };

  const handleResetFunnelSetup = async () => {
    // Reload from Supabase, effectively discarding unsaved local changes
    if (!activeFunnelId) return;

    const [{ data: stages }, { data: triggers }] = await Promise.all([
      supabase
        .from('crm_funnel_stages')
        .select('*')
        .eq('funnel_id', activeFunnelId)
        .order('order_index', { ascending: true }),
      supabase
        .from('crm_funnel_triggers')
        .select('*')
        .eq('funnel_id', activeFunnelId)
        .order('stage_id', { ascending: true })
        .order('order_index', { ascending: true }),
    ]);

    setFunnelStages(
      (stages || []).map((s) => ({ id: s.id, name: s.name, color: s.color }))
    );
    setFunnelTriggers(
      (triggers || []).map((t) => ({
        id: t.id,
        stageId: t.stage_id,
        event: t.event,
        icon: t.icon as FunnelTrigger['icon'],
        title: t.title,
        description: t.description,
        config: (t.config as Record<string, unknown>) || {},
      }))
    );
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleAllSelection = () => {
    if (selectedIds.size === filteredAndSortedLeads.length)
      setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredAndSortedLeads.map((l) => l.id)));
  };

  const activeFunnel = useMemo(
    () => funnels.find((f) => f.id === activeFunnelId) || null,
    [funnels, activeFunnelId],
  );

  return {
    leads,
    viewMode,
    setViewMode,
    selectedLead,
    setSelectedLead,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    sortOption,
    setSortOption,
    isFilterPanelOpen,
    setIsFilterPanelOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    isCreateModalOpen,
    setIsCreateModalOpen,
    selectedIds,
    setSelectedIds,
    filteredAndSortedLeads,
    totalLeadsSum,
    activeFiltersCount,
    resetFilters,
    toggleSelection,
    toggleAllSelection,
    handleCreateLead,
    handleStatusChange,
    handleAddTask,
    handleCompleteTask,
    handleToggleTask,
    handleDeleteTask,
    handleAddNote,
    handleAddTag,
    handleRemoveTag,
    handleDeleteSelected,
    handleMassAssign,
    handleUpdateLead,
    handleMergeLeads,
    handleImportLeads,
    funnels,
    activeFunnel,
    handleSelectFunnel,
    handleAddFunnel,
    handleDeleteFunnel,
    editingFunnelId,
    editingFunnelName,
    setEditingFunnelName,
    handleStartEditFunnel,
    handleSaveFunnel,
    handleCancelEditFunnel,
    funnelStages,
    funnelTriggers,
    missingApartmentStatusFunnels: funnelAutomationComplianceQuery.data || [],
    handleUpdateStage,
    handleAddStage,
    handleDeleteStage,
    handleReorderStages,
    handleAddTrigger,
    handleUpdateTrigger,
    handleDeleteTrigger,
    handleReorderTrigger,
    handleSaveFunnelSetup,
    handleResetFunnelSetup,
    handleDeleteAllTriggers,
    cardConfig,
    handleSaveCardConfig,
    MOCK_USERS,
    isLoading: leadsLoading || funnelsQuery.isLoading,
  };
}
