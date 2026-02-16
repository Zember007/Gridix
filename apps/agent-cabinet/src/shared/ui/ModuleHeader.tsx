import React, { useEffect, useRef, useState } from "react";
import {
  Calendar,
  ChevronDown,
  Filter,
  LayoutGrid,
  List as ListIcon,
  Map,
  MoreHorizontal,
  Plus,
  Search,
  Wallet,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export type ViewMode = "list" | "kanban" | "grid" | "map" | "calendar" | "workload";

export interface ModuleHeaderProps {
  title: string;
  subtitle?: string;

  hideSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  onFilterClick?: () => void;
  activeFiltersCount?: number;
  searchPlaceholder?: string;

  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  availableViews?: ViewMode[];

  primaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  };
  actionsMenu?: React.ReactNode;

  funnelName?: string;
  onFunnelClick?: () => void;

  balance?: number;
  onBalanceClick?: () => void;
}

export const ModuleHeader: React.FC<ModuleHeaderProps> = ({
  title,
  subtitle,
  hideSearch = false,
  searchValue = "",
  onSearchChange = (_) => {},
  onFilterClick,
  activeFiltersCount = 0,
  searchPlaceholder,
  viewMode,
  onViewModeChange,
  availableViews = ["list", "kanban"],
  primaryAction,
  actionsMenu,
  funnelName,
  onFunnelClick,
  balance,
  onBalanceClick,
}) => {
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const effectiveSearchPlaceholder = searchPlaceholder ?? t("common.moduleHeader.searchPlaceholder");
  const financeTitle = t("common.moduleHeader.financeTitle");
  const balanceLabel = t("common.moduleHeader.balanceLabel");
  const hasDesktopRightControls = Boolean(balance !== undefined || actionsMenu || primaryAction);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="h-auto min-h-[72px] px-4 md:px-6 py-3 bg-white border-b border-slate-200 sticky top-0 z-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all">
      {/* Top Row: Title & Mobile Actions */}
      <div className="flex items-center justify-between w-full md:w-auto">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight leading-none truncate">
              {title}
            </h1>
            {funnelName ? (
              <button
                type="button"
                onClick={onFunnelClick}
                className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors text-xs md:text-sm font-bold text-slate-700 ml-2 truncate max-w-[120px] md:max-w-none"
              >
                {funnelName}
                <ChevronDown size={14} className="opacity-50" />
              </button>
            ) : null}
          </div>
          {subtitle ? (
            <p className="text-xs text-slate-500 font-medium mt-1 truncate max-w-full lg:max-w-md">
              {subtitle}
            </p>
          ) : null}
        </div>

        {/* Mobile Only: Balance & Menu */}
        <div className="flex md:hidden items-center gap-2">
          {balance !== undefined ? (
            <div
              onClick={onBalanceClick}
              className="flex items-center gap-1.5 bg-slate-100/70 border border-slate-200/80 px-2 py-1 rounded-lg cursor-pointer active:bg-slate-200"
            >
              <Wallet size={14} className="text-slate-500" />
              <span className="text-xs font-bold text-slate-900">
                ${balance.toLocaleString("en-US", { compactDisplay: "short", notation: "compact" })}
              </span>
            </div>
          ) : null}
          {actionsMenu ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`p-2 border rounded-lg transition-all shadow-sm ${
                  isMenuOpen ? "bg-slate-100 border-slate-300 text-slate-900" : "bg-white border-slate-200 text-slate-600"
                }`}
              >
                <MoreHorizontal size={18} />
              </button>
              {isMenuOpen ? (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-30 py-1.5 animate-in fade-in zoom-in-95">
                  {actionsMenu}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* Bottom Row (Mobile) / Right Side (Desktop): Controls */}
      <div className={`flex items-center gap-3 w-full ${hasDesktopRightControls ? "md:w-auto" : "md:w-auto md:ml-auto"}`}>
        {!hideSearch ? (
          <div className="relative group flex-1 md:w-64 md:flex-none">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors pointer-events-none"
            />
            <input
              type="text"
              placeholder={effectiveSearchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all font-medium"
            />
            {onFilterClick ? (
              <button
                type="button"
                onClick={onFilterClick}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white transition-colors ${
                  activeFiltersCount > 0 ? "text-blue-600" : "text-slate-400"
                }`}
              >
                <Filter size={14} />
                {activeFiltersCount > 0 ? (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-600 rounded-full border border-white" />
                ) : null}
              </button>
            ) : null}
          </div>
        ) : null}

        {viewMode && onViewModeChange && availableViews && availableViews.length > 1 ? (
          <div className="hidden md:flex p-1 bg-slate-100 rounded-lg border border-slate-200">
            {availableViews.map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => onViewModeChange(view)}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === view ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                }`}
                title={view.charAt(0).toUpperCase() + view.slice(1)}
              >
                {view === "list" && <ListIcon size={16} />}
                {view === "kanban" && <LayoutGrid size={16} />}
                {view === "grid" && <LayoutGrid size={16} />}
                {view === "map" && <Map size={16} />}
                {view === "calendar" && <Calendar size={16} />}
                {view === "workload" && <LayoutGrid size={16} />}
              </button>
            ))}
          </div>
        ) : null}

        {/* Desktop Balance & Actions */}
        {hasDesktopRightControls ? (
          <div className="hidden md:flex items-center gap-3">
            {balance !== undefined ? (
              <div
                onClick={onBalanceClick}
                className="flex items-center gap-2 bg-slate-100/70 border border-slate-200/80 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-200/70 transition-colors"
                title={financeTitle}
              >
                <Wallet size={16} className="text-slate-500" />
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-slate-900 leading-none">
                    ${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium leading-none">{balanceLabel}</span>
                </div>
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              {actionsMenu ? (
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`p-2 border rounded-lg transition-all shadow-sm ${
                      isMenuOpen
                        ? "bg-slate-100 border-slate-300 text-slate-900"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {isMenuOpen ? (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-30 py-1.5 animate-in fade-in zoom-in-95">
                      {actionsMenu}
                    </div>
                  ) : null}
                </div>
              ) : null}

            </div>
          </div>
        ) : null}

        {/* Primary Action */}
        {primaryAction ? (
          <button
            type="button"
            onClick={primaryAction.onClick}
            className="bg-slate-900 hover:bg-slate-800 text-white h-9 md:h-10 px-2 md:px-4 rounded-lg text-sm font-bold shadow-md shadow-slate-900/10 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            {primaryAction.icon || <Plus size={18} />}
            <span className="hidden md:inline">{primaryAction.label}</span>
          </button>
        ) : null}
      </div>
    </div>
  );
};
