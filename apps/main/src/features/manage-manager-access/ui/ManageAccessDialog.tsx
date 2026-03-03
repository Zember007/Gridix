import { Button } from "@gridix/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@gridix/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import { Spinner } from "@/shared/ui/Spinner";
import type { ManagerAccount } from "@/entities/manager-account";
import type { ProjectSummary } from "@/entities/project/api/projectApi";
import { ProjectCheckboxList } from "@/shared/ui/ProjectCheckboxList";

interface ManageAccessDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectedManager: ManagerAccount | null;
  projects: ProjectSummary[];
  selectedProjectIds: string[];
  loading: boolean;
  toggleProject: (projectId: string) => void;
  selectAll: () => void;
  clearAll: () => void;
  handleSave: () => void;
  close: () => void;
}

export const ManageAccessDialog = ({
  isOpen,
  setIsOpen,
  selectedManager,
  projects,
  selectedProjectIds,
  loading,
  toggleProject,
  selectAll,
  clearAll,
  handleSave,
  close,
}: ManageAccessDialogProps) => {
  const { t } = useLanguage();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("workspace.projectAccess")}</DialogTitle>
          <DialogDescription>
            {selectedManager && (
              <>
                {t("workspace.grantAccessToProjects")}{" "}
                <strong>{selectedManager.full_name}</strong>
                <br />
                <span className="text-sm text-muted-foreground">
                  {t("workspace.leaveEmptyForAll")}
                </span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {t("workspace.selectProjects")}: {selectedProjectIds.length} /{" "}
                {projects.length}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  {t("workspace.allProjects")}
                </Button>
                <Button variant="outline" size="sm" onClick={clearAll}>
                  {t("common.clear")}
                </Button>
              </div>
            </div>

            {/* Projects List */}
            <ProjectCheckboxList
              projects={projects}
              selectedIds={selectedProjectIds}
              onToggle={toggleProject}
              maxHeight="max-h-96"
              emptyText={t("workspace.noProjectsSelected")}
            />

            {/* Info Message */}
            {selectedProjectIds.length === 0 && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                {t("workspace.leaveEmptyForAll")}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={close}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleSave}>{t("common.save")}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
