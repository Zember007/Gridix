import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLeadsQuery } from '@/entities/lead/queries/useLeadsQuery';
import { cancelLead as apiCancelLead, updateLeadNotes as apiUpdateLeadNotes } from '@/entities/lead/api/leadApi';

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
  const queryClient = useQueryClient();
  const query = useLeadsQuery(filters);

  const { leads, isLoading, error } = query;

  const refetchLeads = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const cancelLead = useCallback(
    async (leadId: string) => {
      try {
        await apiCancelLead(leadId);
        // После изменения данных инвалидируем все связанные запросы по лидам
        await queryClient.invalidateQueries({ queryKey: ['leads'] });
      } catch (err) {
        console.error('Error cancelling lead:', err);
        throw err;
      }
    },
    [queryClient],
  );

  const updateLeadNotes = useCallback(
    async (leadId: string, notes: string) => {
      try {
        await apiUpdateLeadNotes(leadId, notes);
        // После изменения заметок также инвалидируем кэш
        await queryClient.invalidateQueries({ queryKey: ['leads'] });
      } catch (err) {
        console.error('Error updating lead notes:', err);
        throw err;
      }
    },
    [queryClient],
  );

  // Get counts for different statuses
  const getLeadCounts = () => {
    return {
      total: leads.length,
      pending: leads.filter((lead) => lead.status === 'pending').length,
      sent: leads.filter((lead) => lead.status === 'sent_to_crm').length,
      savedOnly: leads.filter((lead) => lead.status === 'saved_only').length,
      failed: leads.filter((lead) => lead.status === 'failed').length,
      cancelled: leads.filter((lead) => lead.status === 'cancelled').length,
    };
  };

  return {
    leads,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    fetchLeads: refetchLeads,
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
