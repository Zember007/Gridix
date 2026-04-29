import { startTransition, useEffect, useState } from "react";
import { useLanguage } from "@gridix/utils/react";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsMobile } from "@gridix/ui";
import { useAmoWidget } from "@/hooks/useAmoWidget";
import { useAuth } from "@/contexts/AuthContext";
import { IconMap } from "@tabler/icons-react";
import {
  BarChart3,
  Briefcase,
  Building2,
  Camera,
  Code,
  CreditCard,
  FileText,
  Folder,
  Globe,
  Handshake,
  Home,
  Layers,
  Package,
  Settings,
  UserCheck,
  UserCircle,
} from "lucide-react";
import { SimplifiedSidebar } from "@gridix/ui";
import { UnreadBadge } from "@/shared/ui/UnreadBadge";
import { ExitDemoButton } from "@/features/demo-cabinet";
import { useAdminAccess } from "@/entities/admin-access";

const getQueryPage = (): string | null => {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("page");
};

// Tabs hidden in demo viewer mode
const DEMO_HIDDEN_TABS = new Set([
  "subscription",
  "widgets",
  "integrations",
  "settings",
]);

// Simplified admin navigation items
const getAdminNavItems = (
  t: (k: string) => string,
  isManager: boolean = false,
  amoWidget: boolean = false,
  crmUnreadCount: number = 0,
  isDemoViewer: boolean = false,
) => {
  const items = [
    {
      id: "projects",
      icon: <Building2 className="h-5 w-5" />,
      label: t("admin.projects"),
    },
    ...(!amoWidget
      ? [
          {
            id: "crm",
            icon: <Briefcase className="h-5 w-5" />,
            badge:
              crmUnreadCount > 0 ? <UnreadBadge variant="dot" /> : undefined,
            label: t("admin.crm"),
            children: [
              {
                id: "leads",
                icon: <UserCheck className="h-[18px] w-[18px]" />,
                label: t("admin.leads"),
                badge:
                  crmUnreadCount > 0 ? (
                    <UnreadBadge variant="pulse" count={crmUnreadCount} />
                  ) : undefined,
              },
              {
                id: "contacts",
                icon: <UserCircle className="h-[18px] w-[18px]" />,
                label: t("admin.contacts"),
              },
              {
                id: "agent_network",
                icon: <Handshake className="h-[18px] w-[18px]" />,
                label: t("admin.agent_network"),
              },
            ],
          },
        ]
      : []),

    {
      id: "widgets",
      icon: <Code className="h-5 w-5" />,
      label: t("admin.widgets"),
    },
    {
      id: "integrations",
      icon: <Package className="h-5 w-5" />,
      label: t("admin.integrations"),
    },
    {
      id: "analytics",
      icon: <BarChart3 className="h-5 w-5" />,
      label: t("admin.analytics.title"),
    },
    {
      id: "settings",
      icon: <Settings className="h-5 w-5" />,
      label: t("admin.settings"),
    },
    {
      id: "partners",
      icon: <Handshake className="h-5 w-5" />,
      label: t("admin.partners"),
    },
    {
      id: "subscription",
      icon: <CreditCard className="h-5 w-5" />,
      label: t("admin.billing"),
    },
  ];

  // Demo viewers only see projects, CRM, analytics
  if (isDemoViewer) {
    return items.filter((item) => !DEMO_HIDDEN_TABS.has(item.id));
  }

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
  hasMasterplan?: boolean,
) => {
  const items = [
    {
      id: "general",
      icon: <Building2 className="h-5 w-5" />,
      label: t("projectEditor.general"),
    },
    {
      id: "apartments",
      icon: <Layers className="h-5 w-5" />,
      label:
        projectType === "object"
          ? t("projectEditor.objects")
          : t("projectEditor.apartmentsTab"),
    },
    {
      id: "floorplan",
      icon: <Folder className="h-5 w-5" />,
      label: t("projectEditor.floorplan"),
    },
    {
      id: "photos",
      icon: <Camera className="h-5 w-5" />,
      label: t("projectEditor.photosTab"),
    },
    {
      id: "fields",
      icon: <FileText className="h-5 w-5" />,
      label: t("projectEditor.fieldsTab"),
    },
    {
      id: "genplan",
      icon: <IconMap size={20} />,
      label: t("projectEditor.genplan"),
    },
    {
      id: "domains",
      icon: <Globe className="h-5 w-5" />,
      label: t("projectEditor.domains"),
    },
  ];

  // When genplan is active, hide apartment/floor/photo/field tabs
  if (hasMasterplan) {
    const genplanHidden = new Set([
      "apartments",
      "floorplan",
      "photos",
      "fields",
    ]);
    return items.filter((item) => !genplanHidden.has(item.id));
  }

  // Hide floorplan tab for object projects (villas/townhouses)
  if (projectType === "object") {
    return items.filter((item) => item.id !== "floorplan");
  }

  return items;
};

const getSubProjectEditorNavItems = (
  t: (k: string) => string,
  subProjectType?: "building" | "object" | null,
) => {
  const items = [
    {
      id: "general",
      icon: <Building2 className="h-5 w-5" />,
      label: t("projectEditor.general"),
    },
    {
      id: "facade",
      icon: <Home className="h-5 w-5" />,
      label: t("projectEditor.buildingImage"),
    },
    {
      id: "apartments",
      icon: <Layers className="h-5 w-5" />,
      label:
        subProjectType === "object"
          ? t("projectEditor.objects")
          : t("projectEditor.apartmentsTab"),
    },
    {
      id: "floorplan",
      icon: <Folder className="h-5 w-5" />,
      label: t("projectEditor.floorplan"),
    },
    {
      id: "photos",
      icon: <Camera className="h-5 w-5" />,
      label: t("projectEditor.photosTab"),
    },
    {
      id: "fields",
      icon: <FileText className="h-5 w-5" />,
      label: t("projectEditor.fieldsTab"),
    },
  ];

  if (subProjectType === "object") {
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
  const { isManager } = useUserRole();
  const { user, userProfile } = useAuth();
  const isMobile = useIsMobile();
  const adminAccess = useAdminAccess();

  const [activeSection, setActiveSection] = useState(
    () => activeTab || getQueryPage() || "projects",
  );

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    startTransition(() => {
      onTabChange?.(section);
    });
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
    isManager,
    amoWidget,
    crmUnreadCount,
    adminAccess?.isDemoViewer ?? false,
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
      showWorkspaceSwitcher={isManager || adminAccess?.isDemoWorkspace === true}
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
      exitDemoSlot={
        adminAccess?.isDemoWorkspace ? (
          <ExitDemoButton isCollapsed={isCollapsed} />
        ) : undefined
      }
    />
  );
}

export function ProjectEditorSidebar({
  onSectionChange,
  activeTab,
  userEmail,
  projectType,
  hasMasterplan,
  isMobileOpen,
  setIsMobileOpen,
  isCollapsed,
  setIsCollapsed,
  onSignOut,
  isSigningOut = false,
  isNavLoading = false,
}: {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onSectionChange: (section: string) => void;
  activeTab?: string;
  userEmail?: string;
  projectType?: "building" | "object" | null;
  hasMasterplan?: boolean;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
  onSignOut?: () => Promise<void> | void;
  isSigningOut?: boolean;
  isNavLoading?: boolean;
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

  const navItems = getProjectEditorNavItems(t, projectType, hasMasterplan);

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
      {...(onSignOut && { onSignOut })}
      isSigningOut={isSigningOut}
      isNavLoading={isNavLoading}
    />
  );
}

export function SubProjectEditorSidebar({
  onSectionChange,
  activeTab,
  userEmail,
  subProjectType,
  isMobileOpen,
  setIsMobileOpen,
  isCollapsed,
  setIsCollapsed,
  onSignOut,
  isSigningOut = false,
}: {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onSectionChange: (section: string) => void;
  activeTab?: string;
  userEmail?: string;
  subProjectType?: "building" | "object" | null;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
  onSignOut?: () => Promise<void> | void;
  isSigningOut?: boolean;
}) {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState(
    () => activeTab || "general",
  );

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    onSectionChange?.(section);
    if (isMobile && setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  useEffect(() => {
    setActiveSection(activeTab || "general");
  }, [activeTab]);

  const navItems = getSubProjectEditorNavItems(t, subProjectType);

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
      syncQueryParam={false}
      {...(onSignOut && { onSignOut })}
      isSigningOut={isSigningOut}
    />
  );
}
