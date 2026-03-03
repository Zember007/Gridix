import { useTranslation } from "react-i18next";
import { Building2, FileDown, Search, User } from "lucide-react";
import { Input, Button } from "@gridix/ui";
import { useContactsList } from "../hooks/useContactsList";
import { exportContactsCSV } from "../lib/export-contacts-csv";

export function AdminContactsPanel() {
  const { t } = useTranslation();
  const { contacts, isLoading, query, setQuery, kindFilter, setKindFilter } =
    useContactsList();

  const handleExportCSV = () => exportContactsCSV(contacts, t);

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {t("admin.contactsPage.title")}
          </h2>
          <p className="text-sm text-slate-500">
            {t("admin.contactsPage.description")}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          disabled={isLoading || contacts.length === 0}
          className="shrink-0 gap-2"
        >
          <FileDown size={16} />
          {t("admin.contactsPage.exportBtn")}
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center">
          <div className="relative max-w-xl flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <Input
              placeholder={t("admin.contactsPage.searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 border-slate-200 bg-slate-50 pl-10"
            />
          </div>

          <div className="flex gap-2">
            {(
              [
                { id: "all", labelKey: "admin.contactsPage.filterAll" },
                { id: "lead", labelKey: "admin.contactsPage.filterClients" },
                { id: "agent", labelKey: "admin.contactsPage.filterAgents" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setKindFilter(opt.id)}
                className={`h-10 rounded-lg border px-3 text-sm font-bold transition-colors ${
                  kindFilter === opt.id
                    ? "border-[var(--admin-primary)] bg-[var(--admin-primary)] text-[var(--admin-text-on-primary)]"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {t(opt.labelKey)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">
                  {t("admin.contactsPage.tableContact")}
                </th>
                <th className="px-6 py-4">
                  {t("admin.contactsPage.tableType")}
                </th>
                <th className="px-6 py-4">
                  {t("admin.contactsPage.tablePhone")}
                </th>
                <th className="px-6 py-4">
                  {t("admin.contactsPage.tableEmail")}
                </th>
                <th className="px-6 py-4 text-right">
                  {t("admin.contactsPage.tableDetails")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-slate-400"
                  >
                    {t("admin.contactsPage.loading")}
                  </td>
                </tr>
              )}

              {!isLoading && contacts.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-slate-400"
                  >
                    {t("admin.contactsPage.noContacts")}
                  </td>
                </tr>
              )}

              {!isLoading &&
                contacts.map((c) => {
                  const icon =
                    c.kind === "agent" ? (
                      <Building2 size={18} className="text-purple-600" />
                    ) : (
                      <User size={18} className="text-[var(--admin-primary)]" />
                    );

                  const typeLabel =
                    c.kind === "agent"
                      ? t("admin.contactsPage.typeAgent")
                      : t("admin.contactsPage.typeClient");
                  const details =
                    c.kind === "agent"
                      ? `${c.meta?.agentStatus ?? "—"}${c.meta?.agentType ? ` • ${c.meta.agentType}` : ""}`
                      : t("admin.contactsPage.detailsLeads", {
                          count: c.meta?.leadCount ?? 1,
                        });

                  return (
                    <tr
                      key={`${c.kind}:${c.id}`}
                      className="transition-colors hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                            {icon}
                          </div>
                          <div className="min-w-0">
                            <div className="max-w-[280px] truncate text-sm font-bold text-slate-900">
                              {c.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {c.createdAt
                                ? new Date(c.createdAt).toLocaleDateString()
                                : "—"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${
                            c.kind === "agent"
                              ? "border-purple-100 bg-purple-50 text-purple-700"
                              : "border-[var(--admin-border)] bg-[var(--admin-background-secondary)] text-[var(--admin-text-secondary)]"
                          }`}
                        >
                          {typeLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {c.phone || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {c.email || "—"}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-sm text-slate-700">
                        {details}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
