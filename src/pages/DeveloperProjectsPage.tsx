import { useEffect, useState } from "react";
import ProjectList from "@/components/projects/ProjectList";
import ProjectCreationModal from "@/components/projects/ProjectCreationModal";
import { ADMIN_THEME, getAdminThemeVariables } from "@/lib/admin-theme-config";
import { useLanguageNavigation } from "@/hooks/useLanguageNavigation";

const DeveloperProjectsPage = () => {
  const { navigate } = useLanguageNavigation();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const themeVariables = getAdminThemeVariables(ADMIN_THEME);
    Object.entries(themeVariables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, []);

  const handleCreateNew = () => {
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
  };

  const handleManualCreate = () => {
    setShowCreateModal(false);
    navigate("/admin/project/new");
  };

  const handleEditProject = (projectId: string, isNew: boolean) => {
    if (isNew) {
      navigate("/admin/project/new");
    } else {
      navigate(`/admin/project/${projectId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 lg:py-10">
      

        <ProjectList
          onCreateNew={handleCreateNew}
          onEditProject={handleEditProject}
        />
      </div>

      <ProjectCreationModal
        open={showCreateModal}
        onClose={handleCloseCreateModal}
        onManualCreate={handleManualCreate}
      />
    </div>
  );
};

export default DeveloperProjectsPage;


