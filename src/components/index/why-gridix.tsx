import { Zap, Sparkles, Settings, Shield } from 'lucide-react';
import FeaturesCards, { type Feature } from "@/components/ui/feature-shader-cards";
import { useLanguage } from '@/contexts/LanguageContext';


export const WhyGridix = () => {
  const { t } = useLanguage();
  
  const features: Feature[] = [
    {
      title: t('landing.whyGridix.quickLaunch.title'),
      icon: (
          <Zap className="w-8 h-8 text-white" />
      ),
      content: (
        <ul className="space-y-3 text-sm text-gray-100">
          <li className="flex items-start gap-2">
            <span className="text-[#e98383] ">✓</span>
            <span>{t('landing.whyGridix.quickLaunch.item1')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#e98383] ">✓</span>
            <span>{t('landing.whyGridix.quickLaunch.item2')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#e98383] ">✓</span>
            <span>{t('landing.whyGridix.quickLaunch.item3')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#e98383] ">✓</span>
            <span>{t('landing.whyGridix.quickLaunch.item4')}</span>
          </li>
        </ul>
      ),
      showLearnMore: false,
    },
    {
      title: t('landing.whyGridix.automation.title'),
      icon: (
          <Sparkles className="w-8 h-8 text-white" />
      ),
      content: (
        <ul className="space-y-3 text-sm text-gray-100">
          <li className="flex items-start gap-2">
            <span className="text-blue-400 ">✓</span>
            <span>{t('landing.whyGridix.automation.item1')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 ">✓</span>
            <span>{t('landing.whyGridix.automation.item2')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 ">✓</span>
            <span>{t('landing.whyGridix.automation.item3')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 ">✓</span>
            <span>{t('landing.whyGridix.automation.item4')}</span>
          </li>
        </ul>
      ),
      showLearnMore: false,
    },
    {
      title: t('landing.whyGridix.flexibility.title'),
      icon: (
          <Settings className="w-8 h-8 text-white" />
      ),
      content: (
        <ul className="space-y-3 text-sm text-gray-100">
          <li className="flex items-start gap-2">
            <span className="text-green-400 ">✓</span>
            <span>{t('landing.whyGridix.flexibility.item1')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 ">✓</span>
            <span>{t('landing.whyGridix.flexibility.item2')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 ">✓</span>
            <span>{t('landing.whyGridix.flexibility.item3')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 ">✓</span>
            <span>{t('landing.whyGridix.flexibility.item4')}</span>
          </li>
        </ul>
      ),
      showLearnMore: false,
    },
    {
      title: t('landing.whyGridix.technology.title'),
      icon: (
          <Shield className="w-8 h-8 text-white" />
      ),
      content: (
        <ul className="space-y-3 text-sm text-gray-100">
          <li className="flex items-start gap-2">
            <span className="text-orange-400 ">✓</span>
            <span>{t('landing.whyGridix.technology.item1')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-400 ">✓</span>
            <span>{t('landing.whyGridix.technology.item2')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-400 ">✓</span>
            <span>{t('landing.whyGridix.technology.item3')}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-400 ">✓</span>
            <span>{t('landing.whyGridix.technology.item4')}</span>
          </li>
        </ul>
      ),
      showLearnMore: false,
    },
  ];

  return (
    <div id="why-gridix">
      <FeaturesCards
        title={t('landing.whyGridix.title')}
        description={t('landing.whyGridix.description')}
        features={features}
        className="bg-white dark:bg-gray-900"
        cardHeight="h-auto min-h-[350px]"
        gridCols="grid-cols-1 md:grid-cols-2"
      />
    </div>
  );
};


