import { useState, useEffect, lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import {
  Button,
  Card,
  CardContent,
  LanguageToggle,
  Loader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gridix/ui";
import { useLanguage } from "@gridix/utils/react";
import {
  Calendar,
  DollarSign,
  Eye,
  Grid,
  MapPin,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { formatPriceWithCurrency } from "@gridix/utils/lib";
import { useProjectsWithPrices } from "@/entities/project/queries/useProjectsWithPrices";
import { FullPageLoaderView } from "@/shared/ui/LoaderView";

// Lazy load heavy map component
const InteractiveProjectsMap = lazy(
  () => import("@/components/visualization/InteractiveProjectsMap"),
);

interface Project {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  building_image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  currency: string | null;
  min_price: number | null;
  slug?: string | null;
}

interface EmbedProjectsPageProps {
  UserId?: string;
  isWidget?: boolean;
  compactMode?: boolean;
  showHeader?: boolean;
  showFilters?: boolean;
  maxHeight?: string;
}

const EmbedProjectsPage = ({
  UserId,
  isWidget = false,
  compactMode = false,
  showHeader = true,
  showFilters = true,
  maxHeight,
}: EmbedProjectsPageProps) => {
  const { userId: routeUserId } = useParams<{ userId: string }>();
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [showFiltersPanel, setShowFiltersPanel] = useState(!compactMode);
  const { t } = useLanguage();

  // Пытаемся получить userId из URL параметров или query string для совместимости с iframe
  const userId = UserId || routeUserId;

  // Для widget режима - получаем userId из URL parameters если не передан через props
  useEffect(() => {
    if (isWidget && !userId) {
      const urlParams = new URLSearchParams(window.location.search);
      const userIdFromUrl = urlParams.get("userId");
      if (userIdFromUrl) {
        // Обновляем состояние если нужно
      }
    }
  }, [isWidget, userId]);

  // Используем объединенный оптимизированный хук
  const { projects, loading, error, userExists } =
    useProjectsWithPrices(userId);

  // Состояние для отображения
  const userNotFound = userExists === false;

  const handleViewProject = (project: Project) => {
    const url = project.slug
      ? `/embed/project/${project.slug}`
      : `/embed/project/id/${project.id}`;
    window.open(url, "_blank");
  };

  if (loading) {
    return <FullPageLoaderView />;
  }

  if (userNotFound) {
    return (
      <div
        className={`${isWidget ? "h-full" : "min-h-screen"} flex items-center justify-center bg-white p-4`}
        style={{ maxHeight }}
      >
        <div className="text-center">
          <h1
            className={`${compactMode ? "text-lg" : "text-2xl"} mb-4 font-bold text-gray-900`}
          >
            {t("embed.userNotFound")}
          </h1>
          {!compactMode && (
            <p className="text-gray-600">{t("embed.userNotFoundDesc")}</p>
          )}
          {/* Отладочная информация для разработки */}
          {process.env.NODE_ENV === "development" && !isWidget && (
            <div className="mt-4 rounded bg-gray-100 p-4 text-left text-xs">
              <strong>Debug Info:</strong>
              <br />
              Route userId: {routeUserId || "undefined"}
              <br />
              Query userId:{" "}
              {new URLSearchParams(window.location.search).get("userId") ||
                "undefined"}
              <br />
              Final userId: {userId || "undefined"}
              <br />
              Current URL: {window.location.href}
              <br />
              User exists: {userExists?.toString() || "null"}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Если выбран режим карты, отображаем InteractiveProjectsMap

  return (
    <div
      className={`${isWidget ? "h-full" : "min-h-screen"} overflow-hidden bg-white`}
      style={{ maxHeight }}
    >
      {/* Header with filters */}
      {showHeader && (
        <div className="border-b bg-white">
          <div
            className={`${isWidget ? "px-4 py-3" : "container mx-auto py-6"}`}
          >
            <div
              className={`flex items-center justify-between ${compactMode ? "mb-3" : "mb-6"}`}
            >
              <h1
                className={`${compactMode ? "text-xl" : "text-3xl"} font-bold text-gray-900`}
              >
                {t("embed.title")}
              </h1>
              <div className="flex items-center gap-2">
                {!compactMode && <LanguageToggle />}
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size={compactMode ? "sm" : "sm"}
                  className={
                    viewMode === "grid"
                      ? "bg-[#1E1E1E] text-white"
                      : "border-gray-300"
                  }
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="mr-1 h-4 w-4" />
                  {compactMode ? "" : t("embed.listView")}
                </Button>
                <Button
                  variant={
                    (viewMode as string) === "map" ? "default" : "outline"
                  }
                  size={compactMode ? "sm" : "sm"}
                  className={
                    (viewMode as string) === "map"
                      ? "bg-[#1E1E1E] text-white"
                      : "border-gray-300"
                  }
                  onClick={() => setViewMode("map")}
                >
                  <MapPin className="mr-1 h-4 w-4" />
                  {compactMode ? "" : t("embed.onMap")}
                </Button>
              </div>
            </div>

            {/* Filters */}
            {showFilters && (
              <>
                {compactMode && (
                  <div className="flex w-full items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                      className="text-gray-600"
                    >
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      {t("embed.filters")}
                    </Button>
                    <span className="text-sm text-gray-600">
                      {t("embed.projects").replace(
                        "{count}",
                        projects.length.toString(),
                      )}
                    </span>
                  </div>
                )}

                {(!compactMode || showFiltersPanel) && (
                  <div
                    className={`flex flex-wrap items-center gap-2 ${compactMode ? "mt-3" : ""}`}
                  >
                    {/* Parameters filter */}
                    <div className="flex items-center gap-2 rounded-lg border bg-gray-50 px-2 py-1 text-sm">
                      <SlidersHorizontal className="h-3 w-3 text-gray-600" />
                      <Select defaultValue="all">
                        <SelectTrigger className="h-auto border-0 bg-transparent p-0 text-xs shadow-none">
                          <SelectValue placeholder={t("project.parameters")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            {t("project.allTypes")}
                          </SelectItem>
                          <SelectItem value="studio">
                            {t("apartment.studio")}
                          </SelectItem>
                          <SelectItem value="1">
                            1 {t("apartment.room")}
                          </SelectItem>
                          <SelectItem value="2">
                            2 {t("apartment.rooms")}
                          </SelectItem>
                          <SelectItem value="3">
                            3 {t("apartment.rooms")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Price filter */}
                    <div className="flex items-center gap-2 rounded-lg border bg-gray-50 px-2 py-1 text-sm">
                      <DollarSign className="h-3 w-3 text-gray-600" />
                      <Select defaultValue="all">
                        <SelectTrigger className="h-auto border-0 bg-transparent p-0 text-xs shadow-none">
                          <SelectValue placeholder={t("gallery.cost")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            {t("gallery.anyCost")}
                          </SelectItem>
                          <SelectItem value="low">
                            {t("gallery.upTo5M")}
                          </SelectItem>
                          <SelectItem value="medium">
                            {t("gallery.from5To10M")}
                          </SelectItem>
                          <SelectItem value="high">
                            {t("gallery.from10M")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {!compactMode && (
                      <>
                        {/* Delivery date filter */}
                        <div className="flex items-center gap-2 rounded-lg border bg-gray-50 px-2 py-1 text-sm">
                          <Calendar className="h-3 w-3 text-gray-600" />
                          <Select defaultValue="all">
                            <SelectTrigger className="h-auto border-0 bg-transparent p-0 text-xs shadow-none">
                              <SelectValue
                                placeholder={t("gallery.salesStart")}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">
                                {t("gallery.salesStart")}
                              </SelectItem>
                              <SelectItem value="2024">2024</SelectItem>
                              <SelectItem value="2025">2025</SelectItem>
                              <SelectItem value="2026">2026</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Reset filters */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-gray-600"
                        >
                          {t("embed.resetFilters")}
                        </Button>

                        {/* Main CTA */}
                        <Button className="ml-auto bg-[#1E1E1E] text-xs text-white hover:bg-[#1E1E1E]/90">
                          {t("embed.projects").replace(
                            "{count}",
                            projects.length.toString(),
                          )}
                        </Button>
                      </>
                    )}

                    {compactMode && showFiltersPanel && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFiltersPanel(false)}
                        className="ml-auto text-gray-400"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className={`flex-1 ${isWidget ? "overflow-auto" : ""}`}
        style={{
          maxHeight: maxHeight
            ? `calc(${maxHeight} - ${showHeader ? "120px" : "0px"})`
            : undefined,
        }}
      >
        {viewMode === "map" ? (
          <Suspense fallback={<FullPageLoaderView />}>
            <InteractiveProjectsMap userId={userId} />
          </Suspense>
        ) : (
          <div
            className={`${isWidget ? "px-4 py-4" : "container mx-auto py-8"}`}
          >
            {/* Grid view */}
            {projects.length === 0 ? (
              <div className={`text-center ${compactMode ? "py-8" : "py-16"}`}>
                <p className="text-gray-500">{t("embed.noProjects")}</p>
              </div>
            ) : (
              <div
                className={`grid ${
                  compactMode
                    ? "grid-cols-1 gap-4 md:grid-cols-2"
                    : "grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                }`}
              >
                {projects.map((project) => (
                  <Card
                    key={project.id}
                    className="group overflow-hidden rounded-2xl border-0 bg-white transition-all duration-300 hover:shadow-xl"
                  >
                    <CardContent className="p-0">
                      {/* Project image */}
                      <div
                        className={`relative ${compactMode ? "aspect-[16/10]" : "aspect-[4/3]"} overflow-hidden`}
                      >
                        {project.building_image_url ? (
                          <img
                            src={project.building_image_url}
                            alt={project.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600" />
                        )}

                        {/* Badges - hide in compact mode */}
                        {/*   {!compactMode && (
                          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                            <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-gray-700">
                              {t('gallery.installment0')}
                            </div>
                            <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-gray-700">
                              {t('gallery.downPayment')}
                            </div>
                          </div>
                        )}

                        {!compactMode && (
                          <div className="absolute bottom-4 left-4">
                            <div className="bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 text-white">
                              <div className="text-xs opacity-80">{t('gallery.salesStart')}</div>
                            </div>
                          </div>
                        )} */}
                      </div>

                      {/* Project info */}
                      <div className={compactMode ? "p-4" : "p-6"}>
                        <h3
                          className={`${compactMode ? "text-lg" : "text-xl"} mb-2 font-bold text-gray-900 transition-colors group-hover:text-[#1E1E1E]`}
                        >
                          {project.name}
                        </h3>

                        <div className="mb-4 text-sm text-gray-600">
                          {project.min_price !== null ? (
                            <>
                              {t("gallery.from")}{" "}
                              {formatPriceWithCurrency(
                                project.min_price,
                                project.currency,
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400">
                              {t("common.priceOnRequest")}
                            </span>
                          )}
                        </div>

                        {project.address && (
                          <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
                            <MapPin className="h-4 w-4" />
                            <span
                              className={compactMode ? "text-xs" : "text-sm"}
                            >
                              {project.address}
                            </span>
                          </div>
                        )}

                        <Button
                          onClick={() => handleViewProject(project)}
                          className={`w-full bg-[#1E1E1E] text-white hover:bg-[#1E1E1E]/90 ${
                            compactMode ? "py-2 text-sm" : "py-3"
                          } rounded-lg font-medium`}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          {t("embed.viewApartments")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmbedProjectsPage;
