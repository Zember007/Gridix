import type { Contact } from "../model/types";

interface LeadRow {
  email?: unknown;
  phone?: unknown;
  id?: unknown;
  name?: unknown;
  created_at?: unknown;
  projects?: { name?: unknown };
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function contactKeyFromLead(lead: LeadRow): string {
  const email =
    typeof lead.email === "string" ? lead.email.trim().toLowerCase() : "";
  if (email) return `email:${email}`;
  const phone = typeof lead.phone === "string" ? lead.phone.trim() : "";
  if (phone) return `phone:${phone}`;
  const id = typeof lead.id === "string" ? lead.id : "";
  return id ? `lead:${id}` : crypto.randomUUID();
}

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
    if (projName && !prev.projects.includes(projName))
      prev.projects.push(projName);
  }

  return Array.from(map.values()).sort((a, b) =>
    String(b.lastLeadAt ?? "").localeCompare(String(a.lastLeadAt ?? "")),
  );
}
