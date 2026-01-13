
import { useState, useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import { MessageCircleQuestionMark } from 'lucide-react';
import { ADMIN_THEME, getAdminThemeVariables } from '@/shared/lib/admin-theme-config';
import ProjectList from '@/components/projects/ProjectList';
import AdminSettings from './AdminSettings';
import AdminWidgets from './AdminWidgets';
import { LeadsManager } from './LeadsManager';
import SubscriptionTab from './SubscriptionTab';
import PartnersPage from '../../pages/PartnersPage';
import ProjectCreationModal from '@/components/projects/ProjectCreationModal';
import { AdminAnalytics } from './AdminAnalytics';
import { useLanguageNavigation } from '@/hooks/useLanguageNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { AdminSidebar, ProjectEditorSidebarMenuButton } from '@/shared/ui/sidebar-component';
import { ManagerBlockedScreen } from '@/components/Auth/ManagerBlockedScreen';
import { useAmoWidget } from '@/hooks/useAmoWidget';
import { startAdminOnboardingTour } from '@/integrations/usertour';

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

  // First admin entry: trigger onboarding tour once per user (handled by Usertour with `once: true`).
  useEffect(() => {
    if (loading) return;
    if (!user?.id) return;

    const run = () => {
      try {
        startAdminOnboardingTour({
          userId: user.id,
          email: userProfile?.email ?? user.email ?? null,
          name:
            userProfile?.full_name ??
            (typeof user.user_metadata?.full_name === 'string'
              ? user.user_metadata.full_name
              : null),
          signedUpAt: user.created_at ?? userProfile?.created_at ?? null,
          companyName:
            userProfile?.company_name ??
            (typeof user.user_metadata?.company_name === 'string'
              ? user.user_metadata.company_name
              : null),
          phone:
            userProfile?.phone ??
            (typeof user.user_metadata?.phone === 'string' ? user.user_metadata.phone : null),
          accountType:
            (typeof user.user_metadata?.account_type === 'string'
              ? user.user_metadata.account_type
              : null),
        });
      } catch (e) {
        // Don't block admin UX if onboarding SDK fails
        console.warn('Failed to start admin onboarding tour:', e);
      }
    };

    void run();
  }, [loading, user, userProfile]);
  const { navigate } = useLanguageNavigation();
  const { userRole, isManager, developerId } = useUserRole();
  const { availableWorkspaces } = useWorkspace();

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const { amoWidget } = useAmoWidget();

  const handleCreateNew = () => {
    if (amoWidget) {
      window.open('https://app.gridix.live/ru/admin', '_blank');
      return;
    }
    setShowCreateModal(true);
  };

  const [isCollapsed, setIsCollapsed] = useState(true);


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
        userEmail={userProfile?.email || user?.email || 'Unknown user'}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        onSignOut={handleSignOut}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <div className={`flex-1 bg-background flex flex-col transition-all duration-300 ${isCollapsed ? 'md:ml-28 md:max-w-[calc(100vw-7rem)] ' : 'md:ml-64 md:max-w-[calc(100vw-16rem)]'}`}>
        {/* Floating Mobile Menu Button */}
        <ProjectEditorSidebarMenuButton
          setIsMobileOpen={setIsMobileOpen}
        />

        <div className={`flex-1  overflow-y-auto ${activeTab === 'subscription' ? 'mx-auto' : ''} ${activeTab !== 'leads' ? '  px-6 py-4 lg:py-6' : ''}`}>
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <ProjectList
                onCreateNew={handleCreateNew}
                onEditProject={handleEditProject}
              />
            </div>
          )}

          {activeTab === 'leads' && (
            <LeadsManager showProjectColumn={!isManager} />
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
          className="fixed bottom-2 right-2 lg:bottom-6 lg:right-6 z-50 rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all duration-200"
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
          <MessageCircleQuestionMark />
        </Button>
      </div>
    </div>
  );
};

export default AdminDashboard;
