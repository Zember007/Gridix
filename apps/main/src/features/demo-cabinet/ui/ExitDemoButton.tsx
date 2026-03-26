import { ArrowLeft } from "@phosphor-icons/react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { ADMIN_THEME } from "@gridix/utils/lib";

interface ExitDemoButtonProps {
  isCollapsed?: boolean;
}

export const ExitDemoButton = ({
  isCollapsed = false,
}: ExitDemoButtonProps) => {
  const { t } = useLanguage();
  const { setActiveWorkspaceId } = useWorkspace();

  const handleExit = () => {
    setActiveWorkspaceId(null);
  };

  const label = t("admin.demo.exitButton");

  return (
    <div
      className="px-3 py-2"
      style={{ borderBottom: `1px solid ${ADMIN_THEME.sidebarBorder}` }}
    >
      <button
        type="button"
        onClick={handleExit}
        title={label}
        className={`flex w-full rounded-lg transition-colors duration-200 ${
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
        <ArrowLeft size={20} className="flex-shrink-0" />
        <span
          className={`font-medium ${
            isCollapsed
              ? "break-words text-center text-xs"
              : "min-w-0 flex-1 truncate text-sm"
          }`}
          style={isCollapsed ? { lineHeight: "1.2" } : {}}
        >
          {isCollapsed ? t("admin.demo.exitShort") : label}
        </span>
      </button>
    </div>
  );
};
