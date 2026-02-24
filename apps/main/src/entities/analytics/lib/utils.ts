import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { AnalyticsData } from "../model/types";

export function truncateLabel(value: string, maxLen: number): string {
  if (value.length <= maxLen) return value;
  return value.substring(0, maxLen) + "...";
}

export function safeNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeAnalyticsResponse(
  raw: Record<string, unknown>,
): AnalyticsData {
  const projectViewsRaw = Array.isArray(raw.projectViews)
    ? raw.projectViews
    : [];
  const leadsRaw = Array.isArray(raw.leads) ? raw.leads : [];
  const topProjectsRaw = Array.isArray(raw.topProjects) ? raw.topProjects : [];
  const topApartmentsRaw = Array.isArray(raw.topApartments)
    ? raw.topApartments
    : [];
  const apartmentStatsRaw = (raw.apartmentStats ?? {}) as Record<
    string,
    unknown
  >;

  const viewsByIso = new Map<string, number>();
  projectViewsRaw.forEach((p) => {
    const row = p as Record<string, unknown>;
    const iso = typeof row.date === "string" ? row.date : null;
    if (!iso) return;
    viewsByIso.set(iso, safeNumber(row.views));
  });

  const leadsByIso = new Map<string, number>();
  leadsRaw.forEach((p) => {
    const row = p as Record<string, unknown>;
    const iso = typeof row.date === "string" ? row.date : null;
    if (!iso) return;
    leadsByIso.set(iso, safeNumber(row.leads));
  });

  const allIsoDates = Array.from(
    new Set([...viewsByIso.keys(), ...leadsByIso.keys()]),
  ).sort();

  return {
    projectViews: allIsoDates.map((iso) => ({
      date: format(new Date(iso), "dd.MM", { locale: ru }),
      views: viewsByIso.get(iso) || 0,
    })),
    leads: allIsoDates.map((iso) => ({
      date: format(new Date(iso), "dd.MM", { locale: ru }),
      leads: leadsByIso.get(iso) || 0,
    })),
    topProjects: topProjectsRaw.map((p) => {
      const row = p as Record<string, unknown>;
      const name = typeof row.name === "string" ? row.name : "Unknown";
      return {
        name: truncateLabel(name, 20),
        views: safeNumber(row.views),
        leads: safeNumber(row.leads),
      };
    }),
    topApartments: topApartmentsRaw.map((p) => {
      const row = p as Record<string, unknown>;
      const apt =
        typeof row.apartment_number === "string" ? row.apartment_number : "";
      const projectName =
        typeof row.project_name === "string" ? row.project_name : "Unknown";
      return {
        apartment_number: apt,
        project_name: truncateLabel(projectName, 20),
        views: safeNumber(row.views),
      };
    }),
    apartmentStats: {
      available: safeNumber(apartmentStatsRaw.available),
      sold: safeNumber(apartmentStatsRaw.sold),
      reserved: safeNumber(apartmentStatsRaw.reserved),
      total: safeNumber(apartmentStatsRaw.total),
    },
    conversionRate: safeNumber(raw.conversionRate),
    totalViews: safeNumber(raw.totalViews),
    totalLeads: safeNumber(raw.totalLeads),
  };
}
