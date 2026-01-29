import { Users, CreditCard, FolderKanban, BarChart3, Settings, Handshake, DollarSign } from 'lucide-react';
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

interface SuperAdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  {
    title: 'Пользователи',
    icon: Users,
    value: 'users',
  },
  {
    title: 'Подписки',
    icon: CreditCard,
    value: 'subscriptions',
  },
  {
    title: 'Проекты',
    icon: FolderKanban,
    value: 'projects',
  },
  {
    title: 'Статистика',
    icon: BarChart3,
    value: 'stats',
  },
  {
    title: 'Партнёры',
    icon: Handshake,
    value: 'partners',
  },
  {
    title: 'Выплаты',
    icon: DollarSign,
    value: 'partner-payouts',
  },
  {
    title: 'Настройки',
    icon: Settings,
    value: 'settings',
  },
];

export function SuperAdminSidebar({ activeTab, onTabChange }: SuperAdminSidebarProps) {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Суперадмин</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.value)}
                    isActive={activeTab === item.value}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
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
