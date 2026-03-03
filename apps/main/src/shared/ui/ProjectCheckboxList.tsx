import { Checkbox } from "@gridix/ui";

interface ProjectItem {
  id: string;
  name: string;
  description?: string | null;
}

interface ProjectCheckboxListProps {
  projects: ProjectItem[];
  selectedIds: string[];
  onToggle: (projectId: string) => void;
  idPrefix?: string;
  maxHeight?: string;
  compact?: boolean;
  emptyText?: string;
}

export const ProjectCheckboxList = ({
  projects,
  selectedIds,
  onToggle,
  idPrefix = "project",
  maxHeight = "max-h-60",
  compact = false,
  emptyText,
}: ProjectCheckboxListProps) => {
  return (
    <div
      className={`${maxHeight} space-y-2 overflow-y-auto rounded-lg border p-4`}
    >
      {projects.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          {emptyText}
        </p>
      ) : (
        projects.map((project) => (
          <div
            key={project.id}
            className={`flex items-center space-x-3 rounded-lg border ${compact ? "p-2" : "p-3"} transition-colors hover:bg-muted/50`}
          >
            <Checkbox
              id={`${idPrefix}-${project.id}`}
              checked={selectedIds.includes(project.id)}
              onCheckedChange={() => onToggle(project.id)}
            />
            <label
              htmlFor={`${idPrefix}-${project.id}`}
              className="flex-1 cursor-pointer"
            >
              <div className={compact ? "text-sm font-medium" : "font-medium"}>
                {project.name}
              </div>
              {project.description && (
                <div
                  className={
                    compact
                      ? "text-xs text-muted-foreground"
                      : "text-sm text-muted-foreground"
                  }
                >
                  {project.description}
                </div>
              )}
            </label>
          </div>
        ))
      )}
    </div>
  );
};
