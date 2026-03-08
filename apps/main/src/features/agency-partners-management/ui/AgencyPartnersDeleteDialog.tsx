import React from "react";
import type { AgencyPartner } from "@/entities/agency-partner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@gridix/ui";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  partnerToDelete: AgencyPartner | null;
  setPartnerToDelete: (partner: AgencyPartner | null) => void;
  deletePartner: (partnerId: string) => Promise<void>;
};

export const AgencyPartnersDeleteDialog: React.FC<Props> = ({
  partnerToDelete,
  setPartnerToDelete,
  deletePartner,
}) => {
  const { t } = useLanguage();

  return (
    <AlertDialog
      open={!!partnerToDelete}
      onOpenChange={(open) => !open && setPartnerToDelete(null)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("partners.actions.deleteConfirmTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("partners.actions.deleteConfirmDescription", {
              name: partnerToDelete?.name,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("partners.actions.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
              if (partnerToDelete) {
                await deletePartner(partnerToDelete.id);
                setPartnerToDelete(null);
              }
            }}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {t("partners.actions.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
