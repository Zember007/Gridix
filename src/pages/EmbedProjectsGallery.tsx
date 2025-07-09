
import ProjectsGallery from '@/components/ProjectsGallery';

const EmbedProjectsGallery = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <ProjectsGallery 
        embedMode={true} 
        showHeader={true}
        onProjectSelect={(projectId) => {
          window.open(`/embed/project/${projectId}`, '_blank');
        }}
      />
    </div>
  );
};

export default EmbedProjectsGallery;
