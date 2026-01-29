"use client";

import React, { useEffect, useRef, useState } from "react";
import { useLanguage } from "@gridix/utils/react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsMobile } from "@gridix/ui";
import { ADMIN_THEME, getAdminThemeVariables } from "@gridix/utils/lib";
import { Language, LANGUAGE_CONFIG } from "@gridix/utils/lib";
import { supabase } from "@gridix/utils/api";
import { useAmoWidget } from "@/hooks/useAmoWidget";
import {
  Book,
  Briefcase,
  Building,
  Buildings as Building2,
  Camera,
  CaretDown as ChevronDownIcon,
  CaretUp as ChevronUp,
  ChartBar as BarChart3,
  Code,
  FileText as DocumentAdd,
  FolderSimple as Folder,
  Gear as SettingsIcon,
  Globe,
  Handshake,
  List as Menu,
  Package as Integration,
  SignOut as LogOut,
  Stack as Layers3,
  UserCheck,
  UserCircle as UserIcon,
  Crown,
} from "@phosphor-icons/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gridix/ui";
import { Button } from "@gridix/ui";
import { SidebarButton } from "@gridix/ui";
import { Sheet, SheetContent } from "@gridix/ui";
import { UnreadBadge } from "@/shared/ui/UnreadBadge";

const normalizePreferredLanguage = (value: unknown): Language | null => {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();

  return raw in LANGUAGE_CONFIG ? (raw as Language) : null;
};

const getQueryPage = (): string | null => {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("page");
};

const setQueryPage = (page: string) => {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (url.searchParams.get("page") === page) return;
  url.searchParams.set("page", page);
  window.history.pushState({}, "", url.toString());
};



const ProfileMenuItem = ({
  icon,
  label,
  onClick,
  isDanger,
  isIndented,
  isActive,
}: {
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
  isDanger?: boolean;
  isIndented?: boolean;
  isActive?: boolean;
}) => {
  const baseColor = isDanger ? "#dc2626" : ADMIN_THEME.sidebarText;
  const bg = isActive ? "var(--admin-sidebar-active-background)" : "transparent";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2 text-sm transition-colors rounded-md ${
        isIndented ? "pl-8 pr-3" : "px-3"
      } py-2 hover:!bg-[var(--admin-sidebar-active-background)]`}
      style={{
        color: baseColor,
        backgroundColor: bg,
      }}
    >
      {icon ? <span className="shrink-0">{icon}</span> : null}
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
};

const ProfileFooterMenu = ({
  userEmail,
  isCollapsed,
  onSignOut,
  language,
  setLanguage,
  docsUrl,
  t,
}: {
  userEmail: string;
  isCollapsed: boolean;
  onSignOut?: () => void;
  language: string;
  setLanguage: (l: Language) => void;
  docsUrl?: string;
  t: (k: string) => string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) setIsLanguageOpen(false);
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const username = userEmail.split("@")[0] ?? userEmail;

  const handleSelectLanguage = async (nextLanguage: Language) => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!userError && user?.id) {
        await supabase
          .from("user_profiles")
          .update({ preferred_locale: nextLanguage })
          .eq("id", user.id);
      }
    } catch (e) {
      console.error("Failed to persist preferred locale", e);
    } finally {
      setLanguage(nextLanguage);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {isOpen && (
        <div
          className={`absolute bottom-full ${
            isCollapsed ? "left-full ml-4 mb-0" : "left-0 right-0 mb-2"
          } rounded-lg shadow-xl border z-30 overflow-hidden py-1.5 w-56 animate-in fade-in zoom-in-95 duration-150`}
          style={{
            backgroundColor: ADMIN_THEME.sidebarBackground,
            borderColor: ADMIN_THEME.sidebarBorder,
          }}
        >
          <div
            className="px-3 py-2 border-b"
            style={{ borderColor: ADMIN_THEME.sidebarBorder }}
          >
            <p
              className="text-sm font-semibold truncate"
              style={{ color: ADMIN_THEME.sidebarText }}
            >
              {username}
            </p>
            <p className="text-xs truncate" style={{ color: ADMIN_THEME.textMuted }}>
              {userEmail}
            </p>
          </div>

          <div className="py-1">
            <ProfileMenuItem
              icon={<Globe className="h-4 w-4" />}
              label={t("common.language") || "Language"}
              onClick={() => setIsLanguageOpen((v) => !v)}
            />

            {isLanguageOpen && (
              <div className="pt-1">
                {Object.entries(LANGUAGE_CONFIG).map(([code, config]) => (
                  <ProfileMenuItem
                    key={code}
                    label={`${config.flag} ${config.name}`}
                    isIndented
                    isActive={language === code}
                    onClick={() => {
                      void handleSelectLanguage(code as Language);
                    }}
                  />
                ))}
              </div>
            )}

            {docsUrl ? (
              <ProfileMenuItem
                icon={<Book className="h-4 w-4" />}
                label={t("admin.documentation")}
                onClick={() => {
                  window.open(docsUrl, "_blank", "noopener,noreferrer");
                  setIsOpen(false);
                }}
              />
            ) : null}
          </div>

          <div
            className="py-1 border-t"
            style={{ borderColor: ADMIN_THEME.sidebarBorder }}
          >
            <ProfileMenuItem
              icon={<LogOut className="h-4 w-4" />}
              label={t("auth.signOut")}
              isDanger
              onClick={() => onSignOut?.()}
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`flex items-center w-full ${
          isCollapsed ? "justify-center flex-col p-1 gap-1" : "gap-3 p-2"
        } rounded-md hover:bg-opacity-80 transition-colors`}
        style={{
          backgroundColor: "transparent",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = ADMIN_THEME.sidebarActiveBackground;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: ADMIN_THEME.primaryActive }}
        >
          <UserIcon className="h-4 w-4" style={{ color: ADMIN_THEME.textOnPrimary }} />
        </div>

        <>
          <div className="min-w-0 flex-1 text-left">
            <p
              className={`font-medium text-sm ${
                isCollapsed ? "text-xs text-center break-words" : "whitespace-nowrap"
              }`}
              style={
                isCollapsed
                  ? { lineHeight: "1.2", color: ADMIN_THEME.sidebarText }
                  : { color: ADMIN_THEME.sidebarText }
              }
            >
              {username}
            </p>

            {!isCollapsed && (
              <p className="text-xs truncate" style={{ color: ADMIN_THEME.textMuted }}>
                {userEmail}
              </p>
            )}
          </div>

          {!isCollapsed && (
            <ChevronUp
              className={`h-4 w-4 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
              style={{ color: ADMIN_THEME.sidebarText }}
            />
          )}
        </>
      </button>
    </div>
  );
};

// Simplified admin navigation items
const getAdminNavItems = (
  t: (k: string) => string,
  isManager: boolean = false,
  amoWidget: boolean = false,
  crmUnreadCount: number = 0,
) => {
  const items = [
    { id: "projects", icon: <Building2 size={20} />, label: t('admin.projects') },
    ...(!amoWidget ? [
      {
        id: "crm",
        icon: <Briefcase size={20} />,
        badge: crmUnreadCount > 0 ? <UnreadBadge variant="dot" /> : undefined,
        label: t('admin.crm') || 'CRM',
        children: [
          {
            id: "leads",
            icon: <UserCheck size={18} />,
            label: t('admin.leads'),
            badge:
              crmUnreadCount > 0 ? (
                <UnreadBadge variant="pulse" count={crmUnreadCount} />
              ) : undefined,
          },
          { id: "contacts", icon: <UserIcon size={18} />, label: t('admin.contacts') || 'Контакты' },
          /* { id: "agent_network", icon: <Handshake size={18} />, label: t('admin.agent_network') || 'Агентская сеть' }, */
        ]
      }
    ] : []),
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

export function SimplifiedSidebar({
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
  navItems: Array<{
    id: string;
    icon: React.ReactNode;
    label: string;
    badge?: React.ReactNode;
    children?: Array<{ id: string; icon: React.ReactNode; label: string; badge?: React.ReactNode }>;
  }>;
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
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const languageRef = useRef(language);
  const settingsNavItem = navItems.find((item) => item.id === "settings");
  const primaryNavItems = navItems.filter((item) => item.id !== "settings");

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  // Initialize language from user profile preferred_locale
  useEffect(() => {
    let cancelled = false;

    const loadPreferredLocale = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (cancelled || userError || !user?.id) return;

        const { data, error } = await supabase
          .from("user_profiles")
          .select("preferred_locale")
          .eq("id", user.id)
          .single();

        if (cancelled || error) return;

        const preferred = normalizePreferredLanguage(
          (data as { preferred_locale?: unknown } | null)?.preferred_locale,
        );
        if (preferred && preferred !== languageRef.current) {
          setLanguage(preferred);
        }
      } catch (e) {
        // Non-blocking: keep current language if profile load fails
        console.error("Failed to load preferred locale", e);
      }
    };

    void loadPreferredLocale();

    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-expand parent if child is active
  useEffect(() => {
    setExpandedItems((prev) => {
      let next = prev;
      primaryNavItems.forEach((item) => {
        if (!item.children) return;
        const hasActiveChild = item.children.some((child) => child.id === activeSection);
        if (!hasActiveChild) return;
        if (next.includes(item.id)) return;
        next = [...next, item.id];
      });
      return next;
    });
  }, [activeSection, primaryNavItems]);

  const toggleExpand = (id: string) => {
    if (isCollapsed && onToggleCollapse) onToggleCollapse();
    setExpandedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Применяем CSS переменные темы
  useEffect(() => {
    const themeVariables = getAdminThemeVariables(ADMIN_THEME);
    Object.entries(themeVariables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, []);

  const handleSectionChange = (section: string) => {
    setQueryPage(section);
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
          {primaryNavItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedItems.includes(item.id);
            const isChildActive = hasChildren && item.children?.some(child => child.id === activeSection);

            return (
              <SidebarButton
                key={item.id}
                id={item.id}
                icon={item.icon}
                badge={item.badge}
                label={item.label}
                isActive={hasChildren ? Boolean(isChildActive && !isExpanded) : activeSection === item.id}
                isCollapsed={isCollapsed}
                onClick={hasChildren ? () => toggleExpand(item.id) : () => handleSectionChange(item.id)}
                items={hasChildren ? item.children : undefined}
                activeItemId={activeSection}
                onItemClick={(id) => handleSectionChange(id)}
                isExpanded={hasChildren ? isExpanded : undefined}
                onToggleExpand={hasChildren ? () => toggleExpand(item.id) : undefined}
              />
            );
          })}
        </nav>
      </div>

      {/* Pinned Settings (always visible) */}
      {settingsNavItem ? (
        <div
          className="p-4"
          style={{ borderTop: `1px solid ${ADMIN_THEME.sidebarBorder}` }}
        >
          <SidebarButton
            id={settingsNavItem.id}
            icon={settingsNavItem.icon}
            badge={settingsNavItem.badge}
            label={settingsNavItem.label}
            isActive={activeSection === settingsNavItem.id}
            isCollapsed={isCollapsed}
            onClick={() => handleSectionChange(settingsNavItem.id)}
          />
        </div>
      ) : null}

      {/* Footer */}
      {userEmail && (
        <div>
          {!amoWidget && (
            <div
              className="p-4"
              style={{ borderTop: `1px solid ${ADMIN_THEME.sidebarBorder}` }}
            >
              <ProfileFooterMenu
                userEmail={userEmail}
                isCollapsed={isCollapsed}
                onSignOut={onSignOut}
                language={language}
                setLanguage={setLanguage}
                docsUrl={`https://docs.gridix.live/${language === "ru" ? "ru" : "en"}`}
                t={t}
              />
            </div>
          )}
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
  crmUnreadCount = 0,
}: {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  userEmail?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
  onSignOut?: () => void;
  crmUnreadCount?: number;
}) {
  const { t } = useLanguage();
  const { userRole } = useUserRole();
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState(() => activeTab || getQueryPage() || "projects");

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    onTabChange?.(section);
    if (isMobile && setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  useEffect(() => {
    setActiveSection(activeTab || getQueryPage() || "projects");
  }, [activeTab]);

  useEffect(() => {
    const handlePopState = () => {
      const next = getQueryPage() || "projects";
      setActiveSection(next);
      onTabChange?.(next);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [onTabChange]);

  const { amoWidget } = useAmoWidget();



  const navItems = getAdminNavItems(
    t,
    userRole.type === 'manager',
    amoWidget,
    crmUnreadCount,
  );

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
  const [activeSection, setActiveSection] = useState(() => activeTab || getQueryPage() || "general");


  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    onSectionChange?.(section);
    if (isMobile && setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  useEffect(() => {
    setActiveSection(activeTab || getQueryPage() || "general");
  }, [activeTab]);

  useEffect(() => {
    const handlePopState = () => {
      const next = getQueryPage() || "general";
      setActiveSection(next);
      onSectionChange?.(next);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [onSectionChange]);


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
