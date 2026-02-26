export interface Contact {
  key: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  leadsCount: number;
  lastLeadAt: string | null;
  projects: string[];
}
