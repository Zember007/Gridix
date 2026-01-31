import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, Input } from "@gridix/ui";
import { supabase } from "@gridix/utils/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { getActiveApplicationId, setActiveApplicationId } from "@/shared/lib/agentContext";

type Contact = {
  key: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  leadsCount: number;
  lastLeadAt: string | null;
  projects: string[];
};

function contactKeyFromLead(lead: { email?: unknown; phone?: unknown; id?: unknown }): string {
  const email = typeof lead.email === "string" ? lead.email.trim().toLowerCase() : "";
  if (email) return `email:${email}`;
  const phone = typeof lead.phone === "string" ? lead.phone.trim() : "";
  if (phone) return `phone:${phone}`;
  const id = typeof lead.id === "string" ? lead.id : "";
  return id ? `lead:${id}` : crypto.randomUUID();
}

export default function ContactsPage() {
  const { t } = useLanguage();
  const [sp] = useSearchParams();
  const applicationId = sp.get("application_id") || getActiveApplicationId();
  const [q, setQ] = useState("");

  const contactsQuery = useQuery({
    queryKey: ["agent_contacts", applicationId],
    enabled: !!applicationId,
    queryFn: async () => {
      if (!applicationId) return [];
      setActiveApplicationId(applicationId);

      const { data, error } = await supabase
        .from("leads")
        .select(
          `
          id,
          created_at,
          name,
          phone,
          email,
          projects ( name )
        `,
        )
        .eq("agent_id", applicationId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const map = new Map<string, Contact>();
      for (const row of (data ?? []) as any[]) {
        const key = contactKeyFromLead(row);
        const prev = map.get(key);
        const email = typeof row.email === "string" ? row.email : null;
        const phone = typeof row.phone === "string" ? row.phone : null;
        const name = typeof row.name === "string" ? row.name : null;
        const createdAt = typeof row.created_at === "string" ? row.created_at : null;
        const projName = typeof row.projects?.name === "string" ? String(row.projects.name) : null;

        if (!prev) {
          map.set(key, {
            key,
            name,
            email,
            phone,
            leadsCount: 1,
            lastLeadAt: createdAt,
            projects: projName ? [projName] : [],
          });
          continue;
        }

        prev.leadsCount += 1;
        if (!prev.name && name) prev.name = name;
        if (!prev.email && email) prev.email = email;
        if (!prev.phone && phone) prev.phone = phone;
        if (createdAt && (!prev.lastLeadAt || createdAt > prev.lastLeadAt)) prev.lastLeadAt = createdAt;
        if (projName && !prev.projects.includes(projName)) prev.projects.push(projName);
      }

      return Array.from(map.values()).sort((a, b) => String(b.lastLeadAt ?? "").localeCompare(String(a.lastLeadAt ?? "")));
    },
  });

  const filtered = useMemo(() => {
    const rows = contactsQuery.data ?? [];
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((c) => {
      const name = String(c.name ?? "").toLowerCase();
      const email = String(c.email ?? "").toLowerCase();
      const phone = String(c.phone ?? "").toLowerCase();
      const projects = (c.projects ?? []).join(" ").toLowerCase();
      return name.includes(s) || email.includes(s) || phone.includes(s) || projects.includes(s);
    });
  }, [contactsQuery.data, q]);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">{t("common.nav.contacts")}</h1>
          <div className="text-sm text-slate-500">application_id: {applicationId ?? "—"}</div>
        </div>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="max-w-xs" />
      </div>

      {!applicationId ? (
        <div className="text-sm text-slate-500">Select an application first.</div>
      ) : contactsQuery.isLoading ? (
        <div className="text-sm text-slate-500">{t("common.common.loading")}</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-slate-500">No contacts.</div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((c) => (
            <Card key={c.key} className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{c.name || c.email || c.phone || "—"}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-700 space-y-1">
                <div className="text-xs text-slate-500">
                  {c.lastLeadAt ? `Last lead: ${new Date(c.lastLeadAt).toLocaleString()}` : "Last lead: —"}
                </div>
                <div className="text-xs text-slate-500">
                  {c.phone || "—"} • {c.email || "—"}
                </div>
                <div className="text-xs text-slate-500">Leads: {c.leadsCount}</div>
                <div className="text-xs text-slate-500">
                  Projects: {(c.projects ?? []).length ? c.projects.join(", ") : "—"}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

