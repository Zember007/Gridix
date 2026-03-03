import { useMemo } from "react";
import { useIsMobile } from "@gridix/ui";
import type { Contact } from "../model/types";
import { prepareContactsListItems } from "../lib/prepare-contacts-list-items";
import { ContactsListDesktop } from "./ContactsListDesktop";
import { ContactsListMobile } from "./ContactsListMobile";

interface Props {
  contacts: Contact[];
  t: (key: string) => string;
  onOpen: (key: string) => void;
}

export function ContactsList({ contacts, t, onOpen }: Props) {
  const isMobile = useIsMobile();
  const emptyLabel = t("common.common.empty");
  const desktopTitle = t("common.contacts.columns.contact");

  const preparedContacts = useMemo(
    () => prepareContactsListItems(contacts, emptyLabel),
    [contacts, emptyLabel],
  );

  return isMobile ? (
    <ContactsListMobile contacts={preparedContacts} onOpen={onOpen} />
  ) : (
    <ContactsListDesktop
      contacts={preparedContacts}
      onOpen={onOpen}
      title={desktopTitle}
    />
  );
}
