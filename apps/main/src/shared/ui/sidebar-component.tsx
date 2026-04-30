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

export { SimplifiedSidebar };

export function getBrowserQueryPage(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("page");
}

// Tabs hidden in demo viewer mode
const DEMO_HIDDEN_TABS = new Set([
  "subscription",
  "widgets",
  "integrations",
  "settings",
]);

export function getAdminNavItems(
  t: (k: string) => string,
  isManager: boolean = false,
  amoWidget: boolean = false,
  crmUnreadCount: number = 0,
  isDemoViewer: boolean = false,
) {
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

  if (isDemoViewer) {
    return items.filter((item) => !DEMO_HIDDEN_TABS.has(item.id));
  }

  if (isManager) {
    return items.filter(
      (item) => item.id !== "subscription" && item.id !== "settings",
    );
  }

  return items;
}

export function getProjectEditorNavItems(
  t: (k: string) => string,
  projectType?: "building" | "object" | null,
  hasMasterplan?: boolean,
) {
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

  if (hasMasterplan) {
    const genplanHidden = new Set([
      "apartments",
      "floorplan",
      "photos",
      "fields",
    ]);
    return items.filter((item) => !genplanHidden.has(item.id));
  }

  if (projectType === "object") {
    return items.filter((item) => item.id !== "floorplan");
  }

  return items;
}

export function getSubProjectEditorNavItems(
  t: (k: string) => string,
  subProjectType?: "building" | "object" | null,
) {
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
}
