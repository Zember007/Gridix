import { Mail, Phone } from "lucide-react";
import { getContactInitials } from "../lib/get-contact-initials";
import type { PreparedContactListItem } from "../lib/prepare-contacts-list-items";

interface Props {
  contacts: PreparedContactListItem[];
  onOpen: (key: string) => void;
  title: string;
}

export function ContactsListDesktop({ contacts, onOpen, title }: Props) {
  return (
    <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
      <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {title}
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {contacts.map((contact) => (
          <button
            key={contact.key}
            type="button"
            className="flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-slate-50"
            onClick={() => onOpen(contact.key)}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white">
                {getContactInitials(contact.title)}
              </div>

              <div className="min-w-0">
                <div className="truncate font-bold text-slate-900">
                  {contact.title}
                </div>
                <div className="flex flex-col gap-1 text-xs text-slate-500 lg:flex-row lg:items-center lg:gap-3">
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <Phone size={14} className="shrink-0 text-slate-400" />
                    <span className="truncate">{contact.phone}</span>
                  </span>

                  <span className="inline-flex min-w-0 items-center gap-1">
                    <Mail size={14} className="shrink-0 text-slate-400" />
                    <span className="truncate">{contact.email}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="w-10 shrink-0 text-center text-xs tabular-nums text-slate-600 xl:w-14">
              {contact.leadsCount}
            </div>
            <div className="hidden w-40 shrink-0 truncate text-left text-xs text-slate-600 xl:block 2xl:w-56">
              {contact.projectsLabel}
            </div>
            <div className="w-28 shrink-0 truncate text-left text-xs tabular-nums text-slate-500 xl:w-36">
              {contact.lastLeadAtLabel}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
