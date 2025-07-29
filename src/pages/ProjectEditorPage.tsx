
import { useParams } from 'react-router-dom';
import ProjectEditor from '@/components/ProjectEditor';
import { useLanguageNavigation } from '@/hooks/useLanguageNavigation';

const ProjectEditorPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { navigate } = useLanguageNavigation();
  
  const isNew = !projectId || projectId === 'new';
  const actualProjectId = isNew ? '' : projectId;

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
