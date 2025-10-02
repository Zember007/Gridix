import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { EnhancedPricingPlans } from '../components/subscription/EnhancedPricingPlans';
import { SubscriptionManager } from '../components/subscription/SubscriptionManager';
import { useSubscription } from '../hooks/useSubscription';
import { useLanguage } from '../contexts/LanguageContext';
import { Crown, CreditCard } from 'lucide-react';

const translations = {
  en: {
    title: 'Subscriptions',
    subtitle: 'Manage your subscription and get access to advanced features',
    mySubscription: 'My Subscription',
    plans: 'Plans',
    trialExpired: 'Trial Period Expired',
    subscriptionExpired: 'Subscription Expired',
    trialExpiredDesc: 'Your 14-day Pro plan trial has ended. Choose a suitable plan to continue using advanced features.',
    subscriptionExpiredDesc: 'Your subscription has expired. Choose a plan to continue using advanced features.',
    faqTitle: 'Frequently Asked Questions',
    faq1Title: 'What does the free trial include?',
    faq1Text: 'The 14-day trial includes all Pro plan features: CRM integration, custom domain, advanced templates, and priority support. No credit card required.',
    faq2Title: 'Can I change my plan?',
    faq2Text: 'Yes, you can upgrade or downgrade your plan at any time. When upgrading, the difference will be prorated for the remaining period.',
    faq3Title: 'How do discounts work?',
    faq3Text: 'The longer the subscription period, the bigger the discount: 3 months - 5%, 6 months - 10%, 1 year - 20%, 2 years - 30%, 3 years - 50%. Discounts are applied automatically.',
    faq4Title: 'What happens when I cancel?',
    faq4Text: 'When you cancel your subscription, you retain access until the end of the paid period. After that, your account is switched to the Basic plan with limited features.',
  },
  ru: {
    title: 'Подписки',
    subtitle: 'Управляйте своей подпиской и получите доступ к расширенным возможностям',
    mySubscription: 'Моя подписка',
    plans: 'Планы',
    trialExpired: 'Пробный период истек',
    subscriptionExpired: 'Подписка истекла',
    trialExpiredDesc: 'Ваш 14-дневный пробный период Pro плана завершился. Выберите подходящий план для продолжения работы с расширенными возможностями.',
    subscriptionExpiredDesc: 'Срок действия вашей подписки истек. Выберите план для продолжения работы с расширенными возможностями.',
    faqTitle: 'Часто задаваемые вопросы',
    faq1Title: 'Что включает бесплатный пробный период?',
    faq1Text: '14-дневный пробный период включает все возможности Pro плана: интеграцию с CRM, персональный домен, расширенные шаблоны и приоритетную поддержку. Привязка карты не требуется.',
    faq2Title: 'Можно ли изменить план?',
    faq2Text: 'Да, вы можете повысить или понизить тарифный план в любое время. При повышении плана разница будет пропорционально рассчитана за оставшийся период.',
    faq3Title: 'Как работают скидки?',
    faq3Text: 'Чем дольше период подписки, тем больше скидка: 3 мес - 5%, 6 мес - 10%, 1 год - 20%, 2 года - 30%, 3 года - 50%. Скидка применяется автоматически.',
    faq4Title: 'Что происходит при отмене?',
    faq4Text: 'При отмене подписки вы сохраняете доступ до конца оплаченного периода. После этого аккаунт переводится на Basic план с ограниченными возможностями.',
  },
  ka: {
    title: 'გამოწერები',
    subtitle: 'მართეთ თქვენი გამოწერა და მიიღეთ წვდომა გაფართოებულ ფუნქციებზე',
    mySubscription: 'ჩემი გამოწერა',
    plans: 'გეგმები',
    trialExpired: 'საცდელი პერიოდი ამოიწურა',
    subscriptionExpired: 'გამოწერა ამოიწურა',
    trialExpiredDesc: 'თქვენი 14-დღიანი Pro გეგმის საცდელი პერიოდი დასრულდა. აირჩიეთ შესაბამისი გეგმა გაფართოებული ფუნქციების გამოსაყენებლად.',
    subscriptionExpiredDesc: 'თქვენი გამოწერა ამოიწურა. აირჩიეთ გეგმა გაფართოებული ფუნქციების გამოსაყენებლად.',
    faqTitle: 'ხშირად დასმული კითხვები',
    faq1Title: 'რას მოიცავს უფასო საცდელი პერიოდი?',
    faq1Text: '14-დღიანი საცდელი პერიოდი მოიცავს Pro გეგმის ყველა ფუნქციას: CRM ინტეგრაცია, პირადი დომენი, გაფართოებული შაბლონები და პრიორიტეტული მხარდაჭერა. საბანკო ბარათის მიბმა არ არის საჭირო.',
    faq2Title: 'შემიძლია გეგმის შეცვლა?',
    faq2Text: 'დიახ, თქვენ შეგიძლიათ ამაღლდეთ ან დაიწიოთ თქვენი გეგმა ნებისმიერ დროს. ამაღლებისას, სხვაობა პროპორციულად გამოითვლება დარჩენილი პერიოდისთვის.',
    faq3Title: 'როგორ მუშაობს ფასდაკლებები?',
    faq3Text: 'რაც უფრო გრძელია გამოწერის პერიოდი, მით უფრო დიდია ფასდაკლება: 3 თვე - 5%, 6 თვე - 10%, 1 წელი - 20%, 2 წელი - 30%, 3 წელი - 50%. ფასდაკლება ავტომატურად გამოიყენება.',
    faq4Title: 'რა ხდება გაუქმებისას?',
    faq4Text: 'გამოწერის გაუქმებისას თქვენ შეინარჩუნებთ წვდომას გადახდილი პერიოდის ბოლომდე. ამის შემდეგ თქვენი ანგარიში გადაერთვება Basic გეგმაზე შეზღუდული ფუნქციებით.',
  },
  ar: {
    title: 'الاشتراكات',
    subtitle: 'إدارة اشتراكك والحصول على ميزات متقدمة',
    mySubscription: 'اشتراكي',
    plans: 'الخطط',
    trialExpired: 'انتهت الفترة التجريبية',
    subscriptionExpired: 'انتهى الاشتراك',
    trialExpiredDesc: 'انتهت فترتك التجريبية لخطة Pro لمدة 14 يومًا. اختر خطة مناسبة لمواصلة استخدام الميزات المتقدمة.',
    subscriptionExpiredDesc: 'انتهى اشتراكك. اختر خطة لمواصلة استخدام الميزات المتقدمة.',
    faqTitle: 'الأسئلة الشائعة',
    faq1Title: 'ماذا تتضمن الفترة التجريبية المجانية؟',
    faq1Text: 'تتضمن الفترة التجريبية لمدة 14 يومًا جميع ميزات خطة Pro: تكامل CRM، نطاق مخصص، قوالب متقدمة، ودعم ذو أولوية. لا حاجة لبطاقة ائتمان.',
    faq2Title: 'هل يمكنني تغيير خطتي؟',
    faq2Text: 'نعم، يمكنك الترقية أو التخفيض في أي وقت. عند الترقية، سيتم احتساب الفرق بشكل تناسبي للفترة المتبقية.',
    faq3Title: 'كيف تعمل الخصومات؟',
    faq3Text: 'كلما طالت فترة الاشتراك، زاد الخصم: 3 أشهر - 5%، 6 أشهر - 10%، سنة واحدة - 20%، سنتان - 30%، 3 سنوات - 50%. يتم تطبيق الخصومات تلقائيًا.',
    faq4Title: 'ماذا يحدث عند الإلغاء؟',
    faq4Text: 'عند إلغاء اشتراكك، تحتفظ بالوصول حتى نهاية الفترة المدفوعة. بعد ذلك، يتم تحويل حسابك إلى خطة Basic مع ميزات محدودة.',
  },
} as const;

export default function SubscriptionPage() {
  const { subscription, loading } = useSubscription();
  const { language } = useLanguage();
  const t = translations[language] || translations.en;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
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
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight flex items-center justify-center gap-2">
          <Crown className="w-8 h-8 text-yellow-500" />
          {t.title}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t.subtitle}
        </p>
      </div>

      {hasActiveSubscription ? (
        <Tabs defaultValue="subscription" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              {t.mySubscription}
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              {t.plans}
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
                  {subscription.subscription.status === 'trial_expired' ? t.trialExpired : t.subscriptionExpired}
                </CardTitle>
                <CardDescription className="text-yellow-700 dark:text-yellow-300">
                  {subscription.subscription.status === 'trial_expired' 
                    ? t.trialExpiredDesc
                    : t.subscriptionExpiredDesc}
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          <EnhancedPricingPlans showHeader={false} requireAuth={true} />
        </div>
      )}

      {/* FAQ Section */}
      <div className="mt-16 space-y-8">
        <h2 className="text-2xl font-bold text-center">{t.faqTitle}</h2>
        
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.faq1Title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t.faq1Text}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.faq2Title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t.faq2Text}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.faq3Title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t.faq3Text}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.faq4Title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t.faq4Text}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
