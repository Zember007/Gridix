import { Mail, Phone } from "lucide-react";
import { SheetContent } from "@gridix/ui";
import type { Contact } from "../model/types";

interface Props {
  contact: Contact | null;
  t: (key: string, vars?: unknown) => string;
}

export function ContactDetailsSheet({ contact, t }: Props) {
  const emptyLabel = t("common.common.empty");

  if (!contact) {
    return (
      <SheetContent side="right" className="w-full p-0 sm:w-[520px]">
        <div className="p-6 text-sm text-slate-600">
          {t("common.contacts.drawer.notSelected")}
        </div>
      </SheetContent>
    );
  }

  const displayName =
    contact.name || contact.email || contact.phone || emptyLabel;
  const lastLeadAtLabel = contact.lastLeadAt
    ? new Date(contact.lastLeadAt).toLocaleString()
    : emptyLabel;
  const projects = contact.projects ?? [];
  const projectsContent =
    projects.length > 0 ? (
      projects.map((project) => (
        <span
          key={project}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700"
        >
          {project}
        </span>
      ))
    ) : (
      <span className="text-sm text-slate-600">{emptyLabel}</span>
    );

  return (
    <SheetContent side="right" className="w-full p-0 sm:w-[520px]">
      <div className="flex h-full flex-col bg-white">
        <div className="border-b border-slate-100 p-6">
          <div className="text-lg font-black text-slate-900">{displayName}</div>
          <div className="mt-1 text-xs text-slate-500">
            {t("common.contacts.drawer.leadsAndLast", {
              count: contact.leadsCount,
              last: lastLeadAtLabel,
            })}
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto p-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              {t("common.contacts.drawer.contactsSection")}
            </div>
            <div className="space-y-1 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-slate-400" />
                <span>{contact.phone || emptyLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-slate-400" />
                <span className="truncate">{contact.email || emptyLabel}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              {t("common.contacts.drawer.projectsSection")}
            </div>
            <div className="flex flex-wrap gap-2">{projectsContent}</div>
          </div>
        </div>
      </div>
    </SheetContent>
  );
}
