import React from "react";
import { ADMIN_THEME } from "@gridix/utils/lib";
import { ChevronDown } from "lucide-react";

export interface SidebarButtonItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  href?: string;
  badge?: React.ReactNode;
}

interface SidebarButtonProps {
  icon: React.ReactNode;
  badge?: React.ReactNode;
  id: string;
  label: string;
  isActive?: boolean;
  isCollapsed?: boolean;
  onClick?: () => void;
  href?: string;
  title?: string;
  items?: SidebarButtonItem[];
  activeItemId?: string;
  onItemClick?: (id: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  size?: "default" | "child";
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
  badge,
  id,
  label,
  isActive = false,
  isCollapsed = false,
  onClick,
  href,
  title,
  items,
  activeItemId,
  onItemClick,
  isExpanded = false,
  onToggleExpand,
  size = "default",
}: SidebarButtonProps) {
  const hasChildren = Boolean(items?.length);
  const isChildSize = size === "child";

  const className = `w-full flex relative ${isCollapsed
      ? "flex-col items-center gap-1 px-1 py-2"
      : `items-center gap-3 px-3 ${isChildSize ? "py-1.5" : "py-2"}`
    } rounded-lg ${isCollapsed ? "text-center" : "text-left"} transition-colors duration-200`;
  const displayTitle = title || (isCollapsed ? label : undefined);

  const content = (
    <>
      <div className="flex-shrink-0 relative">
        <span className={isChildSize ? "inline-flex scale-90 origin-center" : "inline-flex"}>
          {icon}
        </span>
        {badge && hasChildren && (
        <div 
        style={{ top: '-5px', right: '-7px' }}
        className="absolute">
          {badge}
        </div>
      )}
      </div>
      <span
        className={`font-medium ${isCollapsed
            ? "text-xs text-center break-words"
            : `flex-1 min-w-0 truncate text-left ${isChildSize ? "text-xs" : "text-sm"}`
          }`}
        style={isCollapsed ? { lineHeight: "1.2" } : {}}
      >
        {label}
      </span>

      {badge && !hasChildren && (
        <div className="absolute top-1/2 -translate-y-1/2 right-5">
          {badge}
        </div>
      )}

      {hasChildren && !isCollapsed && (
        <ChevronDown
          size={14}
          className={`ml-auto transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
        />
      )}
    </>
  );

  if (href && !hasChildren) {
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
    <div>
      <button
        onClick={hasChildren ? onToggleExpand : onClick}
        className={className + ` ${id}_usertour`}
        style={buttonStyles(isActive)}
        onMouseEnter={(e) => handleMouseEnter(e, isActive)}
        onMouseLeave={(e) => handleMouseLeave(e, isActive)}
        title={displayTitle}
        type="button"
      >
        {content}
      </button>

      {hasChildren && !isCollapsed && isExpanded && (
        <div className="mt-1 ml-4 space-y-1 animate-in slide-in-from-top-1 duration-200">
          {items?.map((child) => (
            <SidebarButton
              key={child.id}
              id={child.id}
              icon={child.icon}
              badge={child.badge}
              label={child.label}
              href={child.href || ''}
              isActive={activeItemId ? child.id === activeItemId : false}
              isCollapsed={isCollapsed}
              onClick={() => onItemClick?.(child.id)}
              size="child"
            />
          ))}
        </div>
      )}
    </div>
  );
}

