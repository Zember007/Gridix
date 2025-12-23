// Thin wrapper around generated Supabase client.
// The goal is to keep a single import location for the client across the app.
import { supabase as rawSupabase } from "@/integrations/supabase/client";

export const supabase = rawSupabase;


