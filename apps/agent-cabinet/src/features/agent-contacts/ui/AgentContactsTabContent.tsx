import { useCallback, useMemo, useState } from "react";
import { useWorkspace } from "@gridix/utils/react";
import { Sheet } from "@gridix/ui";
import { ModuleHeader } from "@/shared/ui/ModuleHeader";
import { useLanguage } from "@/shared/lib/language";
import { ContactDetailsSheet, ContactsList } from "@/entities/contact";
import { EmptyState } from "@/shared/ui/EmptyState";
import { LoadingState } from "@/shared/ui/LoadingState";
import { useAgentContactsQuery } from "../model/useAgentContactsQuery";
import { useFilteredContacts } from "../model/useFilteredContacts";

export function AgentContactsTabContent() {
  const { t } = useLanguage();
  const { activeWorkspaceId, availableWorkspaces } = useWorkspace();
  const selected =
    availableWorkspaces.find(
      (workspace) => workspace.id === activeWorkspaceId,
    ) ?? null;
  const [searchQuery, setSearchQuery] = useState("");
  const [openContactKey, setOpenContactKey] = useState<string | null>(null);

  const contactsQuery = useAgentContactsQuery(activeWorkspaceId);
  const filtered = useFilteredContacts(contactsQuery.data, searchQuery);

  const openedContact = useMemo(
    () =>
      openContactKey
        ? (filtered.find((contact) => contact.key === openContactKey) ?? null)
        : null,
    [filtered, openContactKey],
  );
  const translate = useCallback(
    (key: string, vars?: unknown) => String(t(key, vars as never)),
    [t],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <ModuleHeader
        title={t("common.contacts.title")}
        subtitle={
          selected
            ? t("common.contacts.subtitleWithWorkspace", {
                count: filtered.length,
                workspace: selected.label,
              })
            : t("common.contacts.subtitle", { count: filtered.length })
        }
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t("common.contacts.searchPlaceholder")}
      />

      <Sheet
        open={!!openContactKey}
        onOpenChange={(isOpen) =>
          setOpenContactKey(isOpen ? openContactKey : null)
        }
      >
        <div className="custom-scrollbar relative flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
          <div className="mx-auto max-w-[1600px] pb-20">
            {!activeWorkspaceId ? (
              <EmptyState message={t("common.workspace.pickInSidebar")} />
            ) : contactsQuery.isLoading ? (
              <LoadingState message={t("common.common.loading")} />
            ) : filtered.length === 0 ? (
              <EmptyState message={t("common.contacts.notFound")} />
            ) : (
              <ContactsList
                contacts={filtered}
                t={t}
                onOpen={(key) => setOpenContactKey(key)}
              />
            )}
          </div>
        </div>

        <ContactDetailsSheet contact={openedContact} t={translate} />
      </Sheet>
    </div>
  );
}
