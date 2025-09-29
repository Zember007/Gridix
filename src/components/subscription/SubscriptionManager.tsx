import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Calendar, CreditCard, Crown, AlertTriangle, CheckCircle, Clock, X, ExternalLink } from 'lucide-react';
import { useSubscription } from '../../hooks/useSubscription';
import { formatDate } from '../../lib/utils';

export function SubscriptionManager() {
  const { subscription, loading, getManagementUrl } = useSubscription();
  const [managementLoading, setManagementLoading] = useState(false);

  const handleManageSubscription = async () => {
    setManagementLoading(true);
    try {
      const managementUrl = await getManagementUrl();
      if (managementUrl) {
        window.open(managementUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to get management URL:', error);
      // Fallback to general billing page
      window.open('https://gridixlive.lemonsqueezy.com/billing', '_blank');
    } finally {
      setManagementLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Подписка не найдена</CardTitle>
          <CardDescription>
            У вас пока нет активной подписки. Выберите тарифный план для начала работы.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { subscription: sub, isTrialActive, trialDaysRemaining } = subscription;
  const plan = sub.subscription_plans;

  const getStatusBadge = () => {
    switch (sub.status) {
      case 'active':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Активна</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-500"><Clock className="w-3 h-3 mr-1" />Пробный период</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Отменена</Badge>;
      case 'trial_expired':
        return <Badge variant="outline"><AlertTriangle className="w-3 h-3 mr-1" />Пробный период истек</Badge>;
      default:
        return <Badge variant="secondary">{sub.status}</Badge>;
    }
  };

  const getTrialProgress = () => {
    if (!isTrialActive || !sub.trial_ends_at) return 0;
    
    const trialStart = new Date(sub.current_period_start!);
    const trialEnd = new Date(sub.trial_ends_at);
    const now = new Date();
    
    const totalDays = Math.ceil((trialEnd.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return Math.max(0, Math.min(100, ((totalDays - remainingDays) / totalDays) * 100));
  };

  return (
    <div className="space-y-6">
      {/* Current Subscription Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {plan.slug === 'pro' && <Crown className="w-5 h-5 text-yellow-500" />}
              <CardTitle>План {plan.name}</CardTitle>
              {getStatusBadge()}
            </div>
            {sub.final_price && (
              <div className="text-right">
                <div className="text-2xl font-bold">${sub.final_price}</div>
                <div className="text-sm text-muted-foreground">
                  {sub.duration_months} мес
                </div>
              </div>
            )}
          </div>
          <CardDescription>{plan.description}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Trial Progress */}
          {isTrialActive && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Пробный период</span>
                <span>{trialDaysRemaining} дней осталось</span>
              </div>
              <Progress value={getTrialProgress()} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Пробный период заканчивается {formatDate(sub.trial_ends_at!)}
              </p>
            </div>
          )}
          
          {/* Subscription Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Период подписки:</span>
              </div>
              <p className="text-sm font-medium pl-6">
                {sub.current_period_start && formatDate(sub.current_period_start)} - {' '}
                {sub.current_period_end && formatDate(sub.current_period_end)}
              </p>
            </div>
            
            {sub.lemon_squeezy_subscription_id && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">ID подписки:</span>
                </div>
                <p className="text-sm font-mono pl-6">
                  {sub.lemon_squeezy_subscription_id}
                </p>
              </div>
            )}
          </div>
          
          {/* Discount Information */}
          {sub.discount_percentage > 0 && (
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800 dark:text-green-200 font-medium">
                  Применена скидка {sub.discount_percentage}%
                </span>
              </div>
            </div>
          )}
          
          {/* Cancel at Period End Warning */}
          {sub.cancel_at_period_end && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                  Подписка будет отменена {formatDate(sub.current_period_end!)}
                </span>
              </div>
            </div>
          )}
          
          {/* Features List */}
          <div className="space-y-2">
            <h4 className="font-medium">Включенные возможности:</h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm text-muted-foreground">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
      
      {/* Actions Card */}
      {(sub.status === 'active' || sub.status === 'trialing') && (
        <Card>
          <CardHeader>
            <CardTitle>Управление подпиской</CardTitle>
            <CardDescription>
              Изменение, продление или отмена вашей подписки
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleManageSubscription}
              disabled={managementLoading}
              className="w-full"
            >
              {managementLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Загружаю...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Управление подпиской
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Откроется страница LemonSqueezy для управления вашей подпиской
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
