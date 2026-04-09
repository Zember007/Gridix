import { supabase } from "@gridix/utils/api";

export interface LeadFilters {
  projectId?: string | undefined;
  status?: string | null;
  dateFrom?: string;
  dateTo?: string;
}

export const fetchLeads = async (
  filters: LeadFilters | undefined,
  projectIdsForManager: string[] | null,
  userId: string | null,
) => {
  let query = supabase
    .from("leads")
    .select(
      `
      id,
      created_at,
      updated_at,
      name,
      email,
      phone,
      project_id,
      apartment_id,
      amocrm_lead_id,
      amocrm_sent_at,
      status,
      source,
      notes,
      agent_id,
      pipeline_stage_id,
      assigned_to_user_id,
      tags,
      projects!inner (
        name
      ),
      apartments (
        apartment_number,
        area,
        price
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (projectIdsForManager && projectIdsForManager.length > 0) {
    query = query.in("project_id", projectIdsForManager);
  }

  if (filters?.projectId) {
    query = query.eq("project_id", filters.projectId);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.dateFrom) {
    query = query.gte("created_at", filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte("created_at", filters.dateTo);
  }

  const { data, error } = await query;

  if (error) throw error;

  const leads = (data || []) as Array<Record<string, unknown>>;

  if (!userId || leads.length === 0) {
    return leads;
  }

  const leadIds = leads
    .map((l) => String(l.id))
    .filter((id): id is string => Boolean(id));

  if (leadIds.length === 0) return leads;

  const { data: reads, error: readsError } = await supabase
    .from("lead_reads")
    .select("lead_id, read_at")
    .eq("user_id", userId)
    .in("lead_id", leadIds);

  if (readsError) throw readsError;

  const readAtByLeadId = new Map<string, string>();
  (reads || []).forEach((r) => {
    if (r.lead_id && r.read_at) readAtByLeadId.set(r.lead_id, r.read_at);
  });

  return leads.map((l) => ({
    ...l,
    read_at: readAtByLeadId.get(String(l.id)) || null,
  }));
};

export const cancelLead = async (leadId: string) => {
  const { error } = await supabase
    .from("leads")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  if (error) throw error;
};

export const updateLeadNotes = async (leadId: string, notes: string) => {
  const { error } = await supabase
    .from("leads")
    .update({
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  if (error) throw error;
};
