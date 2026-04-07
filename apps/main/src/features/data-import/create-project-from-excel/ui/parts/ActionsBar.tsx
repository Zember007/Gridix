import { Button } from "@gridix/ui";

export function ActionsBar({
  t,
  onComplete,
  createProjectWithData,
  isValidWithCustom,
  projectName,
  isCreating,
  admin,
  creatingLabel,
  primaryActionLabel,
}: {
  t: (key: string) => string;
  onComplete: () => void;
  createProjectWithData: () => void | Promise<void>;
  isValidWithCustom: boolean;
  projectName: string;
  isCreating: boolean;
  admin: { primary: string; primaryHover: string };
  /** Overrides `state.creatingProject` while the primary action runs */
  creatingLabel?: string;
  /** Overrides `excel.mapper.actions.createProject` */
  primaryActionLabel?: string;
}) {
  return (
    <div className="flex justify-end gap-4">
      <Button variant="outline" onClick={onComplete}>
        {t("common.cancel")}
      </Button>
      <Button
        onClick={createProjectWithData}
        disabled={!isValidWithCustom || !projectName.trim() || isCreating}
        className={`${admin.primary} ${admin.primaryHover} excel_create_project_usertour`}
      >
        {isCreating
          ? (creatingLabel ?? t("state.creatingProject"))
          : (primaryActionLabel ?? t("excel.mapper.actions.createProject"))}
      </Button>
    </div>
  );
}
