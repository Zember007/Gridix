import { TrendingUp, Clock, DollarSign } from 'lucide-react';
import FeaturesCards, { type Feature } from "@/components/ui/feature-shader-cards";
import { useLanguage } from '@/contexts/LanguageContext';


export const KeyMetrics = () => {
  const { t } = useLanguage();
  
  const metrics: Feature[] = [
    {
      title: t('landing.keyMetrics.leadCost.title'),
      icon: (
          <DollarSign className="w-8 h-8 text-white" />
      ),
      content: (
        <div className="text-center">
          <div className="text-4xl font-bold text-white mb-2">{t('landing.keyMetrics.leadCost.reduction')}</div>
          <div className="text-sm text-gray-300 mb-3">{t('landing.keyMetrics.leadCost.reductionText')}</div>
          <div className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-bold">
            {t('landing.keyMetrics.leadCost.reason')}
          </div>
        </div>
      ),
      showLearnMore: false,
    },
    {
      title: t('landing.keyMetrics.conversion.title'),
      icon: (
        <TrendingUp className="w-8 h-8 text-white" />
      ),
      content: (
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-400 line-through mb-1">{t('landing.keyMetrics.conversion.old')}</div>
          <div className="text-5xl font-bold text-white mb-2">{t('landing.keyMetrics.conversion.new')}</div>
          <div className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-bold">
            {t('landing.keyMetrics.conversion.increase')}
          </div>
        </div>
      ),
      showLearnMore: false,
    },
    {
      title: t('landing.keyMetrics.processingSpeed.title'),
      icon: (
          <Clock className="w-8 h-8 text-white" />
      ),
      content: (
        <div className="text-center">
          <div className="text-4xl font-bold text-white mb-2">{t('landing.keyMetrics.processingSpeed.savings')}</div>
          <div className="text-sm text-gray-300 mb-3">{t('landing.keyMetrics.processingSpeed.savingsText')}</div>
          <div className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-bold">
            {t('landing.keyMetrics.processingSpeed.reason')}
          </div>
        </div>
      ),
      showLearnMore: false,
    },
   
  ];

  return (
    <FeaturesCards
      title={t('landing.keyMetrics.title')}
      description={t('landing.keyMetrics.description')}
      features={metrics}
      className="bg-gray-50 dark:bg-gray-900"
      cardHeight="h-80"
    />
  );
};


