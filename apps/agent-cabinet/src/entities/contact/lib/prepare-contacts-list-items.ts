import type { Contact } from "../model/types";

export interface PreparedContactListItem {
  key: string;
  title: string;
  phone: string;
  email: string;
  leadsCount: number;
  projects: string[];
  projectsLabel: string;
  lastLeadAtLabel: string;
  mobileMeta: string;
}

function resolveTitle(contact: Contact, emptyLabel: string) {
  if (contact.name) return contact.name;
  if (contact.email) return contact.email;
  if (contact.phone) return contact.phone;
  return emptyLabel;
}

function resolveMobileMeta(contact: Contact, emptyLabel: string) {
  if (contact.phone) return contact.phone;
  if (contact.email) return contact.email;
  return emptyLabel;
}

function resolveProjectsLabel(projects: string[], emptyLabel: string) {
  if (projects.length === 0) return emptyLabel;
  return projects.join(", ");
}

function resolveLastLeadAtLabel(lastLeadAt: string | null, emptyLabel: string) {
  if (!lastLeadAt) return emptyLabel;
  return new Date(lastLeadAt).toLocaleString();
}

/**
 * Prepares normalized contact items for `ContactsList` rendering.
 * It resolves fallback labels and precomputes display strings,
 * so JSX stays focused on layout only.
 */
export function prepareContactsListItems(
  contacts: Contact[],
  emptyLabel: string,
): PreparedContactListItem[] {
  return contacts.map((contact) => {
    const projects = contact.projects ?? [];

    return {
      key: contact.key,
      title: resolveTitle(contact, emptyLabel),
      phone: contact.phone || emptyLabel,
      email: contact.email || emptyLabel,
      leadsCount: contact.leadsCount,
      projects,
      projectsLabel: resolveProjectsLabel(projects, emptyLabel),
      lastLeadAtLabel: resolveLastLeadAtLabel(contact.lastLeadAt, emptyLabel),
      mobileMeta: resolveMobileMeta(contact, emptyLabel),
    };
  });
}
