import { Map, Sparkles, Upload, Users, Globe2, Palette } from 'lucide-react';
import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline";
import { useLanguage } from '@/contexts/LanguageContext';

export const Solution = () => {
  const { t } = useLanguage();
  
  const timelineData = [
    {
      id: 1,
      title: t('landing.solution.features.interactivePlans.title'),
      date: "2024",
      content: t('landing.solution.features.interactivePlans.content'),
      category: t('landing.solution.features.interactivePlans.category'),
      icon: Map,
      relatedIds: [2, 3],
      status: "completed" as const,
      energy: 95,
    },
    {
      id: 2,
      title: t('landing.solution.features.automation.title'),
      date: "2024",
      content: t('landing.solution.features.automation.content'),
      category: t('landing.solution.features.automation.category'),
      icon: Sparkles,
      relatedIds: [1, 4],
      status: "completed" as const,
      energy: 90,
    },
    {
      id: 3,
      title: t('landing.solution.features.dataImport.title'),
      date: "2024",
      content: t('landing.solution.features.dataImport.content'),
      category: t('landing.solution.features.dataImport.category'),
      icon: Upload,
      relatedIds: [1, 4],
      status: "completed" as const,
      energy: 85,
    },
    {
      id: 4,
      title: t('landing.solution.features.teamManagement.title'),
      date: "2024",
      content: t('landing.solution.features.teamManagement.content'),
      category: t('landing.solution.features.teamManagement.category'),
      icon: Users,
      relatedIds: [2, 3, 5],
      status: "completed" as const,
      energy: 88,
    },
    {
      id: 5,
      title: t('landing.solution.features.customDomain.title'),
      date: "2024",
      content: t('landing.solution.features.customDomain.content'),
      category: t('landing.solution.features.customDomain.category'),
      icon: Globe2,
      relatedIds: [4, 6],
      status: "completed" as const,
      energy: 92,
    },
    {
      id: 6,
      title: t('landing.solution.features.customization.title'),
      date: "2024",
      content: t('landing.solution.features.customization.content'),
      category: t('landing.solution.features.customization.category'),
      icon: Palette,
      relatedIds: [5],
      status: "completed" as const,
      energy: 87,
    },
  ];

  return (
    <section id="solution" className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto">
        <div className="text-center mb-16">


          <h2 className="text-4xl md:text-5xl font-light text-gray-900 dark:text-white mb-6">{t('landing.solution.title')}</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {t('landing.solution.description')}
          </p>

        </div>

        <div className="w-full" style={{ minHeight: '600px' }}>
          <RadialOrbitalTimeline timelineData={timelineData} />
        </div>
      </div>
    </section>
  );
};


