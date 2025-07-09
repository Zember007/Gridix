
import ProjectsMap from '@/components/ProjectsMap';

const EmbedProjectsMap = () => {
  return (
    <div className="bg-gray-50 min-h-screen p-4">
      <ProjectsMap
        onProjectSelect={(projectId) => {
          window.open(`/embed/project/${projectId}`, '_blank');
        }}
      />
    </div>
  );
};

export default EmbedProjectsMap;
