import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../api/supabase";
import type { CurrentSessionResult } from "../auth/currentSession";
import { fetchCurrentSession } from "../auth/currentSession";

export function useCurrentSession() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return useQuery<CurrentSessionResult>({
    queryKey: ["auth", "session"],
    queryFn: fetchCurrentSession,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
