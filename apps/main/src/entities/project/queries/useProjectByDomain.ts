import { useEffect, useState } from "react";
import { supabase } from "@gridix/utils/api";
import type { Tables } from "@gridix/types/database";

type Project = Tables<'projects'>;

export interface ProjectByDomainResult {
  project: Project | null;
  loading: boolean;
  error: string | null;
  isDomainProject: boolean; // true if this is a custom domain, false for main app domain
}

export function useProjectByDomain(hostname?: string): ProjectByDomainResult {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDomainProject, setIsDomainProject] = useState(false);

  useEffect(() => {
    const loadProjectByDomain = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const host = (hostname || window.location.hostname).toLowerCase();

        // List of main application hostnames (can be configured via env)
        const mainHosts = (import.meta.env.VITE_MAIN_HOSTNAMES || "localhost,127.0.0.1")
          .split(",")
          .map((x: string) => x.trim().toLowerCase())
          .filter(Boolean);

        // If this is a main app domain, don't try to map it to a project
        if (mainHosts.includes(host)) {
          setProject(null);
          setIsDomainProject(false);
          return;
        }

        // Try to find a project by domain - include subscription fields
        const { data, error: domainError } = await supabase
          .from("project_domains")
          .select(`
            project_id,
            domain,
            is_primary,
            status,
            projects!inner (
              *,
              subscription_status,
              subscription_expires_at,
              is_public_visible
            )
          `)
          .eq("domain", host)
          .eq("status", "active")
          .single();

        if (domainError) {
          if (domainError.code === 'PGRST116') {
            // No matching domain found - this is normal for non-custom domains
            setProject(null);
            setIsDomainProject(false);
            return;
          }
          throw domainError;
        }

        if (data && data.projects) {
          setProject(data.projects as Project);
          setIsDomainProject(true);
        } else {
          setProject(null);
          setIsDomainProject(false);
        }
      } catch (e: any) {
        console.error("Error loading project by domain:", e);
        setError(e.message || "Failed to load project by domain");
        setProject(null);
        setIsDomainProject(false);
      } finally {
        setLoading(false);
      }
    };

    loadProjectByDomain();
  }, [hostname]);

  return { project, loading, error, isDomainProject };
}
