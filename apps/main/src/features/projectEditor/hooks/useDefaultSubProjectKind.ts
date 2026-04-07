import { useEffect, useState } from "react";
import { supabase } from "@gridix/utils/api";
import { normalizeSubProjectKind } from "@/components/project-selector/lib/subProjectDisplay";

/**
 * `sub_projects.type` for the project's default (or first) sub-project — not `projects.project_type`.
 */
export function useDefaultSubProjectKind(
  projectId: string | null | undefined,
): "building" | "object" {
  const [kind, setKind] = useState<"building" | "object">("building");

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    void (async () => {
      const { data: def } = await supabase
        .from("sub_projects")
        .select("type")
        .eq("project_id", projectId)
        .eq("is_default", true)
        .maybeSingle();
      if (cancelled) return;
      if (def?.type) {
        setKind(normalizeSubProjectKind(def.type as string));
        return;
      }
      const { data: first } = await supabase
        .from("sub_projects")
        .select("type")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!cancelled && first?.type) {
        setKind(normalizeSubProjectKind(first.type as string));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return kind;
}
