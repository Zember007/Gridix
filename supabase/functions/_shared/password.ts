import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function checkIfUserHasPassword(params: {
  supabaseUrl: string;
  anonKey: string;
  accessToken: string;
}): Promise<boolean> {
  const client = createClient(params.supabaseUrl, params.anonKey, {
    global: { headers: { Authorization: `Bearer ${params.accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.rpc("check_if_user_has_password");
  if (error) throw error;
  return data === true;
}

