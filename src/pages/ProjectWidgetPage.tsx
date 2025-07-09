
import { useParams } from 'react-router-dom';
import ProjectWidget from '@/components/ProjectWidget';

const ProjectWidgetPage = () => {
  const { projectId } = useParams<{ projectId: string }>();

  if (!projectId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Проект не найден</h1>
          <p className="text-gray-600">Неверный идентификатор проекта</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <ProjectWidget projectId={projectId} />
      </div>
    </div>
  );
};

export default ProjectWidgetPage;
