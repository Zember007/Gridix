import { memo, useEffect, useRef, useState } from "react";
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
import { Button } from "./button";
import { Menu, MessageCircleQuestionMark } from "lucide-react";
import { Sheet, SheetContent } from "./sheet";
import { createPortal } from "react-dom";

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
  isMobile = false,
  onSignOut,
  language,
  setLanguage,
  docsUrl,
  t,
  userId,
}: {
  userEmail: string;
  isCollapsed: boolean;
  isMobile?: boolean;
  onSignOut?: () => void;
  language: Language;
  setLanguage: (l: Language) => void;
  docsUrl?: string;
  t: (k: string) => string;
  userId?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const username = userEmail.split("@")[0] ?? userEmail;

  const menuSide = isMobile ? "top" : isCollapsed ? "right" : "top";
  const menuAlign = isMobile ? "start" : isCollapsed ? "center" : "end";

  const handleSelectLanguage = async (nextLanguage: Language) => {
    if (!userId) {
      setLanguage(nextLanguage);
      return;
    }

    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ preferred_locale: nextLanguage })
        .eq("id", userId);

      if (error) {
        throw error;
      }
    } catch (e) {
      console.error("Failed to persist preferred locale", e);
    } finally {
      setLanguage(nextLanguage);
    }
  };

  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setIsLanguageOpen(false);
      }}
    >
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
        align={menuAlign}
        side={menuSide}
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

        {isMobile ? (
          <>
            <div
              className="grid overflow-hidden transition-all duration-200 ease-out"
              style={{
                gridTemplateRows: isLanguageOpen ? "1fr" : "0fr",
                opacity: isLanguageOpen ? 1 : 0,
              }}
            >
              <div className="min-h-0">
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
              </div>
            </div>

            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2"
              style={{ color: ADMIN_THEME.sidebarText }}
              onSelect={(event) => {
                event.preventDefault();
                setIsLanguageOpen((prev) => !prev);
              }}
            >
              <Globe className="h-4 w-4" />
              <span className="flex-1">{t("common.language")}</span>
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform duration-200 ${isLanguageOpen ? "rotate-180" : ""}`}
              />
            </DropdownMenuItem>
          </>
        ) : (
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
        )}

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
const SUPPORT_PORTAL_ID = "gridix-support-portal-root";

const SupportFloatingButton = memo(function SupportFloatingButton() {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const existing = document.getElementById(
      SUPPORT_PORTAL_ID,
    ) as HTMLElement | null;

    if (existing) {
      setPortalRoot(existing);
      return;
    }

    const el = document.createElement("div");
    el.id = SUPPORT_PORTAL_ID;
    document.body.appendChild(el);
    setPortalRoot(el);

    // Важно: не удаляем контейнер на unmount,
    // чтобы избежать гонок/StrictMode дублей.
  }, []);

  if (!portalRoot) return null;

  return createPortal(
    <Button
      size="icon"
      aria-label="Support"
      className="support_usertour fixed right-2 bottom-2 z-50 h-12 w-12 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl lg:right-6 lg:bottom-6"
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
      onClick={() => {
        window.open("https://t.me/gridix_bot", "_blank", "noopener,noreferrer");
      }}
    >
      <MessageCircleQuestionMark />
    </Button>,
    portalRoot,
  );
});
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
  mobileOpen,
  onMobileOpenChange,
  onMobileClose,
  onSignOut,
  hideTitle = false,
  hideFooter = false,
  docsUrl,
  syncQueryParam = true,
  showSupportButton = false,
  userId,
  preferredLocale,
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
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
  onMobileClose?: () => void;
  onSignOut?: () => void;
  hideTitle?: boolean;
  hideFooter?: boolean;
  docsUrl?: string;
  syncQueryParam?: boolean;
  showSupportButton?: boolean;
  userId?: string;
  preferredLocale?: string;
}) {
  const { t, language, setLanguage } = useLanguage();
  const { availableWorkspaces } = useWorkspace();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [manuallyCollapsedItems, setManuallyCollapsedItems] = useState<
    string[]
  >([]);
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const languageRef = useRef(language);

  const resolvedMobileOpen = mobileOpen ?? internalMobileOpen;

  const setResolvedMobileOpen = (open: boolean) => {
    onMobileOpenChange?.(open);
    if (mobileOpen === undefined) {
      setInternalMobileOpen(open);
    }
  };

  const settingsNavItem = navItems.find((item) => item.id === "settings");
  const primaryNavItems = navItems.filter((item) => item.id !== "settings");

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    const preferred = normalizePreferredLanguage(preferredLocale);
    if (preferred && preferred !== languageRef.current) {
      setLanguage(preferred);
    }
  }, [preferredLocale, setLanguage]);

  // Auto-expand parent if child is active
  useEffect(() => {
    setExpandedItems((prev) => {
      let next = prev;
      primaryNavItems.forEach((item) => {
        if (!item.children) return;
        const hasActiveChild = item.children.some(
          (child) => child.id === activeSection,
        );
        if (!hasActiveChild || manuallyCollapsedItems.includes(item.id)) return;
        if (next.includes(item.id)) return;
        next = [...next, item.id];
      });
      return next;
    });
  }, [activeSection, manuallyCollapsedItems, primaryNavItems]);

  const toggleExpand = (id: string) => {
    if (isCollapsed && onToggleCollapse) onToggleCollapse();
    setExpandedItems((prev) => {
      const isCurrentlyExpanded = prev.includes(id);

      setManuallyCollapsedItems((collapsedPrev) => {
        if (isCurrentlyExpanded) {
          return collapsedPrev.includes(id)
            ? collapsedPrev
            : [...collapsedPrev, id];
        }
        return collapsedPrev.filter((itemId) => itemId !== id);
      });

      return isCurrentlyExpanded ? prev.filter((i) => i !== id) : [...prev, id];
    });
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
    if (isMobile) {
      setResolvedMobileOpen(false);
      onMobileClose?.();
    }
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
                    ? Boolean(isChildActive)
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
            isMobile={isMobile}
            {...(onSignOut ? { onSignOut } : {})}
            language={language}
            setLanguage={setLanguage}
            docsUrl={resolvedDocsUrl}
            t={t}
            {...(userId ? { userId } : {})}
          />
        </div>
      ) : null}
    </>
  );

  if (isMobile) {
    return (
      <>
        <Sheet open={resolvedMobileOpen} onOpenChange={setResolvedMobileOpen}>
          <SheetContent side="left" className="w-80 p-0">
            <aside
              className="flex h-full flex-col overflow-hidden"
              style={{ backgroundColor: ADMIN_THEME.sidebarBackground }}
            >
              {sidebarContent}
            </aside>
          </SheetContent>
        </Sheet>

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
          onClick={() => setResolvedMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        {showSupportButton ? <SupportFloatingButton /> : null}
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
      {showSupportButton ? <SupportFloatingButton /> : null}
    </>
  );
}
