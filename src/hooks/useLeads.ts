import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export interface Lead {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  phone: string;
  project_id: string;
  apartment_id: string;
  amocrm_lead_id?: number | null;
  amocrm_contact_id?: number | null;
  amocrm_sent_at?: string | null;
  amocrm_error?: string | null;
  amocrm_retries: number | null;
  status: string | null;
  source: string | null;
  notes?: string | null;
  // Relations
  projects?: {
    name: string;
    address?: string | null;
  };
  apartments?: {
    apartment_number: string;
    area?: number | null;
    price?: number | null;
    floor_number?: number | null;
    rooms?: string | null;
  };
}

export interface LeadFilters {
  projectId?: string | undefined;
  status?: Lead['status'];
  dateFrom?: string;
  dateTo?: string;
}

export function useLeads(filters?: LeadFilters) {
  const { userRole } = useUserRole();
  const { activeWorkspaceId } = useWorkspace();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('leads')
        .select(`
          *,
          projects!inner (
            name,
            address
          ),
          apartments!inner (
            apartment_number,
            area,
            price,
            floor_number,
            rooms
          )
        `)
        .order('created_at', { ascending: false });

      // Для менеджеров - получить доступные проекты
      if (userRole.type === 'manager' && activeWorkspaceId) {
        // Получаем ID текущего пользователя
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: managerAccount } = await supabase
          .from('manager_accounts')
          .select('id')
          .eq('manager_id', user.id)
          .eq('developer_id', activeWorkspaceId)
          .single();
        
        if (managerAccount) {
          const { data: accessRules } = await supabase
            .from('manager_project_access')
            .select('project_id')
            .eq('manager_account_id', managerAccount.id);
          
          const projectIds = accessRules?.map(r => r.project_id) || [];
          
          // Применить фильтр по project_ids
          if (projectIds.length > 0) {
            query = query.in('project_id', projectIds);
          } else {
            // Если нет доступа к проектам, возвращаем пустой результат
            setLeads([]);
            return;
          }
        } else {
          // Если нет manager_account, возвращаем пустой результат
          setLeads([]);
          return;
        }
      }

      // Apply filters
      if (filters?.projectId) {
        query = query.eq('project_id', filters.projectId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setLeads(data || []);
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  }, [userRole.type, activeWorkspaceId, filters?.projectId, filters?.status, filters?.dateFrom, filters?.dateTo]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);


  const cancelLead = async (leadId: string) => {
    try {
      setError(null);
      
      const { error: updateError } = await supabase
        .from('leads')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (updateError) {
        throw updateError;
      }

      // Refresh leads after cancellation
      await fetchLeads();
    } catch (err) {
      console.error('Error cancelling lead:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel lead');
      throw err;
    }
  };

  const updateLeadNotes = async (leadId: string, notes: string) => {
    try {
      setError(null);
      
      const { error: updateError } = await supabase
        .from('leads')
        .update({ 
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (updateError) {
        throw updateError;
      }

      // Refresh leads after update
      await fetchLeads();
    } catch (err) {
      console.error('Error updating lead notes:', err);
      setError(err instanceof Error ? err.message : 'Failed to update lead notes');
      throw err;
    }
  };

  // Get counts for different statuses
  const getLeadCounts = () => {
    return {
      total: leads.length,
      pending: leads.filter(lead => lead.status === 'pending').length,
      sent: leads.filter(lead => lead.status === 'sent_to_crm').length,
      savedOnly: leads.filter(lead => lead.status === 'saved_only').length,
      failed: leads.filter(lead => lead.status === 'failed').length,
      cancelled: leads.filter(lead => lead.status === 'cancelled').length,
    };
  };

  return {
    leads,
    loading,
    error,
    fetchLeads,
    cancelLead,
    updateLeadNotes,
    getLeadCounts,
  };
}

// Hook for getting leads for a specific project
export function useProjectLeads(projectId?: string) {
  return useLeads({ projectId });
}

// Hook for getting failed leads only
export function useFailedLeads(projectId?: string) {
  return useLeads({ projectId, status: 'failed' });
}
