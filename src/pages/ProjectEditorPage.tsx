
import { useParams, useNavigate } from 'react-router-dom';
import ProjectEditor from '@/components/ProjectEditor';

const ProjectEditorPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  const isNew = !projectId || projectId === 'new';
  const actualProjectId = isNew ? '' : projectId;

  const handleBack = () => {
    navigate('/admin');
  };

  return (
    <ProjectEditor 
      projectId={actualProjectId}
      isNew={isNew}
      onBack={handleBack}
    />
  );
};

export default ProjectEditorPage;
