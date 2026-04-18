import { RefObject, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Button,
  LanguageToggle,
  Sheet,
  SheetContent,
  SheetTrigger,
  useIsBelowLg,
} from "@gridix/ui";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";
import { useLanguage } from "@gridix/utils/react";
import { CompactFilters } from "@/components/project-selector/filters/CompactFilters";
import {
  ViewModeButtons,
  ViewModeSelect,
} from "@/components/project-selector/ViewModeButtons";
import { AdvancedFilters } from "@/features/project-selector/advanced-filters";
import type { Project } from "@/entities/project/queries/useProjects";
import type { ProjectFilters } from "./hooks/useProjectFilters";
import { cn, Language, LANGUAGE_CONFIG } from "@gridix/utils/lib";

type ModeContext = "project-multi-sub" | "default";

const BTN_BACK_CLASS = "h-8 w-8 shrink-0 text-gray-900";
const TITLE_BLOCK_DESKTOP =
  "flex min-w-0 max-w-[min(100%,42rem)] shrink-0 items-center gap-1 md:shrink-0 md:gap-2";
const TITLE_H1_DESKTOP =
  "min-w-0 truncate whitespace-nowrap text-base font-bold text-gray-900";
const INNER_ROW_CLASS =
  "flex min-w-0 flex-1 items-center gap-2 overflow-hidden md:gap-3";
const FILTERS_SHELL_CLASS = "max-w-full shrink-0";
const VIEWMODE_WRAP_CLASS = "min-w-0 shrink-0 overflow-visible";
const HEADER_ROW_CLASS = "flex items-center justify-between gap-2 md:gap-4";
const TRAILING_CLUSTER_CLASS = "flex shrink-0 items-center gap-2";
const SHEET_TRIGGER_FILTERS =
  "inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-2 text-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

function getIntrinsicNavWidth(navEl: HTMLElement | null): number {
  if (!navEl) return 0;
  const styles = getComputedStyle(navEl);
  const gap = parseFloat(styles.columnGap || styles.gap) || 0;
  const children = [...navEl.children] as HTMLElement[];
  if (children.length === 0) return 0;
  let sum = 0;
  for (const child of children) {
    sum += child.getBoundingClientRect().width;
  }
  sum += gap * Math.max(0, children.length - 1);
  return Math.ceil(sum);
}

interface ProjectHeaderProps {
  project: Project;
  filtersRef: RefObject<HTMLDivElement>;
  isWidget: boolean;
  isMobile: boolean;
  viewMode: "facade" | "floor-plan" | "list" | "map" | "favorites" | "chess";
  setViewMode: (mode: ProjectHeaderProps["viewMode"]) => void;
  favoritesCount: number;
  mapVisible: boolean;
  projectType: "building" | "object";
  themeColor: string;
  filters: ProjectFilters;
  isFiltersOpen: boolean;
  setIsFiltersOpen: (open: boolean) => void;
  modeContext?: ModeContext;
  /** When set (e.g. sub-project from genplan), show back arrow next to the title */
  onBack?: () => void;
  backAriaLabel?: string;
  /** Title in the header; defaults to project name */
  headerTitle?: string;
}

export const ProjectHeader = ({
  project,
  filtersRef,
  isWidget,
  isMobile,
  viewMode,
  setViewMode,
  favoritesCount,
  mapVisible,
  projectType,
  themeColor,
  filters,
  isFiltersOpen,
  setIsFiltersOpen,
  modeContext = "default",
  onBack,
  backAriaLabel,
  headerTitle,
}: ProjectHeaderProps) => {
  const { language, setLanguage } = useLanguage();
  const isBelowLg = useIsBelowLg();
  const [stackNavBelow, setStackNavBelow] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleOneLineMeasureRef = useRef<HTMLSpanElement>(null);
  /** Mobile one row: filters + view select + language */
  const mobileFullNavRef = useRef<HTMLDivElement>(null);
  /** Mobile stacked: filters + view select only */
  const mobileBottomNavRef = useRef<HTMLDivElement>(null);
  /** Mobile stacked: language (still counted toward single-row width for unstack) */
  const mobileLangRef = useRef<HTMLDivElement>(null);

  /** Desktop: switch view mode from tabs to select when title truncates */
  const [desktopViewModeSelect, setDesktopViewModeSelect] = useState(false);
  const desktopTitleRef = useRef<HTMLHeadingElement>(null);
  const desktopFiltersRef = useRef<HTMLDivElement>(null);
  const desktopViewModeWrapRef = useRef<HTMLDivElement>(null);
  const desktopLangRef = useRef<HTMLDivElement>(null);
  const desktopStoredButtonsWidthRef = useRef(0);

  const isDesktopCompact = !isMobile && Boolean(isBelowLg ?? false);
  const showDesktopViewModeSelect = isDesktopCompact || desktopViewModeSelect;

  const titleText = (headerTitle ?? project?.name)?.trim() || "";
  const showTitleBlock = !isWidget || Boolean(onBack);

  const allowedLanguages: Language[] | null = Array.isArray(
    (project as unknown as { available_languages?: unknown })
      .available_languages,
  )
    ? (
        (project as unknown as { available_languages?: unknown })
          .available_languages as unknown[]
      ).filter(
        (v): v is Language => typeof v === "string" && v in LANGUAGE_CONFIG,
      )
    : null;

  // If current language is not allowed for this project, redirect to the first allowed language.
  useEffect(() => {
    if (!allowedLanguages || allowedLanguages.length === 0) return;
    if (allowedLanguages.includes(language)) return;
    const first = allowedLanguages[0];
    if (first) setLanguage(first);
  }, [allowedLanguages?.join(","), language, setLanguage]);

  useLayoutEffect(() => {
    if (!isMobile) {
      setStackNavBelow(false);
      return;
    }
    if (!showTitleBlock || !titleText) {
      setStackNavBelow(false);
      return;
    }

    const measure = () => {
      const container = containerRef.current;
      const titleOneLine = titleOneLineMeasureRef.current;
      if (!container || !titleOneLine) return;

      const backReserve = onBack ? 32 + 4 : 0;
      const rowGap = 8;

      if (!stackNavBelow) {
        if (!mobileFullNavRef.current) return;
        const h1 = titleRef.current;
        if (h1 && h1.scrollWidth > h1.clientWidth + 1) {
          setStackNavBelow(true);
        }
        return;
      }

      if (!mobileBottomNavRef.current) return;
      const titleOneLineW = titleOneLine.getBoundingClientRect().width;
      const leftNeed = backReserve + titleOneLineW;
      const langW = isWidget ? 0 : getIntrinsicNavWidth(mobileLangRef.current);
      const langGap = !isWidget && langW > 0 ? 8 : 0;
      const navW =
        getIntrinsicNavWidth(mobileBottomNavRef.current) + langW + langGap;
      if (leftNeed + navW + rowGap <= container.clientWidth) {
        setStackNavBelow(false);
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    if (titleOneLineMeasureRef.current) {
      ro.observe(titleOneLineMeasureRef.current);
    }
    if (mobileFullNavRef.current) ro.observe(mobileFullNavRef.current);
    if (mobileBottomNavRef.current) ro.observe(mobileBottomNavRef.current);
    if (mobileLangRef.current) ro.observe(mobileLangRef.current);
    return () => ro.disconnect();
  }, [
    isMobile,
    showTitleBlock,
    titleText,
    onBack,
    stackNavBelow,
    viewMode,
    favoritesCount,
    language,
    isWidget,
    isFiltersOpen,
  ]);

  useLayoutEffect(() => {
    if (isMobile) {
      setDesktopViewModeSelect(false);
      return;
    }
    if (isDesktopCompact) {
      setDesktopViewModeSelect(false);
      return;
    }
    if (!showTitleBlock || !titleText) {
      setDesktopViewModeSelect(false);
      return;
    }

    const GAP_TITLE_TO_INNER = 12;
    const GAP_FILTERS_TO_VIEWMODE = 8;
    const GAP_LEFT_TO_LANG = 12;

    const measure = () => {
      const container = containerRef.current;
      const titleOneLine = titleOneLineMeasureRef.current;
      if (!container || !titleOneLine) return;

      const backReserve = onBack ? 36 : 0;
      const titleOneLineW = titleOneLine.getBoundingClientRect().width;
      const langW = isWidget
        ? 0
        : (desktopLangRef.current?.getBoundingClientRect().width ?? 0);
      const langGap = !isWidget && langW > 0 ? GAP_LEFT_TO_LANG : 0;

      if (!desktopViewModeSelect) {
        if (!desktopViewModeWrapRef.current) return;
        desktopStoredButtonsWidthRef.current = getIntrinsicNavWidth(
          desktopViewModeWrapRef.current,
        );
        const h1 = desktopTitleRef.current;
        if (h1 && h1.scrollWidth > h1.clientWidth + 1) {
          setDesktopViewModeSelect(true);
        }
        return;
      }

      const filtersW =
        desktopFiltersRef.current?.getBoundingClientRect().width ?? 0;
      const buttonsW = desktopStoredButtonsWidthRef.current;
      const needWidth =
        backReserve +
        titleOneLineW +
        GAP_TITLE_TO_INNER +
        filtersW +
        GAP_FILTERS_TO_VIEWMODE +
        buttonsW +
        langGap +
        langW;
      if (needWidth <= container.clientWidth - 2) {
        setDesktopViewModeSelect(false);
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    if (titleOneLineMeasureRef.current)
      ro.observe(titleOneLineMeasureRef.current);
    if (desktopFiltersRef.current) ro.observe(desktopFiltersRef.current);
    if (desktopViewModeWrapRef.current)
      ro.observe(desktopViewModeWrapRef.current);
    if (desktopLangRef.current) ro.observe(desktopLangRef.current);
    return () => ro.disconnect();
  }, [
    isMobile,
    isDesktopCompact,
    showTitleBlock,
    titleText,
    onBack,
    desktopViewModeSelect,
    viewMode,
    favoritesCount,
    language,
    isWidget,
    mapVisible,
    projectType,
    modeContext,
  ]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US").format(Math.round(price));

  const compactFiltersCommon = {
    ...filters,
    getUniqueRoomCounts: filters.getUniqueRoomCounts,
    getUniqueFloors: filters.getUniqueFloors,
    hasFreeLayout: filters.hasFreeLayout,
    project,
    projectType,
    viewMode,
    setViewMode,
    themeColor,
    formatPrice,
    visibleFilterFields: filters.visibleFilterFields,
    hasAnyVisibleFilter: filters.hasAnyVisibleFilter,
  };

  const viewModeDesktop = showDesktopViewModeSelect ? (
    <ViewModeSelect
      viewMode={viewMode}
      setViewMode={setViewMode}
      favoritesCount={favoritesCount}
      mapVisible={mapVisible}
      projectType={projectType}
      modeContext={modeContext}
      className={
        isDesktopCompact ? "min-w-0 max-w-[min(60vw,16rem)]" : undefined
      }
    />
  ) : (
    <ViewModeButtons
      viewMode={viewMode}
      setViewMode={setViewMode}
      favoritesCount={favoritesCount}
      isMobile={isMobile}
      mapVisible={mapVisible}
      projectType={projectType}
      themeColor={themeColor}
      modeContext={modeContext}
    />
  );

  const renderDesktopFiltersAndViewMode = () => (
    <>
      <div
        ref={desktopFiltersRef}
        className={cn(
          FILTERS_SHELL_CLASS,
          isWidget && "max-w-[min(100%,28rem)] xl:max-w-none",
        )}
      >
        <CompactFilters {...compactFiltersCommon} />
      </div>
      <div ref={desktopViewModeWrapRef} className={VIEWMODE_WRAP_CLASS}>
        {viewModeDesktop}
      </div>
    </>
  );

  return (
    <div
      ref={filtersRef}
      data-project-header
      className="sticky top-0 z-40 bg-white"
    >
      <div
        ref={containerRef}
        className={cn(
          "container relative mx-auto flex flex-col px-4 py-2 md:px-6 md:py-3",
          isMobile && stackNavBelow && "gap-2",
        )}
      >
        <span
          ref={titleOneLineMeasureRef}
          aria-hidden
          className="pointer-events-none invisible absolute left-0 top-0 -z-10 whitespace-nowrap text-base font-bold text-gray-900"
        >
          {titleText}
        </span>

        {!isMobile ? (
          <div className={HEADER_ROW_CLASS}>
            <div className={INNER_ROW_CLASS}>
              {(!isWidget || onBack) && (
                <div className={TITLE_BLOCK_DESKTOP}>
                  {onBack ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={BTN_BACK_CLASS}
                      onClick={onBack}
                      aria-label={backAriaLabel ?? undefined}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  ) : null}
                  <h1
                    ref={desktopTitleRef}
                    className={TITLE_H1_DESKTOP}
                    title={titleText}
                  >
                    {titleText}
                  </h1>
                </div>
              )}
              {!isDesktopCompact ? (
                <div className={INNER_ROW_CLASS}>
                  {renderDesktopFiltersAndViewMode()}
                </div>
              ) : null}
            </div>

            <div ref={desktopLangRef} className={TRAILING_CLUSTER_CLASS}>
              {isDesktopCompact ? renderDesktopFiltersAndViewMode() : null}
              {!isWidget ? (
                <LanguageToggle
                  allowedLanguages={allowedLanguages ?? undefined}
                />
              ) : null}
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "flex gap-2",
              stackNavBelow
                ? "flex-col"
                : "flex-row items-center justify-between md:gap-4",
            )}
          >
            <div
              className={cn(
                "flex min-w-0 gap-2 overflow-hidden md:gap-3",
                stackNavBelow
                  ? "w-full items-center justify-between"
                  : "flex-1 items-center",
              )}
            >
              {showTitleBlock ? (
                <div
                  className={cn(
                    "flex min-w-0 items-center gap-1 md:gap-2",
                    !stackNavBelow &&
                      "max-w-[min(100%,42rem)] shrink-0 md:shrink-0",
                    stackNavBelow && "min-w-0 flex-1",
                  )}
                >
                  {onBack ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={BTN_BACK_CLASS}
                      onClick={onBack}
                      aria-label={backAriaLabel ?? undefined}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  ) : null}
                  <h1
                    ref={titleRef}
                    className={cn(
                      "min-w-0 text-base font-bold text-gray-900",
                      stackNavBelow
                        ? "flex-1 break-words"
                        : "truncate whitespace-nowrap",
                    )}
                    title={titleText}
                  >
                    {titleText}
                  </h1>
                </div>
              ) : null}
              {stackNavBelow && !isWidget ? (
                <div ref={mobileLangRef} className="shrink-0">
                  <LanguageToggle
                    allowedLanguages={allowedLanguages ?? undefined}
                  />
                </div>
              ) : null}
            </div>

            <div
              ref={stackNavBelow ? mobileBottomNavRef : mobileFullNavRef}
              className={cn(
                TRAILING_CLUSTER_CLASS,
                stackNavBelow && "w-full min-w-0",
              )}
            >
              <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                <SheetTrigger
                  aria-label="Open filters"
                  className={SHEET_TRIGGER_FILTERS}
                >
                  <SlidersHorizontal className="h-3 w-3" />
                </SheetTrigger>
                <SheetContent side="top" className="h-[90dvh] p-0">
                  <div className="mt-6 h-full overflow-y-auto">
                    <AdvancedFilters
                      open={isFiltersOpen}
                      onClose={() => setIsFiltersOpen(false)}
                      selectedRooms={filters.selectedRooms}
                      setSelectedRooms={filters.setSelectedRooms}
                      selectedFloor={filters.selectedFloor}
                      setSelectedFloor={filters.setSelectedFloor}
                      selectedType={filters.selectedType}
                      setSelectedType={filters.setSelectedType}
                      searchQuery={filters.searchQuery}
                      setSearchQuery={filters.setSearchQuery}
                      selectedCurrency={filters.selectedCurrency}
                      setSelectedCurrency={filters.setSelectedCurrency}
                      showOnlyAvailable={filters.showOnlyAvailable}
                      setShowOnlyAvailable={filters.setShowOnlyAvailable}
                      priceRange={filters.priceRange}
                      setPriceRange={filters.setPriceRange}
                      areaRange={filters.areaRange}
                      setAreaRange={filters.setAreaRange}
                      minPrice={filters.minPrice}
                      maxPrice={filters.maxPrice}
                      minArea={filters.minArea}
                      maxArea={filters.maxArea}
                      resetFilters={filters.resetFilters}
                      getUniqueRoomCounts={filters.getUniqueRoomCounts}
                      getUniqueFloors={filters.getUniqueFloors}
                      {...(filters.hasFreeLayout
                        ? { hasFreeLayout: filters.hasFreeLayout }
                        : {})}
                      project={project}
                      viewMode={viewMode}
                      setViewMode={setViewMode}
                      themeColor={themeColor}
                      formatPrice={formatPrice}
                      visibleFilterFields={filters.visibleFilterFields}
                      hasAnyVisibleFilter={filters.hasAnyVisibleFilter}
                      projectType={projectType}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              <ViewModeSelect
                viewMode={viewMode}
                setViewMode={setViewMode}
                favoritesCount={favoritesCount}
                mapVisible={mapVisible}
                projectType={projectType}
                modeContext={modeContext}
                className={
                  stackNavBelow
                    ? "min-w-0 max-w-none flex-1"
                    : "min-w-0 max-w-[min(60vw,16rem)]"
                }
              />

              {!stackNavBelow && !isWidget ? (
                <LanguageToggle
                  allowedLanguages={allowedLanguages ?? undefined}
                />
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
