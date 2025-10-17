
import { Button } from '@/components/ui/button';
import {  CheckCircle, ArrowRight, Zap, Shield, Globe, Smartphone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLanguageNavigation } from '@/hooks/useLanguageNavigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState, useEffect } from 'react';
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import HeroHeader from '@/components/index/header';
import Footer from '@/components/index/footer';
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

  const goToRefundPolicy = () => {
    navigate('/refund-policy');
  };

  const goToPricing = () => {
    navigate('/pricing');
  };

  // Функция для плавной прокрутки к элементу
  const smoothScrollTo = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  // Автоматическое переключение слайдов для интерактивности
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % 6);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Обработчик для плавной прокрутки по якорным ссылкам
  useEffect(() => {
    const handleAnchorClick = (e: Event) => {
      const target = e.target as HTMLAnchorElement;
      if (target.tagName === 'A' && target.getAttribute('href')?.includes('#')) {
        e.preventDefault();
        const elementId = target.getAttribute('href')?.substring(1);
        if (elementId) {
          smoothScrollTo(elementId);
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => {
      document.removeEventListener('click', handleAnchorClick);
    };
  }, []);

  const data = [
    {
      title: t('landing.widgetsTitle'),
      content: (
        <div>
          <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mb-8">
            {t('landing.widgetsDesc')}
          </p>
          <video
            src=""
            controls
            className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full bg-neutral-200 dark:bg-neutral-800 shadow"
          />
        </div>
      ),
    },
    {
      title: t('landing.dataImportTitle'),
      content: (
        <div>
          <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mb-8">
            {t('landing.dataImportDesc')}
          </p>
          <video
            src=""
            controls
            className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full bg-neutral-200 dark:bg-neutral-800 shadow"
          />
        </div>
      ),
    },
    {
      title: t('landing.crmIntegrationTitle'),
      content: (
        <div>
          <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mb-8">
            {t('landing.crmIntegrationDesc')}
          </p>
          <video
            src=""
            controls
            className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full bg-neutral-200 dark:bg-neutral-800 shadow"
          />
        </div>
      ),
    },
  ];



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">

      {/* Header */}
      <HeroHeader />
      <HeroSection
        title={t('landing.interactivePlansTitle')}
        description={t('landing.interactivePlansDesc')}
        actions={[
          {
            text: "Get Started",
            href: `/${language}/admin`,
            variant: "default",
          },
          {
            text: "View Demo",
            href: "#demo",
            variant: "default",
          },

        ]}
        image={{
          light: "/AdminScreen.jpeg",
          dark: "/AdminScreen.jpeg",
          alt: "UI Components Preview",
        }}
      />


      <Timeline
        title={
          <>
            <h2 className="text-xl sm:text-4xl font-semibold text-black dark:text-white">
              {t('landing.whatWeGiveClients')} <br />
              <span className="text-3xl sm:text-5xl md:text-7xl   font-bold mt-1 leading-none">
                {t('landing.ourAdvantages')}
              </span>
            </h2>
          </>
        }
        data={data}
      />



      <ContainerScroll
        titleComponent={
          <>
            <h2 className="text-xl sm:text-4xl font-semibold text-black dark:text-white">
              {t('landing.howItLooks')} <br />
              <span className="text-3xl sm:text-5xl md:text-7xl  font-bold mt-1 leading-none">
                {t('landing.interactiveDemo')}
              </span>
            </h2>
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

      <section className="flex items-center justify-center flex-col gap-20">
        <h2 className="text-xl sm:text-4xl max-w-5xl font-semibold text-black dark:text-white text-center">
          {t('landing.workWithoutBorders')}   <br />
          <span className="text-3xl sm:text-5xl md:text-7xl   font-bold mt-1 leading-none">
            {t('landing.sellFromAnywhere')}
          </span>


        </h2>
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
      </section>




      {/* CTA Section */}
      <section className={`${isMobile ? 'py-16' : 'py-24'} text-gray-100 relative overflow-hidden`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/10 to-purple-500/10"></div>
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">


          {/* Title */}
          <h3 className={`${isMobile ? 'text-4xl' : 'text-6xl'} font-semibold mb-6 animate-appear opacity-0 delay-100`}>
            <span className="bg-black to-gray-300 bg-clip-text text-transparent">
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
                {t('landing.enterAdmin')}
                <ArrowRight className="w-6 h-6 ml-3" />
              </Button>
            </div>

            {/* Features list */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400 max-w-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>{t('landing.freeTrial')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span>{t('landing.noObligations')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-400" />
                <span>{t('landing.setupIn5Minutes')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
