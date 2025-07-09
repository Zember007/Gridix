
import { useParams } from 'react-router-dom';
import ProjectWidget from '@/components/ProjectWidget';

const EmbedProjectWidget = () => {
  const { projectId } = useParams<{ projectId: string }>();

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Проект не найден</h1>
          <p className="text-gray-600">Неверный идентификатор проекта</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <ProjectWidget projectId={projectId} showHeader={true} />
    </div>
  );
};

export default EmbedProjectWidget;
