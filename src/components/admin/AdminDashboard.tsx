
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, HelpCircle } from 'lucide-react';
import { ADMIN_THEME, getAdminThemeVariables } from '@/lib/admin-theme-config';
import ProjectList from '@/components/projects/ProjectList';
import AdminSettings from './AdminSettings';
import AdminWidgets from './AdminWidgets';
import { LeadsManager } from './LeadsManager';
import SubscriptionTab from './SubscriptionTab';
import PartnersPage from '../../pages/PartnersPage';
import ProjectCreationModal from '@/components/projects/ProjectCreationModal';
import { AdminAnalytics } from './AdminAnalytics';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLanguageNavigation } from '@/hooks/useLanguageNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { AdminSidebar, AdminSidebarMenuButton } from '@/components/ui/sidebar-component';
import { ManagerBlockedScreen } from '@/components/Auth/ManagerBlockedScreen';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('projects');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { user, userProfile, signOut, loading } = useAuth();

  // Применяем CSS переменные темы
  useEffect(() => {
    const themeVariables = getAdminThemeVariables(ADMIN_THEME);
    Object.entries(themeVariables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });

    const queryParams = new URLSearchParams(window.location.search);
    const tab = queryParams.get('page');

    if (tab) {
      setActiveTab(tab);
    }
  }, []);
  const { navigate } = useLanguageNavigation();
  const { t } = useLanguage();
  const { userRole, isManager, developerId } = useUserRole();
  const { availableWorkspaces } = useWorkspace();

  // Mobile menu state (shared between AdminSidebar and AdminSidebarMenuButton)
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleCreateNew = () => {
    setShowCreateModal(true);
  };

  // Проверяем, заблокирован ли менеджер
  if (userRole.type === 'manager' && (!availableWorkspaces || availableWorkspaces.length === 0)) {
    return <ManagerBlockedScreen />;
  }

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

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar
        onNavigate={navigate}
        userEmail={userProfile?.email || user?.email || 'Unknown user'}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <div className="flex-1 bg-background flex flex-col max-w-[100vw]">
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto  py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Mobile menu button */}
                <AdminSidebarMenuButton
                  setIsMobileOpen={setIsMobileOpen}
                />
                <div className="hidden lg:block">
                  <h1 className="text-2xl font-bold">{t('admin.dashboard')}</h1>
                  <p className="text-muted-foreground text-sm">{t('admin.dashboardDescription')}</p>
                </div>
                <div className="lg:hidden">
                  <h1 className="text-xl font-bold">{t('admin.dashboard')}</h1>
                  <p className="text-muted-foreground text-sm">{t('admin.dashboardDescription')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 lg:gap-4">
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
                  <span className="hidden sm:inline">{t('auth.signOut')}</span>
                </Button>

                <LanguageToggle />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 container mx-auto  py-4 lg:py-8 overflow-auto">
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

          {activeTab === 'partners' && (
            <div className="space-y-6">
              <PartnersPage />
            </div>
          )}

          {activeTab === 'widgets' && (
            <div className="space-y-6">
              <AdminWidgets />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <AdminAnalytics />
            </div>
          )}

          {activeTab === 'settings' && userRole.type !== 'manager' && developerId && (
            <div className="space-y-6">
              <AdminSettings
                userProfile={user!}
                loading={loading}
                developerId={developerId}
                isManager={isManager}
                {...(userRole.managerData && { managerData: userRole.managerData })}
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

        {/* Support Button */}
        <Button
          size={"icon"}
          className="fixed bottom-4 right-4 lg:bottom-6 lg:right-6 z-50 rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all duration-200"
          style={{
            backgroundColor: ADMIN_THEME.primary,
            color: ADMIN_THEME.textOnPrimary,
            borderColor: ADMIN_THEME.primary,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = ADMIN_THEME.primaryHover;
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = ADMIN_THEME.primary;
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onClick={() => {
            window.open('https://t.me/gridix_bot', '_blank');
          }}
        >
          <HelpCircle className="h-5 w-5 lg:h-6 lg:w-6" />
        </Button>
      </div>
    </div>
  );
};

export default AdminDashboard;
