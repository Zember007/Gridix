"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useUserRole } from "@/hooks/useUserRole";
import { ADMIN_THEME, getAdminThemeVariables } from "@/lib/admin-theme-config";
import {
  Search as SearchIcon,
  LayoutDashboard as Dashboard,
  CheckSquare as Task,
  Folder,
  Calendar as CalendarIcon,
  Users as UserMultiple,
  BarChart3 as Analytics,
  FileText as DocumentAdd,
  Settings as SettingsIcon,
  User as UserIcon,
  ChevronDown as ChevronDownIcon,
  Plus as AddLarge,
  Filter,
  Clock as Time,
  RotateCw as InProgress,
  Check as CheckmarkOutline,
  Flag,
  Archive,
  Eye as View,
  FileBarChart as Report,
  Star as StarFilled,
  Users as Group,
  BarChart as ChartBar,
  BarChart3,
  FolderOpen,
  Share,
  Upload as CloudUpload,
  Shield as Security,
  Bell as Notification,
  Zap as Integration,
  Building2,
  Code,
  LogOut,
  ArrowLeft,
  Save,
  Image,
  Layers3,
  Camera,
  UserCheck,
  Globe,
  Crown,
  Handshake,
  Building,
  ChevronDown,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";



// Simplified admin navigation items
const getAdminNavItems = (t: (k: string) => string, isManager: boolean = false, onNavigate?: (path: string) => void) => {
  const items = [
    { id: "projects", icon: <Building2 size={20} />, label: t('admin.projects') },
    { id: "leads", icon: <UserCheck size={20} />, label: t('admin.leads') },
    { id: "subscription", icon: <Crown size={20} />, label: t('admin.subscription') },
    { id: "partners", icon: <Handshake size={20} />, label: t('admin.partners') },
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
}: {
  navItems: Array<{ id: string; icon: React.ReactNode; label: string }>;
  activeSection: string;
  onSectionChange: (section: string) => void;
  userEmail?: string;
  isCollapsed?: boolean;
  onToggleCollapse: () => void;
  title?: string;
  showWorkspaceSwitcher?: boolean;
}) {
  const { t } = useLanguage();
  const { activeWorkspaceId, setActiveWorkspaceId, availableWorkspaces } = useWorkspace();

  // Применяем CSS переменные темы
  useEffect(() => {
    const themeVariables = getAdminThemeVariables(ADMIN_THEME);
    Object.entries(themeVariables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, []);

  return (
    <aside 
      className={`flex flex-col transition-all duration-300 h-screen sticky top-0 overflow-hidden ${
        isCollapsed ? "w-16" : "w-64"
      }`}
      style={{
        backgroundColor: ADMIN_THEME.sidebarBackground,
        borderRight: `1px solid ${ADMIN_THEME.sidebarBorder}`,
      }}
    >
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
              className={`h-4 w-4 transition-transform duration-300 ${
                isCollapsed ? "rotate-90" : "-rotate-90"
              }`} 
            />
          </button>
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
      <div className="flex-1 p-4">
        <nav className="space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${isCollapsed ? "justify-center px-2" : ""}`}
              style={{
                backgroundColor: activeSection === item.id ? ADMIN_THEME.sidebarActiveBackground : 'transparent',
                border: activeSection === item.id ? `1px solid ${ADMIN_THEME.sidebarActiveBorder}` : '1px solid transparent',
                color: activeSection === item.id ? ADMIN_THEME.sidebarActiveText : ADMIN_THEME.sidebarText,
              }}
              onMouseEnter={(e) => {
                if (activeSection !== item.id) {
                  e.currentTarget.style.backgroundColor = ADMIN_THEME.primaryHover;
                  e.currentTarget.style.color = ADMIN_THEME.sidebarTextHover;
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== item.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = ADMIN_THEME.sidebarText;
                }
              }}
              title={isCollapsed ? item.label : undefined}
            >
              <div className="flex-shrink-0">
                {item.icon}
              </div>
              {!isCollapsed && (
                <span className="font-medium whitespace-nowrap">{item.label}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Footer */}
      {userEmail && (
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
      )}
    </aside>
  );
}



/* --------------------------------- Layout -------------------------------- */

export function AdminSidebar({ 
  onNavigate, 
  userEmail,
  activeTab,
  onTabChange
}: { 
  onNavigate?: (path: string) => void; 
  userEmail?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}) {
  const { t } = useLanguage();
  const { userRole } = useUserRole();
  const [activeSection, setActiveSection] = useState(activeTab || "projects");
  const [isCollapsed, setIsCollapsed] = useState(false); // Collapsed by default

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    onTabChange?.(section);
  };

  const navItems = getAdminNavItems(t, userRole.type === 'manager', onNavigate);

  return (
    <SimplifiedSidebar
      navItems={navItems}
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
      userEmail={userEmail}
      isCollapsed={isCollapsed}
      onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      title={t('adminSidebar.title')}
      showWorkspaceSwitcher={userRole.type === 'manager'}
    />
  );
}

export function ProjectEditorSidebar({ 
  onSectionChange, 
  activeTab,
  userEmail,
  projectType
}: { 
  onSectionChange?: (section: string) => void; 
  activeTab?: string;
  userEmail?: string;
  projectType?: 'building' | 'object' | null;
}) {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState(activeTab || "general");
  const [isCollapsed, setIsCollapsed] = useState(false); // Collapsed by default

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    onSectionChange?.(section);
  };

  const navItems = getProjectEditorNavItems(t, projectType);

  return (
    <SimplifiedSidebar
      navItems={navItems}
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
      userEmail={userEmail}
      isCollapsed={isCollapsed}
      onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      title={t('projectEditorSidebar.title')}
    />
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
