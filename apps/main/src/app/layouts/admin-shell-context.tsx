import {
  createContext,
  useContext,
  useLayoutEffect,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { SimplifiedSidebarNavItem } from "@gridix/ui";

/**
 * Sidebar snapshot registered by Outlet children (`AdminDashboardRoot`, editors).
 * Collapsed/mobile sheet chrome lives in AdminShellLayout.
 */
export type AdminShellSidebarSlot = {
  kind?: "dashboard" | "project-editor" | "subproject-editor";
  navItems: SimplifiedSidebarNavItem[];
  activeSection: string;
  onSectionChange: (section: string) => void;
  userEmail: string;
  title: string;
  showWorkspaceSwitcher?: boolean;
  showSupportButton?: boolean;
  syncQueryParam?: boolean;
  onSignOut?: () => Promise<void> | void;
  isSigningOut?: boolean;
  userId?: string;
  preferredLocale?: string;
  workspaceExtra?: ReactNode;
  exitDemoSlot?: ReactNode;
  isNavLoading?: boolean;
  hideFooter?: boolean;
  docsUrl?: string;
};

export type AdminShellContextValue = {
  setSidebarSlot: Dispatch<SetStateAction<AdminShellSidebarSlot | null>>;
  /** Full viewport content without sidebar (e.g. manager blocked screen, sub-project missing). */
  fullBleed: boolean;
  setFullBleed: Dispatch<SetStateAction<boolean>>;
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (value: boolean) => void;
};

export const AdminShellContext = createContext<AdminShellContextValue | null>(
  null,
);

export function useAdminShell() {
  const ctx = useContext(AdminShellContext);
  if (!ctx) {
    throw new Error("useAdminShell must be used within AdminShellLayout");
  }
  return ctx;
}

/**
 * Keeps shell sidebar in sync with the active route.\n * Updates on `slot` identity change without clearing to `null` between updates.
 */
export function useRegisterAdminShellSidebar(
  slot: AdminShellSidebarSlot | null,
): void {
  const { setSidebarSlot } = useAdminShell();

  useLayoutEffect(() => {
    setSidebarSlot(slot ?? null);
  }, [setSidebarSlot, slot]);

  useLayoutEffect(
    () => () => {
      setSidebarSlot(null);
    },
    [setSidebarSlot],
  );
}

/** When active, hides admin shell sidebar and uses full-width outlet (paired with unregistering sidebar slot when needed). */
export function useAdminShellFullBleed(active: boolean): void {
  const { setFullBleed } = useAdminShell();
  useLayoutEffect(() => {
    setFullBleed(active);
    return () => setFullBleed(false);
  }, [active, setFullBleed]);
}
