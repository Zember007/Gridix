import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@gridix/utils/api';
import { useAuth } from '@/contexts/AuthContext';

function patchLeadInCache(
  oldData: unknown,
  leadId: string,
  patch: Record<string, unknown>,
): { data: unknown; found: boolean } {
  if (!Array.isArray(oldData)) return { data: oldData, found: false };
  let found = false;
  const data = oldData.map((l) => {
    if (!l || typeof l !== 'object') return l;
    const lead = l as Record<string, unknown>;
    if (String(lead.id) !== leadId) return l;
    found = true;
    return { ...lead, ...patch };
  });
  return { data, found };
}

function patchReadAtInCache(
  oldData: unknown,
  leadId: string,
  readAt: string | null,
): { data: unknown; found: boolean } {
  if (!Array.isArray(oldData)) return { data: oldData, found: false };
  let found = false;
  const data = oldData.map((l) => {
    if (!l || typeof l !== 'object') return l;
    const lead = l as Record<string, unknown>;
    if (String(lead.id) !== leadId) return l;
    found = true;
    return { ...lead, read_at: readAt };
  });
  return { data, found };
}

export function useLeadsRealtime() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`admin-leads-realtime:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        (payload) => {
          const eventType = payload.eventType;
          const nextRow = (payload.new || null) as Record<string, unknown> | null;
          const oldRow = (payload.old || null) as Record<string, unknown> | null;
          const leadId = String(nextRow?.id || oldRow?.id || '');
          if (!leadId) return;

          if (eventType === 'UPDATE' && nextRow) {
            let anyNotFound = false;
            queryClient.setQueriesData({ queryKey: ['leads'] }, (old) => {
              const res = patchLeadInCache(old, leadId, nextRow);
              if (!res.found) anyNotFound = true;
              return res.data;
            });
            if (anyNotFound) {
              queryClient.invalidateQueries({ queryKey: ['leads'] });
            }
            return;
          }

          // For INSERT/DELETE (and any unexpected shapes), refetch is safer (joined relations)
          queryClient.invalidateQueries({ queryKey: ['leads'] });
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lead_reads',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const eventType = payload.eventType;
          const nextRow = (payload.new || null) as Record<string, unknown> | null;
          const oldRow = (payload.old || null) as Record<string, unknown> | null;
          const leadId = String(nextRow?.lead_id || oldRow?.lead_id || '');
          if (!leadId) return;

          const readAt =
            eventType === 'DELETE' ? null : (String(nextRow?.read_at || '') || null);

          let anyNotFound = false;
          queryClient.setQueriesData({ queryKey: ['leads'] }, (old) => {
            const res = patchReadAtInCache(old, leadId, readAt);
            if (!res.found) anyNotFound = true;
            return res.data;
          });

          if (anyNotFound) {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
          }
        },
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {
        // ignore
      }
    };
  }, [queryClient, user?.id]);
}

