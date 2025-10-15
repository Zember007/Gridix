import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Check, Crown, Zap, Sparkles, Receipt } from 'lucide-react';
import { useSubscription, SubscriptionPlan } from '../../hooks/useSubscription';
import { cn } from '../../lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '../ui/label';
import { toast } from 'sonner';

interface EnhancedPricingPlansProps {
  className?: string;
  showHeader?: boolean;
  requireAuth?: boolean;
  projectId?: string;
}

const translations = {
  en: {
    title: 'Choose Your Plan',
    subtitle: 'Select the perfect subscription plan for your needs',
    month: 'month',
    months: 'months',
    year: 'year',
    years: 'years',
    perMonth: '/month',
    total: 'Total',
    save: 'Save',
    recommended: 'Recommended',
    currentPlan: 'Current Plan',
    choosePlan: 'Choose Plan',
    getStarted: 'Get Started',
    signInRequired: 'Sign in to subscribe',
    mostPopular: 'Most Popular',
    bestValue: 'Best Value',
    discount: 'discount',
    requestInvoice: 'Request Invoice',
    selectProject: 'Select Project',
    selectProjectDesc: 'Choose a project for this subscription',
  },
  ru: {
    title: 'Выберите тарифный план',
    subtitle: 'Выберите идеальный план подписки для ваших нужд',
    month: 'месяц',
    months: 'месяца',
    year: 'год',
    years: 'года',
    perMonth: '/мес',
    total: 'Всего',
    save: 'Экономия',
    recommended: 'Рекомендуется',
    currentPlan: 'Текущий план',
    choosePlan: 'Выбрать план',
    getStarted: 'Начать',
    signInRequired: 'Войдите для подписки',
    mostPopular: 'Популярный',
    bestValue: 'Выгодно',
    discount: 'скидка',
    requestInvoice: 'Запросить счет',
    selectProject: 'Выберите проект',
    selectProjectDesc: 'Выберите проект для этой подписки',
  },
  ka: {
    title: 'აირჩიეთ ტარიფი',
    subtitle: 'აირჩიეთ იდეალური გამოწერის გეგმა თქვენი საჭიროებისთვის',
    month: 'თვე',
    months: 'თვე',
    year: 'წელი',
    years: 'წელი',
    perMonth: '/თვე',
    total: 'სულ',
    save: 'დაზოგვა',
    recommended: 'რეკომენდებული',
    currentPlan: 'მიმდინარე გეგმა',
    choosePlan: 'გეგმის არჩევა',
    getStarted: 'დაწყება',
    signInRequired: 'შედით გამოწერისთვის',
    mostPopular: 'პოპულარული',
    bestValue: 'მომგებიანი',
    discount: 'ფასდაკლება',
    requestInvoice: 'ინვოისის მოთხოვნა',
    selectProject: 'აირჩიეთ პროექტი',
    selectProjectDesc: 'აირჩიეთ პროექტი ამ გამოწერისთვის',
  },
  ar: {
    title: 'اختر خطتك',
    subtitle: 'اختر خطة الاشتراك المثالية لاحتياجاتك',
    month: 'شهر',
    months: 'أشهر',
    year: 'سنة',
    years: 'سنوات',
    perMonth: '/شهر',
    total: 'المجموع',
    save: 'توفير',
    recommended: 'موصى به',
    currentPlan: 'الخطة الحالية',
    choosePlan: 'اختر الخطة',
    getStarted: 'ابدأ',
    signInRequired: 'تسجيل الدخول للاشتراك',
    mostPopular: 'الأكثر شعبية',
    bestValue: 'أفضل قيمة',
    discount: 'خصم',
    requestInvoice: 'طلب فاتورة',
    selectProject: 'اختر المشروع',
    selectProjectDesc: 'اختر مشروعًا لهذا الاشتراك',
  },
} as const;

export function EnhancedPricingPlans({ className, showHeader = true, requireAuth = true, projectId }: EnhancedPricingPlansProps) {
  const { projectSubscriptions, loading, plansLoading, plans: plansData, requestInvoice } = useSubscription();
  const [selectedDuration, setSelectedDuration] = useState<number>(1);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedProjectForInvoice, setSelectedProjectForInvoice] = useState<string>(projectId || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const { language } = useLanguage();
  const t = translations[language] || translations.en;

  const getDurationLabel = (months: number) => {
    if (months === 1) return `1 ${t.month}`;
    if (months === 3) return `3 ${t.months}`;
    if (months === 6) return `6 ${t.months}`;
    if (months === 12) return `1 ${t.year}`;
    if (months === 24) return `2 ${t.years}`;
    if (months === 36) return `3 ${t.years}`;
    return `${months} ${t.months}`;
  };

  const handlePlanSelect = (planId: string, durationMonths: number) => {
    if (requireAuth && (!projectSubscriptions || projectSubscriptions.length === 0)) {
      // Redirect to auth page
      window.location.href = `/${language}/auth`;
      return;
    }

    setSelectedPlanId(planId);
    setSelectedDuration(durationMonths);
    
    // If projectId is provided, use it directly
    if (projectId) {
      setSelectedProjectForInvoice(projectId);
    } else if (projectSubscriptions && projectSubscriptions.length === 1) {
      // Auto-select if only one project
      setSelectedProjectForInvoice(projectSubscriptions[0].id);
    }
    
    setIsInvoiceDialogOpen(true);
  };

  const handleRequestInvoice = async () => {
    if (!selectedProjectForInvoice || !selectedPlanId) {
      toast.error('Please select a project and plan');
      return;
    }

    setIsProcessing(true);
    try {
      await requestInvoice(selectedProjectForInvoice, selectedPlanId, selectedDuration);
      toast.success('Invoice requested successfully!');
      setIsInvoiceDialogOpen(false);
    } catch (error) {
      console.error('Error requesting invoice:', error);
      toast.error('Failed to request invoice');
    } finally {
      setIsProcessing(false);
    }
  };

  const isCurrentPlan = (planSlug: string) => {
    if (!projectId || !projectSubscriptions) return false;
    const project = projectSubscriptions.find(p => p.id === projectId);
    if (!project) return false;
    const subscription = project.user_subscriptions?.[0];
    return subscription?.subscription_plans?.slug === planSlug &&
           ['active', 'trialing'].includes(subscription?.status || '');
  };

  if (loading || plansLoading) {
    return (
      <div className={cn('flex justify-center items-center py-12', className)}>

        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!plansData || plansData.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <p className="text-muted-foreground">Unable to load pricing plans</p>
      </div>
    );
  }

  // Get available durations from the first plan
  const availableDurations = plansData[0]?.pricing || [];

  return (
    <div className={cn('space-y-8', className)}>
      {showHeader && (
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">{t.title}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t.subtitle}</p>
        </div>
      )}

      {/* Duration Selector */}
      {availableDurations.length > 0 && (
        <div className="flex justify-center">
          <Tabs value={selectedDuration.toString()} onValueChange={(v) => setSelectedDuration(Number(v))} className="w-full max-w-3xl">
            <TabsList className="grid w-full grid-cols-4 h-auto">
              {availableDurations.map((pricing) => (
                <TabsTrigger 
                  key={pricing.durationMonths} 
                  value={pricing.durationMonths.toString()}
                  className="flex flex-col items-center py-3 relative"
                >
                  <span className="font-semibold">{getDurationLabel(pricing.durationMonths)}</span>
                  {pricing.discountPercentage > 0 && (
                    <Badge variant="secondary" className="absolute -top-2 -right-1 text-xs px-1 py-0">
                      -{pricing.discountPercentage}%
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Plan Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {plansData.map((plan: SubscriptionPlan) => {
          const isCurrentUserPlan = isCurrentPlan(plan.slug);
          const isPro = plan.slug === 'pro';
          const selectedPricing = plan.pricing.find(p => p.durationMonths === selectedDuration);

          if (!selectedPricing) return null;

          return (
            <Card 
              key={plan.slug} 
              className={cn(
                'relative',
                isPro && 'border-primary shadow-xl scale-105',
                isCurrentUserPlan && 'ring-2 ring-primary'
              )}
            >
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-1.5 text-sm font-semibold">
                    <Crown className="w-3.5 h-3.5 mr-1.5" />
                    {t.recommended}
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-8 pt-6">
                <div className="flex items-center justify-center mb-4">
                  {isPro ? (
                    <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                  ) : (
                    <div className="p-3 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
                
                <CardTitle className="text-3xl mb-2">{plan.name}</CardTitle>
                <CardDescription className="text-base">{plan.description}</CardDescription>
                
                <div className="space-y-3 pt-6">
                  <div className="text-5xl font-bold">
                    ${selectedPricing.monthlyPrice.toFixed(0)}
                    <span className="text-lg font-normal text-muted-foreground">{t.perMonth}</span>
                  </div>
                  
                  {selectedDuration > 1 && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        {t.total}: ${selectedPricing.totalPrice.toFixed(2)}
                      </p>
                      {selectedPricing.savings > 0 && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {t.save} ${selectedPricing.savings.toFixed(2)} ({selectedPricing.discountPercentage}% {t.discount})
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-sm leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                <Button
                  className={cn(
                    "w-full h-12 text-base font-semibold",
                    isPro && "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                  )}
                  variant={isPro ? 'default' : 'outline'}
                  size="lg"
                  disabled={isCurrentUserPlan}
                  onClick={() => handlePlanSelect(plan.id, selectedDuration)}
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  {isCurrentUserPlan 
                    ? t.currentPlan 
                    : requireAuth && (!projectSubscriptions || projectSubscriptions.length === 0)
                      ? t.signInRequired
                      : t.requestInvoice
                  }
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Invoice Request Dialog */}
      <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.requestInvoice}</DialogTitle>
            <DialogDescription>
              {t.selectProjectDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Project Selector - show only if not pre-selected */}
            {!projectId && projectSubscriptions && projectSubscriptions.length > 1 && (
              <div>
                <Label>{t.selectProject}</Label>
                <Select value={selectedProjectForInvoice} onValueChange={setSelectedProjectForInvoice}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectProject} />
                  </SelectTrigger>
                  <SelectContent>
                    {projectSubscriptions.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Show selected project name if pre-selected */}
            {(projectId || (projectSubscriptions && projectSubscriptions.length === 1)) && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  {t.selectProject}: {projectSubscriptions?.find(p => p.id === selectedProjectForInvoice)?.name || 'Selected Project'}
                </p>
              </div>
            )}

            <Button
              onClick={handleRequestInvoice}
              disabled={isProcessing || !selectedProjectForInvoice || !selectedPlanId}
              className="w-full"
            >
              {isProcessing && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />}
              {t.requestInvoice}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

