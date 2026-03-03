import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useLeads } from "@/entities/lead/queries/useLeads";
import { useAgentApplications } from "@/entities/agent-application";
import { normalizePhone, normalizeEmail } from "@/shared/lib/normalize";
import type { ContactKind, ContactRow } from "../model/types";

export function useContactsList() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { activeWorkspaceId, isManagerMode } = useWorkspace();

  const developerId = isManagerMode ? activeWorkspaceId : (user?.id ?? null);

  const { leads, loading: leadsLoading } = useLeads();
  const agentsQuery = useAgentApplications(developerId);

  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | ContactKind>("all");

  const noName = t("admin.contactsPage.noName");

  const leadContacts: ContactRow[] = useMemo(() => {
    const byKey = new Map<string, ContactRow>();

    for (const lead of leads) {
      const name = (lead.name || "").trim();
      const email = normalizeEmail(lead.email);
      const phone = normalizePhone(lead.phone);

      const key = email || phone || `lead:${lead.id}`;

      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, {
          id: lead.id,
          kind: "lead",
          name: name || noName,
          email: lead.email?.trim() || null,
          phone: lead.phone?.trim() || null,
          createdAt: lead.created_at || null,
          meta: { leadCount: 1 },
        });
      } else {
        const nextCount = (existing.meta?.leadCount ?? 1) + 1;
        byKey.set(key, {
          ...existing,
          name:
            existing.name !== noName ? existing.name : name || existing.name,
          email: existing.email || lead.email?.trim() || null,
          phone: existing.phone || lead.phone?.trim() || null,
          createdAt:
            existing.createdAt && lead.created_at
              ? new Date(existing.createdAt) > new Date(lead.created_at)
                ? existing.createdAt
                : lead.created_at
              : existing.createdAt || lead.created_at || null,
          meta: { ...existing.meta, leadCount: nextCount },
        });
      }
    }

    return Array.from(byKey.values());
  }, [leads, noName]);

  const agentContacts: ContactRow[] = useMemo(() => {
    const rows = agentsQuery.data ?? [];
    return rows.map((a) => ({
      id: a.id,
      kind: "agent" as const,
      name: (a.full_name || "").trim() || noName,
      email: a.email?.trim() || null,
      phone: a.phone?.trim() || null,
      createdAt: a.created_at || null,
      meta: {
        agentStatus: a.status ?? null,
        agentType: a.type ?? null,
      },
    }));
  }, [agentsQuery.data, noName]);

  const contacts: ContactRow[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...leadContacts, ...agentContacts]
      .filter((c) => (kindFilter === "all" ? true : c.kind === kindFilter))
      .filter((c) => {
        if (!q) return true;
        return (
          c.name.toLowerCase().includes(q) ||
          (c.email ?? "").toLowerCase().includes(q) ||
          (c.phone ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const ad = a.createdAt ? Date.parse(a.createdAt) : 0;
        const bd = b.createdAt ? Date.parse(b.createdAt) : 0;
        return bd - ad;
      });
  }, [agentContacts, leadContacts, kindFilter, query]);

  const isLoading = leadsLoading || agentsQuery.isLoading;

  return { contacts, isLoading, query, setQuery, kindFilter, setKindFilter };
}
