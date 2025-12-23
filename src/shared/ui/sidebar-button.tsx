import React from "react";
import { ADMIN_THEME } from "@/shared/lib/admin-theme-config";

interface SidebarButtonProps {
  icon: React.ReactNode;
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
  label,
  isActive = false,
  isCollapsed = false,
  onClick,
  href,
  title,
}: SidebarButtonProps) {
  const className = `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${isCollapsed ? "justify-center px-2" : ""}`;
  const displayTitle = title || (isCollapsed ? label : undefined);

  const content = (
    <>
      <div className="flex-shrink-0">
        {icon}
      </div>
      {!isCollapsed && (
        <span className="font-medium whitespace-nowrap">{label}</span>
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        rel="noopener noreferrer"
        className={className}
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
      className={className}
      style={buttonStyles(isActive)}
      onMouseEnter={(e) => handleMouseEnter(e, isActive)}
      onMouseLeave={(e) => handleMouseLeave(e, isActive)}
      title={displayTitle}
    >
      {content}
    </button>
  );
}

