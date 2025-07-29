
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Building2, Settings, Code, BarChart3 } from 'lucide-react';
import ProjectList from './ProjectList';
import AdminSettings from './AdminSettings';
import AdminWidgets from './AdminWidgets';
import ProjectCreationModal from './ProjectCreationModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLanguageNavigation } from '@/hooks/useLanguageNavigation';

interface AdminDashboardProps {
  onBack: () => void;
}

const AdminDashboard = ({ onBack }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState('projects');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { navigate } = useLanguageNavigation();
  const { t } = useLanguage();

  const handleCreateNew = () => {
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
  };

  const handleManualCreate = () => {
    setShowCreateModal(false);
    navigate('/admin/project/new');
  };

  const handleEditProject = (projectId: string, isNew: boolean) => {
    if (isNew) {
      navigate('/admin/project/new');
    } else {
      navigate(`/admin/project/${projectId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('admin.back')}
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{t('admin.dashboard')}</h1>
                <p className="text-muted-foreground">{t('admin.dashboardDescription')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {t('admin.projects')}
            </TabsTrigger>
            <TabsTrigger value="widgets" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              {t('admin.widgets')}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {t('admin.analytics')}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {t('admin.settings')}
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="projects" className="space-y-6">
              <ProjectList 
                onCreateNew={handleCreateNew}
                onEditProject={handleEditProject}
              />
            </TabsContent>

            <TabsContent value="widgets" className="space-y-6">
              <AdminWidgets />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.analytics')}</CardTitle>
                  <CardDescription>
                    {t('admin.analyticsDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{t('admin.analyticsComingSoon')}</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <AdminSettings />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Project Creation Modal */}
      <ProjectCreationModal
        open={showCreateModal}
        onClose={handleCloseCreateModal}
        onManualCreate={handleManualCreate}
      />
    </div>
  );
};

export default AdminDashboard;
