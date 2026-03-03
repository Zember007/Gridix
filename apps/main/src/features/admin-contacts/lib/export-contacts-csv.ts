import type { TFunction } from "i18next";
import { showToast } from "@gridix/utils/lib";
import type { ContactKind, ContactRow } from "../model/types";

export function exportContactsCSV(contacts: ContactRow[], t: TFunction) {
  if (contacts.length === 0) {
    showToast(
      "info",
      t("admin.contactsPage.toastNothingToExportTitle"),
      t("admin.contactsPage.toastNothingToExportDesc"),
    );
    return;
  }

  const headers = [
    t("admin.contactsPage.tableContact"),
    t("admin.contactsPage.tableType"),
    t("admin.contactsPage.tablePhone"),
    t("admin.contactsPage.tableEmail"),
    t("admin.contactsPage.tableDetails"),
    t("admin.contactsPage.tableDate"),
  ];

  const typeLabel = (kind: ContactKind) =>
    kind === "agent"
      ? t("admin.contactsPage.typeAgent")
      : t("admin.contactsPage.typeClient");

  const rows = contacts.map((c) => {
    const safeName = (c.name || "").replace(/"/g, '""');
    const details =
      c.kind === "agent"
        ? `${c.meta?.agentStatus ?? "—"}${c.meta?.agentType ? ` • ${c.meta.agentType}` : ""}`
        : t("admin.contactsPage.detailsLeads", {
            count: c.meta?.leadCount ?? 1,
          });
    const date = c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—";
    return `"${safeName}","${typeLabel(c.kind)}","${(c.phone ?? "").replace(/"/g, '""')}","${(c.email ?? "").replace(/"/g, '""')}","${details.replace(/"/g, '""')}","${date}"`;
  });

  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `contacts_export_${new Date().toISOString().slice(0, 10)}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast(
    "success",
    t("admin.contactsPage.toastExportDoneTitle"),
    t("admin.contactsPage.toastExportDoneDesc"),
  );
}
