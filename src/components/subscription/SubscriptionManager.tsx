import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Calendar, Crown, CheckCircle, X, AlertCircle, FileText, ExternalLink } from 'lucide-react';
import { useSubscription } from '../../hooks/useSubscription';
import { formatDate } from '../../lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function SubscriptionManager() {
  const { projectSubscriptions, loading } = useSubscription();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const { language } = useLanguage();

  const handleViewInvoice = async (subscriptionId: string) => {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session?.access_token) {
        toast.error('Please log in to view invoice');
        return;
      }

      // Call edge function to get invoice HTML
      const { data, error } = await supabase.functions.invoke('generate-invoice', {
        body: { subscription_id: subscriptionId },
        headers: {
          'Authorization': `Bearer ${session.data.session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      // Open invoice HTML in new window
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(data);
        newWindow.document.close();
      } else {
        toast.error('Please allow pop-ups to view invoice');
      }
    } catch (error) {
      console.error('Error opening invoice:', error);
      toast.error('Failed to open invoice');
    }
  };

  const t = {
    ru: {
      noSubTitle: 'Подписка не найдена',
      noSubDesc: 'У вас пока нет активной подписки. Выберите тарифный план для начала работы.',
      selectProject: 'Выберите проект',
      plan: 'План',
      statusActive: 'Активна',
      statusTrial: 'Пробный период',
      statusPending: 'Ожидает оплаты',
      statusCancelled: 'Отменена',
      statusExpired: 'Истекла',
      accessUntil: 'Доступ до',
      invoiceNumber: 'Номер счета',
      subscriptionDetails: 'Детали подписки',
      selectProjectPrompt: 'Выберите проект для просмотра подписки',
      viewInvoice: 'Просмотреть счет',
    },
    en: {
      noSubTitle: 'Subscription not found',
      noSubDesc: 'No active subscription yet. Choose a plan to get started.',
      selectProject: 'Select Project',
      plan: 'Plan',
      statusActive: 'Active',
      statusTrial: 'Trial',
      statusPending: 'Pending Payment',
      statusCancelled: 'Cancelled',
      statusExpired: 'Expired',
      accessUntil: 'Access until',
      invoiceNumber: 'Invoice Number',
      subscriptionDetails: 'Subscription Details',
      selectProjectPrompt: 'Select a project to view subscription',
      viewInvoice: 'View Invoice',
    },
    ka: {
      noSubTitle: 'გამოწერა ვერ მოიძებნა',
      noSubDesc: 'ჯერ არ გაქვთ აქტიური გამოწერა. აირჩიეთ ტარიფი დასაწყებად.',
      selectProject: 'აირჩიეთ პროექტი',
      plan: 'გეგმა',
      statusActive: 'აქტიური',
      statusTrial: 'სატესტო პერიოდი',
      statusPending: 'გადახდის მოლოდინში',
      statusCancelled: 'გაუქმებულია',
      statusExpired: 'ვადაგასულია',
      accessUntil: 'წვდომა სანამ',
      invoiceNumber: 'ინვოისის ნომერი',
      subscriptionDetails: 'გამოწერის დეტალები',
      selectProjectPrompt: 'აირჩიეთ პროექტი გამოწერის სანახავად',
      viewInvoice: 'ინვოისის ნახვა',
    },
    ar: {
      noSubTitle: 'لم يتم العثور على اشتراك',
      noSubDesc: 'لا يوجد اشتراك نشط بعد. اختر خطة للبدء.',
      selectProject: 'اختر المشروع',
      plan: 'الخطة',
      statusActive: 'نشطة',
      statusTrial: 'تجريبي',
      statusPending: 'في انتظار الدفع',
      statusCancelled: 'ملغاة',
      statusExpired: 'منتهية الصلاحية',
      accessUntil: 'الوصول حتى',
      invoiceNumber: 'رقم الفاتورة',
      subscriptionDetails: 'تفاصيل الاشتراك',
      selectProjectPrompt: 'اختر مشروعًا لعرض الاشتراك',
      viewInvoice: 'عرض الفاتورة',
    },
  } as const;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!projectSubscriptions || projectSubscriptions.length === 0) {
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

  // Auto-select first project if none selected
  const effectiveProjectId = selectedProjectId || projectSubscriptions[0]?.id;
  const selectedProject = projectSubscriptions.find(p => p.id === effectiveProjectId);
  const subscription = selectedProject?.user_subscriptions?.[0];

  const getStatusBadge = () => {
    if (!subscription) {
      return <Badge variant="outline">{t[language].statusExpired}</Badge>;
    }

    const isExpired = selectedProject?.subscription_expires_at && 
      new Date(selectedProject.subscription_expires_at) < new Date();
    
    if (subscription.status === 'active' && !isExpired) {
      return (
        <Badge className="bg-green-500">
          <CheckCircle className="w-3 h-3 mr-1" />
          {t[language].statusActive}
        </Badge>
      );
    }
    if (subscription.status === 'trialing' || subscription.status === 'trial') {
      return (
        <Badge className="bg-blue-500">
          <Crown className="w-3 h-3 mr-1" />
          {t[language].statusTrial}
        </Badge>
      );
    }
    if (subscription.status === 'pending_payment') {
      return (
        <Badge className="bg-yellow-500">
          <AlertCircle className="w-3 h-3 mr-1" />
          {t[language].statusPending}
        </Badge>
      );
    }
    if (subscription.status === 'cancelled') {
      return (
        <Badge variant="destructive">
          <X className="w-3 h-3 mr-1" />
          {t[language].statusCancelled}
        </Badge>
      );
    }
    return <Badge variant="outline">{t[language].statusExpired}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Project Selector */}
      {projectSubscriptions.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{t[language].selectProject}</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={effectiveProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger>
                <SelectValue placeholder={t[language].selectProjectPrompt} />
              </SelectTrigger>
              <SelectContent>
                {projectSubscriptions.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Current Subscription Card */}
      {selectedProject && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CardTitle>
                  {selectedProject.name}
                </CardTitle>
                {getStatusBadge()}
              </div>
            </div>
            <CardDescription>
              {subscription?.subscription_plans?.name || t[language].noSubDesc}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Subscription Details */}
            {subscription && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t[language].accessUntil}:</span>
                  </div>
                  <p className="text-sm font-medium pl-6">
                    {selectedProject.subscription_expires_at 
                      ? formatDate(selectedProject.subscription_expires_at) 
                      : '—'}
                  </p>
                </div>

                {(subscription.invoice_number || subscription.status === 'pending_payment') && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t[language].invoiceNumber}:</span>
                    </div>
                    <div className="flex items-center gap-2 pl-6">
                      <p className="text-sm font-medium">
                        {subscription.invoice_number || 'Pending'}
                      </p>
                      {subscription.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewInvoice(subscription.id)}
                          className="h-7"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          {t[language].viewInvoice}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pending Payment Notice */}
            {subscription?.status === 'pending_payment' && (
              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  {language === 'ru' 
                    ? '⏳ Ваш запрос на счет обрабатывается. Вы получите счет в ближайшее время.' 
                    : '⏳ Your invoice request is being processed. You will receive an invoice shortly.'}
                </p>
              </div>
            )}

            {/* Expired Notice */}
            {(!subscription || (selectedProject.subscription_expires_at && 
              new Date(selectedProject.subscription_expires_at) < new Date())) && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {language === 'ru' 
                    ? '⚠️ Подписка истекла. Пожалуйста, продлите подписку для продолжения использования.' 
                    : '⚠️ Subscription has expired. Please renew to continue using the service.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
