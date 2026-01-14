import React from "react";
import { ADMIN_THEME } from "@/shared/lib/admin-theme-config";

interface SidebarButtonProps {
  icon: React.ReactNode;
  id: string;
  label: string;
  isActive?: boolean;
  isCollapsed?: boolean;
  onClick?: () => void;
  href?: string;
  title?: string;
}

const buttonStyles = (isActive: boolean): React.CSSProperties => ({
  backgroundColor: isActive ? ADMIN_THEME.sidebarActiveBackground : 'transparent',
  border: isActive ? `1px solid ${ADMIN_THEME.sidebarActiveBorder}` : '1px solid transparent',
  color: isActive ? ADMIN_THEME.sidebarActiveText : ADMIN_THEME.sidebarText,
});

const handleMouseEnter = (e: React.MouseEvent<HTMLElement>, isActive: boolean) => {
  if (!isActive) {
    e.currentTarget.style.backgroundColor = ADMIN_THEME.primaryHover;
    e.currentTarget.style.color = ADMIN_THEME.sidebarTextHover;
  }
};

const handleMouseLeave = (e: React.MouseEvent<HTMLElement>, isActive: boolean) => {
  if (!isActive) {
    e.currentTarget.style.backgroundColor = 'transparent';
    e.currentTarget.style.color = ADMIN_THEME.sidebarText;
  }
};

export function SidebarButton({
  icon,
  id,
  label,
  isActive = false,
  isCollapsed = false,
  onClick,
  href,
  title,
}: SidebarButtonProps) {
  const className = `w-full flex ${isCollapsed ? "flex-col items-center gap-1 px-1 py-2" : "items-center gap-3 px-3 py-2"} rounded-lg ${isCollapsed ? "text-center" : "text-left"} transition-colors duration-200`;
  const displayTitle = title || (isCollapsed ? label : undefined);

  const content = (
    <>
      <div className="flex-shrink-0">
        {icon}
      </div>
      <span className={`font-medium ${isCollapsed ? "text-xs text-center break-words" : "whitespace-nowrap"}`} style={isCollapsed ? { lineHeight: '1.2' } : {}}>{label}</span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        rel="noopener noreferrer"
        className={className + ` ${id}_usertour`}
        style={buttonStyles(isActive)}
        onMouseEnter={(e) => handleMouseEnter(e, isActive)}
        onMouseLeave={(e) => handleMouseLeave(e, isActive)}
        title={displayTitle}
        onClick={(e) => {
          if (href === window.location.href) {
            e.preventDefault();
          }
          onClick?.();
        }}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      className={className + ` ${id}_usertour`}
      style={buttonStyles(isActive)}
      onMouseEnter={(e) => handleMouseEnter(e, isActive)}
      onMouseLeave={(e) => handleMouseLeave(e, isActive)}
      title={displayTitle}
    >
      {content}
    </button>
  );
}

