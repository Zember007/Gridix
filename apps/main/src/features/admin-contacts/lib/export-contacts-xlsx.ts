import type { TFunction } from "i18next";
import * as XLSX from "xlsx";
import { showToast } from "@gridix/utils/lib";
import { computeXlsxColWidths } from "@/shared/lib/xlsxColWidths";
import type { ContactKind, ContactRow } from "../model/types";

export function exportContactsXLSX(contacts: ContactRow[], t: TFunction) {
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

  const dataRows = contacts.map((c) => {
    const details =
      c.kind === "agent"
        ? `${c.meta?.agentStatus ?? "—"}${c.meta?.agentType ? ` • ${c.meta.agentType}` : ""}`
        : t("admin.contactsPage.detailsLeads", {
            count: c.meta?.leadCount ?? 1,
          });
    const date = c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—";
    return [
      c.name ?? "",
      typeLabel(c.kind),
      c.phone ?? "",
      c.email ?? "",
      details,
      date,
    ];
  });

  const aoa = [headers, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = computeXlsxColWidths(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Contacts");
  XLSX.writeFile(
    wb,
    `contacts_export_${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
  showToast(
    "success",
    t("admin.contactsPage.toastExportDoneTitle"),
    t("admin.contactsPage.toastExportDoneDesc"),
  );
}
