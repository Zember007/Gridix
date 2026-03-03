export interface Contact {
  key: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  leadsCount: number;
  lastLeadAt: string | null;
  projects: string[];
}

export interface LeadRow {
  email?: unknown;
  phone?: unknown;
  id?: unknown;
  name?: unknown;
  created_at?: unknown;
  projects?: { name?: unknown };
}
