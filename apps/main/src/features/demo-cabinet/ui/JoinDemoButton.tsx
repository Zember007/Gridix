import { useState } from "react";
import { Eye } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/shared/api/supabase";
import { ADMIN_THEME } from "@gridix/utils/lib";

const WORKSPACE_STORAGE_KEY = "gridix_active_workspace_id:developer";

interface JoinDemoButtonProps {
  isCollapsed?: boolean;
  /**
   * `sidebar` (default) — renders inside the dark sidebar with a border-bottom divider.
   * `instructions` — full-width button for dark content cards.
   * `inline` — outline button that sits inline next to other page-level buttons.
   */
  variant?: "sidebar" | "instructions" | "inline";
}

/**
 * Enters the demo workspace. If the user already has demo access, switches
 * instantly via workspace context. Otherwise calls the join-demo edge function,
 * persists the demo workspace id and reloads so useUserRole picks up the new
 * manager_account.
 */
export const JoinDemoButton = ({
  isCollapsed = false,
  variant = "sidebar",
}: JoinDemoButtonProps) => {
  const { t } = useLanguage();
  const { userRole } = useUserRole();
  const { setActiveWorkspaceId } = useWorkspace();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    setLoading(true);
    setError(null);

    try {
      const existingDemo = userRole.demoManagerData?.[0];

      if (existingDemo) {
        setActiveWorkspaceId(existingDemo.developer_id);
        return;
      }

      const { data, error: fnError } =
        await supabase.functions.invoke("join-demo");

      if (fnError) {
        setError(t("admin.demo.joinError"));
        return;
      }

      const developerId = data?.developer_id as string | undefined;
      if (developerId) {
        localStorage.setItem(WORKSPACE_STORAGE_KEY, developerId);
      }

      window.location.reload();
    } catch {
      setError(t("admin.demo.joinError"));
    } finally {
      setLoading(false);
    }
  };

  const label = loading ? t("admin.demo.joining") : t("admin.demo.joinButton");

  if (variant === "inline") {
    return (
      <div>
        <button
          type="button"
          onClick={handleJoin}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          style={{
            borderColor: ADMIN_THEME.sidebarBorder,
            color: ADMIN_THEME.textPrimary,
            backgroundColor: "transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = ADMIN_THEME.backgroundHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <Eye className="h-4 w-4 flex-shrink-0" />
          {label}
        </button>
        {error && (
          <p className="mt-1 text-xs" style={{ color: ADMIN_THEME.error }}>
            {error}
          </p>
        )}
      </div>
    );
  }

  if (variant === "instructions") {
    return (
      <div className="mt-3">
        <button
          type="button"
          onClick={handleJoin}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
        >
          <Eye className="h-[18px] w-[18px] flex-shrink-0" />
          {label}
        </button>
        {error && (
          <p className="mt-1 text-center text-xs text-red-400">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div
      className="px-3 py-2"
      style={{ borderBottom: `1px solid ${ADMIN_THEME.sidebarBorder}` }}
    >
      <button
        type="button"
        onClick={handleJoin}
        disabled={loading}
        title={label}
        className={`flex w-full rounded-lg transition-colors duration-200 disabled:opacity-50 ${
          isCollapsed
            ? "flex-col items-center gap-1 px-1 py-2 text-center"
            : "items-center gap-3 px-3 py-2 text-left"
        }`}
        style={{
          color: "#fbbf24",
          backgroundColor: "transparent",
          border: "1px solid transparent",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor =
            ADMIN_THEME.sidebarActiveBackground;
          e.currentTarget.style.borderColor = ADMIN_THEME.sidebarActiveBorder;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.borderColor = "transparent";
        }}
      >
        <Eye className="h-5 w-5 flex-shrink-0" />
        <span
          className={`font-medium ${
            isCollapsed
              ? "break-words text-center text-xs"
              : "min-w-0 flex-1 truncate text-sm"
          }`}
          style={isCollapsed ? { lineHeight: "1.2" } : {}}
        >
          {isCollapsed ? "Demo" : label}
        </span>
      </button>
      {error && !isCollapsed && (
        <p className="mt-1 px-1 text-xs" style={{ color: ADMIN_THEME.error }}>
          {error}
        </p>
      )}
    </div>
  );
};
