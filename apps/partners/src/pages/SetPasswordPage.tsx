import { SetPasswordPage as GlobalSetPasswordPage } from "@gridix/ui";
import { addLanguageToPath } from "@gridix/utils/lib";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Navigate, useNavigate } from "react-router-dom";

export default function SetPasswordPage() {
  const { user, loading } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to={addLanguageToPath("/auth", language)} replace />;
  }

  if (user.user_metadata?.requires_password_setup !== true) {
    return <Navigate to={addLanguageToPath("/", language)} replace />;
  }

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
