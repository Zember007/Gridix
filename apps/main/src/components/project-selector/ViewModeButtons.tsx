import { useState } from "react";
import { Button } from "@gridix/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@gridix/ui";
import { Building2, Grid, List, MapPin, Heart, Menu, X } from "lucide-react";
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
  projectType?: "building" | "object" | null;
  themeColor?: string;
  mapVisible?: boolean;
  isWidget?: boolean;
  className?: string;
  modeContext?: ModeContext;
}

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isMultiSub = modeContext === "project-multi-sub";

  const buttonClass = (mode: ViewMode) =>
    ` -mb-[2px] px-4 h-9 rounded-none bg-transparent hover:bg-transparent transition-all duration-200
       ${
         viewMode === mode
           ? "text-gray-900 font-bold border-b-2"
           : "text-gray-500 font-medium border-b-2 border-transparent hover:text-gray-700"
       }
       ${isMobile ? "text-xs" : "text-sm"}`;

  const buttonStyle = (mode: ViewMode) =>
    viewMode === mode ? { borderColor: themeColor } : {};

  const getModeLabel = (mode: ViewMode) => {
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
  };

  // Mobile: burger menu with icons and labels
  if (isMobile) {
    return (
      <nav className="flex items-center justify-between gap-2">
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger className="!border-none" asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={
                isMenuOpen ? t("project.closeMenu") : t("project.openMenu")
              }
              className="`h-9 relative z-20 block w-9 cursor-pointer p-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 lg:hidden"
            >
              <Menu
                className={`${isMenuOpen ? "rotate-180 scale-0 opacity-0" : ""} m-auto size-6 duration-200`}
              />
              <X
                className={`${isMenuOpen ? "!rotate-0 !scale-100 !opacity-100" : ""} absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200`}
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[10rem]">
            {isMultiSub ? (
              <>
                <DropdownMenuItem
                  onClick={() => setViewMode("facade")}
                  className={
                    viewMode === "facade"
                      ? "bg-accent text-accent-foreground"
                      : ""
                  }
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  <span>{getModeLabel("facade")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setViewMode("chess")}
                  className={
                    viewMode === "chess"
                      ? "bg-accent text-accent-foreground"
                      : ""
                  }
                >
                  <Grid className="mr-2 h-4 w-4" />
                  <span>{getModeLabel("chess")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setViewMode("list")}
                  className={
                    viewMode === "list"
                      ? "bg-accent text-accent-foreground"
                      : ""
                  }
                >
                  <List className="mr-2 h-4 w-4" />
                  <span>{getModeLabel("list")}</span>
                </DropdownMenuItem>
                {mapVisible && (
                  <DropdownMenuItem
                    onClick={() => setViewMode("map")}
                    className={
                      viewMode === "map"
                        ? "bg-accent text-accent-foreground"
                        : ""
                    }
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    <span>{getModeLabel("map")}</span>
                  </DropdownMenuItem>
                )}
              </>
            ) : (
              <>
                <DropdownMenuItem
                  onClick={() => setViewMode("chess")}
                  className={
                    viewMode === "chess"
                      ? "bg-accent text-accent-foreground"
                      : ""
                  }
                >
                  <Grid className="mr-2 h-4 w-4" />
                  <span>{getModeLabel("chess")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setViewMode("facade")}
                  className={
                    viewMode === "facade"
                      ? "bg-accent text-accent-foreground"
                      : ""
                  }
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  <span>{getModeLabel("facade")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setViewMode("list")}
                  className={
                    viewMode === "list"
                      ? "bg-accent text-accent-foreground"
                      : ""
                  }
                >
                  <List className="mr-2 h-4 w-4" />
                  <span>{getModeLabel("list")}</span>
                </DropdownMenuItem>
                {projectType !== "object" && (
                  <DropdownMenuItem
                    onClick={() => setViewMode("floor-plan")}
                    className={
                      viewMode === "floor-plan"
                        ? "bg-accent text-accent-foreground"
                        : ""
                    }
                  >
                    <Grid className="mr-2 h-4 w-4" />
                    <span>{getModeLabel("floor-plan")}</span>
                  </DropdownMenuItem>
                )}
                {mapVisible && (
                  <DropdownMenuItem
                    onClick={() => setViewMode("map")}
                    className={
                      viewMode === "map"
                        ? "bg-accent text-accent-foreground"
                        : ""
                    }
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    <span>{getModeLabel("map")}</span>
                  </DropdownMenuItem>
                )}
              </>
            )}
            <DropdownMenuItem
              onClick={() => setViewMode("favorites")}
              className={
                viewMode === "favorites"
                  ? "bg-accent text-accent-foreground"
                  : ""
              }
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center">
                  <Heart className="mr-2 h-4 w-4" />
                  <span>{getModeLabel("favorites")}</span>
                </div>
                {favoritesCount > 0 && (
                  <span className="ml-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white">
                    {favoritesCount > 99 ? "99+" : favoritesCount}
                  </span>
                )}
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    );
  }

  return (
    <div
      className={cn(
        "flex justify-center border-b-2 border-gray-200 md:items-center",
        className,
      )}
    >
      {isMultiSub ? (
        <>
          {/* 1. Genplans (mapped to facade viewMode) */}
          <Button
            variant="ghost"
            size="sm"
            className={buttonClass("facade")}
            style={buttonStyle("facade")}
            onClick={() => setViewMode("facade")}
          >
            <Building2 className="mr-1 h-4 w-4" />
            {getModeLabel("facade")}
          </Button>

          {/* 2. Objects (mapped to chess viewMode) */}
          <Button
            variant="ghost"
            size="sm"
            className={buttonClass("chess")}
            style={buttonStyle("chess")}
            onClick={() => setViewMode("chess")}
          >
            <Grid className="mr-1 h-4 w-4" />
            {getModeLabel("chess")}
          </Button>

          {/* 3. List */}
          <Button
            variant="ghost"
            size="sm"
            className={buttonClass("list")}
            style={buttonStyle("list")}
            onClick={() => setViewMode("list")}
          >
            <List className="mr-1 h-4 w-4" />
            {getModeLabel("list")}
          </Button>

          {/* 4. Map */}
          {mapVisible && (
            <Button
              variant="ghost"
              size="sm"
              className={buttonClass("map")}
              style={buttonStyle("map")}
              onClick={() => setViewMode("map")}
            >
              <MapPin className="mr-1 h-4 w-4" />
              {getModeLabel("map")}
            </Button>
          )}
        </>
      ) : (
        <>
          {/* 1. Chess */}
          <Button
            variant="ghost"
            size="sm"
            className={buttonClass("chess")}
            style={buttonStyle("chess")}
            onClick={() => setViewMode("chess")}
          >
            <Grid
              className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} ${isMobile ? "mr-0" : "mr-1"}`}
            />
            {!isMobile && getModeLabel("chess")}
          </Button>

          {/* 2. Facade */}
          <Button
            variant="ghost"
            size="sm"
            className={buttonClass("facade")}
            style={buttonStyle("facade")}
            onClick={() => setViewMode("facade")}
          >
            <Building2
              className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} ${isMobile ? "mr-0" : "mr-1"}`}
            />
            {!isMobile && getModeLabel("facade")}
          </Button>

          {/* 3. List */}
          <Button
            variant="ghost"
            size="sm"
            className={buttonClass("list")}
            style={buttonStyle("list")}
            onClick={() => setViewMode("list")}
          >
            <List
              className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} ${isMobile ? "mr-0" : "mr-1"}`}
            />
            {!isMobile && getModeLabel("list")}
          </Button>

          {/* 4. Floor Plan */}
          {projectType !== "object" && (
            <Button
              variant="ghost"
              size="sm"
              className={buttonClass("floor-plan")}
              style={buttonStyle("floor-plan")}
              onClick={() => setViewMode("floor-plan")}
            >
              <Grid
                className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} ${isMobile ? "mr-0" : "mr-1"}`}
              />
              {!isMobile && getModeLabel("floor-plan")}
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
              <MapPin
                className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} ${isMobile ? "mr-0" : "mr-1"}`}
              />
              {!isMobile && t("embed.onMap")}
            </Button>
          )}
        </>
      )}

      <Button
        variant="ghost"
        size="sm"
        className={`${buttonClass("favorites")} relative`}
        style={buttonStyle("favorites")}
        onClick={() => setViewMode("favorites")}
      >
        <Heart
          className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} ${isMobile ? "mr-0" : "mr-1"}`}
        />
        {!isMobile && t("favorites.title")}
        {favoritesCount > 0 && (
          <span className="absolute right-0 top-0 flex h-4 w-4 -translate-y-1/2 translate-x-1/2 transform items-center justify-center rounded-full bg-red-500 text-[10px] text-white sm:h-5 sm:w-5 sm:text-xs">
            {favoritesCount > 99 ? "99+" : favoritesCount}
          </span>
        )}
      </Button>
    </div>
  );
};
