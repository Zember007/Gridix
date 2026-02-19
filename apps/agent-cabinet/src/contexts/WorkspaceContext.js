import { jsx as _jsx } from "react/jsx-runtime";
import { supabase } from "@gridix/utils/api";
import { WorkspaceProvider } from "@gridix/utils/react";
import { useAuth } from "@/contexts/AuthContext";
const LEGACY_ACTIVE_APPLICATION_KEY = "agent_cabinet:active_application_id";
export function AgentWorkspaceProvider({ children }) {
  const { user } = useAuth();
  return _jsx(WorkspaceProvider, {
    type: "agent",
    storageKey: "gridix_active_workspace_id:agent",
    migrateFromStorageKey: LEGACY_ACTIVE_APPLICATION_KEY,
    reloadKey: user?.id ?? "anonymous",
    loadWorkspaces: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase.functions.invoke("agent-program", {
        body: { action: "list_my_workspaces" },
      });
      if (error) throw error;
      const raw = data?.workspaces;
      const list = Array.isArray(raw) ? raw : [];
      return list
        .map((w) => {
          const applicationId =
            typeof w?.application_id === "string" ? w.application_id : null;
          const profile = w?.developer_profile ?? null;
          const label =
            (typeof profile?.company_name === "string" &&
              profile.company_name) ||
            (typeof profile?.full_name === "string" && profile.full_name) ||
            (typeof profile?.email === "string" && profile.email) ||
            "Workspace";
          if (!applicationId) return null;
          const developerInfo =
            profile && typeof profile === "object"
              ? {
                  full_name:
                    typeof profile.full_name === "string"
                      ? profile.full_name
                      : "",
                  company_name:
                    typeof profile.company_name === "string"
                      ? profile.company_name
                      : "",
                  email: typeof profile.email === "string" ? profile.email : "",
                }
              : null;
          const optionBase = {
            id: applicationId,
            label,
            type: "agent",
            meta: {
              developer_user_id:
                typeof w?.developer_user_id === "string"
                  ? w.developer_user_id
                  : null,
              commission_rate: w?.commission_rate ?? null,
              agreement_signed_at: w?.agreement_signed_at ?? null,
            },
          };
          return developerInfo ? { ...optionBase, developerInfo } : optionBase;
        })
        .filter(Boolean);
    },
    children: children,
  });
}
