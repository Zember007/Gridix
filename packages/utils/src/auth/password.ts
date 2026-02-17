import type { SupabaseClient } from "@supabase/supabase-js";

export async function hasUserPassword(
  supabase: SupabaseClient,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("check_if_user_has_password");
  if (error) throw error;
  return data === true;
}
