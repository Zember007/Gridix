import {
  Users,
  CreditCard,
  FolderKanban,
  BarChart3,
  Settings,
  Handshake,
  DollarSign,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@gridix/ui";
import { useLanguage } from "@gridix/utils/react";

interface SuperAdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  {
    titleKey: "admin.superadmin.sidebar.users",
    icon: Users,
    value: "users",
  },
  {
    titleKey: "admin.superadmin.sidebar.subscriptions",
    icon: CreditCard,
    value: "subscriptions",
  },
  {
    titleKey: "admin.superadmin.sidebar.projects",
    icon: FolderKanban,
    value: "projects",
  },
  {
    titleKey: "admin.superadmin.sidebar.stats",
    icon: BarChart3,
    value: "stats",
  },
  {
    titleKey: "admin.superadmin.sidebar.partners",
    icon: Handshake,
    value: "partners",
  },
  {
    titleKey: "admin.superadmin.sidebar.partnerPayouts",
    icon: DollarSign,
    value: "partner-payouts",
  },
  {
    titleKey: "admin.superadmin.sidebar.settings",
    icon: Settings,
    value: "settings",
  },
];

export function SuperAdminSidebar({
  activeTab,
  onTabChange,
}: SuperAdminSidebarProps) {
  const { t } = useLanguage();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {t("admin.superadmin.sidebar.group")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.value)}
                    isActive={activeTab === item.value}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{t(item.titleKey)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
