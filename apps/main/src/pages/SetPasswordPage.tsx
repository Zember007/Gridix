import { SetPasswordPage as GlobalSetPasswordPage } from "@gridix/ui";
import { addLanguageToPath } from "@gridix/utils/lib";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const SetPasswordPage = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  return (
    <GlobalSetPasswordPage
      userId={user?.id}
      texts={{
        title: t("auth.setPasswordTitle"),
        description: t("auth.setPasswordDescription"),
        passwordLabel: t("auth.newPassword"),
        confirmPasswordLabel: t("auth.confirmNewPassword"),
        passwordMinLengthError: t("auth.passwordMinLength"),
        passwordsDontMatchError: t("auth.passwordsDoNotMatch"),
        passwordUpdatedSuccess: t("auth.passwordUpdated"),
        failedToUpdatePassword: t("auth.errorOccurred"),
        loadingLabel: t("auth.settingPassword"),
        savePasswordLabel: t("auth.setPasswordButton"),
      }}
      onSuccess={() =>
        navigate(addLanguageToPath("/", language), { replace: true })
      }
    />
  );
};

export default SetPasswordPage;
