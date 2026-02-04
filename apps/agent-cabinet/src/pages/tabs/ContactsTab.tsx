import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@gridix/utils/api";
import { useWorkspace } from "@gridix/utils/react";
import { Sheet, SheetContent } from "@gridix/ui";
import { ArrowRight, Mail, Phone } from "lucide-react";
import { ModuleHeader } from "@/shared/ui/ModuleHeader";
import { useLanguage } from "@/contexts/LanguageContext";

type Contact = {
  key: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  leadsCount: number;
  lastLeadAt: string | null;
  projects: string[];
};

const initials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
};

function contactKeyFromLead(lead: { email?: unknown; phone?: unknown; id?: unknown }): string {
  const email = typeof lead.email === "string" ? lead.email.trim().toLowerCase() : "";
  if (email) return `email:${email}`;
  const phone = typeof lead.phone === "string" ? lead.phone.trim() : "";
  if (phone) return `phone:${phone}`;
  const id = typeof lead.id === "string" ? lead.id : "";
  return id ? `lead:${id}` : crypto.randomUUID();
}

export function ContactsTab() {
  const { t } = useLanguage();
  const { activeWorkspaceId, availableWorkspaces } = useWorkspace();
  const selected = availableWorkspaces.find((w) => w.id === activeWorkspaceId) ?? null;
  const [q, setQ] = useState("");
  const [openContactKey, setOpenContactKey] = useState<string | null>(null);

  const contactsQuery = useQuery({
    queryKey: ["agent_contacts", activeWorkspaceId],
    enabled: !!activeWorkspaceId,
    queryFn: async () => {
      if (!activeWorkspaceId) return [];

      const { data, error } = await supabase.functions.invoke("agent-program", {
        body: { action: "list_agent_leads", application_id: activeWorkspaceId },
      });
      if (error) throw error;

      const leads = (data as any)?.leads ?? [];

      const map = new Map<string, Contact>();
      for (const row of (leads ?? []) as any[]) {
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

      return Array.from(map.values()).sort((a, b) =>
        String(b.lastLeadAt ?? "").localeCompare(String(a.lastLeadAt ?? "")),
      );
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

  const openContact = useMemo(
    () => (openContactKey ? filtered.find((c) => c.key === openContactKey) ?? null : null),
    [filtered, openContactKey],
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ModuleHeader
        title={t("common.contacts.title")}
        subtitle={
          selected
            ? t("common.contacts.subtitleWithWorkspace", { count: filtered.length, workspace: selected.label })
            : t("common.contacts.subtitle", { count: filtered.length })
        }
        searchValue={q}
        onSearchChange={setQ}
        searchPlaceholder={t("common.contacts.searchPlaceholder")}
      />

      <Sheet open={!!openContactKey} onOpenChange={(open) => setOpenContactKey(open ? openContactKey : null)}>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 relative custom-scrollbar">
          <div className="pb-20">
            {!activeWorkspaceId ? (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-sm text-slate-600">
                {t("common.workspace.pickInSidebar")}
              </div>
            ) : contactsQuery.isLoading ? (
              <div className="text-sm text-slate-500">{t("common.common.loading")}</div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-sm text-slate-600">
                {t("common.contacts.notFound")}
              </div>
            ) : (
              <>
                {/* Desktop list */}
                <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {t("common.contacts.columns.contact")}
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {filtered.map((c) => {
                      const title = c.name || c.email || c.phone || t("common.common.empty");
                      return (
                        <button
                          key={c.key}
                          type="button"
                          className="w-full text-left px-6 py-4 hover:bg-slate-50 transition-colors flex items-center gap-4"
                          onClick={() => setOpenContactKey(c.key)}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0">
                              {initials(String(title))}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate">{title}</div>
                              <div className="text-xs text-slate-500 flex items-center gap-3">
                                <span className="inline-flex items-center gap-1">
                                  <Phone size={14} className="text-slate-400" /> {c.phone || t("common.common.empty")}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Mail size={14} className="text-slate-400" /> {c.email || t("common.common.empty")}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-slate-600 w-24 text-right">{c.leadsCount}</div>
                          <div className="text-xs text-slate-600 w-64 truncate text-right">
                            {(c.projects ?? []).length ? c.projects.join(", ") : t("common.common.empty")}
                          </div>
                          <div className="text-xs text-slate-500 w-48 text-right">
                            {c.lastLeadAt ? new Date(c.lastLeadAt).toLocaleString() : t("common.common.empty")}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {filtered.map((c) => {
                    const title = c.name || c.email || c.phone || t("common.common.empty");
                    return (
                      <div
                        key={c.key}
                        onClick={() => setOpenContactKey(c.key)}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm active:bg-slate-50"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black">
                              {initials(String(title))}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate">{title}</div>
                              <div className="text-xs text-slate-500 truncate">
                                {c.phone || c.email || t("common.common.empty")}
                              </div>
                            </div>
                          </div>
                          <div className="text-blue-600">
                            <ArrowRight size={16} />
                          </div>
                        </div>
                        {(c.projects ?? []).length ? (
                          <div className="pt-2 mt-2 border-t border-slate-100 flex flex-wrap gap-1">
                            {c.projects.slice(0, 4).map((p) => (
                              <span key={p} className="text-[10px] px-2 py-1 rounded-md font-medium bg-slate-100 text-slate-600">
                                {p}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        <SheetContent side="right" className="w-full sm:w-[520px] p-0">
          {openContact ? (
            <div className="h-full flex flex-col bg-white">
              <div className="p-6 border-b border-slate-100">
                <div className="font-black text-slate-900 text-lg">
                  {openContact.name || openContact.email || openContact.phone || t("common.common.empty")}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {t("common.contacts.drawer.leadsAndLast", {
                    count: openContact.leadsCount,
                    last: openContact.lastLeadAt ? new Date(openContact.lastLeadAt).toLocaleString() : t("common.common.empty"),
                  })}
                </div>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {t("common.contacts.drawer.contactsSection")}
                  </div>
                  <div className="text-sm text-slate-700 space-y-1">
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-slate-400" />
                      <span>{openContact.phone || t("common.common.empty")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-slate-400" />
                      <span className="truncate">{openContact.email || t("common.common.empty")}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {t("common.contacts.drawer.projectsSection")}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(openContact.projects ?? []).length ? (
                      openContact.projects.map((p) => (
                        <span key={p} className="text-xs font-bold bg-white border border-slate-200 text-slate-700 px-2 py-1 rounded-lg">
                          {p}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-600">{t("common.common.empty")}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-sm text-slate-600">{t("common.contacts.drawer.notSelected")}</div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

