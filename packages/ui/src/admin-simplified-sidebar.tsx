import { useEffect, useRef, useState } from "react";
import { useLanguage, useWorkspace } from "@gridix/utils/react";
import { ADMIN_THEME, getAdminThemeVariables } from "@gridix/utils/lib";
import { Language, LANGUAGE_CONFIG } from "@gridix/utils/lib";
import { supabase } from "@gridix/utils/api";
import {
  Book,
  CaretDown as ChevronDownIcon,
  CaretUp as ChevronUp,
  Globe,
  SignOut as LogOut,
  UserCircle as UserIcon,
} from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { SidebarButton } from "./sidebar-button";

const normalizePreferredLanguage = (value: unknown): Language | null => {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  return raw in LANGUAGE_CONFIG ? (raw as Language) : null;
};

const setQueryPage = (page: string) => {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (url.searchParams.get("page") === page) return;
  url.searchParams.set("page", page);
  window.history.pushState({}, "", url.toString());
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
  language: Language;
  setLanguage: (l: Language) => void;
  docsUrl?: string;
  t: (k: string) => string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
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
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`flex w-full items-center ${
            isCollapsed ? "flex-col justify-center gap-1 p-1" : "gap-3 p-2"
          } hover:bg-opacity-80 rounded-md transition-colors`}
          style={{ backgroundColor: "transparent" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor =
              ADMIN_THEME.sidebarActiveBackground;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: ADMIN_THEME.primaryActive }}
          >
            <UserIcon
              className="h-4 w-4"
              style={{ color: ADMIN_THEME.textOnPrimary }}
            />
          </div>

          <div className="min-w-0 flex-1 text-left">
            <p
              className={`text-sm font-medium ${isCollapsed ? "text-center text-xs break-words" : "whitespace-nowrap"}`}
              style={
                isCollapsed
                  ? { lineHeight: "1.2", color: ADMIN_THEME.sidebarText }
                  : { color: ADMIN_THEME.sidebarText }
              }
            >
              {username}
            </p>

            {!isCollapsed ? (
              <p
                className="truncate text-xs"
                style={{ color: ADMIN_THEME.textMuted }}
              >
                {userEmail}
              </p>
            ) : null}
          </div>

          {!isCollapsed ? (
            <ChevronUp
              className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              style={{ color: ADMIN_THEME.sidebarText }}
            />
          ) : null}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={isCollapsed ? "center" : "end"}
        side={isCollapsed ? "right" : "top"}
        className="w-56"
        style={{
          backgroundColor: ADMIN_THEME.sidebarBackground,
          borderColor: ADMIN_THEME.sidebarBorder,
        }}
      >
        <div
          className="border-b px-3 py-2"
          style={{ borderColor: ADMIN_THEME.sidebarBorder }}
        >
          <p
            className="truncate text-sm font-semibold"
            style={{ color: ADMIN_THEME.sidebarText }}
          >
            {username}
          </p>
          <p
            className="truncate text-xs"
            style={{ color: ADMIN_THEME.textMuted }}
          >
            {userEmail}
          </p>
        </div>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger
            className="flex cursor-pointer items-center gap-2"
            style={{ color: ADMIN_THEME.sidebarText }}
          >
            <Globe className="h-4 w-4" />
            <span className="flex-1">{t("common.language")}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent
            className="w-48"
            style={{
              backgroundColor: ADMIN_THEME.sidebarBackground,
              borderColor: ADMIN_THEME.sidebarBorder,
            }}
          >
            {Object.entries(LANGUAGE_CONFIG).map(([code, config]) => (
              <DropdownMenuItem
                key={code}
                className={`cursor-pointer pl-8 ${
                  language === code
                    ? "!bg-[var(--admin-sidebar-active-background)]"
                    : "hover:!bg-[var(--admin-sidebar-active-background)]"
                }`}
                style={{ color: ADMIN_THEME.sidebarText }}
                onSelect={() => {
                  void handleSelectLanguage(code as Language);
                }}
              >
                <span className="mr-2">{config.flag}</span>
                {config.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {docsUrl ? (
          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-2"
            style={{ color: ADMIN_THEME.sidebarText }}
            onSelect={() => {
              window.open(docsUrl, "_blank", "noopener,noreferrer");
            }}
          >
            <Book className="h-4 w-4" />
            <span>{t("admin.documentation")}</span>
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuSeparator
          style={{ backgroundColor: ADMIN_THEME.sidebarBorder }}
        />

        <DropdownMenuItem
          className="flex cursor-pointer items-center gap-2"
          style={{ color: "#dc2626" }}
          onSelect={() => onSignOut?.()}
        >
          <LogOut className="h-4 w-4" />
          <span>{t("auth.signOut")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export interface SimplifiedSidebarNavItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  badge?: React.ReactNode;
  children?: Array<{
    id: string;
    icon: React.ReactNode;
    label: string;
    badge?: React.ReactNode;
  }>;
}

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
  hideTitle = false,
  hideFooter = false,
  docsUrl,
  syncQueryParam = true,
}: {
  navItems: SimplifiedSidebarNavItem[];
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
  hideTitle?: boolean;
  hideFooter?: boolean;
  docsUrl?: string;
  syncQueryParam?: boolean;
}) {
  const { t, language, setLanguage } = useLanguage();
  const { availableWorkspaces } = useWorkspace();
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
        console.error("Failed to load preferred locale", e);
      }
    };

    void loadPreferredLocale();

    return () => {
      cancelled = true;
    };
  }, [setLanguage]);

  // Auto-expand parent if child is active
  useEffect(() => {
    setExpandedItems((prev) => {
      let next = prev;
      primaryNavItems.forEach((item) => {
        if (!item.children) return;
        const hasActiveChild = item.children.some(
          (child) => child.id === activeSection,
        );
        if (!hasActiveChild) return;
        if (next.includes(item.id)) return;
        next = [...next, item.id];
      });
      return next;
    });
  }, [activeSection, primaryNavItems]);

  const toggleExpand = (id: string) => {
    if (isCollapsed && onToggleCollapse) onToggleCollapse();
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  // Apply CSS variables for theme
  useEffect(() => {
    const themeVariables = getAdminThemeVariables(ADMIN_THEME);
    Object.entries(themeVariables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, []);

  const handleSectionChange = (section: string) => {
    if (syncQueryParam) setQueryPage(section);
    onSectionChange(section);
    if (isMobile && onMobileClose) onMobileClose();
  };

  const resolvedDocsUrl =
    docsUrl ?? `https://docs.gridix.live/${language === "ru" ? "ru" : "en"}`;

  const sidebarContent = (
    <>
      {/* Header */}
      <div
        className="p-4"
        style={{ borderBottom: `1px solid ${ADMIN_THEME.sidebarBorder}` }}
      >
        <div
          className={`flex items-center ${isCollapsed ? "flex-col gap-3" : "justify-between"}`}
        >
          <div
            className={`flex items-center ${isCollapsed ? "flex-col gap-2" : "gap-4"}`}
          >
            <img
              src="/images/logo/gridix_black_logo.svg"
              alt="Gridix"
              className="h-8 w-8"
            />
            {!isCollapsed && !hideTitle && (
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
              className={`flex items-center justify-center rounded-lg transition-colors duration-200 ${
                isCollapsed ? "px-3 py-2" : "p-1"
              }`}
              style={{
                color: ADMIN_THEME.sidebarText,
                border: `1px solid transparent`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  ADMIN_THEME.sidebarActiveBackground;
                e.currentTarget.style.borderColor =
                  ADMIN_THEME.sidebarActiveBorder;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = "transparent";
              }}
              title={isCollapsed ? t("common.more") : t("common.hide")}
              type="button"
            >
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform duration-300 ${
                  isCollapsed ? "rotate-90" : "-rotate-90"
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Workspace Switcher */}
      {showWorkspaceSwitcher && availableWorkspaces.length > 0 ? (
        <WorkspaceSwitcher show isCollapsed={isCollapsed} />
      ) : null}

      {/* Navigation */}
      <div className="no-scrollbar flex-1 overflow-y-auto p-4">
        <nav className="space-y-2">
          {primaryNavItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedItems.includes(item.id);
            const isChildActive =
              hasChildren &&
              item.children?.some((child) => child.id === activeSection);

            return (
              <SidebarButton
                key={item.id}
                id={item.id}
                icon={item.icon}
                badge={item.badge}
                label={item.label}
                isActive={
                  hasChildren
                    ? Boolean(isChildActive && !isExpanded)
                    : activeSection === item.id
                }
                isCollapsed={isCollapsed}
                onClick={
                  hasChildren
                    ? () => toggleExpand(item.id)
                    : () => handleSectionChange(item.id)
                }
                {...(hasChildren
                  ? {
                      items: item.children!,
                      activeItemId: activeSection,
                      onItemClick: (id: string) => handleSectionChange(id),
                      isExpanded,
                      onToggleExpand: () => toggleExpand(item.id),
                    }
                  : {})}
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
      {hideFooter ? null : userEmail ? (
        <div
          className="p-4"
          style={{ borderTop: `1px solid ${ADMIN_THEME.sidebarBorder}` }}
        >
          <ProfileFooterMenu
            userEmail={userEmail}
            isCollapsed={isCollapsed}
            {...(onSignOut ? { onSignOut } : {})}
            language={language}
            setLanguage={setLanguage}
            docsUrl={resolvedDocsUrl}
            t={t}
          />
        </div>
      ) : null}
    </>
  );

  if (isMobile) {
    return (
      <>
        <aside
          className="flex h-full flex-col overflow-hidden"
          style={{ backgroundColor: ADMIN_THEME.sidebarBackground }}
        >
          {sidebarContent}
        </aside>
      </>
    );
  }

  return (
    <>
      <aside
        className={`sidebar_usertour fixed top-0 flex h-screen flex-col overflow-hidden transition-all duration-300 ${
          isCollapsed ? "w-28" : "w-64"
        }`}
        style={{
          backgroundColor: ADMIN_THEME.sidebarBackground,
          borderRight: `1px solid ${ADMIN_THEME.sidebarBorder}`,
        }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
