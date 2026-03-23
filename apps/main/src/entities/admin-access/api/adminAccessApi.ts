import { supabase } from "@/shared/api/supabase";
import type { AdminBootstrapResponse } from "../model/types";

export interface FetchAdminBootstrapParams {
  isManagerMode: boolean;
  activeWorkspaceId: string | null | undefined;
}

export async function fetchAdminBootstrap(
  params: FetchAdminBootstrapParams,
): Promise<AdminBootstrapResponse> {
  const { data, error } = await supabase.functions.invoke("admin-bootstrap", {
    body: {
      isManagerMode: params.isManagerMode,
      activeWorkspaceId: params.activeWorkspaceId ?? null,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? {}) as AdminBootstrapResponse;
}
