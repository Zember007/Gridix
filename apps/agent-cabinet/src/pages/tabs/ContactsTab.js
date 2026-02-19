import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@gridix/utils/api";
import { useWorkspace } from "@gridix/utils/react";
import { Sheet, SheetContent } from "@gridix/ui";
import { ArrowRight, Mail, Phone } from "lucide-react";
import { ModuleHeader } from "@/shared/ui/ModuleHeader";
import { useLanguage } from "@/contexts/LanguageContext";
const initials = (name) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
};
function contactKeyFromLead(lead) {
  const email =
    typeof lead.email === "string" ? lead.email.trim().toLowerCase() : "";
  if (email) return `email:${email}`;
  const phone = typeof lead.phone === "string" ? lead.phone.trim() : "";
  if (phone) return `phone:${phone}`;
  const id = typeof lead.id === "string" ? lead.id : "";
  return id ? `lead:${id}` : crypto.randomUUID();
}
export function ContactsTab() {
  const { t } = useLanguage();
  const { activeWorkspaceId, availableWorkspaces } = useWorkspace();
  const selected =
    availableWorkspaces.find((w) => w.id === activeWorkspaceId) ?? null;
  const [q, setQ] = useState("");
  const [openContactKey, setOpenContactKey] = useState(null);
  const contactsQuery = useQuery({
    queryKey: ["agent_contacts", activeWorkspaceId],
    enabled: !!activeWorkspaceId,
    queryFn: async () => {
      if (!activeWorkspaceId) return [];
      const { data, error } = await supabase.functions.invoke("agent-program", {
        body: { action: "list_agent_leads", application_id: activeWorkspaceId },
      });
      if (error) throw error;
      const leads = data?.leads ?? [];
      const map = new Map();
      for (const row of leads ?? []) {
        const key = contactKeyFromLead(row);
        const prev = map.get(key);
        const email = typeof row.email === "string" ? row.email : null;
        const phone = typeof row.phone === "string" ? row.phone : null;
        const name = typeof row.name === "string" ? row.name : null;
        const createdAt =
          typeof row.created_at === "string" ? row.created_at : null;
        const projName =
          typeof row.projects?.name === "string"
            ? String(row.projects.name)
            : null;
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
        if (createdAt && (!prev.lastLeadAt || createdAt > prev.lastLeadAt))
          prev.lastLeadAt = createdAt;
        if (projName && !prev.projects.includes(projName))
          prev.projects.push(projName);
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
      return (
        name.includes(s) ||
        email.includes(s) ||
        phone.includes(s) ||
        projects.includes(s)
      );
    });
  }, [contactsQuery.data, q]);
  const openContact = useMemo(
    () =>
      openContactKey
        ? (filtered.find((c) => c.key === openContactKey) ?? null)
        : null,
    [filtered, openContactKey],
  );
  return _jsxs("div", {
    className: "flex h-full flex-col overflow-hidden",
    children: [
      _jsx(ModuleHeader, {
        title: t("common.contacts.title"),
        subtitle: selected
          ? t("common.contacts.subtitleWithWorkspace", {
              count: filtered.length,
              workspace: selected.label,
            })
          : t("common.contacts.subtitle", { count: filtered.length }),
        searchValue: q,
        onSearchChange: setQ,
        searchPlaceholder: t("common.contacts.searchPlaceholder"),
      }),
      _jsxs(Sheet, {
        open: !!openContactKey,
        onOpenChange: (open) => setOpenContactKey(open ? openContactKey : null),
        children: [
          _jsx("div", {
            className:
              "custom-scrollbar relative flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6",
            children: _jsx("div", {
              className: "mx-auto max-w-[1600px] pb-20",
              children: !activeWorkspaceId
                ? _jsx("div", {
                    className:
                      "rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm",
                    children: t("common.workspace.pickInSidebar"),
                  })
                : contactsQuery.isLoading
                  ? _jsx("div", {
                      className: "text-sm text-slate-500",
                      children: t("common.common.loading"),
                    })
                  : filtered.length === 0
                    ? _jsx("div", {
                        className:
                          "rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm",
                        children: t("common.contacts.notFound"),
                      })
                    : _jsxs(_Fragment, {
                        children: [
                          _jsxs("div", {
                            className:
                              "hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block",
                            children: [
                              _jsx("div", {
                                className:
                                  "flex items-center gap-3 border-b border-slate-100 px-6 py-4",
                                children: _jsx("div", {
                                  className:
                                    "text-xs font-bold uppercase tracking-wider text-slate-400",
                                  children: t(
                                    "common.contacts.columns.contact",
                                  ),
                                }),
                              }),
                              _jsx("div", {
                                className: "divide-y divide-slate-100",
                                children: filtered.map((c) => {
                                  const title =
                                    c.name ||
                                    c.email ||
                                    c.phone ||
                                    t("common.common.empty");
                                  return _jsxs(
                                    "button",
                                    {
                                      type: "button",
                                      className:
                                        "flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-slate-50",
                                      onClick: () => setOpenContactKey(c.key),
                                      children: [
                                        _jsxs("div", {
                                          className:
                                            "flex min-w-0 flex-1 items-center gap-3",
                                          children: [
                                            _jsx("div", {
                                              className:
                                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white",
                                              children: initials(String(title)),
                                            }),
                                            _jsxs("div", {
                                              className: "min-w-0",
                                              children: [
                                                _jsx("div", {
                                                  className:
                                                    "truncate font-bold text-slate-900",
                                                  children: title,
                                                }),
                                                _jsxs("div", {
                                                  className:
                                                    "flex flex-col gap-1 text-xs text-slate-500 lg:flex-row lg:items-center lg:gap-3",
                                                  children: [
                                                    _jsxs("span", {
                                                      className:
                                                        "inline-flex min-w-0 items-center gap-1",
                                                      children: [
                                                        _jsx(Phone, {
                                                          size: 14,
                                                          className:
                                                            "shrink-0 text-slate-400",
                                                        }),
                                                        _jsx("span", {
                                                          className: "truncate",
                                                          children:
                                                            c.phone ||
                                                            t(
                                                              "common.common.empty",
                                                            ),
                                                        }),
                                                      ],
                                                    }),
                                                    _jsxs("span", {
                                                      className:
                                                        "inline-flex min-w-0 items-center gap-1",
                                                      children: [
                                                        _jsx(Mail, {
                                                          size: 14,
                                                          className:
                                                            "shrink-0 text-slate-400",
                                                        }),
                                                        _jsx("span", {
                                                          className: "truncate",
                                                          children:
                                                            c.email ||
                                                            t(
                                                              "common.common.empty",
                                                            ),
                                                        }),
                                                      ],
                                                    }),
                                                  ],
                                                }),
                                              ],
                                            }),
                                          ],
                                        }),
                                        _jsx("div", {
                                          className:
                                            "w-10 shrink-0 text-center text-xs tabular-nums text-slate-600 xl:w-14",
                                          children: c.leadsCount,
                                        }),
                                        _jsx("div", {
                                          className:
                                            "hidden w-40 shrink-0 truncate text-left text-xs text-slate-600 xl:block 2xl:w-56",
                                          children: (c.projects ?? []).length
                                            ? c.projects.join(", ")
                                            : t("common.common.empty"),
                                        }),
                                        _jsx("div", {
                                          className:
                                            "w-28 shrink-0 truncate text-left text-xs tabular-nums text-slate-500 xl:w-36",
                                          children: c.lastLeadAt
                                            ? new Date(
                                                c.lastLeadAt,
                                              ).toLocaleString()
                                            : t("common.common.empty"),
                                        }),
                                      ],
                                    },
                                    c.key,
                                  );
                                }),
                              }),
                            ],
                          }),
                          _jsx("div", {
                            className: "space-y-3 md:hidden",
                            children: filtered.map((c) => {
                              const title =
                                c.name ||
                                c.email ||
                                c.phone ||
                                t("common.common.empty");
                              return _jsxs(
                                "div",
                                {
                                  onClick: () => setOpenContactKey(c.key),
                                  className:
                                    "rounded-xl border border-slate-200 bg-white p-4 shadow-sm active:bg-slate-50",
                                  children: [
                                    _jsxs("div", {
                                      className:
                                        "mb-2 flex items-start justify-between",
                                      children: [
                                        _jsxs("div", {
                                          className: "flex items-center gap-3",
                                          children: [
                                            _jsx("div", {
                                              className:
                                                "flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white",
                                              children: initials(String(title)),
                                            }),
                                            _jsxs("div", {
                                              className: "min-w-0",
                                              children: [
                                                _jsx("div", {
                                                  className:
                                                    "truncate font-bold text-slate-900",
                                                  children: title,
                                                }),
                                                _jsx("div", {
                                                  className:
                                                    "truncate text-xs text-slate-500",
                                                  children:
                                                    c.phone ||
                                                    c.email ||
                                                    t("common.common.empty"),
                                                }),
                                              ],
                                            }),
                                          ],
                                        }),
                                        _jsx("div", {
                                          className: "text-blue-600",
                                          children: _jsx(ArrowRight, {
                                            size: 16,
                                          }),
                                        }),
                                      ],
                                    }),
                                    (c.projects ?? []).length
                                      ? _jsx("div", {
                                          className:
                                            "mt-2 flex flex-wrap gap-1 border-t border-slate-100 pt-2",
                                          children: c.projects
                                            .slice(0, 4)
                                            .map((p) =>
                                              _jsx(
                                                "span",
                                                {
                                                  className:
                                                    "rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600",
                                                  children: p,
                                                },
                                                p,
                                              ),
                                            ),
                                        })
                                      : null,
                                  ],
                                },
                                c.key,
                              );
                            }),
                          }),
                        ],
                      }),
            }),
          }),
          _jsx(SheetContent, {
            side: "right",
            className: "w-full p-0 sm:w-[520px]",
            children: openContact
              ? _jsxs("div", {
                  className: "flex h-full flex-col bg-white",
                  children: [
                    _jsxs("div", {
                      className: "border-b border-slate-100 p-6",
                      children: [
                        _jsx("div", {
                          className: "text-lg font-black text-slate-900",
                          children:
                            openContact.name ||
                            openContact.email ||
                            openContact.phone ||
                            t("common.common.empty"),
                        }),
                        _jsx("div", {
                          className: "mt-1 text-xs text-slate-500",
                          children: t("common.contacts.drawer.leadsAndLast", {
                            count: openContact.leadsCount,
                            last: openContact.lastLeadAt
                              ? new Date(
                                  openContact.lastLeadAt,
                                ).toLocaleString()
                              : t("common.common.empty"),
                          }),
                        }),
                      ],
                    }),
                    _jsxs("div", {
                      className: "space-y-4 overflow-y-auto p-6",
                      children: [
                        _jsxs("div", {
                          className:
                            "rounded-xl border border-slate-200 bg-slate-50 p-4",
                          children: [
                            _jsx("div", {
                              className:
                                "mb-2 text-xs font-bold uppercase tracking-wider text-slate-400",
                              children: t(
                                "common.contacts.drawer.contactsSection",
                              ),
                            }),
                            _jsxs("div", {
                              className: "space-y-1 text-sm text-slate-700",
                              children: [
                                _jsxs("div", {
                                  className: "flex items-center gap-2",
                                  children: [
                                    _jsx(Phone, {
                                      size: 16,
                                      className: "text-slate-400",
                                    }),
                                    _jsx("span", {
                                      children:
                                        openContact.phone ||
                                        t("common.common.empty"),
                                    }),
                                  ],
                                }),
                                _jsxs("div", {
                                  className: "flex items-center gap-2",
                                  children: [
                                    _jsx(Mail, {
                                      size: 16,
                                      className: "text-slate-400",
                                    }),
                                    _jsx("span", {
                                      className: "truncate",
                                      children:
                                        openContact.email ||
                                        t("common.common.empty"),
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                        _jsxs("div", {
                          className:
                            "rounded-xl border border-slate-200 bg-slate-50 p-4",
                          children: [
                            _jsx("div", {
                              className:
                                "mb-2 text-xs font-bold uppercase tracking-wider text-slate-400",
                              children: t(
                                "common.contacts.drawer.projectsSection",
                              ),
                            }),
                            _jsx("div", {
                              className: "flex flex-wrap gap-2",
                              children: (openContact.projects ?? []).length
                                ? openContact.projects.map((p) =>
                                    _jsx(
                                      "span",
                                      {
                                        className:
                                          "rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700",
                                        children: p,
                                      },
                                      p,
                                    ),
                                  )
                                : _jsx("span", {
                                    className: "text-sm text-slate-600",
                                    children: t("common.common.empty"),
                                  }),
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                })
              : _jsx("div", {
                  className: "p-6 text-sm text-slate-600",
                  children: t("common.contacts.drawer.notSelected"),
                }),
          }),
        ],
      }),
    ],
  });
}
