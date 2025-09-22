
import { useParams } from 'react-router-dom';
import ProjectEditor from '@/components/projects/ProjectEditor';
import { useLanguageNavigation } from '@/hooks/useLanguageNavigation';

interface ProjectEditorPageProps {
  useId?: boolean;
}

const ProjectEditorPage = ({ useId = false }: ProjectEditorPageProps) => {
  const { projectId, projectSlug } = useParams<{ projectId?: string; projectSlug?: string }>();
  const { navigate } = useLanguageNavigation();
  
  // Определяем идентификатор проекта в зависимости от типа маршрута
  const projectIdentifier = useId ? projectId : (projectSlug || projectId);
  const isNew = !projectIdentifier || projectIdentifier === 'new';
  const actualProjectId = isNew ? '' : projectIdentifier;

  const goBack = () => {
    navigate('/admin');
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
