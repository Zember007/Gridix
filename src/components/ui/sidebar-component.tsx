"use client";

import React, { useState } from "react";
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
} from "lucide-react";

// Softer spring animation curve
const softSpringEasing = "cubic-bezier(0.25, 1.1, 0.4, 1)";


// Simplified admin navigation items
const getAdminNavItems = (onNavigate?: (path: string) => void) => [
  { id: "projects", icon: <Building2 size={20} />, label: "Проекты" },
  { id: "leads", icon: <UserCheck size={20} />, label: "Лиды" },
  { id: "widgets", icon: <Code size={20} />, label: "Виджеты" },
  { id: "analytics", icon: <BarChart3 size={20} />, label: "Аналитика" },
  { id: "settings", icon: <SettingsIcon size={20} />, label: "Настройки" },
];

// Simplified project editor navigation items
const getProjectEditorNavItems = () => [
  { id: "general", icon: <Building2 size={20} />, label: "Основное" },
  { id: "apartments", icon: <Layers3 size={20} />, label: "Квартиры" },
  { id: "floorplan", icon: <Folder size={20} />, label: "Планировки" },
  { id: "photos", icon: <Camera size={20} />, label: "Фото" },
  { id: "fields", icon: <DocumentAdd size={20} />, label: "Поля" },
  { id: "integrations", icon: <Integration size={20} />, label: "Интеграции" },
];

/* ---------------------------- Simplified Sidebar -------------------------- */

function SimplifiedSidebar({
  navItems,
  activeSection,
  onSectionChange,
  userEmail,
  isCollapsed = false,
  onToggleCollapse,
  title = "Admin Panel",
}: {
  navItems: Array<{ id: string; icon: React.ReactNode; label: string }>;
  activeSection: string;
  onSectionChange: (section: string) => void;
  userEmail?: string;
  isCollapsed?: boolean;
  onToggleCollapse: () => void;
  title?: string;
}) {
  return (
    <aside className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 h-screen sticky top-0 ${
      isCollapsed ? "w-16" : "w-64"
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-gray-900 whitespace-nowrap">{title}</span>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
            title={isCollapsed ? "Развернуть" : "Свернуть"}
          >
            <ChevronDownIcon 
              className={`h-4 w-4 text-gray-500 transition-transform duration-300 ${
                isCollapsed ? "rotate-90" : "-rotate-90"
              }`} 
            />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4">
        <nav className="space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                activeSection === item.id
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              } ${isCollapsed ? "justify-center px-2" : ""}`}
              title={isCollapsed ? item.label : undefined}
            >
              <div className="flex-shrink-0">
                {item.icon}
              </div>
              {!isCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Footer */}
      {userEmail && (
        <div className="p-4 border-t border-gray-200">
          <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <UserIcon className="h-4 w-4 text-gray-600" />
              </div>
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userEmail.split('@')[0]}
                </p>
                <p className="text-xs text-gray-500 truncate">
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
  const [activeSection, setActiveSection] = useState(activeTab || "projects");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    onTabChange?.(section);
  };

  const navItems = getAdminNavItems(onNavigate);

  return (
    <SimplifiedSidebar
      navItems={navItems}
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
      userEmail={userEmail}
      isCollapsed={isCollapsed}
      onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      title="Админ Панель"
    />
  );
}

export function ProjectEditorSidebar({ 
  onSectionChange, 
  activeTab,
  userEmail 
}: { 
  onSectionChange?: (section: string) => void; 
  activeTab?: string;
  userEmail?: string;
}) {
  const [activeSection, setActiveSection] = useState(activeTab || "general");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    onSectionChange?.(section);
  };

  const navItems = getProjectEditorNavItems();

  return (
    <SimplifiedSidebar
      navItems={navItems}
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
      userEmail={userEmail}
      isCollapsed={isCollapsed}
      onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      title="Редактор Проекта"
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
