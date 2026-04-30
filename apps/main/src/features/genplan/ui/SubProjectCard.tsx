import { useState } from "react";
import { Badge, Button } from "@gridix/ui";
import { ArrowRight, Building2, MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@gridix/ui";
import { useLanguage } from "@gridix/utils/react";
import { useNavigate, useParams } from "react-router-dom";
import type { SubProject } from "../model/types";
import { deleteSubProject } from "../api/genplanApi";
import { toast } from "sonner";

interface SubProjectCardProps {
  projectId: string;
  subProject: SubProject;
  onDeleted: (id: string) => void;
}

export function SubProjectCard({
  projectId,
  subProject,
  onDeleted,
}: SubProjectCardProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { projectSlug } = useParams<{ projectSlug: string }>();
  const [deleting, setDeleting] = useState(false);

  const handleNavigate = () => {
    if (projectSlug) {
      navigate(`sub/${subProject.slug}`);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteSubProject(projectId, subProject.id);
      toast.success(t("genplan.subProjects.deleteSuccess"));
      onDeleted(subProject.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || t("genplan.subProjects.deleteError"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="group relative flex flex-col gap-3 rounded-xl border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary/8 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
            <Building2 className="h-[18px] w-[18px] text-primary" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium leading-tight">
              {subProject.name}
            </p>
            {subProject.is_default && (
              <Badge
                variant="secondary"
                className="mt-0.5 h-4 px-1.5 text-[10px]"
              >
                {t("genplan.subProjects.default")}
              </Badge>
            )}
          </div>
        </div>

        {!subProject.is_default && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100"
                disabled={deleting}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                {t("genplan.infraZones.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Footer */}
      <Button
        variant="ghost"
        size="sm"
        className="mt-auto h-8 w-full justify-between text-xs text-muted-foreground hover:text-foreground"
        onClick={handleNavigate}
      >
        <span>{t("genplan.subProjects.goTo")}</span>
        <ArrowRight className="h-[13px] w-[13px]" />
      </Button>
    </div>
  );
}
