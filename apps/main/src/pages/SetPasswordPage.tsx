import { SetPasswordPage as GlobalSetPasswordPage } from "@gridix/ui";
import { addLanguageToPath } from "@gridix/utils/lib";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { FullPageLoaderView } from "@/shared/ui/LoaderView";

const SetPasswordPage = () => {
  const { user, loading, requiresPasswordSetup } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  if (loading) {
    return <FullPageLoaderView />;
  }

  if (!user) {
    return <Navigate to={addLanguageToPath("/auth", language)} replace />;
  }

  if (!requiresPasswordSetup) {
    return <Navigate to={addLanguageToPath("/", language)} replace />;
  }

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
