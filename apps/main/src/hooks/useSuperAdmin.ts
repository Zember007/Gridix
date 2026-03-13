import { useQuery } from "@tanstack/react-query";
import { supabase } from "@gridix/utils/api";
import { useAuth } from "@/contexts/AuthContext";

export const useSuperAdmin = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["superadmin-role", user?.id],
    enabled: Boolean(user?.id),
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      if (!user?.id) {
        return false;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "superadmin")
        .maybeSingle();

      if (error) {
        console.error("Error checking superadmin role:", error);
        return false;
      }

      return Boolean(data);
    },
  });

  return {
    isSuperAdmin: data ?? false,
    loading: Boolean(user) && isLoading,
  };
};
