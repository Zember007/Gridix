
import { useMemo, useRef, useState, useEffect } from 'react';
import { Button } from "@gridix/ui";
import { MessageCircleQuestionMark, User as UserIcon } from 'lucide-react';
import { ADMIN_THEME, getAdminThemeVariables } from "@gridix/utils/lib";
import ProjectList from '@/components/projects/ProjectList';
import AdminSettings from './AdminSettings';
import AdminWidgets from './AdminWidgets';
import { LeadsManager } from './LeadsManager';
import SubscriptionTab from './SubscriptionTab';
import PartnersPage from '../../pages/PartnersPage';
import { AgencyPartnersPage } from '@/components/admin/partners/AgencyPartnersPage';
import ProjectCreationModal from '@/components/projects/ProjectCreationModal';
import { AdminAnalytics } from './AdminAnalytics';
import { IntegrationsTab } from './IntegrationsTab';
import { useLanguageNavigation } from '@gridix/utils/react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { AdminSidebar, ProjectEditorSidebarMenuButton } from "@/shared/ui/sidebar-component";
import { ManagerBlockedScreen } from '@/components/Auth/ManagerBlockedScreen';
import { useAmoWidget } from '@/hooks/useAmoWidget';
import { useLeadsRealtime } from '@/hooks/useLeadsRealtime';
import { isDevTourMode, startAdminChecklist, startAdminOnboardingTour, startPartnersTour, startProjectCreationTour } from '@gridix/utils/integrations';
import { waitForSelectors } from '@gridix/utils/integrations';
import { AdminContactsPage } from '@/components/admin/contacts/AdminContactsPage';
import { useLeads } from '@/entities/lead/queries/useLeads';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('projects');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { user, userProfile, signOut, loading } = useAuth();

  // Start Realtime subscriptions immediately on admin load
  useLeadsRealtime();
  const startedAdminTourRef = useRef(false);
  const startedAdminChecklistRef = useRef(false);
  const startedPartnersTourRef = useRef(false);
  const startedProjectCreationTourRef = useRef(false);

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

  // Admin main onboarding: usertour tracks "once" internally (no Supabase tracking needed)
  useEffect(() => {
    if (loading) return;

    if (!user?.id) return;

    if (startedAdminTourRef.current) return;

    startedAdminTourRef.current = true;
    const run = async () => {
      try {
        // Wait until core tour anchors are present, otherwise the tour can start "into nothing".
        // This is especially important on first load when ProjectList is still loading.
        const anchorsReady = await waitForSelectors(
          ['.sidebar_usertour', '.projects_list_usertour', '.create_project_usertour', '.support_usertour'],
          { timeoutMs: 8000, intervalMs: 100, debugLabel: 'admin_onboarding' },
        );

        if (!anchorsReady) {
          // Don't mark as started/done; allow retry next visit.
          startedAdminTourRef.current = false;
          return;
        }

        await startAdminOnboardingTour({
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
        startedAdminTourRef.current = false;
      }
    };

    void run();
  }, [loading, user, userProfile]);

  // Admin checklist: once per user (Usertour-side), open on admin load
  useEffect(() => {
    if (loading) return;
    if (!user?.id) return;
    if (startedAdminChecklistRef.current) return;

    startedAdminChecklistRef.current = true;
    const run = async () => {
      try {
        await startAdminChecklist({
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
        console.warn('Failed to start admin checklist:', e);
        startedAdminChecklistRef.current = false;
      }
    };

    void run();
  }, [loading, user, userProfile]);

  // Project creation onboarding: once per user, when opening creation modal
  useEffect(() => {

    if (loading) return;
    const devTour = isDevTourMode();
    // allow re-opening in dev mode

    if (devTour && !showCreateModal) {
      startedProjectCreationTourRef.current = false;
      return;
    }

    if (!showCreateModal) return;
    if (!user?.id) return;
    if (startedProjectCreationTourRef.current) return;

    startedProjectCreationTourRef.current = true;
    const run = async () => {
      try {
        await startProjectCreationTour({
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
        console.warn('Failed to start project creation onboarding tour:', e);
      }
    };

    void run();
  }, [loading, showCreateModal, user, userProfile]);
  const { navigate } = useLanguageNavigation();
  const { userRole, isManager, developerId } = useUserRole();
  const { availableWorkspaces } = useWorkspace();

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const { amoWidget } = useAmoWidget();

  // Needed to show unread dot on CRM in sidebar (and keep it updated in realtime)
  const { leads: allLeadsForUnread } = useLeads();
  const crmUnreadCount = useMemo(
    () => allLeadsForUnread.filter((l) => !l.read_at).length,
    [allLeadsForUnread],
  );

  // Partners onboarding: once per user, when opening partners tab
  useEffect(() => {
    const devTour = isDevTourMode();
    // allow re-opening in dev mode
    if (devTour && activeTab !== 'partners') {
      startedPartnersTourRef.current = false;
      return;
    }
    if (loading) return;
    if (activeTab !== 'partners') return;
    if (!user?.id) return;
    if (startedPartnersTourRef.current) return;

    startedPartnersTourRef.current = true;
    const run = async () => {
      try {
        await startPartnersTour({
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
        console.warn('Failed to start partners onboarding tour:', e);
      }
    };

    void run();
  }, [activeTab, loading, user, userProfile]);

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
        crmUnreadCount={crmUnreadCount}
      />

      <div className={`flex-1 bg-background flex flex-col transition-all duration-300 ${isCollapsed ? 'md:ml-28 md:max-w-[calc(100vw-7rem)] ' : 'md:ml-64 md:max-w-[calc(100vw-16rem)]'}`}>
        {/* Floating Mobile Menu Button */}
        <ProjectEditorSidebarMenuButton
          setIsMobileOpen={setIsMobileOpen}
        />

        <div className={`flex-1  overflow-y-auto ${activeTab === 'subscription' ? 'mx-auto' : ''} ${activeTab !== 'leads' ? '  px-6 py-4 lg:py-6' : ''}`}>
          {activeTab === 'projects' && (
            <div className="space-y-6 projects_list_usertour h-full">
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

          {activeTab === 'agent_network' && (
            <div className="space-y-6">
              <AgencyPartnersPage />
            </div>
          )}

          {activeTab === 'contacts' && (
            <AdminContactsPage />
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

          {activeTab === 'integrations' && userRole.type !== 'manager' && (
            <div className="space-y-6">
              <IntegrationsTab />
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
          className="fixed bottom-2 right-2 lg:bottom-6 lg:right-6 z-50 rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all duration-200 support_usertour"
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
