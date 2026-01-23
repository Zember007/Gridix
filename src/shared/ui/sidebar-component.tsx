"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsMobile } from "@/hooks/use-mobile";
import { ADMIN_THEME, getAdminThemeVariables } from "@/shared/lib/admin-theme-config";
import { Language, LANGUAGE_CONFIG } from "@/shared/lib/language-utils";
import { useAmoWidget } from "@/hooks/useAmoWidget";
import {

  Folder,

  FileText as DocumentAdd,
  Settings as SettingsIcon,
  User as UserIcon,
  ChevronDown as ChevronDownIcon,
  LogOut,
  Globe,
  BarChart3,
  Package as Integration,
  Building2,
  Code,
  Layers3,
  Camera,
  UserCheck,
  Crown,
  Handshake,
  Building,
  Book,
  Menu,
  ChevronUp,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Button } from "./button";
import { SidebarButton } from "./sidebar-button";
import { Sheet, SheetContent } from "./sheet";



// Simplified admin navigation items
const getAdminNavItems = (t: (k: string) => string, isManager: boolean = false, amoWidget: boolean = false) => {
  const items = [
    { id: "projects", icon: <Building2 size={20} />, label: t('admin.projects') },
    ...(!amoWidget ? [{ id: "leads", icon: <UserCheck size={20} />, label: t('admin.leads') }] : []),
    { id: "subscription", icon: <Crown size={20} />, label: t('admin.subscription') },
    { id: "widgets", icon: <Code size={20} />, label: t('admin.widgets') },
    { id: "integrations", icon: <Integration size={20} />, label: t('admin.integrations') },
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
  onSignOut,
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
  onSignOut?: () => void;
}) {
  const { amoWidget } = useAmoWidget();
  const { t, language, setLanguage } = useLanguage();
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
        <div className={`flex items-center ${isCollapsed ? "flex-col gap-3" : "justify-between"}`}>
          <div className={`flex items-center ${isCollapsed ? "flex-col gap-2" : "gap-4"}`}>
            <img src="/images/logo/gridix_black_logo.svg" alt="Gridix" className="h-8 w-8" />
            {!isCollapsed && !amoWidget && (
              <span
                className="font-semibold whitespace-nowrap"
                style={{ color: ADMIN_THEME.sidebarText }}
              >
                {title}
              </span>
            )}
          </div>

          {!isMobile && (
            <button
              onClick={onToggleCollapse}
              className={`flex items-center justify-center rounded-lg transition-colors  duration-200 ${isCollapsed ? " px-3 py-2" : "p-1"
                }`}
              style={{
                color: ADMIN_THEME.sidebarText,
                border: `1px solid transparent`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = ADMIN_THEME.sidebarActiveBackground;
                e.currentTarget.style.borderColor = ADMIN_THEME.sidebarActiveBorder;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
              }}
              title={isCollapsed ? t('common.more') : t('common.hide')}
            >
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform duration-300 ${isCollapsed ? "rotate-90" : "-rotate-90"}`}
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
      <div className="flex-1 p-4 overflow-y-auto no-scrollbar">
        <nav className="space-y-2">
          {navItems.map((item) => (
            <SidebarButton
              key={item.id}
              id={item.id}
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
              id="partners"
              icon={<Handshake size={20} />}
              label={t('admin.partners')}
              isActive={activeSection === 'partners'}
              isCollapsed={isCollapsed}
              onClick={() => handleSectionChange('partners')}
              href={`/${language}/admin?page=partners`}
            />
            <SidebarButton
              id="documentation"
              icon={<Book size={20} />}
              label={t('admin.documentation')}
              isCollapsed={isCollapsed}
              href={`https://docs.gridix.live/${language === 'ru' ? 'ru' : 'en'}`}
            />

          </div>
          {!amoWidget && <div
            className="p-4"
            style={{ borderTop: `1px solid ${ADMIN_THEME.sidebarBorder}` }}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`flex items-center  w-full ${isCollapsed ? "justify-center flex-col p-1 gap-1" : "gap-3 p-2"} rounded-md  hover:bg-opacity-80 transition-colors`}
                  style={{
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = ADMIN_THEME.sidebarActiveBackground;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: ADMIN_THEME.primaryActive }}
                  >
                    <UserIcon
                      className="h-4 w-4"
                      style={{ color: ADMIN_THEME.textOnPrimary }}
                    />
                  </div>
                  <>
                    <div className="min-w-0 flex-1 text-left ">


                      <p className={`font-medium text-sm ${isCollapsed ? "text-xs text-center break-words" : "whitespace-nowrap"}`} style={isCollapsed ? { lineHeight: '1.2', color: ADMIN_THEME.sidebarText } : { color: ADMIN_THEME.sidebarText }}>
                        {userEmail.split('@')[0]}

                      </p>

                      {!isCollapsed && (

                        <p
                          className="text-xs truncate"
                          style={{ color: ADMIN_THEME.textMuted }}
                        >
                          {userEmail}
                        </p>
                      )}

                    </div>
                    {
                      !isCollapsed && (
                        <ChevronUp className={`h-4 w-4 text-white`} />
                      )
                    }
                  </>

                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align={isCollapsed ? "center" : "end"}
                side={isCollapsed ? "right" : "top"}
                className="w-48"
                style={{
                  backgroundColor: ADMIN_THEME.sidebarBackground,
                  borderColor: ADMIN_THEME.sidebarBorder,
                }}
              >
                <DropdownMenuItem
                  className="flex items-center gap-2 cursor-pointer hover:!bg-transparent"
                  style={{
                    color: ADMIN_THEME.sidebarText,
                  }}
                  onSelect={(e) => e.preventDefault()}
                >
                  <Globe className="h-4 w-4" />
                  <span className="flex-1">{t('common.language') || 'Language'}</span>
                </DropdownMenuItem>
                {Object.entries(LANGUAGE_CONFIG).map(([code, config]) => (
                  <DropdownMenuItem
                    key={code}
                    onClick={() => setLanguage(code as Language)}
                    className={`cursor-pointer pl-8 ${language === code ? '!bg-[var(--admin-sidebar-active-background)]' : 'hover:!bg-[var(--admin-sidebar-active-background)]'}`}
                    style={{
                      color: ADMIN_THEME.sidebarText,

                    }}
                  >
                    <span className="mr-2">{config.flag}</span>
                    {config.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator
                  style={{
                    backgroundColor: ADMIN_THEME.sidebarBorder
                  }}
                />
                <DropdownMenuItem
                  onClick={() => onSignOut?.()}
                  className="flex items-center gap-2 cursor-pointer text-red-600"
                  style={{
                    color: '#dc2626',
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t('auth.signOut')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>}
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
      className={`flex flex-col sidebar_usertour transition-all duration-300 h-screen fixed top-0 overflow-hidden ${isCollapsed ? "w-28" : "w-64"
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
  userEmail,
  activeTab,
  onTabChange,
  isMobileOpen,
  setIsMobileOpen,
  onSignOut,
  isCollapsed,
  setIsCollapsed,
}: {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  userEmail?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
  onSignOut?: () => void;
}) {
  const { t } = useLanguage();
  const { userRole } = useUserRole();
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState(activeTab || "projects");

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

  const { amoWidget } = useAmoWidget();



  const navItems = getAdminNavItems(t, userRole.type === 'manager', amoWidget);

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
      isMobile={isMobile ?? false}
      onMobileClose={() => {
        if (setIsMobileOpen) {
          setIsMobileOpen(false);
        }
      }}
      {...(onSignOut && { onSignOut })}
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
      onClick={() => setIsMobileOpen?.(true)}
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
  isCollapsed,
  setIsCollapsed,
}: {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onSectionChange: (section: string) => void;
  activeTab?: string;
  userEmail?: string;
  projectType?: 'building' | 'object' | null;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}) {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState(activeTab || "general");


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
      isMobile={isMobile ?? false}
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

export function ProjectEditorSidebarMenuButton({
  setIsMobileOpen,
}: {
  setIsMobileOpen?: (open: boolean) => void;
}) {

  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden fixed bottom-2 left-2 z-50 rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-all duration-200"
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
      onClick={() => setIsMobileOpen?.(true)}
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
