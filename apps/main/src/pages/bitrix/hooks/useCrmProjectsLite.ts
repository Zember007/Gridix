import { useEffect, useState } from "react";
import { useCurrentSession, useUserProjects } from "@gridix/utils";

export type CrmProjectLite = {
  id: string;
  name: string;
  slug: string | null;
};

export function useCrmProjectsLite(enabled: boolean = true) {
  const [projects, setProjects] = useState<CrmProjectLite[]>([]);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);
  const { data: sessionQuery, isLoading: isSessionLoading } =
    useCurrentSession();
  const { refetch: refetchProjects } = useUserProjects(
    sessionQuery?.user?.id ?? null,
    false,
  );

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

        if (isSessionLoading) return;
        const user = sessionQuery?.user ?? null;
        if (!user) {
          if (!cancelled) setProjects([]);
          return;
        }

        const projectsData = await refetchProjects();
        if (projectsData.error) throw projectsData.error;

        const normalized = (projectsData.data ?? []).map((project) => ({
          id: project.id,
          name: project.name,
          slug: project.slug,
        }));

        if (!cancelled) setProjects(normalized as CrmProjectLite[]);
      } catch (e: any) {
        console.error(e);
        if (!cancelled)
          setError(e?.message ? String(e.message) : "Failed to load projects");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [enabled, isSessionLoading, refetchProjects, sessionQuery?.user]);

  return { projects, loading, error };
}
