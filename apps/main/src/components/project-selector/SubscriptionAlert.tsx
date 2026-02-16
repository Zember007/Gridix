import { Alert, AlertDescription, AlertTitle } from "@gridix/ui";
import { Button } from "@gridix/ui";
import { AlertTriangle } from "lucide-react";

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
  if (!isSubscriptionInactive) return null;

  return (
    <Alert className="m-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-800 dark:text-yellow-200">
        {isOwner
          ? language === "ru"
            ? "Подписка на проект истекла"
            : "Project Subscription Expired"
          : language === "ru"
            ? "Этот проект временно недоступен"
            : "This project is temporarily unavailable"}
      </AlertTitle>
      <AlertDescription className="text-yellow-700 dark:text-yellow-300">
        {isOwner
          ? language === "ru"
            ? 'Для продолжения работы с проектом необходимо продлить подписку. Перейдите в раздел "Подписка" в админ-панели.'
            : 'To continue working with this project, please renew your subscription. Go to the "Subscription" section in the admin panel.'
          : language === "ru"
            ? "Владелец проекта приостановил доступ к проекту. Пожалуйста, свяжитесь с ним для получения дополнительной информации."
            : "The project owner has suspended access to this project. Please contact them for more information."}
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
          {language === "ru" ? "Перейти к подпискам" : "Go to Subscriptions"}
        </Button>
      )}
    </Alert>
  );
};
