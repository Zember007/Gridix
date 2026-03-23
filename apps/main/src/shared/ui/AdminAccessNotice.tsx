import { Alert, AlertDescription, AlertTitle, Button } from "@gridix/ui";
import { AlertTriangle, Crown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLanguageNavigation } from "@gridix/utils/react";

type AdminAccessNoticeVariant = "subscription" | "pro";

interface AdminAccessNoticeProps {
  variant: AdminAccessNoticeVariant;
  className?: string;
}

const COPY = {
  subscription: {
    ru: {
      title: "Нет активных проектов",
      description:
        "Активируйте подписку хотя бы на один проект, чтобы открыть этот раздел.",
      cta: "Открыть подписки",
    },
    en: {
      title: "No active projects",
      description:
        "Activate a subscription for at least one project to unlock this section.",
      cta: "Open subscriptions",
    },
  },
  pro: {
    ru: {
      title: "Доступно на тарифе Pro",
      description:
        "Для этой функции нужен хотя бы один активный проект с тарифом Pro.",
      cta: "Перейти к тарифам",
    },
    en: {
      title: "Available on Pro",
      description:
        "This feature requires at least one active project on the Pro plan.",
      cta: "View plans",
    },
  },
} as const;

export function AdminAccessNotice({
  variant,
  className,
}: AdminAccessNoticeProps) {
  const { language } = useLanguage();
  const { navigate } = useLanguageNavigation();
  const locale = language === "ru" ? "ru" : "en";
  const copy = COPY[variant][locale];

  return (
    <Alert className={className}>
      {variant === "pro" ? (
        <Crown className="h-4 w-4" />
      ) : (
        <AlertTriangle className="h-4 w-4" />
      )}
      <AlertTitle>{copy.title}</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p>{copy.description}</p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate("/admin?page=subscription")}
        >
          {copy.cta}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
