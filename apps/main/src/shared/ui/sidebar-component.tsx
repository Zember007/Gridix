import { useEffect, useState } from "react";
import { useLanguage } from "@gridix/utils/react";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsMobile } from "@gridix/ui";
import { useAmoWidget } from "@/hooks/useAmoWidget";
import { useAuth } from "@/contexts/AuthContext";
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
  Package as Integration,
  Stack as Layers3,
  UserCheck,
  UserCircle as UserIcon,
  Crown,
} from "@phosphor-icons/react";
import { SimplifiedSidebar } from "@gridix/ui";
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
            label: t("admin.crm"),
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
                label: t("admin.contacts"),
              },
              {
                id: "agent_network",
                icon: <Handshake size={18} />,
                label: t("admin.agent_network"),
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
  isSigningOut = false,
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
  onSignOut?: () => Promise<void> | void;
  isSigningOut?: boolean;
  crmUnreadCount?: number;
}) {
  const { t } = useLanguage();
  const { userRole } = useUserRole();
  const { user, userProfile } = useAuth();
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

  return (
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
      mobileOpen={isMobileOpen}
      onMobileOpenChange={setIsMobileOpen}
      onMobileClose={() => {
        if (setIsMobileOpen) {
          setIsMobileOpen(false);
        }
      }}
      showSupportButton
      {...(onSignOut && { onSignOut })}
      isSigningOut={isSigningOut}
      userId={user?.id}
      preferredLocale={userProfile?.preferred_locale ?? undefined}
    />
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

  return (
    <SimplifiedSidebar
      navItems={navItems}
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
      userEmail={userEmail || ""}
      isCollapsed={isCollapsed}
      onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      title={t("projectEditorSidebar.title")}
      isMobile={isMobile ?? false}
      mobileOpen={isMobileOpen}
      onMobileOpenChange={setIsMobileOpen}
      onMobileClose={() => {
        if (setIsMobileOpen) {
          setIsMobileOpen(false);
        }
      }}
      showSupportButton={false}
    />
  );
}
