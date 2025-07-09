
import { useParams } from 'react-router-dom';
import ProjectApartmentSelector from '@/components/ProjectApartmentSelector';

const ProjectWidgetPage = () => {
  const { projectId } = useParams<{ projectId: string }>();

  if (!projectId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Проект не найден</h1>
          <p className="text-muted-foreground">Неверный идентификатор проекта</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ProjectApartmentSelector projectId={projectId} />
    </div>
  );
};

export default ProjectWidgetPage;
