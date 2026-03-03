import { supabase } from "@gridix/utils/api";

export const fetchManagerAccess = async (
  managerAccountId: string,
): Promise<string[]> => {
  const { data, error } = await supabase
    .from("manager_project_access")
    .select("project_id")
    .eq("manager_account_id", managerAccountId);

  if (error) throw error;
  return (data || []).map((rule) => rule.project_id);
};

export const saveManagerAccess = async (
  managerAccountId: string,
  projectIds: string[],
): Promise<void> => {
  const { error: deleteError } = await supabase
    .from("manager_project_access")
    .delete()
    .eq("manager_account_id", managerAccountId);

  if (deleteError) throw deleteError;

  if (projectIds.length > 0) {
    const records = projectIds.map((projectId) => ({
      manager_account_id: managerAccountId,
      project_id: projectId,
    }));

    const { error: insertError } = await supabase
      .from("manager_project_access")
      .insert(records);

    if (insertError) throw insertError;
  }
};
