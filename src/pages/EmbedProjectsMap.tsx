
import { useParams } from 'react-router-dom';
import InteractiveProjectsMap from '@/components/visualization/InteractiveProjectsMap';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';

const EmbedProjectsMap = () => {
  const { userId } = useParams<{ userId: string }>();

  return (
    <div className="bg-white min-h-screen relative">
      {/* Language toggle in top-right corner */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageToggle />
      </div>
      
      <InteractiveProjectsMap
        userId={userId}
        
      />
    </div>
  );
};

export default EmbedProjectsMap;
