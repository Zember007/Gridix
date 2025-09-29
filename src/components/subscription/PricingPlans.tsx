import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Check, Crown, Zap } from 'lucide-react';
import { useSubscription } from '../../hooks/useSubscription';
import { cn } from '../../lib/utils';

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
  const [purchaseLinks, setPurchaseLinks] = useState<{basic: PurchaseLink, pro: PurchaseLink} | null>(null);
  const [linksLoading, setLinksLoading] = useState(true);

  useEffect(() => {
    const loadPurchaseLinks = async () => {
      try {
        const links = await getPurchaseLinks();
        setPurchaseLinks(links);
      } catch (error) {
        console.error('Failed to load purchase links:', error);
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
    const link = planSlug === 'basic' ? purchaseLinks?.basic.link : purchaseLinks?.pro.link;
    if ( link) {
      // Create a temporary link element to trigger LemonSqueezy overlay
      (window as any).LemonSqueezy.Url.Open(link);
    }
  };

  const isCurrentPlan = (planSlug: string) => {
    return subscription?.subscription.subscription_plans.slug === planSlug;
  };

  if (loading || linksLoading) {
    return (
      <div className={cn('flex justify-center items-center py-12', className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!purchaseLinks) {
    return (
      <div className={cn('text-center py-12', className)}>
        <p className="text-muted-foreground">Не удалось загрузить тарифные планы</p>
      </div>
    );
  }

  const plans = [
    { slug: 'basic', ...purchaseLinks.basic },
    { slug: 'pro', ...purchaseLinks.pro }
  ];

  return (
    <div className={cn('space-y-8', className)}>
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">Выберите тарифный план</h2>
        <p className="text-muted-foreground text-lg">
          Начните с 14-дневного бесплатного пробного периода Pro
        </p>
      </div>


      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => {
          const isCurrentUserPlan = isCurrentPlan(plan.slug);
          const isPro = plan.slug === 'pro';
          
          return (
            <Card 
              key={plan.slug} 
              className={cn(
                'relative',
                isPro && 'border-primary shadow-lg scale-105',
                isCurrentUserPlan && 'ring-2 ring-primary'
              )}
            >
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    <Crown className="w-3 h-3 mr-1" />
                    Рекомендуется
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center mb-2">
                  {isPro ? (
                    <Zap className="w-6 h-6 text-primary mr-2" />
                  ) : (
                    <div className="w-6 h-6 mr-2" />
                  )}
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                </div>
                
                <div className="space-y-2 pt-4">
                  <div className="text-4xl font-bold">
                    {plan.price}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                <Button
                  className="w-full"
                  variant={isPro ? 'default' : 'outline'}
                  size="lg"
                  disabled={isCurrentUserPlan}
                  onClick={() => handlePlanSelect(plan.slug)}
                >
                  {isCurrentUserPlan ? (
                    'Текущий план'
                  ) : isPro && !subscription ? (
                    'Начать бесплатный пробный период'
                  ) : (
                    'Выбрать план'
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
      
      {/* Trial Information */}
      {!subscription && (
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>14-дневный бесплатный пробный период:</strong> Начните с Pro плана без привязки карты. 
              Вы сможете отменить в любое время до окончания пробного периода.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
