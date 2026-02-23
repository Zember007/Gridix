import { useQuery } from "@tanstack/react-query";
import { supabase } from "../api/supabase";

export interface UserProject {
  id: string;
  name: string;
  slug: string | null;
  created_at: string;
}

async function fetchUserProjects(userId: string): Promise<UserProject[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("id,name,slug,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as UserProject[];
}

export function useUserProjects(
  userId: string | null,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: ["userProjects", userId],
    queryFn: () => fetchUserProjects(userId as string),
    enabled: enabled && Boolean(userId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
