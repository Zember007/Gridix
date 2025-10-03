import React from 'react';
import { EnhancedPricingPlans } from '../components/subscription/EnhancedPricingPlans';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useLanguage } from '../contexts/LanguageContext';
import { Crown, Check, Zap, Shield, Globe, TrendingUp } from 'lucide-react';
import HeroHeader from '@/components/index/header';
import Footer from '@/components/index/footer';

const translations = {
  en: {
    title: 'Pricing Plans',
    subtitle: 'Choose the perfect plan for your business needs',
    benefits: 'Why Choose Our Platform',
    benefit1Title: 'Professional Tools',
    benefit1Text: 'Create stunning floor plans with our advanced editor and templates',
    benefit2Title: 'CRM Integration',
    benefit2Text: 'Connect with your favorite CRM systems seamlessly',
    benefit3Title: 'Custom Domains',
    benefit3Text: 'Use your own domain for a professional brand presence',
    benefit4Title: 'Scalable Solution',
    benefit4Text: 'Grow your business with unlimited projects and apartments',
    benefit5Title: 'Secure & Reliable',
    benefit5Text: '99.9% uptime guarantee with enterprise-grade security',
    benefit6Title: 'Priority Support',
    benefit6Text: 'Get help when you need it with our dedicated support team',
    faqTitle: 'Frequently Asked Questions',
    faq1Q: 'What payment methods do you accept?',
    faq1A: 'We accept all major credit cards, PayPal, and bank transfers for annual plans.',
    faq2Q: 'Can I switch plans later?',
    faq2A: 'Yes! You can upgrade or downgrade your plan at any time. Changes are prorated.',
    faq3Q: 'Is there a free trial?',
    faq3A: 'Yes, new users get a 14-day free trial of the Pro plan with no credit card required.',
    faq4Q: 'What happens if I cancel?',
    faq4A: 'You retain access until the end of your billing period, then your account moves to the free tier.',
    faq5Q: 'Do you offer refunds?',
    faq5A: 'Yes, we offer a 30-day money-back guarantee on all plans.',
    faq6Q: 'Can I get a custom plan for my enterprise?',
    faq6A: 'Absolutely! Contact our sales team for custom enterprise solutions.',
  },
  ru: {
    title: 'Тарифные планы',
    subtitle: 'Выберите идеальный план для вашего бизнеса',
    benefits: 'Почему выбирают нашу платформу',
    benefit1Title: 'Профессиональные инструменты',
    benefit1Text: 'Создавайте потрясающие планировки с помощью нашего редактора и шаблонов',
    benefit2Title: 'Интеграция с CRM',
    benefit2Text: 'Легко подключайтесь к вашим любимым CRM-системам',
    benefit3Title: 'Персональные домены',
    benefit3Text: 'Используйте свой домен для профессионального присутствия бренда',
    benefit4Title: 'Масштабируемое решение',
    benefit4Text: 'Растите с неограниченным количеством проектов и квартир',
    benefit5Title: 'Надежность и безопасность',
    benefit5Text: '99,9% uptime и защита корпоративного уровня',
    benefit6Title: 'Приоритетная поддержка',
    benefit6Text: 'Получайте помощь когда нужно от нашей команды',
    faqTitle: 'Часто задаваемые вопросы',
    faq1Q: 'Какие способы оплаты вы принимаете?',
    faq1A: 'Мы принимаем все основные кредитные карты, PayPal и банковские переводы для годовых планов.',
    faq2Q: 'Могу ли я изменить план позже?',
    faq2A: 'Да! Вы можете повысить или понизить план в любое время. Изменения пропорциональны.',
    faq3Q: 'Есть ли бесплатный пробный период?',
    faq3A: 'Да, новые пользователи получают 14-дневный пробный период Pro плана без привязки карты.',
    faq4Q: 'Что произойдет при отмене?',
    faq4A: 'Вы сохраняете доступ до конца платежного периода, затем аккаунт переходит на бесплатный уровень.',
    faq5Q: 'Предоставляете ли вы возврат средств?',
    faq5A: 'Да, мы предлагаем 30-дневную гарантию возврата денег на все планы.',
    faq6Q: 'Могу ли я получить индивидуальный план для предприятия?',
    faq6A: 'Конечно! Свяжитесь с нашим отделом продаж для индивидуальных решений.',
  },
  ka: {
    title: 'ფასების გეგმები',
    subtitle: 'აირჩიეთ იდეალური გეგმა თქვენი ბიზნესისთვის',
    benefits: 'რატომ აირჩიეთ ჩვენი პლატფორმა',
    benefit1Title: 'პროფესიონალური ხელსაწყოები',
    benefit1Text: 'შექმენით შთამბეჭდავი გეგმები ჩვენი რედაქტორით და შაბლონებით',
    benefit2Title: 'CRM ინტეგრაცია',
    benefit2Text: 'დააკავშირეთ თქვენი საყვარელი CRM სისტემები მარტივად',
    benefit3Title: 'პერსონალიზებული დომენები',
    benefit3Text: 'გამოიყენეთ საკუთარი დომენი პროფესიონალური ბრენდისთვის',
    benefit4Title: 'მასშტაბირებადი გადაწყვეტა',
    benefit4Text: 'განავითარეთ ბიზნესი შეუზღუდავი პროექტებით',
    benefit5Title: 'უსაფრთხო და სანდო',
    benefit5Text: '99.9% uptime გარანტია კორპორატიული დონის უსაფრთხოებით',
    benefit6Title: 'პრიორიტეტული მხარდაჭერა',
    benefit6Text: 'მიიღეთ დახმარება როცა გჭირდებათ ჩვენი გუნდისგან',
    faqTitle: 'ხშირად დასმული კითხვები',
    faq1Q: 'რა გადახდის მეთოდებს იღებთ?',
    faq1A: 'ჩვენ ვიღებთ ყველა მთავარ საკრედიტო ბარათს, PayPal-ს და ბანკის გადარიცხვებს.',
    faq2Q: 'შემიძლია გეგმის შეცვლა მოგვიანებით?',
    faq2A: 'დიახ! შეგიძლიათ გაზარდოთ ან შეამციროთ გეგმა ნებისმიერ დროს.',
    faq3Q: 'არის უფასო საცდელი პერიოდი?',
    faq3A: 'დიახ, ახალი მომხმარებლები იღებენ 14-დღიან უფასო საცდელ პერიოდს.',
    faq4Q: 'რა მოხდება გაუქმებისას?',
    faq4A: 'შეინარჩუნებთ წვდომას გადახდილი პერიოდის ბოლომდე.',
    faq5Q: 'გთავაზობთ თანხის დაბრუნებას?',
    faq5A: 'დიახ, ჩვენ გთავაზობთ 30-დღიან თანხის დაბრუნების გარანტიას.',
    faq6Q: 'შემიძლია მივიღო ინდივიდუალური გეგმა?',
    faq6A: 'რა თქმა უნდა! დაუკავშირდით ჩვენს გაყიდვების გუნდს.',
  },
  ar: {
    title: 'خطط الأسعار',
    subtitle: 'اختر الخطة المثالية لاحتياجات عملك',
    benefits: 'لماذا تختار منصتنا',
    benefit1Title: 'أدوات احترافية',
    benefit1Text: 'أنشئ مخططات أرضية مذهلة باستخدام محررنا وقوالبنا',
    benefit2Title: 'تكامل CRM',
    benefit2Text: 'اتصل بأنظمة CRM المفضلة لديك بسلاسة',
    benefit3Title: 'نطاقات مخصصة',
    benefit3Text: 'استخدم نطاقك الخاص لحضور احترافي للعلامة التجارية',
    benefit4Title: 'حل قابل للتطوير',
    benefit4Text: 'نمِّ عملك بمشاريع وشقق غير محدودة',
    benefit5Title: 'آمن وموثوق',
    benefit5Text: 'ضمان وقت تشغيل 99.9٪ مع أمان على مستوى المؤسسات',
    benefit6Title: 'دعم ذو أولوية',
    benefit6Text: 'احصل على المساعدة عندما تحتاجها من فريقنا',
    faqTitle: 'الأسئلة الشائعة',
    faq1Q: 'ما هي طرق الدفع التي تقبلونها؟',
    faq1A: 'نقبل جميع بطاقات الائتمان الرئيسية وPayPal والتحويلات المصرفية.',
    faq2Q: 'هل يمكنني تبديل الخطط لاحقًا؟',
    faq2A: 'نعم! يمكنك الترقية أو التخفيض في أي وقت.',
    faq3Q: 'هل هناك فترة تجريبية مجانية؟',
    faq3A: 'نعم، يحصل المستخدمون الجدد على فترة تجريبية مجانية لمدة 14 يومًا.',
    faq4Q: 'ماذا يحدث إذا ألغيت؟',
    faq4A: 'تحتفظ بالوصول حتى نهاية فترة الفوترة.',
    faq5Q: 'هل تقدمون استردادًا؟',
    faq5A: 'نعم، نقدم ضمان استرداد الأموال لمدة 30 يومًا.',
    faq6Q: 'هل يمكنني الحصول على خطة مخصصة؟',
    faq6A: 'بالتأكيد! اتصل بفريق المبيعات لدينا.',
  },
} as const;

export default function PricingPage() {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      {/* Header */}
      <HeroHeader />

      <div className="container mx-auto px-4 py-20 md:py-32 space-y-16">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-5xl font-bold tracking-tight">
          {t.title}
        </h1>
        <p className="text-xl text-muted-foreground">
          {t.subtitle}
        </p>
      </div>

      {/* Pricing Plans */}
      <EnhancedPricingPlans showHeader={false} requireAuth={false} />

      {/* Benefits Section */}
      <div className="py-16">
        <h2 className="text-3xl font-bold text-center mb-12">{t.benefits}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>{t.benefit1Title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t.benefit1Text}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>{t.benefit2Title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t.benefit2Text}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>{t.benefit3Title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t.benefit3Text}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle>{t.benefit4Title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t.benefit4Text}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle>{t.benefit5Title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t.benefit5Text}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center mb-4">
                <Crown className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <CardTitle>{t.benefit6Title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t.benefit6Text}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-16">
        <h2 className="text-3xl font-bold text-center mb-12">{t.faqTitle}</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span>{t.faq1Q}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t.faq1A}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span>{t.faq2Q}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t.faq2A}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span>{t.faq3Q}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t.faq3A}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span>{t.faq4Q}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t.faq4A}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span>{t.faq5Q}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t.faq5A}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span>{t.faq6Q}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t.faq6A}</p>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

