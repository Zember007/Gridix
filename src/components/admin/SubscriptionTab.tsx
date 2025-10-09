import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { EnhancedPricingPlans } from '@/components/subscription/EnhancedPricingPlans';
import { SubscriptionManager } from '@/components/subscription/SubscriptionManager';
import { useSubscription } from '@/hooks/useSubscription';
import { useLanguage } from '@/contexts/LanguageContext';
import { Crown, CreditCard } from 'lucide-react';
 
export default function SubscriptionTab() {
  const { subscription, loading } = useSubscription();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if subscription is active - includes cancelled subscriptions that are still in their paid period
  const hasActiveSubscription = subscription && 
    (['active', 'trialing'].includes(subscription.subscription.status) || 
    (subscription.subscription.cancel_at_period_end && 
     subscription.subscription.current_period_end && 
     new Date(subscription.subscription.current_period_end) > new Date()));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight flex items-center justify-center gap-2">
          <Crown className="w-8 h-8 text-yellow-500" />
          {t('subscription.title')}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t('subscription.subtitle')}
        </p>
      </div>

      {hasActiveSubscription ? (
        <Tabs defaultValue="subscription" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              {t('subscription.mySubscription')}
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              {t('subscription.plans')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subscription" className="mt-8">
            <SubscriptionManager />
          </TabsContent>

          <TabsContent value="plans" className="mt-8">
            <EnhancedPricingPlans showHeader={false} requireAuth={true} />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-8">
          {/* Trial Expired or Subscription Expired */}
          {(subscription?.subscription.status === 'trial_expired' || 
            subscription?.subscription.status === 'expired') && (
            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <Crown className="w-5 h-5" />
                  {subscription.subscription.status === 'trial_expired' 
                    ? t('subscription.trialExpired') 
                    : t('subscription.subscriptionExpired')}
                </CardTitle>
                <CardDescription className="text-yellow-700 dark:text-yellow-300">
                  {subscription.subscription.status === 'trial_expired' 
                    ? t('subscription.trialExpiredDesc')
                    : t('subscription.subscriptionExpiredDesc')}
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          <EnhancedPricingPlans showHeader={false} requireAuth={true} />
        </div>
      )}

      {/* FAQ Section */}
      <div className="mt-16 space-y-8">
        <h2 className="text-2xl font-bold text-center">{t('subscription.faqTitle')}</h2>
        
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('subscription.faq1Title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t('subscription.faq1Text')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('subscription.faq2Title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t('subscription.faq2Text')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('subscription.faq3Title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t('subscription.faq3Text')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('subscription.faq4Title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t('subscription.faq4Text')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
