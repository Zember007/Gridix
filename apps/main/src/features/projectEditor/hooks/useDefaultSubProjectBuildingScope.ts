import { useEffect, useState } from "react";
import { supabase } from "@gridix/utils/api";

export interface DefaultSubProjectBuildingScope {
  subProjectId: string;
  floors: number;
  buildingImageUrl: string | null;
}

/**
 * Default (or first) sub-project for project-level facade editing when genplan is off.
 * Facades and floor polygons must use this `sub_project_id`, not project-level rows.
 */
export function useDefaultSubProjectBuildingScope(
  projectId: string | null | undefined,
): {
  scope: DefaultSubProjectBuildingScope | null;
  isReady: boolean;
} {
  const [scope, setScope] = useState<DefaultSubProjectBuildingScope | null>(
    null,
  );
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!projectId) {
      setScope(null);
      setIsReady(true);
      return;
    }

    let cancelled = false;
    setIsReady(false);

    void (async () => {
      const { data: def } = await supabase
        .from("sub_projects")
        .select("id, floors, building_image_url")
        .eq("project_id", projectId)
        .eq("is_default", true)
        .maybeSingle();

      if (cancelled) return;

      if (def?.id) {
        setScope({
          subProjectId: def.id,
          floors: def.floors ?? 1,
          buildingImageUrl: def.building_image_url ?? null,
        });
        setIsReady(true);
        return;
      }

      const { data: first } = await supabase
        .from("sub_projects")
        .select("id, floors, building_image_url")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (first?.id) {
        setScope({
          subProjectId: first.id,
          floors: first.floors ?? 1,
          buildingImageUrl: first.building_image_url ?? null,
        });
      } else {
        setScope(null);
      }
      setIsReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return { scope, isReady };
}
