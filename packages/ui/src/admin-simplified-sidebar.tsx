import React, { memo, useEffect, useMemo, useRef, useState } from "react";
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
  SpinnerGap,
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
import { Menu, MessageCircleQuestionMark, Sparkles } from "lucide-react";
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
  isSigningOut = false,
  language,
  setLanguage,
  docsUrl,
  t,
  userId,
  onSectionChange,
}: {
  userEmail: string;
  isCollapsed: boolean;
  isMobile?: boolean;
  onSignOut?: () => Promise<void> | void;
  isSigningOut?: boolean;
  language: Language;
  setLanguage: (l: Language) => void;
  docsUrl?: string;
  t: (k: string) => string;
  userId?: string;
  onSectionChange?: (section: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const username = userEmail.split("@")[0] ?? userEmail;

  const menuSide = isMobile ? "top" : isCollapsed ? "right" : "top";
  const menuAlign = isMobile ? "start" : isCollapsed ? "center" : "end";

  const handleSelectLanguage = async (nextLanguage: Language) => {
    if (nextLanguage === language) return;

    // Apply language immediately so UI updates on first click.
    setLanguage(nextLanguage);

    if (!userId) return;

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
            isCollapsed
              ? "flex-col justify-center gap-0.5 px-0.5 py-1"
              : "gap-2 p-1.5"
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
            className="flex h-7 w-7 items-center justify-center rounded-full"
            style={{ backgroundColor: ADMIN_THEME.primaryActive }}
          >
            <UserIcon
              className="h-3.5 w-3.5"
              style={{ color: ADMIN_THEME.textOnPrimary }}
            />
          </div>

          <div className="min-w-0 flex-1 text-left">
            <p
              className={`font-medium ${isCollapsed ? "text-center text-[11px] break-words" : "text-xs whitespace-nowrap"}`}
              style={
                isCollapsed
                  ? { lineHeight: "1.15", color: ADMIN_THEME.sidebarText }
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

        <DropdownMenuItem
          className="flex cursor-pointer items-center gap-2"
          style={{ color: ADMIN_THEME.sidebarText }}
          onSelect={() => {
            if (onSectionChange) {
              onSectionChange("changelog");
            } else {
              window.open(
                `/${language}/changelog`,
                "_blank",
                "noopener,noreferrer",
              );
            }
          }}
        >
          <Sparkles className="h-4 w-4" />
          <span>{t("admin.whatsNew")}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator
          style={{ backgroundColor: ADMIN_THEME.sidebarBorder }}
        />

        <DropdownMenuItem
          className="flex cursor-pointer items-center gap-2"
          style={{ color: "#dc2626" }}
          disabled={isSigningOut}
          onSelect={(event) => {
            if (isSigningOut) {
              event.preventDefault();
              return;
            }
            onSignOut?.();
          }}
        >
          {isSigningOut ? (
            <SpinnerGap className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          <span>
            {isSigningOut ? `${t("auth.signOut")}...` : t("auth.signOut")}
          </span>
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
  isSigningOut = false,
  hideTitle = false,
  hideFooter = false,
  docsUrl,
  syncQueryParam = true,
  showSupportButton = false,
  userId,
  preferredLocale,
  workspaceExtra,
  exitDemoSlot,
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
  onSignOut?: () => Promise<void> | void;
  isSigningOut?: boolean;
  hideTitle?: boolean;
  hideFooter?: boolean;
  docsUrl?: string;
  syncQueryParam?: boolean;
  showSupportButton?: boolean;
  userId?: string;
  preferredLocale?: string;
  /** Optional content rendered below the workspace switcher (e.g. demo join button). Hidden when collapsed. */
  workspaceExtra?: React.ReactNode;
  /** Demo exit button — always rendered, even when sidebar is collapsed. */
  exitDemoSlot?: React.ReactNode;
}) {
  const { t, language, setLanguage } = useLanguage();
  const { availableWorkspaces } = useWorkspace();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const languageRef = useRef(language);
  const lastAppliedPreferredLocaleRef = useRef<Language | null>(null);

  const resolvedMobileOpen = mobileOpen ?? internalMobileOpen;

  const setResolvedMobileOpen = (open: boolean) => {
    onMobileOpenChange?.(open);
    if (mobileOpen === undefined) {
      setInternalMobileOpen(open);
    }
  };

  const settingsNavItem = navItems.find((item) => item.id === "settings");
  const primaryNavItems = useMemo(
    () => navItems.filter((item) => item.id !== "settings"),
    [navItems],
  );

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    const preferred = normalizePreferredLanguage(preferredLocale);
    if (!preferred) {
      lastAppliedPreferredLocaleRef.current = null;
      return;
    }

    // Apply preferred locale only when the profile value itself changes.
    // This avoids overriding manual language switching on each re-render.
    if (lastAppliedPreferredLocaleRef.current === preferred) return;

    lastAppliedPreferredLocaleRef.current = preferred;
    if (preferred !== languageRef.current) setLanguage(preferred);
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
        className="p-3"
        style={{ borderBottom: `1px solid ${ADMIN_THEME.sidebarBorder}` }}
      >
        <div
          className={`flex items-center ${isCollapsed ? "flex-col gap-2" : "justify-between"}`}
        >
          <div
            className={`flex items-center ${isCollapsed ? "flex-col gap-1.5" : "gap-3"}`}
          >
            <img
              src="/images/logo/gridix_black_logo.svg"
              alt="Gridix"
              className="h-7 w-7"
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
                isCollapsed ? "px-2 py-1.5" : "p-1"
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

      {/* Demo exit button — always visible, even when collapsed */}
      {exitDemoSlot ?? null}

      {/* Workspace Switcher */}
      {showWorkspaceSwitcher && availableWorkspaces.length > 0 ? (
        <WorkspaceSwitcher show isCollapsed={isCollapsed} />
      ) : null}

      {/* Extra workspace-area slot (e.g. demo join button). */}
      {workspaceExtra ?? null}

      {/* Navigation */}
      <div className="no-scrollbar flex-1 overflow-y-auto px-2 py-2">
        <nav className="space-y-1">
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
                    ? Boolean(isChildActive || activeSection === item.id)
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
          className="px-2 py-2"
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
          className="px-2 py-2"
          style={{ borderTop: `1px solid ${ADMIN_THEME.sidebarBorder}` }}
        >
          <ProfileFooterMenu
            userEmail={userEmail}
            isCollapsed={isCollapsed}
            isMobile={isMobile}
            {...(onSignOut ? { onSignOut } : {})}
            isSigningOut={isSigningOut}
            language={language}
            setLanguage={setLanguage}
            docsUrl={resolvedDocsUrl}
            t={t}
            {...(userId ? { userId } : {})}
            onSectionChange={handleSectionChange}
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
          isCollapsed ? "w-24" : "w-64"
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
