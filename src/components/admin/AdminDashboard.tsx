
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Building2, Settings, Code, BarChart3, LogOut, User, Shield } from 'lucide-react';
import ProjectList from '@/components/projects/ProjectList';
import AdminSettings from './AdminSettings';
import AdminWidgets from './AdminWidgets';
import ProjectCreationModal from '@/components/projects/ProjectCreationModal';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLanguageNavigation } from '@/hooks/useLanguageNavigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { AdminSidebar } from '@/components/ui/sidebar-component';

interface AdminDashboardProps {
  onBack: () => void;
}

const AdminDashboard = ({ onBack }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState('projects');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { navigate } = useLanguageNavigation();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const { user, userProfile, signOut, loading } = useAuth();
  const { userRole, isManager, isDeveloper, developerId } = useUserRole();

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

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Mobile view - keep original layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Button variant="ghost" size="sm" onClick={onBack} className="self-start">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('admin.back')}
                </Button>
                <div>
                  <h1 className="text-xl font-bold">{t('admin.dashboard')}</h1>
                  <p className="text-muted-foreground text-sm">{t('admin.dashboardDescription')}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {/* User Info */}
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {userProfile?.email || user?.email || 'Unknown user'}
                    </span>
                  </div>
                  {isManager && userRole.managerData && (
                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3 text-blue-600" />
                      <span className="text-xs text-blue-600">
                        Менеджер: {userRole.managerData.developer_profile?.company_name}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Sign Out Button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="flex items-center gap-2 self-end"
                >
                  <LogOut className="h-4 w-4" />
                  {t('auth.signOut')}
                </Button>
                
                <LanguageToggle />
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 gap-1">
              <TabsTrigger value="projects" className="flex items-center gap-1 text-xs">
                <Building2 className="h-3 w-3" />
                {t('admin.projects').substring(0, 8)}
              </TabsTrigger>
              <TabsTrigger value="widgets" className="flex items-center gap-1 text-xs">
                <Code className="h-3 w-3" />
                {t('admin.widgets').substring(0, 8)}
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-1 text-xs">
                <BarChart3 className="h-3 w-3" />
                {t('admin.analytics').substring(0, 8)}
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-1 text-xs">
                <Settings className="h-3 w-3" />
                {t('admin.settings').substring(0, 8)}
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="projects" className="space-y-6">
                <ProjectList 
                  onCreateNew={handleCreateNew}
                  onEditProject={handleEditProject}
                  developerId={developerId}
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
                <AdminSettings 
                  userProfile={user!} 
                  loading={loading} 
                  developerId={developerId}
                  isManager={isManager}
                  managerData={userRole.managerData}
                />
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
  }

  // Desktop view with sidebar
  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar 
        onNavigate={navigate}
        userEmail={userProfile?.email || user?.email || 'Unknown user'}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      <div className="flex-1 bg-background">
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
                  <p className="text-muted-foreground text-sm">{t('admin.dashboardDescription')}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {/* Sign Out Button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  {t('auth.signOut')}
                </Button>
                
                <LanguageToggle />
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>

            <div className="mt-6">
              <TabsContent value="projects" className="space-y-6">
                <ProjectList 
                  onCreateNew={handleCreateNew}
                  onEditProject={handleEditProject}
                  developerId={developerId}
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
                <AdminSettings 
                  userProfile={user!} 
                  loading={loading} 
                  developerId={developerId}
                  isManager={isManager}
                  managerData={userRole.managerData}
                />
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
    </div>
  );
};

export default AdminDashboard;
