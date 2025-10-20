
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ArrowLeft, Building2, Settings, Code, BarChart3, LogOut, User, Shield, UserCheck, Menu, Crown } from 'lucide-react';
import { ADMIN_THEME, getAdminThemeVariables } from '@/lib/admin-theme-config';
import ProjectList from '@/components/projects/ProjectList';
import AdminSettings from './AdminSettings';
import AdminWidgets from './AdminWidgets';
import { LeadsManager } from './LeadsManager';
import SubscriptionTab from './SubscriptionTab';
import ProjectCreationModal from '@/components/projects/ProjectCreationModal';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLanguageNavigation } from '@/hooks/useLanguageNavigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { AdminSidebar } from '@/components/ui/sidebar-component';

interface AdminDashboardProps {
  onBack: () => void;
}

const AdminDashboard = ({ onBack }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState('projects');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Применяем CSS переменные темы
  useEffect(() => {
    const themeVariables = getAdminThemeVariables(ADMIN_THEME);
    Object.entries(themeVariables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, []);
  const { navigate } = useLanguageNavigation();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const { user, userProfile, signOut, loading } = useAuth();
  const { userRole, isManager, isDeveloper, developerId, primaryDeveloperId } = useUserRole();
  const { isManagerMode } = useWorkspace();

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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                
                {/* Mobile Navigation Drawer */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Menu className="h-4 w-4 mr-2" />
                      {t('common.menu')}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80">
                    <SheetHeader>
                      <SheetTitle>{t('admin.dashboard')}</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <nav className="space-y-2">
                        <button
                          onClick={() => setActiveTab('projects')}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                            activeTab === 'projects' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-muted'
                          }`}
                        >
                          <Building2 className="h-4 w-4" />
                          {t('admin.projects')}
                        </button>
                        <button
                          onClick={() => setActiveTab('leads')}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                            activeTab === 'leads' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-muted'
                          }`}
                        >
                          <UserCheck className="h-4 w-4" />
                          {t('admin.leads')}
                        </button>
                        {!isManagerMode && (
                          <button
                            onClick={() => navigate('/subscription')}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 hover:bg-muted"
                          >
                            <Crown className="h-4 w-4" />
                            {t('admin.subscription')}
                          </button>
                        )}
                        <button
                          onClick={() => setActiveTab('widgets')}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                            activeTab === 'widgets' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-muted'
                          }`}
                        >
                          <Code className="h-4 w-4" />
                          {t('admin.widgets')}
                        </button>
                        <button
                          onClick={() => setActiveTab('analytics')}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                            activeTab === 'analytics' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-muted'
                          }`}
                        >
                          <BarChart3 className="h-4 w-4" />
                          {t('admin.analytics')}
                        </button>
                        <button
                          onClick={() => setActiveTab('settings')}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                            activeTab === 'settings' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-muted'
                          }`}
                        >
                          <Settings className="h-4 w-4" />
                          {t('admin.settings')}
                        </button>
                      </nav>
                    </div>
                    
                    {/* User Info in Drawer */}
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="border-t pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground truncate">
                            {userProfile?.email || user?.email || 'Unknown user'}
                          </span>
                        </div>
                        {isManager && userRole.managerData && (
                          <div className="mb-3">
                            {userRole.managerData.map((data) => (
                              <div key={data.id} className="flex items-center gap-2">
                                <Shield className="h-3 w-3 text-blue-600" />
                                <span className="text-xs text-blue-600 truncate">
                                  Менеджер: {data.developer_profile?.company_name}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleSignOut}
                            className="flex-1"
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            {t('auth.signOut')}
                          </Button>
                          <LanguageToggle />
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
              
              <div>
                <h1 className="text-xl font-bold">{t('admin.dashboard')}</h1>
                <p className="text-muted-foreground text-sm">{t('admin.dashboardDescription')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Show content based on activeTab without Tabs wrapper */}
          
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <ProjectList 
                onCreateNew={handleCreateNew}
                onEditProject={handleEditProject}
              />
            </div>
          )}

          {activeTab === 'leads' && (
            <div className="space-y-6">
              <LeadsManager showProjectColumn={!isManager} />
            </div>
          )}

          {activeTab === 'widgets' && (
            <div className="space-y-6">
              <AdminWidgets />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
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
            </div>
          )}

          {activeTab === 'subscription' && !isManagerMode && (
            <div className="space-y-6">
              <SubscriptionTab />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <AdminSettings 
                userProfile={user!} 
                loading={loading} 
                developerId={developerId}
                isManager={isManager}
                managerData={userRole.managerData}
              />
            </div>
          )}
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
                  style={{
                    backgroundColor: ADMIN_THEME.primary,
                    color: ADMIN_THEME.textOnPrimary,
                    borderColor: ADMIN_THEME.primary,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = ADMIN_THEME.primaryHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = ADMIN_THEME.primary;
                  }}
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
          {/* Remove Tabs wrapper and show content based on activeTab */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <ProjectList 
                onCreateNew={handleCreateNew}
                onEditProject={handleEditProject}
              />
            </div>
          )}

          {activeTab === 'leads' && (
            <div className="space-y-6">
              <LeadsManager showProjectColumn={!isManager} />
            </div>
          )}

          {activeTab === 'subscription' && userRole.type !== 'manager' && (
            <div className="space-y-6">
              <SubscriptionTab />
            </div>
          )}

          {activeTab === 'widgets' && (
            <div className="space-y-6">
              <AdminWidgets />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
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
            </div>
          )}

          {activeTab === 'settings' && userRole.type !== 'manager' && (
            <div className="space-y-6">
              <AdminSettings 
                userProfile={user!} 
                loading={loading} 
                developerId={developerId}
                isManager={isManager}
                managerData={userRole.managerData}
              />
            </div>
          )}
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
