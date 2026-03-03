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
  const subtitle = selected
    ? t("common.contacts.subtitleWithWorkspace", {
        count: filtered.length,
        workspace: selected.label,
      })
    : t("common.contacts.subtitle", { count: filtered.length });

  let content;
  if (!activeWorkspaceId) {
    content = <EmptyState message={t("common.workspace.pickInSidebar")} />;
  } else if (contactsQuery.isLoading) {
    content = <LoadingState message={t("common.common.loading")} />;
  } else if (filtered.length === 0) {
    content = <EmptyState message={t("common.contacts.notFound")} />;
  } else {
    content = (
      <ContactsList
        contacts={filtered}
        t={t}
        onOpen={(key) => setOpenContactKey(key)}
      />
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <ModuleHeader
        title={t("common.contacts.title")}
        subtitle={subtitle}
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
          <div className="mx-auto max-w-[1600px] pb-20">{content}</div>
        </div>

        <ContactDetailsSheet contact={openedContact} t={translate} />
      </Sheet>
    </div>
  );
}
