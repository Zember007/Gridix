import { useMemo } from "react";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gridix/ui";
import {
  Building2,
  ChevronDown,
  Grid,
  List,
  MapPin,
  Heart,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/shared/lib/utils.ts";

type ViewMode =
  | "facade"
  | "floor-plan"
  | "list"
  | "map"
  | "favorites"
  | "chess";

type ModeContext = "project-multi-sub" | "default";

interface ViewModeButtonsProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  favoritesCount: number;
  isMobile: boolean;
  projectType: "building" | "object";
  themeColor?: string;
  mapVisible?: boolean;
  isWidget?: boolean;
  className?: string;
  modeContext?: ModeContext;
}

function getVisibleModes(
  isMultiSub: boolean,
  mapVisible: boolean | undefined,
  projectType: "building" | "object",
): ViewMode[] {
  if (isMultiSub) {
    const m: ViewMode[] = ["facade", "chess", "list"];
    if (mapVisible) m.push("map");
    m.push("favorites");
    return m;
  }
  const m: ViewMode[] = ["chess", "facade", "list"];
  if (projectType !== "object") m.push("floor-plan");
  if (mapVisible) m.push("map");
  m.push("favorites");
  return m;
}

function ModeGlyph({
  mode,
  className,
}: {
  mode: ViewMode;
  className?: string;
}) {
  const c = cn("shrink-0", className);
  switch (mode) {
    case "chess":
      return <Grid className={c} />;
    case "facade":
      return <Building2 className={c} />;
    case "list":
      return <List className={c} />;
    case "floor-plan":
      return <Grid className={c} />;
    case "map":
      return <MapPin className={c} />;
    case "favorites":
      return <Heart className={c} />;
    default:
      return null;
  }
}

function getModeLabel(
  mode: ViewMode,
  isMultiSub: boolean,
  t: (key: string) => string,
) {
  if (isMultiSub) {
    switch (mode) {
      case "facade":
        return t("project.masterplans");
      case "chess":
        return t("project.objects");
      case "list":
        return t("project.listView");
      case "map":
        return t("embed.onMap");
      case "favorites":
        return t("favorites.title");
      default:
        return "";
    }
  }
  switch (mode) {
    case "chess":
      return t("project.chess");
    case "facade":
      return t("project.facade");
    case "list":
      return t("project.listView");
    case "floor-plan":
      return t("project.floorPlan");
    case "map":
      return t("embed.onMap");
    case "favorites":
      return t("favorites.title");
    default:
      return "";
  }
}

/** Mobile: compact Select (same pattern as EmbedProjectsPage filters) */
export const ViewModeSelect = ({
  viewMode,
  setViewMode,
  favoritesCount,
  projectType,
  mapVisible,
  modeContext = "default",
  className,
}: Omit<ViewModeButtonsProps, "isMobile" | "isWidget" | "themeColor">) => {
  const { t } = useLanguage();
  const isMultiSub = modeContext === "project-multi-sub";

  const modes = useMemo(
    () => getVisibleModes(isMultiSub, mapVisible, projectType),
    [isMultiSub, mapVisible, projectType],
  );

  return (
    <div
      className={cn(
        "flex max-w-[min(46vw,12rem)] shrink-0 items-center rounded-lg border border-gray-200 bg-gray-50 px-1.5 py-0.5",
        className,
      )}
    >
      <Select
        value={viewMode}
        onValueChange={(v) => setViewMode(v as ViewMode)}
      >
        <SelectTrigger
          aria-label={t("project.selectViewMode")}
          className={cn(
            "h-8 w-full min-w-0 gap-1 border-0 bg-transparent px-1 py-0 text-xs shadow-none",
            "focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 data-[placeholder]:text-gray-700",
            // стрелка Radix справа не должна сжиматься; дефолтная иконка иногда не видна на сером фоне
            "[&>*:last-child]:hidden",
          )}
        >
          <span className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
            <SelectValue placeholder={getModeLabel(viewMode, isMultiSub, t)} />
            {viewMode === "favorites" && favoritesCount > 0 ? (
              <span className="flex h-4 min-w-[1rem] shrink-0 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] leading-none text-white">
                {favoritesCount > 99 ? "99+" : favoritesCount}
              </span>
            ) : null}
          </span>
          <ChevronDown
            className="h-4 w-4 shrink-0 text-gray-600 opacity-80"
            aria-hidden
          />
        </SelectTrigger>
        <SelectContent align="end" position="popper">
          {modes.map((mode) => (
            <SelectItem
              key={mode}
              value={mode}
              textValue={getModeLabel(mode, isMultiSub, t)}
              className={cn(
                "pl-2 pr-2 [&>span:first-child]:hidden",
                "data-[state=checked]:bg-gray-200 data-[state=checked]:text-gray-900",
                "aria-[selected=true]:bg-gray-200 aria-[selected=true]:text-gray-900",
                "focus:bg-gray-100 focus:text-gray-900",
              )}
            >
              <span className="flex w-full min-w-0 items-center gap-2">
                <ModeGlyph mode={mode} className="h-4 w-4 text-gray-600" />
                <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <span className="truncate">
                    {getModeLabel(mode, isMultiSub, t)}
                  </span>
                  {mode === "favorites" && favoritesCount > 0 ? (
                    <span className="flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white">
                      {favoritesCount > 99 ? "99+" : favoritesCount}
                    </span>
                  ) : null}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export const ViewModeButtons = ({
  viewMode,
  setViewMode,
  favoritesCount,
  isMobile,
  projectType,
  themeColor = "#000000",
  mapVisible,
  className,
  modeContext = "default",
}: ViewModeButtonsProps) => {
  const { t } = useLanguage();
  const isMultiSub = modeContext === "project-multi-sub";

  if (isMobile) {
    return null;
  }

  const buttonClass = (mode: ViewMode) =>
    `h-8 shrink-0 rounded-none bg-transparent px-2 py-1 hover:bg-transparent transition-all duration-200
       ${
         viewMode === mode
           ? "border-b-2 font-bold text-gray-900"
           : "border-b-2 border-transparent font-medium text-gray-500 hover:text-gray-700"
       }
       text-sm`;

  const buttonStyle = (mode: ViewMode) =>
    viewMode === mode ? { borderColor: themeColor } : {};

  const getLabel = (mode: ViewMode) => getModeLabel(mode, isMultiSub, t);

  return (
    <div
      className={cn(
        "inline-flex flex-nowrap items-end justify-start md:items-center",
        className,
      )}
    >
      {isMultiSub ? (
        <>
          <Button
            variant="ghost"
            size="sm"
            className={buttonClass("facade")}
            style={buttonStyle("facade")}
            onClick={() => setViewMode("facade")}
          >
            <Building2 className="mr-0.5 h-3.5 w-3.5" />
            {getLabel("facade")}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={buttonClass("chess")}
            style={buttonStyle("chess")}
            onClick={() => setViewMode("chess")}
          >
            <Grid className="mr-0.5 h-3.5 w-3.5" />
            {getLabel("chess")}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={buttonClass("list")}
            style={buttonStyle("list")}
            onClick={() => setViewMode("list")}
          >
            <List className="mr-0.5 h-3.5 w-3.5" />
            {getLabel("list")}
          </Button>

          {mapVisible && (
            <Button
              variant="ghost"
              size="sm"
              className={buttonClass("map")}
              style={buttonStyle("map")}
              onClick={() => setViewMode("map")}
            >
              <MapPin className="mr-0.5 h-3.5 w-3.5" />
              {getLabel("map")}
            </Button>
          )}
        </>
      ) : (
        <>
          <Button
            variant="ghost"
            size="sm"
            className={buttonClass("chess")}
            style={buttonStyle("chess")}
            onClick={() => setViewMode("chess")}
          >
            <Grid className="mr-0.5 h-3.5 w-3.5" />
            {getLabel("chess")}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={buttonClass("facade")}
            style={buttonStyle("facade")}
            onClick={() => setViewMode("facade")}
          >
            <Building2 className="mr-0.5 h-3.5 w-3.5" />
            {getLabel("facade")}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={buttonClass("list")}
            style={buttonStyle("list")}
            onClick={() => setViewMode("list")}
          >
            <List className="mr-0.5 h-3.5 w-3.5" />
            {getLabel("list")}
          </Button>

          {projectType !== "object" && (
            <Button
              variant="ghost"
              size="sm"
              className={buttonClass("floor-plan")}
              style={buttonStyle("floor-plan")}
              onClick={() => setViewMode("floor-plan")}
            >
              <Grid className="mr-0.5 h-3.5 w-3.5" />
              {getLabel("floor-plan")}
            </Button>
          )}

          {mapVisible && (
            <Button
              variant="ghost"
              size="sm"
              className={buttonClass("map")}
              style={buttonStyle("map")}
              onClick={() => setViewMode("map")}
            >
              <MapPin className="mr-0.5 h-3.5 w-3.5" />
              {t("embed.onMap")}
            </Button>
          )}
        </>
      )}

      <Button
        variant="ghost"
        size="sm"
        className={`${buttonClass("favorites")} relative shrink-0`}
        style={buttonStyle("favorites")}
        onClick={() => setViewMode("favorites")}
      >
        <Heart className="mr-0.5 h-3.5 w-3.5" />
        {t("favorites.title")}
        {favoritesCount > 0 && (
          <span className="absolute right-0 top-0 flex h-4 w-4 -translate-y-1/2 translate-x-1/2 transform items-center justify-center rounded-full bg-red-500 text-[10px] text-white sm:h-5 sm:w-5 sm:text-xs">
            {favoritesCount > 99 ? "99+" : favoritesCount}
          </span>
        )}
      </Button>
    </div>
  );
};
