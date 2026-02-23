import type { User } from "@supabase/supabase-js";
import { supabase } from "../api/supabase";

export interface CurrentSessionResult {
  session:
    | Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]
    | null;
  user: User | null;
}

export async function fetchCurrentSession(): Promise<CurrentSessionResult> {
  const { data } = await supabase.auth.getSession();

  return {
    session: data.session ?? null,
    user: data.session?.user ?? null,
  };
}
