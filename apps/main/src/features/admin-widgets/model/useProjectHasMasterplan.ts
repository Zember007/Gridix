import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/api/supabase";

export function useProjectHasMasterplan(projectId: string | undefined) {
  return useQuery({
    queryKey: ["admin-widgets", "has-masterplan", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("has_masterplan")
        .eq("id", projectId!)
        .single();
      if (error) throw error;
      return Boolean(data?.has_masterplan);
    },
    enabled: Boolean(projectId),
  });
}
