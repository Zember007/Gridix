import { supabase } from "@/shared/api/supabase";

export interface LeadFilters {
  projectId?: string | undefined;
  status?: string | null;
  dateFrom?: string;
  dateTo?: string;
}

export const fetchLeads = async (
  filters: LeadFilters | undefined,
  projectIdsForManager: string[] | null
) => {
  let query = supabase
    .from("leads")
    .select(
      `
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
    `
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

  return data || [];
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
