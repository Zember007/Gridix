import { Suspense, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SimplifiedSidebar, useIsMobile } from "@gridix/ui";

import {
  AdminShellContext,
  type AdminShellContextValue,
  type AdminShellSidebarSlot,
} from "./admin-shell-context";

function AdminShellInner() {
  const [sidebarSlot, setSidebarSlot] = useState<AdminShellSidebarSlot | null>(
    null,
  );
  const [fullBleed, setFullBleed] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();

  const contextValue = useMemo<AdminShellContextValue>(
    () => ({
      setSidebarSlot,
      fullBleed,
      setFullBleed,
      isCollapsed,
      setIsCollapsed,
      isMobileOpen,
      setIsMobileOpen,
    }),
    [fullBleed, isCollapsed, isMobileOpen],
  );

  const mainColumnClass = isCollapsed
    ? "md:ml-24 md:max-w-[calc(100vw-6rem)]"
    : "md:ml-64 md:max-w-[calc(100vw-16rem)]";
  const isProjectEditorRoute = location.pathname.includes("/admin/project/");
  const hasEditorSidebar =
    sidebarSlot?.kind === "project-editor" ||
    sidebarSlot?.kind === "subproject-editor";
  const shouldShowLoadingShell = isProjectEditorRoute
    ? !hasEditorSidebar
    : !sidebarSlot;
  const sidebarTransitionKey = `${isProjectEditorRoute ? "project-route" : "dashboard-route"}:${shouldShowLoadingShell ? "loading" : (sidebarSlot?.kind ?? "active")}`;

  if (fullBleed) {
    return (
      <AdminShellContext.Provider value={contextValue}>
        <div className="h-svh min-h-0 overflow-hidden bg-background">
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </div>
      </AdminShellContext.Provider>
    );
  }

  return (
    <AdminShellContext.Provider value={contextValue}>
      <div className="flex h-svh min-h-0 overflow-hidden bg-background">
        {!shouldShowLoadingShell && sidebarSlot ? (
          <SimplifiedSidebar
            key={sidebarTransitionKey}
            navItems={sidebarSlot.navItems}
            activeSection={sidebarSlot.activeSection}
            onSectionChange={sidebarSlot.onSectionChange}
            userEmail={sidebarSlot.userEmail}
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
            title={sidebarSlot.title}
            showWorkspaceSwitcher={sidebarSlot.showWorkspaceSwitcher}
            isMobile={isMobile ?? false}
            mobileOpen={isMobileOpen}
            onMobileOpenChange={setIsMobileOpen}
            onMobileClose={() => setIsMobileOpen(false)}
            showSupportButton={sidebarSlot.showSupportButton}
            syncQueryParam={sidebarSlot.syncQueryParam}
            {...(sidebarSlot.onSignOut
              ? { onSignOut: sidebarSlot.onSignOut }
              : {})}
            isSigningOut={sidebarSlot.isSigningOut}
            {...(sidebarSlot.userId ? { userId: sidebarSlot.userId } : {})}
            preferredLocale={sidebarSlot.preferredLocale}
            workspaceExtra={sidebarSlot.workspaceExtra}
            exitDemoSlot={sidebarSlot.exitDemoSlot}
            isNavLoading={sidebarSlot.isNavLoading}
            {...(sidebarSlot.hideFooter ? { hideFooter: true } : {})}
            {...(sidebarSlot.docsUrl ? { docsUrl: sidebarSlot.docsUrl } : {})}
          />
        ) : (
          <SimplifiedSidebarLoadingShell
            key={sidebarTransitionKey}
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
            isMobile={isMobile ?? false}
            mobileOpen={isMobileOpen}
            onMobileOpenChange={setIsMobileOpen}
          />
        )}

        <div
          className={`relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background transition-[margin,max-width] duration-300 motion-reduce:transition-none ${mainColumnClass}`}
        >
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </AdminShellContext.Provider>
  );
}

/** Empty shell while Outlet children have not registered a slot yet (Suspense lazy). */
function SimplifiedSidebarLoadingShell({
  isCollapsed,
  onToggleCollapse,
  isMobile,
  mobileOpen,
  onMobileOpenChange,
}: {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobile: boolean;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}) {
  return (
    <SimplifiedSidebar
      navItems={[]}
      activeSection="__loading"
      onSectionChange={() => {}}
      userEmail=""
      isCollapsed={isCollapsed}
      onToggleCollapse={onToggleCollapse}
      title=""
      hideFooter
      hideTitle
      isMobile={isMobile}
      {...(mobileOpen !== undefined ? { mobileOpen } : {})}
      {...(onMobileOpenChange ? { onMobileOpenChange } : {})}
      syncQueryParam={false}
      isNavLoading
    />
  );
}

export function AdminShellLayout() {
  return <AdminShellInner />;
}
