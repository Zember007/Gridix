import { lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';

// Lazy load heavy map component
const InteractiveProjectsMap = lazy(() => import('@/components/visualization/InteractiveProjectsMap'));

const EmbedProjectsMap = () => {
  const { userId } = useParams<{ userId: string }>();

  return (
    <div className="bg-white min-h-screen relative">
      {/* Language toggle in top-right corner */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageToggle />
      </div>
      
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div></div>}>
        <InteractiveProjectsMap
          userId={userId}
          
        />
      </Suspense>
    </div>
  );
};

export default EmbedProjectsMap;
