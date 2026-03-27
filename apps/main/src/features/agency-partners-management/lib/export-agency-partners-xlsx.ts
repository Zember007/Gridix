import type { TFunction } from "i18next";
import * as XLSX from "xlsx";
import { showToast } from "@gridix/utils/lib";
import type { AgencyPartner } from "@/entities/agency-partner";
import { computeXlsxColWidths } from "@/shared/lib/xlsxColWidths";

function formatBankDetailsCell(partner: AgencyPartner): string {
  const summary = [partner.bankDetails?.bank_name, partner.bankDetails?.iban]
    .filter((item): item is string => Boolean(item?.trim()))
    .join(" • ");
  return summary || (partner.bankDetails?.details?.trim() ?? "");
}

export function exportAgencyPartnersXLSX(
  partners: AgencyPartner[],
  t: TFunction,
) {
  if (partners.length === 0) {
    showToast(
      "info",
      t("partners.agencyExport.toastNothingToExportTitle"),
      t("partners.agencyExport.toastNothingToExportDesc"),
    );
    return;
  }

  const headers = [
    t("partners.agencyExport.colName"),
    t("partners.agencyExport.colEmail"),
    t("partners.agencyExport.colBankDetails"),
    t("partners.agencyExport.colPhone"),
    t("partners.agencyExport.colMode"),
  ];

  const modeValue = t("partners.agencyExport.modeValue");

  const dataRows = partners.map((p) => [
    p.name ?? "",
    p.email ?? "",
    formatBankDetailsCell(p),
    p.phone ?? "",
    modeValue,
  ]);

  const aoa = [headers, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = computeXlsxColWidths(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Partners");
  XLSX.writeFile(
    wb,
    `agency_partners_export_${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
  showToast(
    "success",
    t("partners.agencyExport.toastExportDoneTitle"),
    t("partners.agencyExport.toastExportDoneDesc"),
  );
}
