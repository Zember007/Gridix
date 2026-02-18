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

export type ViewMode =
  | "list"
  | "kanban"
  | "grid"
  | "map"
  | "calendar"
  | "workload";

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

  const effectiveSearchPlaceholder =
    searchPlaceholder ?? t("common.moduleHeader.searchPlaceholder");
  const financeTitle = t("common.moduleHeader.financeTitle");
  const balanceLabel = t("common.moduleHeader.balanceLabel");
  const hasDesktopRightControls = Boolean(
    balance !== undefined || actionsMenu || primaryAction,
  );

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
    <div className="sticky top-0 z-20 flex h-auto min-h-[72px] flex-col items-start justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 transition-all md:flex-row md:items-center md:px-6">
      {/* Top Row: Title & Mobile Actions */}
      <div className="flex w-full items-center justify-between md:w-auto">
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-bold leading-none tracking-tight text-slate-900 md:text-xl">
              {title}
            </h1>
            {funnelName ? (
              <button
                type="button"
                onClick={onFunnelClick}
                className="ml-2 flex max-w-[120px] items-center gap-1 truncate rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200 md:max-w-none md:text-sm"
              >
                {funnelName}
                <ChevronDown size={14} className="opacity-50" />
              </button>
            ) : null}
          </div>
          {subtitle ? (
            <p className="mt-1 max-w-full text-xs font-medium text-slate-500 lg:max-w-md">
              {subtitle}
            </p>
          ) : null}
        </div>

        {/* Mobile Only: Balance & Menu */}
        <div className="flex items-center gap-2 md:hidden">
          {balance !== undefined ? (
            <div
              onClick={onBalanceClick}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-100/70 px-2 py-1 active:bg-slate-200"
            >
              <Wallet size={14} className="text-slate-500" />
              <span className="text-xs font-bold text-slate-900">
                $
                {balance.toLocaleString("en-US", {
                  compactDisplay: "short",
                  notation: "compact",
                })}
              </span>
            </div>
          ) : null}
          {actionsMenu ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`rounded-lg border p-2 shadow-sm transition-all ${
                  isMenuOpen
                    ? "border-slate-300 bg-slate-100 text-slate-900"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                <MoreHorizontal size={18} />
              </button>
              {isMenuOpen ? (
                <div className="absolute right-0 top-full z-30 mt-2 w-48 rounded-xl border border-slate-100 bg-white py-1.5 shadow-xl animate-in fade-in zoom-in-95">
                  {actionsMenu}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* Bottom Row (Mobile) / Right Side (Desktop): Controls */}
      <div
        className={`flex w-full items-center gap-3 ${hasDesktopRightControls ? "md:w-auto" : "md:ml-auto md:w-auto"}`}
      >
        {!hideSearch ? (
          <div className="group relative flex-1 md:w-64 md:flex-none">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-hover:text-blue-500"
            />
            <input
              type="text"
              placeholder={effectiveSearchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 hover:bg-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
            {onFilterClick ? (
              <button
                type="button"
                onClick={onFilterClick}
                className={`absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 transition-colors hover:bg-white ${
                  activeFiltersCount > 0 ? "text-blue-600" : "text-slate-400"
                }`}
              >
                <Filter size={14} />
                {activeFiltersCount > 0 ? (
                  <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full border border-white bg-blue-600" />
                ) : null}
              </button>
            ) : null}
          </div>
        ) : null}

        {viewMode &&
        onViewModeChange &&
        availableViews &&
        availableViews.length > 1 ? (
          <div className="hidden rounded-lg border border-slate-200 bg-slate-100 p-1 lg:flex">
            {availableViews.map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => onViewModeChange(view)}
                className={`rounded-md p-1.5 transition-all ${
                  viewMode === view
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
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
          <div className="hidden items-center gap-3 md:flex">
            {balance !== undefined ? (
              <div
                onClick={onBalanceClick}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-100/70 px-3 py-1.5 transition-colors hover:bg-slate-200/70"
                title={financeTitle}
              >
                <Wallet size={16} className="text-slate-500" />
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold leading-none text-slate-900">
                    $
                    {balance.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                  <span className="text-[10px] font-medium leading-none text-slate-400">
                    {balanceLabel}
                  </span>
                </div>
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              {actionsMenu ? (
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`rounded-lg border p-2 shadow-sm transition-all ${
                      isMenuOpen
                        ? "border-slate-300 bg-slate-100 text-slate-900"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {isMenuOpen ? (
                    <div className="absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-slate-100 bg-white py-1.5 shadow-xl animate-in fade-in zoom-in-95">
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
            className="flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-slate-900 px-2 text-sm font-bold text-white shadow-md shadow-slate-900/10 transition-all hover:bg-slate-800 active:scale-95 md:h-10 md:px-4"
          >
            {primaryAction.icon || <Plus size={18} />}
            <span className="hidden md:inline">{primaryAction.label}</span>
          </button>
        ) : null}
      </div>
    </div>
  );
};
