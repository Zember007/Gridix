import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@gridix/ui";
import { Button } from "@gridix/ui";
import { Badge } from "@gridix/ui";
import { Check, Crown, Zap } from "lucide-react";
import { useSubscription } from "@/entities/subscription/queries/useSubscription";
import { cn } from "@gridix/utils/lib";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spinner } from "@/shared/ui/Spinner";

declare global {
  interface Window {
    LemonSqueezy?: {
      Url?: {
        Open: (link: string) => void;
      };
    };
  }
}

interface PricingPlansProps {
  className?: string;
  onPlanSelect?: (planSlug: string) => void;
}

interface PurchaseLink {
  name: string;
  price: string;
  link: string;
  features: string[];
}

export function PricingPlans({ className, onPlanSelect }: PricingPlansProps) {
  const { subscription, loading, getPurchaseLinks } = useSubscription();
  const [purchaseLinks, setPurchaseLinks] = useState<{
    basic: PurchaseLink;
    pro: PurchaseLink;
  } | null>(null);
  const [linksLoading, setLinksLoading] = useState(true);
  const { language } = useLanguage();

  const t = {
    ru: {
      title: "Выберите тарифный план",
      recommended: "Рекомендуется",
      currentPlan: "Текущий план",
      choosePlan: "Выбрать план",
    },
    en: {
      title: "Choose your plan",
      recommended: "Recommended",
      currentPlan: "Current plan",
      choosePlan: "Choose plan",
    },
    ka: {
      title: "აირჩიეთ ტარიფი",
      recommended: "რეკომენდებულია",
      currentPlan: "მიმდინარე გეგმა",
      choosePlan: "გეგმის არჩევა",
    },
    ar: {
      title: "اختر خطتك",
      recommended: "موصى به",
      currentPlan: "الخطة الحالية",
      choosePlan: "اختر الخطة",
    },
  } as const;

  const langKey = (language in t ? language : "en") as keyof typeof t;

  useEffect(() => {
    const loadPurchaseLinks = async () => {
      try {
        const links = await getPurchaseLinks();
        setPurchaseLinks(links);
      } catch (error) {
        console.error("Failed to load purchase links:", error);
      } finally {
        setLinksLoading(false);
      }
    };

    loadPurchaseLinks();
  }, [getPurchaseLinks]);

  const handlePlanSelect = (planSlug: string) => {
    if (onPlanSelect) {
      onPlanSelect(planSlug);
      return;
    }

    // Find the purchase link for this plan
    const link =
      planSlug === "basic"
        ? purchaseLinks?.basic.link
        : purchaseLinks?.pro.link;
    if (link) {
      window.LemonSqueezy?.Url?.Open(link);
    }
  };

  const isCurrentPlan = (planSlug: string) => {
    if (!subscription) return false;

    // Check if it's the current active plan
    return (
      subscription.subscription.subscription_plans.slug === planSlug &&
      ["active", "trialing"].includes(subscription.subscription.status)
    );
  };

  if (loading || linksLoading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <Spinner size="md" />
      </div>
    );
  }

  if (!purchaseLinks) {
    return (
      <div className={cn("py-12 text-center", className)}>
        <p className="text-muted-foreground">
          Не удалось загрузить тарифные планы
        </p>
      </div>
    );
  }

  const plans = [
    { slug: "basic", ...purchaseLinks.basic },
    { slug: "pro", ...purchaseLinks.pro },
  ];

  return (
    <div className={cn("space-y-8", className)}>
      {/* Header */}
      <div className="space-y-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight">
          {t[langKey].title}
        </h2>
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
        {plans.map((plan) => {
          const isCurrentUserPlan = isCurrentPlan(plan.slug);
          const isPro = plan.slug === "pro";

          return (
            <Card
              key={plan.slug}
              className={cn(
                "relative",
                isPro && "scale-105 border-primary shadow-lg",
                isCurrentUserPlan && "ring-2 ring-primary",
              )}
            >
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary px-3 py-1 text-primary-foreground">
                    <Crown className="mr-1 h-3 w-3" />
                    {t[langKey].recommended}
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4 text-center">
                <div className="mb-2 flex items-center justify-center">
                  {isPro ? (
                    <Zap className="mr-2 h-6 w-6 text-primary" />
                  ) : (
                    <div className="mr-2 h-6 w-6" />
                  )}
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                </div>

                <div className="space-y-2 pt-4">
                  <div className="text-4xl font-bold">{plan.price}</div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={isPro ? "default" : "outline"}
                  size="lg"
                  disabled={isCurrentUserPlan}
                  onClick={() => handlePlanSelect(plan.slug)}
                >
                  {isCurrentUserPlan
                    ? t[langKey].currentPlan
                    : t[langKey].choosePlan}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
