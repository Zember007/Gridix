import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/api/supabase";

export function useProjectHasMasterplan(projectId: string | undefined) {
  const id = projectId?.trim();
  return useQuery({
    queryKey: ["admin-widgets", "has-masterplan", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("has_masterplan")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return Boolean(data?.has_masterplan);
    },
    enabled: Boolean(id),
  });
}
