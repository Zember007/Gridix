import React, { useEffect, useRef, useState } from "react";
import { useLanguage } from "@gridix/utils/react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsMobile } from "@gridix/ui";
import { ADMIN_THEME, getAdminThemeVariables } from "@gridix/utils/lib";
import { useAmoWidget } from "@/hooks/useAmoWidget";
import {
  Book,
  Briefcase,
  Buildings as Building2,
  Camera,
  ChartBar as BarChart3,
  Code,
  FileText as DocumentAdd,
  FolderSimple as Folder,
  Gear as SettingsIcon,
  Globe,
  Handshake,
  List as Menu,
  Package as Integration,
  Stack as Layers3,
  UserCheck,
  UserCircle as UserIcon,
  Crown,
} from "@phosphor-icons/react";
import { Button } from "@gridix/ui";
import { SidebarButton } from "@gridix/ui";
import { SimplifiedSidebar } from "@gridix/ui";
import { Sheet, SheetContent } from "@gridix/ui";
import { UnreadBadge } from "@/shared/ui/UnreadBadge";

const getQueryPage = (): string | null => {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("page");
};

// Simplified admin navigation items
const getAdminNavItems = (
  t: (k: string) => string,
  isManager: boolean = false,
  amoWidget: boolean = false,
  crmUnreadCount: number = 0,
) => {
  const items = [
    {
      id: "projects",
      icon: <Building2 size={20} />,
      label: t("admin.projects"),
    },
    ...(!amoWidget
      ? [
          {
            id: "crm",
            icon: <Briefcase size={20} />,
            badge:
              crmUnreadCount > 0 ? <UnreadBadge variant="dot" /> : undefined,
            label: t("admin.crm") || "CRM",
            children: [
              {
                id: "leads",
                icon: <UserCheck size={18} />,
                label: t("admin.leads"),
                badge:
                  crmUnreadCount > 0 ? (
                    <UnreadBadge variant="pulse" count={crmUnreadCount} />
                  ) : undefined,
              },
              {
                id: "contacts",
                icon: <UserIcon size={18} />,
                label: t("admin.contacts") || "Контакты",
              },
              {
                id: "agent_network",
                icon: <Handshake size={18} />,
                label: t("admin.agent_network") || "Агентская сеть",
              },
            ],
          },
        ]
      : []),
    {
      id: "subscription",
      icon: <Crown size={20} />,
      label: t("admin.subscription"),
    },
    { id: "widgets", icon: <Code size={20} />, label: t("admin.widgets") },
    {
      id: "integrations",
      icon: <Integration size={20} />,
      label: t("admin.integrations"),
    },
    {
      id: "analytics",
      icon: <BarChart3 size={20} />,
      label: t("admin.analytics.title"),
    },
    {
      id: "settings",
      icon: <SettingsIcon size={20} />,
      label: t("admin.settings"),
    },
    {
      id: "partners",
      icon: <Handshake size={20} />,
      label: t("admin.partners"),
    },
  ];

  // Убрать подписки и настройки для менеджеров
  if (isManager) {
    return items.filter(
      (item) => item.id !== "subscription" && item.id !== "settings",
    );
  }

  return items;
};

// Simplified project editor navigation items
const getProjectEditorNavItems = (
  t: (k: string) => string,
  projectType?: "building" | "object" | null,
) => {
  const items = [
    {
      id: "general",
      icon: <Building2 size={20} />,
      label: t("projectEditor.general"),
    },
    {
      id: "apartments",
      icon: <Layers3 size={20} />,
      label:
        projectType === "object"
          ? t("projectEditor.objects")
          : t("projectEditor.apartmentsTab"),
    },
    {
      id: "floorplan",
      icon: <Folder size={20} />,
      label: t("projectEditor.floorplan"),
    },
    {
      id: "photos",
      icon: <Camera size={20} />,
      label: t("projectEditor.photosTab"),
    },
    {
      id: "fields",
      icon: <DocumentAdd size={20} />,
      label: t("projectEditor.fieldsTab"),
    },
    {
      id: "domains",
      icon: <Globe size={20} />,
      label: t("projectEditor.domains"),
    },
  ];

  // Hide floorplan tab for object projects (villas/townhouses)
  if (projectType === "object") {
    return items.filter((item) => item.id !== "floorplan");
  }

  return items;
};

export { SimplifiedSidebar };

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
  const [activeSection, setActiveSection] = useState(
    () => activeTab || getQueryPage() || "projects",
  );

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
    userRole.type === "manager",
    amoWidget,
    crmUnreadCount,
  );

  const sidebar = (
    <SimplifiedSidebar
      navItems={navItems}
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
      userEmail={userEmail || ""}
      isCollapsed={isCollapsed}
      onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      title={t("adminSidebar.title")}
      showWorkspaceSwitcher={userRole.type === "manager"}
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
  projectType?: "building" | "object" | null;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}) {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState(
    () => activeTab || getQueryPage() || "general",
  );

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
      userEmail={userEmail || ""}
      isCollapsed={isCollapsed}
      onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      title={t("projectEditorSidebar.title")}
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
      className="fixed bottom-2 left-2 z-50 h-12 w-12 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl md:hidden"
      style={{
        backgroundColor: ADMIN_THEME.primary,
        color: ADMIN_THEME.textOnPrimary,
        borderColor: ADMIN_THEME.primary,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = ADMIN_THEME.primaryHover;
        e.currentTarget.style.transform = "scale(1.05)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = ADMIN_THEME.primary;
        e.currentTarget.style.transform = "scale(1)";
      }}
      onClick={() => setIsMobileOpen?.(true)}
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
