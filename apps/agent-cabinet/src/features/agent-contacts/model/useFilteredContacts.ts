import { useMemo } from "react";
import type { Contact } from "@/entities/contact";

export function useFilteredContacts(
  contacts: Contact[] | undefined,
  searchQuery: string,
) {
  return useMemo(() => {
    const rows = contacts ?? [];
    const value = searchQuery.trim().toLowerCase();
    if (!value) return rows;

    return rows.filter((contact) => {
      const name = String(contact.name ?? "").toLowerCase();
      const email = String(contact.email ?? "").toLowerCase();
      const phone = String(contact.phone ?? "").toLowerCase();
      const projects = (contact.projects ?? []).join(" ").toLowerCase();
      return (
        name.includes(value) ||
        email.includes(value) ||
        phone.includes(value) ||
        projects.includes(value)
      );
    });
  }, [contacts, searchQuery]);
}
