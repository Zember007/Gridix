import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Home } from "lucide-react";
import { useLanguage } from "@gridix/utils/react";
import type { SubProjectListItem } from "@/features/projectSelector/api/projectSelectorApi";
import { normalizeSubProjectKind } from "../lib/subProjectDisplay";

interface SubProjectsListViewProps {
  subProjects: SubProjectListItem[];
  themeColor: string;
}

export function SubProjectsListView({
  subProjects,
  themeColor,
}: SubProjectsListViewProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const orderedSubProjects = useMemo(
    () => [...subProjects].sort((a, b) => a.sort_order - b.sort_order),
    [subProjects],
  );

  const handleClick = useCallback(
    (subSlug: string) => {
      navigate(`p/${subSlug}`);
    },
    [navigate],
  );

  if (orderedSubProjects.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-muted-foreground">{t("project.noObjects")}</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {orderedSubProjects.map((sp) => {
          const kind = normalizeSubProjectKind(sp.type);
          return (
            <button
              key={sp.id}
              type="button"
              onClick={() => handleClick(sp.slug)}
              className="group flex flex-col overflow-hidden rounded-xl border bg-white text-left shadow-sm transition-all hover:shadow-md"
            >
              {/* Thumbnail / image */}
              {sp.building_image_url ? (
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
                  <img
                    src={sp.building_image_url}
                    alt={sp.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="flex aspect-[16/10] w-full items-center justify-center bg-gray-50">
                  {kind === "building" ? (
                    <Building2 className="h-12 w-12 text-gray-300" />
                  ) : (
                    <Home className="h-12 w-12 text-gray-300" />
                  )}
                </div>
              )}

              {/* Info */}
              <div className="flex flex-1 flex-col p-4">
                <h3 className="mb-1 text-sm font-semibold text-gray-900">
                  {sp.name}
                </h3>
                <p className="text-xs text-gray-500">
                  {kind === "building"
                    ? t("project.building")
                    : t("project.object")}
                </p>
                <div className="mt-auto pt-3">
                  <span
                    className="text-xs font-medium transition-colors"
                    style={{ color: themeColor }}
                  >
                    {t("project.viewDetails")} →
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
