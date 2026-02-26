import { Mail, Phone } from "lucide-react";
import type { Contact } from "../model/types";
import { initials } from "../lib/contactMappers";

interface Props {
  contacts: Contact[];
  t: (key: string) => string;
  onOpen: (key: string) => void;
}

export function ContactsList({ contacts, t, onOpen }: Props) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {t("common.contacts.columns.contact")}
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {contacts.map((c) => {
            const title =
              c.name || c.email || c.phone || t("common.common.empty");
            return (
              <button
                key={c.key}
                type="button"
                className="flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-slate-50"
                onClick={() => onOpen(c.key)}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white">
                    {initials(String(title))}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-bold text-slate-900">
                      {title}
                    </div>
                    <div className="flex flex-col gap-1 text-xs text-slate-500 lg:flex-row lg:items-center lg:gap-3">
                      <span className="inline-flex min-w-0 items-center gap-1">
                        <Phone size={14} className="shrink-0 text-slate-400" />
                        <span className="truncate">
                          {c.phone || t("common.common.empty")}
                        </span>
                      </span>
                      <span className="inline-flex min-w-0 items-center gap-1">
                        <Mail size={14} className="shrink-0 text-slate-400" />
                        <span className="truncate">
                          {c.email || t("common.common.empty")}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-10 shrink-0 text-center text-xs tabular-nums text-slate-600 xl:w-14">
                  {c.leadsCount}
                </div>
                <div className="hidden w-40 shrink-0 truncate text-left text-xs text-slate-600 xl:block 2xl:w-56">
                  {(c.projects ?? []).length
                    ? c.projects.join(", ")
                    : t("common.common.empty")}
                </div>
                <div className="w-28 shrink-0 truncate text-left text-xs tabular-nums text-slate-500 xl:w-36">
                  {c.lastLeadAt
                    ? new Date(c.lastLeadAt).toLocaleString()
                    : t("common.common.empty")}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {contacts.map((c) => {
          const title =
            c.name || c.email || c.phone || t("common.common.empty");
          return (
            <div
              key={c.key}
              onClick={() => onOpen(c.key)}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm active:bg-slate-50"
            >
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white">
                    {initials(String(title))}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-bold text-slate-900">
                      {title}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {c.phone || c.email || t("common.common.empty")}
                    </div>
                  </div>
                </div>
              </div>
              {(c.projects ?? []).length ? (
                <div className="mt-2 flex flex-wrap gap-1 border-t border-slate-100 pt-2">
                  {c.projects.slice(0, 4).map((p) => (
                    <span
                      key={p}
                      className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
}
