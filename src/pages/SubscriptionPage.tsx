import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { PricingPlans } from '../components/subscription/PricingPlans';
import { SubscriptionManager } from '../components/subscription/SubscriptionManager';
import { useSubscription } from '../hooks/useSubscription';
import { Crown, CreditCard } from 'lucide-react';

export default function SubscriptionPage() {
  const { subscription, loading } = useSubscription();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const hasActiveSubscription = subscription && ['active', 'trialing'].includes(subscription.subscription.status);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight flex items-center justify-center gap-2">
          <Crown className="w-8 h-8 text-yellow-500" />
          Подписки
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Управляйте своей подпиской и получите доступ к расширенным возможностям
        </p>
      </div>

      {hasActiveSubscription ? (
        <Tabs defaultValue="subscription" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Моя подписка
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Планы
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subscription" className="mt-8">
            <SubscriptionManager />
          </TabsContent>

          <TabsContent value="plans" className="mt-8">
            <PricingPlans />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-8">
          {/* Trial Expired or No Subscription */}
          {subscription?.subscription.status === 'trial_expired' && (
            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <Crown className="w-5 h-5" />
                  Пробный период истек
                </CardTitle>
                <CardDescription className="text-yellow-700 dark:text-yellow-300">
                  Ваш 14-дневный пробный период Pro плана завершился. 
                  Выберите подходящий план для продолжения работы с расширенными возможностями.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          <PricingPlans />
        </div>
      )}

      {/* FAQ Section */}
      <div className="mt-16 space-y-8">
        <h2 className="text-2xl font-bold text-center">Часто задаваемые вопросы</h2>
        
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Что включает бесплатный пробный период?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                14-дневный пробный период включает все возможности Pro плана: интеграцию с CRM, 
                персональный домен, расширенные шаблоны и приоритетную поддержку. 
                Привязка карты не требуется.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Можно ли изменить план?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Да, вы можете повысить или понизить тарифный план в любое время. 
                При повышении плана разница будет пропорционально рассчитана за оставшийся период.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Как работают скидки?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Чем дольше период подписки, тем больше скидка: 3 мес - 5%, 6 мес - 10%, 
                1 год - 20%, 2 года - 30%, 3 года - 50%. Скидка применяется автоматически.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Что происходит при отмене?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                При отмене подписки вы сохраняете доступ до конца оплаченного периода. 
                После этого аккаунт переводится на Basic план с ограниченными возможностями.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
