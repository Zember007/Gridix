import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Calendar, Crown, CheckCircle, X, ExternalLink } from 'lucide-react';
import { useSubscription } from '../../hooks/useSubscription';
import { formatDate } from '../../lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export function SubscriptionManager() {
  const { subscription, loading, getManagementUrl } = useSubscription();
  const [managementLoading, setManagementLoading] = useState(false);
  const { language } = useLanguage();

  const t = {
    ru: {
      noSubTitle: 'Подписка не найдена',
      noSubDesc: 'У вас пока нет активной подписки. Выберите тарифный план для начала работы.',
      plan: 'План',
      statusActive: 'Активна',
      statusTrial: 'Пробный период',
      statusCancelled: 'Отменена',
      statusExpired: 'Пробный период истек',
      accessUntil: 'Доступ до',
      manageTitle: 'Управление подпиской',
      manageDesc: 'Изменение, продление или отмена вашей подписки',
      manageBtn: 'Управление подпиской',
    },
    en: {
      noSubTitle: 'Subscription not found',
      noSubDesc: 'No active subscription yet. Choose a plan to get started.',
      plan: 'Plan',
      statusActive: 'Active',
      statusTrial: 'Trial',
      statusCancelled: 'Cancelled',
      statusExpired: 'Trial expired',
      accessUntil: 'Access until',
      manageTitle: 'Manage subscription',
      manageDesc: 'Change, extend or cancel your subscription',
      manageBtn: 'Manage subscription',
    },
    ka: {
      noSubTitle: 'გამოწერა ვერ მოიძებნა',
      noSubDesc: 'ჯერ არ გაქვთ აქტიური გამოწერა. აირჩიეთ ტარიფი დასაწყებად.',
      plan: 'გეგმა',
      statusActive: 'აქტიური',
      statusTrial: 'სატესტო პერიოდი',
      statusCancelled: 'გაუქმებულია',
      statusExpired: 'სატესტო პერიოდი დასრულდა',
      accessUntil: 'წვდომა სანამ',
      manageTitle: 'გამოწერის მართვა',
      manageDesc: 'შეცვლა, გაგრძელება ან გაუქმება',
      manageBtn: 'გამოწერის მართვა',
    },
    ar: {
      noSubTitle: 'لم يتم العثور على اشتراك',
      noSubDesc: 'لا يوجد اشتراك نشط بعد. اختر خطة للبدء.',
      plan: 'الخطة',
      statusActive: 'نشطة',
      statusTrial: 'تجريبي',
      statusCancelled: 'ملغاة',
      statusExpired: 'انتهت الفترة التجريبية',
      accessUntil: 'الوصول حتى',
      manageTitle: 'إدارة الاشتراك',
      manageDesc: 'تغيير أو تمديد أو إلغاء اشتراكك',
      manageBtn: 'إدارة الاشتراك',
    },
  } as const;

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
          <CardTitle>{t[language].noSubTitle}</CardTitle>
          <CardDescription>
            {t[language].noSubDesc}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { subscription: sub } = subscription;
  const plan = sub.subscription_plans;

  const getStatusBadge = () => {
    // If subscription is cancelled but still active until period end
    if (sub.cancel_at_period_end && (sub.status === 'active' || sub.status === 'trialing')) {
      return (
        <Badge className="bg-orange-500">
          <X className="w-3 h-3 mr-1" />
          {language === 'ru' ? 'Активна (отменяется)' : 'Active (cancelling)'}
        </Badge>
      );
    }
    
    switch (sub.status) {
      case 'active':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />{t[language].statusActive}</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-500">{t[language].statusTrial}</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />{t[language].statusCancelled}</Badge>;
      case 'expired':
      case 'trial_expired':
        return <Badge variant="outline">{t[language].statusExpired}</Badge>;
      case 'paused':
        return <Badge variant="secondary">{language === 'ru' ? 'Приостановлена' : 'Paused'}</Badge>;
      default:
        return <Badge variant="secondary">{sub.status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Subscription Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {plan.slug === 'pro' && <Crown className="w-5 h-5 text-yellow-500" />}
              <CardTitle>{t[language].plan} {plan.name}</CardTitle>
              {getStatusBadge()}
            </div>
          </div>
          <CardDescription>
            {sub.status === 'active' || sub.status === 'trialing' ? (
              <span>
                {t[language].accessUntil}: {sub.current_period_end ? formatDate(sub.current_period_end) : '-'}
              </span>
            ) : (
              <span>
                {t[language].accessUntil}: {sub.current_period_end ? formatDate(sub.current_period_end) : '-'}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Subscription cancellation notice */}
          {sub.cancel_at_period_end && (
            <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                {language === 'ru' 
                  ? '⚠️ Подписка будет отменена в конце текущего периода. Вы сохраняете доступ до ' 
                  : '⚠️ Subscription will be cancelled at the end of the current period. You retain access until '}
                <strong>{sub.current_period_end ? formatDate(sub.current_period_end) : '-'}</strong>
              </p>
            </div>
          )}
          
          {/* Minimal subscription details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t[language].accessUntil}:</span>
              </div>
              <p className="text-sm font-medium pl-6">
                {sub.current_period_end ? formatDate(sub.current_period_end) : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Actions Card */}
      {(sub.status === 'active' || sub.status === 'trialing') && (
        <Card>
          <CardHeader>
            <CardTitle>{t[language].manageTitle}</CardTitle>
            <CardDescription>
              {t[language].manageDesc}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleManageSubscription}
              disabled={managementLoading}
              className="w-full"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {t[language].manageBtn}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
