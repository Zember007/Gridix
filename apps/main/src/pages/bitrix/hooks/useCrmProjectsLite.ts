import { useEffect, useState } from "react";
import { supabase } from "@gridix/utils/api";

export type CrmProjectLite = {
  id: string;
  name: string;
  slug: string | null;
};

export function useCrmProjectsLite(enabled: boolean = true) {
  const [projects, setProjects] = useState<CrmProjectLite[]>([]);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: u0, error: uErr } = await supabase.auth.getUser();
        if (uErr) throw uErr;
        const user = u0?.user ?? null;
        if (!user) {
          if (!cancelled) setProjects([]);
          return;
        }

        const { data, error: pErr } = await supabase
          .from("projects")
          .select("id,name,slug")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (pErr) throw pErr;
        if (!cancelled) setProjects((data ?? []) as CrmProjectLite[]);
      } catch (e: any) {
        console.error(e);
        if (!cancelled) setError(e?.message ? String(e.message) : "Failed to load projects");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { projects, loading, error };
}

