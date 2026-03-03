export type ContactKind = "lead" | "agent";

export interface ContactRow {
  id: string;
  kind: ContactKind;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: string | null;
  meta?: {
    leadCount?: number;
    agentStatus?: string | null;
    agentType?: string | null;
  };
}
