
import InteractiveProjectsMap from '@/components/InteractiveProjectsMap';

const EmbedProjectsMap = () => {
  return (
    <div className="bg-white min-h-screen">
      <InteractiveProjectsMap
        onProjectSelect={(project) => {
          window.open(`/embed/project/${project.id}`, '_blank');
        }}
      />
    </div>
  );
};

export default EmbedProjectsMap;
