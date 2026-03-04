import { SetPasswordPage as GlobalSetPasswordPage } from "@gridix/ui";
import { addLanguageToPath } from "@gridix/utils/lib";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

export default function SetPasswordPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  return (
    <GlobalSetPasswordPage
      userId={user?.id}
      texts={{
        title: t("common.auth.setPasswordTitle"),
        description: t("common.auth.setPasswordDescription"),
        passwordLabel: t("common.auth.password"),
        confirmPasswordLabel: t("common.auth.confirmPassword"),
        passwordMinLengthError: t("common.errors.passwordMinLength"),
        passwordsDontMatchError: t("common.errors.passwordsDontMatch"),
        passwordUpdatedSuccess: t("common.auth.passwordUpdated"),
        failedToUpdatePassword: t("common.errors.failedToUpdatePassword"),
        loadingLabel: t("common.common.loading"),
        savePasswordLabel: t("common.auth.savePassword"),
      }}
      onSuccess={() =>
        navigate(addLanguageToPath("/", language), { replace: true })
      }
    />
  );
}
