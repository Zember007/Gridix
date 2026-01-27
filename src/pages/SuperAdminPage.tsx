import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { SimplifiedSidebar } from '@/shared/ui/sidebar-component';
import { UsersManagement } from '@/components/superadmin/UsersManagement';
import { SubscriptionsManagement } from '@/components/superadmin/SubscriptionsManagement';
import { ProjectsManagement } from '@/components/superadmin/ProjectsManagement';
import { SystemSettings } from '@/components/superadmin/SystemSettings';
import { PartnersManagement } from '@/components/superadmin/PartnersManagement';
import { PartnerPayoutsManagement } from '@/components/superadmin/PartnerPayoutsManagement';
import { EmailTemplatesManagement } from '@/components/superadmin/EmailTemplatesManagement';
import { Loader2, Users, CreditCard, FolderKanban, BarChart3, Settings, Handshake, DollarSign, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { ADMIN_THEME, getAdminThemeVariables } from '@/shared/lib/admin-theme-config';
import { Button } from '@/shared/ui/button';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent } from '@/shared/ui/sheet';

const SuperAdminPage = () => {
  const { isSuperAdmin, loading } = useSuperAdmin();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'users';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      navigate('/');
    }
  }, [isSuperAdmin, loading, navigate]);

  // Sync tab with URL
  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

  // Apply theme
  useEffect(() => {
    const themeVariables = getAdminThemeVariables(ADMIN_THEME);
    Object.entries(themeVariables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, []);

  const menuItems = [
    {
      id: 'users',
      label: 'Пользователи',
      icon: <Users size={20} />,
    },
    {
      id: 'subscriptions',
      label: 'Подписки',
      icon: <CreditCard size={20} />,
    },
    {
      id: 'projects',
      label: 'Проекты',
      icon: <FolderKanban size={20} />,
    },
    {
      id: 'stats',
      label: 'Статистика',
      icon: <BarChart3 size={20} />,
    },
    {
      id: 'partners',
      label: 'Партнёры',
      icon: <Handshake size={20} />,
    },
    {
      id: 'partner-payouts',
      label: 'Выплаты',
      icon: <DollarSign size={20} />,
    },
    {
      id: 'templates',
      label: 'Email Templates',
      icon: <Mail size={20} />,
    },
    {
      id: 'settings',
      label: 'Настройки',
      icon: <Settings size={20} />,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <UsersManagement />;
      case 'subscriptions':
        return <SubscriptionsManagement />;
      case 'projects':
        return <ProjectsManagement />;
      case 'partners':
        return <PartnersManagement />;
      case 'partner-payouts':
        return <PartnerPayoutsManagement />;
      case 'templates':
        return <EmailTemplatesManagement />;
      case 'settings':
        return <SystemSettings />;
      default:
        return <UsersManagement />;
    }
  };

  const sidebarProps = {
    navItems: menuItems,
    activeSection: activeTab,
    onSectionChange: setActiveTab,
    userEmail: user?.email,
    isCollapsed,
    onToggleCollapse: () => setIsCollapsed(!isCollapsed),
    title: "SuperAdmin",
    isMobile,
    onMobileClose: () => setIsMobileOpen(false),
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Sidebar */}
      {isMobile ? (
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetContent side="left" className="p-0 w-80">
            <SimplifiedSidebar {...sidebarProps} />
          </SheetContent>
        </Sheet>
      ) : (
        <SimplifiedSidebar {...sidebarProps} />
      )}

      {/* Main Content */}
      <div className={`flex-1 bg-background flex flex-col transition-all duration-300 ${isCollapsed && !isMobile ? 'md:ml-28 md:max-w-[calc(100vw-7rem)]' : 'md:ml-64 md:max-w-[calc(100vw-16rem)]'}`}>

        {/* Mobile Toggle */}
        {isMobile && (
          <div className="p-4 border-b flex items-center">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
            <span className="ml-2 font-semibold">SuperAdmin</span>
          </div>
        )}

        <main className="flex-1 overflow-auto h-screen bg-slate-50/50">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default SuperAdminPage;
