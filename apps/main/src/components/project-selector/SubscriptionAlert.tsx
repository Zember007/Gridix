import { Alert, AlertDescription, AlertTitle } from "@gridix/ui";
import { Button } from "@gridix/ui";
import { AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface SubscriptionAlertProps {
  isSubscriptionInactive: boolean;
  isOwner: boolean;
  language: "ru" | "en" | string;
}

export const SubscriptionAlert = ({
  isSubscriptionInactive,
  isOwner,
  language,
}: SubscriptionAlertProps) => {
  const { t } = useLanguage();

  if (!isSubscriptionInactive) return null;

  return (
    <Alert className="m-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-800 dark:text-yellow-200">
        {isOwner
          ? t("subscription.projectAccessAlert.ownerTitle")
          : t("subscription.projectAccessAlert.guestTitle")}
      </AlertTitle>
      <AlertDescription className="text-yellow-700 dark:text-yellow-300">
        {isOwner
          ? t("subscription.projectAccessAlert.ownerDescription")
          : t("subscription.projectAccessAlert.guestDescription")}
      </AlertDescription>
      {isOwner && (
        <Button
          variant="outline"
          size="sm"
          className="mt-2 border-yellow-600 text-yellow-800 hover:bg-yellow-100"
          onClick={() =>
            (window.location.href = `/${language}/admin#subscription`)
          }
        >
          {t("subscription.projectAccessAlert.cta")}
        </Button>
      )}
    </Alert>
  );
};
