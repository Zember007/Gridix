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

type ExportLeadsCsvParams = {
  leads: ExportLead[];
  funnelStages: Stage[];
};

export const exportLeadsCsv = ({
  leads,
  funnelStages,
}: ExportLeadsCsvParams) => {
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

  const rows = leads.map((lead) => {
    const statusName =
      funnelStages.find((stage) => stage.id === lead.status)?.name ||
      lead.status ||
      "";
    const safeName = lead.name.replace(/"/g, '""');
    const safeProject = lead.project.replace(/"/g, '""');

    return `"${lead.id}","${safeName}","${lead.phone}","${safeProject}",${lead.price || 0},"${statusName}","${lead.source || ""}","${lead.date}"`;
  });

  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `leads_export_${new Date().toISOString().slice(0, 10)}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
