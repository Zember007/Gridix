import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@gridix/utils/api";
import { fetchCurrentSession } from "@gridix/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import type { NewManagerForm } from "@/entities/manager-account";
import {
  fetchDeveloperProjectsForAccess,
  type ProjectSummary,
} from "@/entities/project/api/projectApi";
import {
  checkUserExists,
  sendManagerInvitation,
  generateInvitationToken,
} from "../api/inviteManagerApi";

interface UseInviteManagerParams {
  developerId: string;
  onSuccess: () => void;
}

export const useInviteManager = ({
  developerId,
  onSuccess,
}: UseInviteManagerParams) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [newManager, setNewManager] = useState<NewManagerForm>({
    email: "",
    full_name: "",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [userAccountType, setUserAccountType] = useState<string | null>(null);
  const [managerPassword, setManagerPassword] = useState("");
  const [checkingUser, setCheckingUser] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchDeveloperProjectsForAccess(developerId)
        .then(setProjects)
        .catch((error) => {
          console.error("Error loading projects:", error);
          toast.error("Ошибка загрузки проектов");
        });
    }
  }, [isOpen, developerId]);

  const handleEmailBlur = async () => {
    if (!newManager.email) {
      setUserExists(null);
      return;
    }

    setCheckingUser(true);
    try {
      const result = await checkUserExists(newManager.email);
      if (result) {
        setUserExists(result.exists);
        setUserAccountType(result.accountType);
        if (result.exists && result.accountType !== "manager") {
          toast.error(t("managerAccounts.userNotManager"));
        }
      } else {
        setUserExists(null);
        setUserAccountType(null);
      }
    } catch (error) {
      console.error("Error checking user existence:", error);
      setUserExists(null);
    } finally {
      setCheckingUser(false);
    }
  };

  const handleInvite = async () => {
    if (!newManager.email || !newManager.full_name) {
      toast.error(t("managerAccounts.fillRequiredFields"));
      return;
    }

    if (userExists === true && userAccountType !== "manager") {
      toast.error(t("managerAccounts.userNotManager"));
      return;
    }

    if (userExists === false && !managerPassword) {
      toast.error(t("managerAccounts.passwordRequired"));
      return;
    }

    setSubmitting(true);
    try {
      const { user } = await fetchCurrentSession();
      if (!user) {
        toast.error("Unauthorized");
        return;
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("full_name, company_name")
        .eq("id", developerId)
        .single();

      const invitation_token = await generateInvitationToken();

      const result = await sendManagerInvitation({
        email: newManager.email,
        full_name: newManager.full_name,
        phone: newManager.phone,
        developer_name: profile?.full_name || "Developer",
        company_name: profile?.company_name || "",
        invitation_token,
        project_ids:
          selectedProjectIds.length > 0 ? selectedProjectIds : undefined,
        password: userExists === false ? managerPassword : undefined,
      });

      if (!result?.success) {
        if (result?.error?.includes("already exists and is active")) {
          toast.error("Менеджер с таким email уже добавлен");
        } else if (result?.error?.includes("is suspended")) {
          toast.error(
            "Менеджер с таким email заблокирован. Разблокируйте его для повторного использования.",
          );
        } else if (result?.error?.includes("Active invitation")) {
          toast.error("Активное приглашение для этого email уже существует");
        } else {
          toast.error(result?.error || t("managerAccounts.errorInviting"));
        }
        return;
      }

      if (result.already_registered) {
        toast.success(
          "Менеджер успешно добавлен (пользователь уже зарегистрирован)",
        );
      } else {
        toast.success("Приглашение успешно отправлено");
      }

      setNewManager({ email: "", full_name: "", phone: "" });
      setSelectedProjectIds([]);
      setUserExists(null);
      setUserAccountType(null);
      setManagerPassword("");
      setIsOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Error inviting manager:", error);
      toast.error(t("managerAccounts.errorInviting"));
    } finally {
      setSubmitting(false);
    }
  };

  return {
    isOpen,
    setIsOpen,
    newManager,
    setNewManager,
    submitting,
    userExists,
    checkingUser,
    managerPassword,
    setManagerPassword,
    projects,
    selectedProjectIds,
    setSelectedProjectIds,
    handleEmailBlur,
    handleInvite,
  };
};
