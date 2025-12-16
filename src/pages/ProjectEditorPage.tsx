
import { useNavigate, useParams } from 'react-router-dom';
import ProjectEditor from '@/components/projects/ProjectEditor';

interface ProjectEditorPageProps {
  useId?: boolean;
}

const ProjectEditorPage = ({ useId = false }: ProjectEditorPageProps) => {
  const { projectId, projectSlug } = useParams<{ projectId?: string; projectSlug?: string }>();
  const navigate = useNavigate();
  
  // Определяем идентификатор проекта в зависимости от типа маршрута
  const projectIdentifier = useId ? projectId : (projectSlug || projectId);
  const isNew = !projectIdentifier || projectIdentifier === 'new';
  const actualProjectId = isNew ? '' : projectIdentifier;

  const goBack = () => {
    navigate(-1);
  };

  return (
    <ProjectEditor 
      projectId={actualProjectId}
      isNew={isNew}
      onBack={goBack}
    />
  );
};

export default ProjectEditorPage;
