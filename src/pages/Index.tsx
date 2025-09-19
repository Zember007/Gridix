
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { Testimonials } from '@/components/ui/testimonials';
import { Building2, Users, Settings, BarChart3, Upload, Eye, Star, CheckCircle, ArrowRight, Zap, Shield, Globe, Smartphone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguageNavigation } from '@/hooks/useLanguageNavigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState, useEffect } from 'react';
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import HeroHeader from '@/components/index/header';
import { HeroSection } from '@/components/blocks/hero-section';
import { Timeline } from '@/components/ui/timeline';
import { WorldMap } from '@/components/ui/map';

const Index = () => {
  const { navigate } = useLanguageNavigation();
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const [currentFeature, setCurrentFeature] = useState(0);

  const goToAdmin = () => {
    navigate('/admin');
  };

  const goToPrivacyPolicy = () => {
    navigate('/privacy-policy');
  };

  const goToTermsOfService = () => {
    navigate('/terms-of-service');
  };

  // Автоматическое переключение слайдов для интерактивности
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % 6);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const data = [
    {
      title: "Готовые виджеты для любого сайта",
      content: (
        <div>
          <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mb-8">
            Встраиваемые интерактивные планы одной строкой кода. Работает на любой CMS (WordPress, Tilda, 1C-Битрикс).
          </p>
          <div className="grid grid-cols-2 gap-4">
            <video
              src=""
              controls
              className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full bg-neutral-200 dark:bg-neutral-800 shadow"
            >
              Ваш браузер не поддерживает видео.
            </video>
            <video
              src=""
              controls
              className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full bg-neutral-200 dark:bg-neutral-800 shadow"
            />
          </div>
        </div>
      ),
    },
    {
      title: "Импорт данных",
      content: (
        <div>
          <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mb-8">
            Загрузите статусы и цены квартир из Excel, CSV или Google Sheets. Все данные автоматически подтянутся в систему.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <video
              src=""
              controls
              className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full bg-neutral-200 dark:bg-neutral-800 shadow"
            />
            <video
              src=""
              controls
              className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full bg-neutral-200 dark:bg-neutral-800 shadow"
            />
          </div>
        </div>
      ),
    },
    {
      title: "Интеграция с популярными CRM",
      content: (
        <div>
          <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mb-8">
            Автоматическая передача лидов и данных о квартирах в AmoCRM, Bitrix24, HubSpot и другие CRM.
            Никаких потерянных заявок — все клиенты сразу в вашей воронке.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <video
              src=""
              controls
              className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full bg-neutral-200 dark:bg-neutral-800 shadow"
            />
            <video
              src=""
              controls
              className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full bg-neutral-200 dark:bg-neutral-800 shadow"
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      {/* Header */}
      <HeroHeader />
      <HeroSection
        title="Интерактивные планы для застройщиков и риелторов"
        description="Gridix помогает создавать наглядные и удобные планы недвижимости: отмечайте статус квартир, подключайте интеграции с CRM и делитесь планами одной строкой кода. Всё просто, быстро и без лишних затрат."
        actions={[
          {
            text: "Get Started",
            href: "/docs/getting-started",
            variant: "default",
          },

        ]}
        image={{
          light: "https://www.launchuicomponents.com/app-light.png",
          dark: "https://www.launchuicomponents.com/app-dark.png",
          alt: "UI Components Preview",
        }}
      />


      <Timeline
        data={data}
      />



      <ContainerScroll
        titleComponent={
          <>
            <h1 className="text-4xl font-semibold text-black dark:text-white">
              как это выглядит <br />
              <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none">
                ИНТЕРАКТИВНОЕ ДЕМО
              </span>
            </h1>
          </>
        }
      >
        <iframe
          id="gridix-widget"
          src={`https://gridix.live/embed/project/85a56cab-d420-4d3e-aa37-2c21bce021a8?lang=${language}`}
          width="100%"
          height="100%"
        >
        </iframe>



      </ContainerScroll>


      <WorldMap
        labelClassName="text-[7px]"
        dots={[
          // 1. Турция -> ОАЭ
          {
            start: { lat: 39.9334, lng: 32.8597, label: t('country.turkey') },
            end: { lat: 25.2048, lng: 55.2708, label: t('country.uae') }
          },
          // 2. ОАЭ -> Мексика
          {
            start: { lat: 25.2048, lng: 55.2708, label: t('country.uae') },
            end: { lat: 23.6345, lng: -102.5528, label: t('country.mexico') }
          },
          // 3. Мексика -> Доминиканская Республика
          {
            start: { lat: 23.6345, lng: -102.5528, label: t('country.mexico') },
            end: { lat: 18.7357, lng: -70.1627, label: t('country.dominicanRepublic') }
          },
          // 4. Доминиканская Республика -> Индонезия
          {
            start: { lat: 18.7357, lng: -70.1627, label: t('country.dominicanRepublic') },
            end: { lat: -0.7893, lng: 113.9213, label: t('country.indonesia') }
          },
          // 5. Индонезия -> Испания
          {
            start: { lat: -0.7893, lng: 113.9213, label: t('country.indonesia') },
            end: { lat: 40.4637, lng: -3.7492, label: t('country.spain') }
          },
          // 6. Испания -> Грузия
          {
            start: { lat: 40.4637, lng: -3.7492, label: t('country.spain') },
            end: { lat: 42.3154, lng: 43.3569, label: t('country.georgia') }
          },
          // 7. Грузия -> Кипр
          {
            start: { lat: 42.3154, lng: 43.3569, label: t('country.georgia') },
            end: { lat: 35.1264, lng: 33.4299, label: t('country.cyprus') }
          },
          // 8. Кипр -> Черногория
          {
            start: { lat: 35.1264, lng: 33.4299, label: t('country.cyprus') },
            end: { lat: 42.7087, lng: 19.3744, label: t('country.montenegro') }
          },
          // 9. Черногория -> Таиланд
          {
            start: { lat: 42.7087, lng: 19.3744, label: t('country.montenegro') },
            end: { lat: 15.8700, lng: 100.9925, label: t('country.thailand') }
          },
          // 10. Таиланд -> Коста-Рика
          {
            start: { lat: 15.8700, lng: 100.9925, label: t('country.thailand') },
            end: { lat: 9.7489, lng: -83.7534, label: t('country.costaRica') }
          },
          // 11. Коста-Рика -> Панама
          {
            start: { lat: 9.7489, lng: -83.7534, label: t('country.costaRica') },
            end: { lat: 8.5380, lng: -80.7821, label: t('country.panama') }
          },
          // 12. Панама -> Греция
          {
            start: { lat: 8.5380, lng: -80.7821, label: t('country.panama') },
            end: { lat: 39.0742, lng: 21.8243, label: t('country.greece') }
          }
        ]}
        lineColor="#000"
        animationDuration={3}
        loop={true}
      />




      {/* CTA Section */}
      <section className={`${isMobile ? 'py-16' : 'py-24'} bg-gray-900 text-gray-100 relative overflow-hidden`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/10 to-purple-500/10"></div>
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-full px-4 py-2 mb-8 animate-appear">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300">Готовы начать работу?</span>
          </div>

          {/* Title */}
          <h3 className={`${isMobile ? 'text-4xl' : 'text-6xl'} font-semibold mb-6 animate-appear opacity-0 delay-100`}>
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              {t('landing.readyToStart')}
            </span>
          </h3>

          {/* Description */}
          <p className={`${isMobile ? 'text-lg' : 'text-xl'} text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-appear opacity-0 delay-200`}>
            {t('landing.readyToStartDesc')}
          </p>

          {/* Actions */}
          <div className="flex flex-col items-center gap-6 animate-appear opacity-0 delay-300">
            <div className="relative group">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>

              <Button
                size="lg"
                className={`relative bg-white text-gray-900 hover:bg-gray-100 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 ${isMobile ? 'text-lg px-8 py-4' : 'text-xl px-12 py-6'} font-semibold`}
                onClick={goToAdmin}
              >
                <Zap className="w-6 h-6 mr-3" />
                {t('landing.enterAdmin')}
                <ArrowRight className="w-6 h-6 ml-3" />
              </Button>
            </div>

            {/* Features list */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400 max-w-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Бесплатный пробный период</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span>Без обязательств</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-400" />
                <span>Настройка за 5 минут</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`bg-gray-900 text-gray-100 ${isMobile ? 'py-12' : 'py-16'}`}>
        <div className="container mx-auto px-4">
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-8' : 'md:grid-cols-4 gap-8'} mb-8`}>
            {/* Company Info */}
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    Gridix
                  </h3>
                  <p className="text-sm text-gray-400">FloorPlan Wizard</p>
                </div>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Инновационная платформа для создания интерактивных планов недвижимости.
                Упрощаем процесс продаж и повышаем конверсию.
              </p>
              <div className="text-sm text-gray-400">
                <p><strong>Компания:</strong> Gridix</p>
                <p><strong>Адрес:</strong> Грузия, Батуми, ул. Леселидзе 3</p>
                <p><strong>Email:</strong> inbox@gridix.live</p>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">Быстрые ссылки</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={goToAdmin} className="hover:text-blue-400 transition-colors">Админ панель</button></li>
                {/*              <li><button className="hover:text-blue-400 transition-colors">Демо</button></li>
                <li><button className="hover:text-blue-400 transition-colors">Документация</button></li> */}
                <li><button
                  onClick={() => {
                    window.open('https://t.me/Klasterdigital', '_blank');
                  }}
                  className="hover:text-blue-400 transition-colors">Поддержка</button></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">Правовая информация</h4>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={goToPrivacyPolicy} className="hover:text-blue-400 transition-colors">Политика конфиденциальности</button></li>
                <li><button onClick={goToTermsOfService} className="hover:text-blue-400 transition-colors">Пользовательское соглашение</button></li>
                {/* <li><button className="hover:text-blue-400 transition-colors">Cookie Policy</button></li> */}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className={`flex ${isMobile ? 'flex-col gap-4 text-center' : 'justify-between items-center'}`}>
              <p className="text-gray-400">
                © 2024 Gridix. Все права защищены.
              </p>

            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
