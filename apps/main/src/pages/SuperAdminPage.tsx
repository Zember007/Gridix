import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { SimplifiedSidebar } from "@/shared/ui/sidebar-component";
import { UsersManagement } from "@/components/superadmin/UsersManagement";
import { SubscriptionsManagement } from "@/components/superadmin/SubscriptionsManagement";
import { ProjectsManagement } from "@/components/superadmin/ProjectsManagement";
import { SystemSettings } from "@/components/superadmin/SystemSettings";
import { PartnersManagement } from "@/components/superadmin/PartnersManagement";
import { PartnerPayoutsManagement } from "@/components/superadmin/PartnerPayoutsManagement";
import { EmailTemplatesManagement } from "@/components/superadmin/EmailTemplatesManagement";
import {
  Loader2,
  Users,
  CreditCard,
  FolderKanban,
  BarChart3,
  Settings,
  Handshake,
  DollarSign,
  Mail,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@gridix/ui";
import { ADMIN_THEME, getAdminThemeVariables } from "@gridix/utils/lib";
import { Button } from "@gridix/ui";
import { Menu } from "lucide-react";
import { Sheet, SheetContent } from "@gridix/ui";
import { useLanguageNavigation } from "@gridix/utils/react";
import { toast } from "sonner";

const SuperAdminPage = () => {
  const { isSuperAdmin, loading } = useSuperAdmin();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { navigate: navigateWithLanguage } = useLanguageNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "users";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      navigate("/");
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

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      await signOut();
      navigateWithLanguage("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  const menuItems = [
    {
      id: "users",
      label: "Пользователи",
      icon: <Users size={20} />,
    },
    {
      id: "subscriptions",
      label: "Подписки",
      icon: <CreditCard size={20} />,
    },
    {
      id: "projects",
      label: "Проекты",
      icon: <FolderKanban size={20} />,
    },
    {
      id: "stats",
      label: "Статистика",
      icon: <BarChart3 size={20} />,
    },
    {
      id: "partners",
      label: "Партнёры",
      icon: <Handshake size={20} />,
    },
    {
      id: "partner-payouts",
      label: "Выплаты",
      icon: <DollarSign size={20} />,
    },
    {
      id: "templates",
      label: "Email Templates",
      icon: <Mail size={20} />,
    },
    {
      id: "settings",
      label: "Настройки",
      icon: <Settings size={20} />,
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "users":
        return <UsersManagement />;
      case "subscriptions":
        return <SubscriptionsManagement />;
      case "projects":
        return <ProjectsManagement />;
      case "partners":
        return <PartnersManagement />;
      case "partner-payouts":
        return <PartnerPayoutsManagement />;
      case "templates":
        return <EmailTemplatesManagement />;
      case "settings":
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
    mobileOpen: isMobileOpen,
    onMobileOpenChange: setIsMobileOpen,
    title: "SuperAdmin",
    isMobile,
    onMobileClose: () => setIsMobileOpen(false),
    showSupportButton: true,
    onSignOut: handleSignOut,
    isSigningOut,
  };

  return (
    <div className="flex min-h-screen bg-background">
      <SimplifiedSidebar {...sidebarProps} />
      {/* Main Content */}
      <div
        className={`flex flex-1 flex-col bg-background transition-all duration-300 ${isCollapsed && !isMobile ? "md:ml-28 md:max-w-[calc(100vw-7rem)]" : "md:ml-64 md:max-w-[calc(100vw-16rem)]"}`}
      >
        <main className="h-screen flex-1 overflow-auto bg-slate-50/50">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default SuperAdminPage;
