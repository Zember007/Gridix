import { getContactInitials } from "../lib/get-contact-initials";
import type { PreparedContactListItem } from "../lib/prepare-contacts-list-items";

interface Props {
  contacts: PreparedContactListItem[];
  onOpen: (key: string) => void;
}

export function ContactsListMobile({ contacts, onOpen }: Props) {
  return (
    <div className="space-y-3 md:hidden">
      {contacts.map((contact) => (
        <div
          key={contact.key}
          onClick={() => onOpen(contact.key)}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm active:bg-slate-50"
        >
          <div className="mb-2 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white">
                {getContactInitials(contact.title)}
              </div>

              <div className="min-w-0">
                <div className="truncate font-bold text-slate-900">
                  {contact.title}
                </div>
                <div className="truncate text-xs text-slate-500">
                  {contact.mobileMeta}
                </div>
              </div>
            </div>
          </div>

          {contact.projects.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1 border-t border-slate-100 pt-2">
              {contact.projects.slice(0, 4).map((project) => (
                <span
                  key={project}
                  className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600"
                >
                  {project}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
