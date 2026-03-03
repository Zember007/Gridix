import type { Dispatch, SetStateAction } from "react";
import { Button } from "@gridix/ui";
import { Input } from "@gridix/ui";
import { Label } from "@gridix/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@gridix/ui";
import { Plus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { NewManagerForm } from "@/entities/manager-account";
import type { ProjectSummary } from "@/entities/project/api/projectApi";
import { ProjectCheckboxList } from "@/shared/ui/ProjectCheckboxList";

interface InviteManagerDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  newManager: NewManagerForm;
  setNewManager: Dispatch<SetStateAction<NewManagerForm>>;
  handleEmailBlur: () => void;
  checkingUser: boolean;
  userExists: boolean | null;
  managerPassword: string;
  setManagerPassword: (password: string) => void;
  projects: ProjectSummary[];
  selectedProjectIds: string[];
  setSelectedProjectIds: Dispatch<SetStateAction<string[]>>;
  submitting: boolean;
  handleInvite: () => void;
}

export const InviteManagerDialog = ({
  isOpen,
  setIsOpen,
  newManager,
  setNewManager,
  handleEmailBlur,
  checkingUser,
  userExists,
  managerPassword,
  setManagerPassword,
  projects,
  selectedProjectIds,
  setSelectedProjectIds,
  submitting,
  handleInvite,
}: InviteManagerDialogProps) => {
  const { t } = useLanguage();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t("managerAccounts.addManager")}
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden sm:max-w-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle>{t("managerAccounts.inviteManager")}</DialogTitle>
          <DialogDescription>
            {t("managerAccounts.inviteManagerDesc")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto overscroll-contain px-1 [-webkit-overflow-scrolling:touch]">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">{t("managerAccounts.email")}</Label>
              <Input
                id="email"
                type="email"
                value={newManager.email}
                onChange={(e) =>
                  setNewManager((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                onBlur={handleEmailBlur}
                placeholder={t("managerAccounts.emailPlaceholder")}
                disabled={checkingUser}
              />
              {checkingUser && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("managerAccounts.checkingUser")}
                </p>
              )}
              {userExists === true && (
                <p className="mt-1 text-sm text-green-600">
                  {t("managerAccounts.userExists")}
                </p>
              )}
              {userExists === false && (
                <p className="mt-1 text-sm text-blue-600">
                  {t("managerAccounts.userNotExists")}
                </p>
              )}
            </div>

            {userExists === false && (
              <div>
                <Label htmlFor="manager_password">
                  {t("managerAccounts.setPassword")}
                </Label>
                <Input
                  id="manager_password"
                  type="password"
                  value={managerPassword}
                  onChange={(e) => setManagerPassword(e.target.value)}
                  placeholder={t("managerAccounts.passwordPlaceholder")}
                />
              </div>
            )}

            <div>
              <Label htmlFor="full_name">{t("managerAccounts.fullName")}</Label>
              <Input
                id="full_name"
                value={newManager.full_name}
                onChange={(e) =>
                  setNewManager((prev) => ({
                    ...prev,
                    full_name: e.target.value,
                  }))
                }
                placeholder={t("managerAccounts.fullNamePlaceholder")}
              />
            </div>

            <div>
              <Label htmlFor="phone">{t("managerAccounts.phone")}</Label>
              <Input
                id="phone"
                value={newManager.phone}
                onChange={(e) =>
                  setNewManager((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                placeholder={t("managerAccounts.phonePlaceholder")}
              />
            </div>

            {/* Project Access Selection */}
            <div className="space-y-2">
              <Label>{t("workspace.projectAccess")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("workspace.leaveEmptyForAll")}
              </p>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">
                  {t("workspace.selectProjects")}: {selectedProjectIds.length} /{" "}
                  {projects.length}
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSelectedProjectIds(projects.map((p) => p.id))
                    }
                  >
                    {t("workspace.allProjects")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedProjectIds([])}
                  >
                    {t("common.clear")}
                  </Button>
                </div>
              </div>
              <ProjectCheckboxList
                projects={projects}
                selectedIds={selectedProjectIds}
                onToggle={(projectId) => {
                  setSelectedProjectIds((prev) =>
                    prev.includes(projectId)
                      ? prev.filter((id) => id !== projectId)
                      : [...prev, projectId],
                  );
                }}
                idPrefix="new-project"
                compact
                emptyText={t("workspace.noProjectsSelected")}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  setSelectedProjectIds([]);
                }}
              >
                {t("common.cancel")}
              </Button>
              <Button onClick={handleInvite} disabled={submitting}>
                {submitting
                  ? t("managerAccounts.inviting")
                  : t("managerAccounts.invite")}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
