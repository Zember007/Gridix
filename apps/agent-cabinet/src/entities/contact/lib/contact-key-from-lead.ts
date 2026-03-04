import type { LeadRow } from "../model/types";

/**
 * Generates a stable contact key from a raw lead row.
 * Priority: normalized email -> phone -> lead id -> random UUID.
 */
export function contactKeyFromLead(lead: LeadRow): string {
  const email =
    typeof lead.email === "string" ? lead.email.trim().toLowerCase() : "";
  if (email) return `email:${email}`;

  const phone = typeof lead.phone === "string" ? lead.phone.trim() : "";
  if (phone) return `phone:${phone}`;

  const id = typeof lead.id === "string" ? lead.id : "";
  return id ? `lead:${id}` : crypto.randomUUID();
}
