import * as XLSX from "xlsx";

type ExportLead = {
  id: string;
  name: string;
  phone: string;
  project: string;
  price?: number | null;
  status: string | null;
  source: string | null;
  date: string;
};

type Stage = {
  id: string;
  name: string;
};

type ExportLeadsXlsxParams = {
  leads: ExportLead[];
  funnelStages: Stage[];
};

export const exportLeadsXlsx = ({
  leads,
  funnelStages,
}: ExportLeadsXlsxParams) => {
  const headers = [
    "ID",
    "Name",
    "Phone",
    "Project",
    "Price",
    "Status",
    "Source",
    "Date",
  ];

  const dataRows = leads.map((lead) => {
    const statusName =
      funnelStages.find((stage) => stage.id === lead.status)?.name ||
      lead.status ||
      "";
    return [
      lead.id,
      lead.name,
      lead.phone,
      lead.project,
      lead.price ?? 0,
      statusName,
      lead.source ?? "",
      lead.date,
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Leads");
  XLSX.writeFile(
    wb,
    `leads_export_${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
};
