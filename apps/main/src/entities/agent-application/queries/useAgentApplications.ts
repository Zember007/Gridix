import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/api/supabase";

export function useAgentApplications(developerId: string | null) {
  return useQuery({
    queryKey: ["agent_applications", developerId],
    enabled: !!developerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_applications")
        .select(
          "id, full_name, email, phone, status, type, created_at, developer_user_id",
        )
        .eq("developer_user_id", developerId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });
}
