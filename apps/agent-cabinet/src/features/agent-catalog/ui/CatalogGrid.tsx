import { Button } from "@gridix/ui";
import { Eye, Share2 } from "lucide-react";
import type { Project } from "@/entities/project";

interface Props {
  projects: Project[];
  t: (key: string) => string;
  shareUrlForProject: (project: Project) => string | null;
  onOpenProject: (project: Project) => void;
}

export function CatalogGrid({
  projects,
  t,
  shareUrlForProject,
  onOpenProject,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {projects.map((project) => {
        const shareUrl = shareUrlForProject(project);

        return (
          <div
            key={project.id}
            className="group flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-sm transition-all duration-300 hover:border-slate-300/80 hover:shadow-lg"
            onClick={() => onOpenProject(project)}
          >
            {project.building_image_url ? (
              <img
                src={project.building_image_url}
                alt={project.name}
                className="h-44 w-full object-cover"
              />
            ) : (
              <div className="h-44 w-full bg-slate-200" />
            )}
            <div className="flex flex-1 flex-col p-5">
              <div className="line-clamp-2 font-black leading-tight text-slate-900">
                {project.name}
              </div>
              <div className="mt-1 line-clamp-2 text-xs text-slate-500">
                {project.address ?? t("common.common.empty")}
              </div>
              <div className="mt-auto pt-4">
                <div className="flex items-center gap-2">
                  <Button
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenProject(project);
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {t("common.catalog.details")}
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    disabled={!shareUrl}
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!shareUrl) return;
                      if (navigator.share) {
                        try {
                          await navigator.share({
                            title: project.name,
                            url: shareUrl,
                          });
                        } catch (err) {
                          console.error("Share failed", err);
                        }
                      } else {
                        try {
                          await navigator.clipboard.writeText(shareUrl);
                        } catch {
                          window.prompt(
                            t("common.catalog.clientLinkPrompt"),
                            shareUrl,
                          );
                        }
                      }
                    }}
                    title={t("common.catalog.share")}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
