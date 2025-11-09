
import { useLanguage } from '@/contexts/LanguageContext';
import { useLanguageNavigation } from '@/hooks/useLanguageNavigation';
import { useEffect, useState } from 'react';
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import HeroHeader from '@/components/index/header';
import Footer from '@/components/index/footer';
import { HeroSection } from '@/components/blocks/hero-section';
import { KeyMetrics } from '@/components/index/key-metrics';
import { Problems } from '@/components/index/problems';
import { Solution } from '@/components/index/solution';
import { WhyGridix } from '@/components/index/why-gridix';
import { ExpandedDemo } from '@/components/index/expanded-demo';
import { GetStarted } from '@/components/index/get-started';
import { CaseStudy } from '@/components/index/case-study';
import { Testimonials } from '@/components/index/testimonials';
import { CostComparison } from '@/components/index/cost-comparison';
import { FAQ } from '@/components/index/faq';
import { DemoModal } from '@/components/index/demo-modal';


const Index = () => {
  const { navigate } = useLanguageNavigation();
  const { language, t } = useLanguage();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const goToAdmin = () => {
    navigate('/admin');
  };

  const goToPricing = () => {
    navigate('/pricing');
  };

  const openDemoModal = () => {
    setIsDemoModalOpen(true);
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

    setTimeout(() => {
      const elementId = window.location.hash.substring(1);
      if (elementId) {
        smoothScrollTo(elementId);
      }
    }, 100);

    document.addEventListener('click', handleAnchorClick);
    return () => {
      document.removeEventListener('click', handleAnchorClick);
    };
  }, []);



  return (
    <div className="min-h-screen">

      {/* Header */}
      <HeroHeader />

      <HeroSection
        title={t('landing.hero.title')}
        description={t('landing.hero.description')}
        onDemoClick={openDemoModal}
      />

      <DemoModal open={isDemoModalOpen} onOpenChange={setIsDemoModalOpen} />
      <KeyMetrics />
      <Problems />
      <Solution />
      <WhyGridix />

      
      <ExpandedDemo />

      <ContainerScroll
        titleComponent={
          <>
       
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 dark:text-white mb-6">{t('landing.howItLooks.title')}</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed ">
            {t('landing.howItLooks.subtitle')}
            </p>
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

      <GetStarted onGoToAdmin={goToAdmin} onScrollToPricing={goToPricing} />

      <CaseStudy />

      <Testimonials />
      
      <CostComparison onGoToAdmin={goToAdmin} />

      <FAQ />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
