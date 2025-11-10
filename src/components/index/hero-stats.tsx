import { CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const HeroStats = () => {
  const { t } = useLanguage();
  
  return (

    <div className="flex md:items-start flex-wrap items-center justify-center gap-6 text-sm text-gray-600 max-w-4xl md:flex-col">
      <div className="flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-green-500" />
        <span>{t('landing.heroStats.projectsLaunched')}</span>
      </div>
      <div className="flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-green-500" />
        <span>{t('landing.heroStats.conversionGrowth')}</span>
      </div>
      <div className="flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-green-500" />
        <span>{t('landing.heroStats.countries')}</span>
      </div>
    </div>

  );
};


