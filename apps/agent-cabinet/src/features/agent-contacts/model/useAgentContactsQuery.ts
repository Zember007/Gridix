import { useQuery } from "@tanstack/react-query";
import { listAgentContacts } from "../api/contacts-api";

export function useAgentContactsQuery(activeWorkspaceId: string | null) {
  return useQuery({
    queryKey: ["agent", "contacts", "list", activeWorkspaceId],
    enabled: !!activeWorkspaceId,
    queryFn: async () => listAgentContacts(activeWorkspaceId as string),
  });
}
