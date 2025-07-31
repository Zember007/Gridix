
import { useParams } from 'react-router-dom';
import InteractiveProjectsMap from '@/components/InteractiveProjectsMap';
import { LanguageToggle } from '@/components/LanguageToggle';

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
        onProjectSelect={(project) => {
          window.open(`/embed/project/${project.id}`, '_blank');
        }}
      />
    </div>
  );
};

export default EmbedProjectsMap;
