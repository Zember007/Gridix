import type { Contact, LeadRow } from "../model/types";
import { contactKeyFromLead } from "./contact-key-from-lead";

/**
 * Aggregates raw lead rows into unique contacts grouped by contact key.
 * Keeps counters, latest lead date and unique project names per contact.
 */
export function aggregateContacts(leads: LeadRow[]): Contact[] {
  const map = new Map<string, Contact>();

  for (const row of leads) {
    const key = contactKeyFromLead(row);
    const prev = map.get(key);
    const email = typeof row.email === "string" ? row.email : null;
    const phone = typeof row.phone === "string" ? row.phone : null;
    const name = typeof row.name === "string" ? row.name : null;
    const createdAt =
      typeof row.created_at === "string" ? row.created_at : null;
    const projName =
      typeof row.projects?.name === "string" ? String(row.projects.name) : null;

    if (!prev) {
      map.set(key, {
        key,
        name,
        email,
        phone,
        leadsCount: 1,
        lastLeadAt: createdAt,
        projects: projName ? [projName] : [],
      });
      continue;
    }

    prev.leadsCount += 1;
    if (!prev.name && name) prev.name = name;
    if (!prev.email && email) prev.email = email;
    if (!prev.phone && phone) prev.phone = phone;
    if (createdAt && (!prev.lastLeadAt || createdAt > prev.lastLeadAt)) {
      prev.lastLeadAt = createdAt;
    }
    if (projName && !prev.projects.includes(projName)) {
      prev.projects.push(projName);
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    String(b.lastLeadAt ?? "").localeCompare(String(a.lastLeadAt ?? "")),
  );
}
