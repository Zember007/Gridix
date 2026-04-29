import { Button } from "@gridix/ui";
import { Plus } from "lucide-react";
import { useLanguage } from "@gridix/utils/react";
import { SubProjectCard } from "./SubProjectCard";
import type { SubProject } from "../model/types";

interface SubProjectListProps {
  projectId: string;
  subProjects: SubProject[];
  onAdd: () => void;
  onDeleted: (id: string) => void;
  maxReached?: boolean;
}

export function SubProjectList({
  projectId,
  subProjects,
  onAdd,
  onDeleted,
  maxReached,
}: SubProjectListProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {t("genplan.subProjects.title")}
          <span className="ml-1.5 text-xs">({subProjects.length}/10)</span>
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={onAdd}
          disabled={maxReached}
          className="h-8 gap-1.5 text-xs"
        >
          <Plus className="h-[13px] w-[13px]" />
          {t("genplan.subProjects.add")}
        </Button>
      </div>

      {maxReached && (
        <p className="text-xs text-muted-foreground">
          {t("genplan.subProjects.maxReached")}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {subProjects.map((sp) => (
          <SubProjectCard
            key={sp.id}
            projectId={projectId}
            subProject={sp}
            onDeleted={onDeleted}
          />
        ))}
      </div>
    </div>
  );
}
