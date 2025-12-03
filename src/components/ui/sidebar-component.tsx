"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsMobile } from "@/hooks/use-mobile";
import { ADMIN_THEME, getAdminThemeVariables } from "@/lib/admin-theme-config";
import {

  Folder,

  FileText as DocumentAdd,
  Settings as SettingsIcon,
  User as UserIcon,
  ChevronDown as ChevronDownIcon,

  BarChart3,

  Zap as Integration,
  Building2,
  Code,
  Layers3,
  Camera,
  UserCheck,
  Globe,
  Crown,
  Handshake,
  Building,
  Book,
  Menu,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "./button";
import { SidebarButton } from "./sidebar-button";
import { Sheet, SheetContent, SheetTrigger } from "./sheet";



// Simplified admin navigation items
const getAdminNavItems = (t: (k: string) => string, isManager: boolean = false, onNavigate?: (path: string) => void) => {
  const items = [
    { id: "projects", icon: <Building2 size={20} />, label: t('admin.projects') },
    { id: "leads", icon: <UserCheck size={20} />, label: t('admin.leads') },
    { id: "subscription", icon: <Crown size={20} />, label: t('admin.subscription') },
    { id: "widgets", icon: <Code size={20} />, label: t('admin.widgets') },
    { id: "analytics", icon: <BarChart3 size={20} />, label: t('admin.analytics.title') },
    { id: "settings", icon: <SettingsIcon size={20} />, label: t('admin.settings') },
  ];

  // Убрать подписки и настройки для менеджеров
  if (isManager) {
    return items.filter(item => item.id !== 'subscription' && item.id !== 'settings');
  }

  return items;
};

// Simplified project editor navigation items
const getProjectEditorNavItems = (t: (k: string) => string, projectType?: 'building' | 'object' | null) => {
  const items = [
    { id: "general", icon: <Building2 size={20} />, label: t('projectEditor.general') },
    { id: "apartments", icon: <Layers3 size={20} />, label: projectType === 'object' ? t('projectEditor.objects') : t('projectEditor.apartmentsTab') },
    { id: "floorplan", icon: <Folder size={20} />, label: t('projectEditor.floorplan') },
    { id: "photos", icon: <Camera size={20} />, label: t('projectEditor.photosTab') },
    { id: "fields", icon: <DocumentAdd size={20} />, label: t('projectEditor.fieldsTab') },
    { id: "integrations", icon: <Integration size={20} />, label: t('projectEditor.integrations') },
    { id: "domains", icon: <Globe size={20} />, label: t('projectEditor.domains') },
  ];

  // Hide floorplan tab for object projects (villas/townhouses)
  if (projectType === 'object') {
    return items.filter(item => item.id !== 'floorplan');
  }

  return items;
};

/* ---------------------------- Simplified Sidebar -------------------------- */

function SimplifiedSidebar({
  navItems,
  activeSection,
  onSectionChange,
  userEmail,
  isCollapsed = false,
  onToggleCollapse,
  title = "Admin Panel",
  showWorkspaceSwitcher = false,
  isMobile = false,
  onMobileClose,
}: {
  navItems: Array<{ id: string; icon: React.ReactNode; label: string }>;
  activeSection: string;
  onSectionChange: (section: string) => void;
  userEmail?: string;
  isCollapsed?: boolean;
  onToggleCollapse: () => void;
  title?: string;
  showWorkspaceSwitcher?: boolean;
  isMobile?: boolean;
  onMobileClose?: () => void;
}) {
  const { t, language } = useLanguage();
  const { activeWorkspaceId, setActiveWorkspaceId, availableWorkspaces } = useWorkspace();

  // Применяем CSS переменные темы
  useEffect(() => {
    const themeVariables = getAdminThemeVariables(ADMIN_THEME);
    Object.entries(themeVariables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, []);

  const handleSectionChange = (section: string) => {
    onSectionChange(section);
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };

  const sidebarContent = (
    <>
      {/* Header */}
      <div
        className="p-4"
        style={{ borderBottom: `1px solid ${ADMIN_THEME.sidebarBorder}` }}
      >
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Building2
                className="h-6 w-6"
                style={{ color: ADMIN_THEME.sidebarText }}
              />
              <span
                className="font-semibold whitespace-nowrap"
                style={{ color: ADMIN_THEME.sidebarText }}
              >
                {title}
              </span>
            </div>
          )}
          {!isMobile && (
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded-md transition-colors"
              style={{
                color: ADMIN_THEME.sidebarText,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = ADMIN_THEME.sidebarActiveBackground;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title={isCollapsed ? t('common.more') : t('common.hide')}
            >
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform duration-300 ${isCollapsed ? "rotate-90" : "-rotate-90"
                  }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Workspace Switcher */}
      {showWorkspaceSwitcher && availableWorkspaces.length > 0 && !isCollapsed && (
        <div
          className="px-4 py-3"
          style={{ borderBottom: `1px solid ${ADMIN_THEME.sidebarBorder}` }}
        >
          <Select
            value={activeWorkspaceId || 'own'}
            onValueChange={(value) => setActiveWorkspaceId(value === 'own' ? null : value)}
          >
            <SelectTrigger
              className="w-full"
              style={{
                borderColor: ADMIN_THEME.sidebarBorder,
                backgroundColor: ADMIN_THEME.sidebarBackground,
                color: ADMIN_THEME.sidebarText,
              }}
            >
              <div className="flex items-center gap-2 flex-1 overflow-hidden">
                <Building className="h-4 w-4 flex-shrink-0" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {availableWorkspaces.map((workspace) => (
                <SelectItem
                  key={workspace.id || 'own'}
                  value={workspace.id || 'own'}
                >
                  <div className="flex items-center gap-2">
                    {workspace.type === 'owner' ? (
                      <Building2 className="h-4 w-4 text-black" />
                    ) : (
                      <UserCheck className="h-4 w-4 text-green-600" />
                    )}
                    <span>{workspace.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 p-4 overflow-y-auto">
        <nav className="space-y-2">
          {navItems.map((item) => (
            <SidebarButton
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={activeSection === item.id}
              isCollapsed={isCollapsed}
              onClick={() => handleSectionChange(item.id)}
            />
          ))}
        </nav>
      </div>

      {/* Footer */}
      {userEmail && (
        <div>
          <div className="flex flex-col gap-2 p-4">
          <SidebarButton
              icon={<Handshake size={20} />}
              label={t('admin.partners')}
              isActive={activeSection === 'partners'}
              isCollapsed={isCollapsed}
              onClick={() => handleSectionChange('partners')}
              href={`/${language}/admin?page=partners`}
            />
            <SidebarButton
              icon={<Book size={20} />}
              label={t('admin.documentation')}
              isCollapsed={isCollapsed}
              href={`https://docs.gridix.live/${language === 'ru' ? 'ru' : 'en'}`}
            />
           
          </div>
          <div
            className="p-4"
            style={{ borderTop: `1px solid ${ADMIN_THEME.sidebarBorder}` }}
          >
            <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
              <div className="flex-shrink-0">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: ADMIN_THEME.primaryActive }}
                >
                  <UserIcon
                    className="h-4 w-4"
                    style={{ color: ADMIN_THEME.textOnPrimary }}
                  />
                </div>
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: ADMIN_THEME.sidebarText }}
                  >
                    {userEmail.split('@')[0]}
                  </p>
                  <p
                    className="text-xs truncate"
                    style={{ color: ADMIN_THEME.textMuted }}
                  >
                    {userEmail}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <>
        <aside
          className="flex flex-col h-full overflow-hidden"
          style={{
            backgroundColor: ADMIN_THEME.sidebarBackground,
          }}
        >
          {sidebarContent}
        </aside>
      </>
    );
  }

  return (
    <aside
      className={`flex flex-col transition-all duration-300 h-screen sticky top-0 overflow-hidden ${isCollapsed ? "w-16" : "w-64"
        }`}
      style={{
        backgroundColor: ADMIN_THEME.sidebarBackground,
        borderRight: `1px solid ${ADMIN_THEME.sidebarBorder}`,
      }}
    >
      {sidebarContent}
    </aside>
  );
}



/* --------------------------------- Layout -------------------------------- */

export function AdminSidebar({
  onNavigate,
  userEmail,
  activeTab,
  onTabChange,
  isMobileOpen,
  setIsMobileOpen,
}: {
  onNavigate?: (path: string) => void;
  userEmail?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}) {
  const { t } = useLanguage();
  const { userRole } = useUserRole();
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState(activeTab || "projects");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    onTabChange?.(section);
    if (isMobile && setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  useEffect(() => {
    setActiveSection(activeTab || "projects");
  }, [activeTab]);


  const navItems = getAdminNavItems(t, userRole.type === 'manager', onNavigate);

  const sidebar = (
    <SimplifiedSidebar
      navItems={navItems}
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
      userEmail={userEmail || ''}
      isCollapsed={isCollapsed}
      onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      title={t('adminSidebar.title')}
      showWorkspaceSwitcher={userRole.type === 'manager'}
      isMobile={isMobile}
      onMobileClose={() => {
        if (setIsMobileOpen) {
          setIsMobileOpen(false);
        }
      }}
    />
  );

  if (isMobile && isMobileOpen !== undefined && setIsMobileOpen) {
    return (
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="w-80 p-0">
          {sidebar}
        </SheetContent>
      </Sheet>
    );
  }

  return sidebar;
}

// Export mobile menu button component
export function AdminSidebarMenuButton({
  setIsMobileOpen,
}: {
  setIsMobileOpen?: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();

  if (!isMobile || !setIsMobileOpen) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="lg:hidden"
      style={{
        color: ADMIN_THEME.sidebarText,
      }}
      onClick={() => setIsMobileOpen(true)}
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}

export function ProjectEditorSidebar({
  onSectionChange,
  activeTab,
  userEmail,
  projectType,
  isMobileOpen,
  setIsMobileOpen,
}: {
  onSectionChange?: (section: string) => void;
  activeTab?: string;
  userEmail?: string;
  projectType?: 'building' | 'object' | null;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}) {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState(activeTab || "general");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    onSectionChange?.(section);
    if (isMobile && setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };


  const navItems = getProjectEditorNavItems(t, projectType);

  const sidebar = (
    <SimplifiedSidebar
      navItems={navItems}
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
      userEmail={userEmail || ''}
      isCollapsed={isCollapsed}
      onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      title={t('projectEditorSidebar.title')}
      isMobile={isMobile}
      onMobileClose={() => {
        if (setIsMobileOpen) {
          setIsMobileOpen(false);
        }
      }}
    />
  );

  if (isMobile && isMobileOpen !== undefined && setIsMobileOpen) {
    return (
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="w-80 p-0">
          {sidebar}
        </SheetContent>
      </Sheet>
    );
  }

  return sidebar;
}

// Export mobile menu button component for ProjectEditor
export function ProjectEditorSidebarMenuButton({
  setIsMobileOpen,
}: {
  setIsMobileOpen?: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();

  if (!isMobile || !setIsMobileOpen) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="lg:hidden"
      style={{
        color: ADMIN_THEME.sidebarText,
      }}
      onClick={() => setIsMobileOpen(true)}
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}

/* ------------------------------- Root Frame ------------------------------ */

export function Frame760() {
  return (
    <div className="bg-background min-h-screen">
      <AdminSidebar />
    </div>
  );
}

export default Frame760;
