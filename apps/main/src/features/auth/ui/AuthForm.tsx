import {
  useAuthFormController,
  type AuthFormProps,
} from "../model/useAuthFormController";
import { AuthFormView } from "./AuthFormView";

export const AuthForm = ({
  onSuccess,
  redirectTo,
  defaultMode,
}: AuthFormProps) => {
  const controller = useAuthFormController({
    onSuccess,
    redirectTo,
    defaultMode,
  });

  return (
    <AuthFormView
      t={controller.t}
      mode={controller.mode}
      loading={controller.loading}
      showPassword={controller.showPassword}
      resetLoading={controller.resetLoading}
      resetEmail={controller.resetEmail}
      showReset={controller.showReset}
      formData={controller.formData}
      refCode={controller.refCode}
      checkingPartner={controller.checkingPartner}
      partnerInfo={controller.partnerInfo}
      marketingEmailsConsent={controller.marketingEmailsConsent}
      onModeChange={controller.setMode}
      onTogglePassword={() =>
        controller.setShowPassword((prev: boolean) => !prev)
      }
      onResetEmailChange={controller.setResetEmail}
      onOpenReset={() => controller.setShowReset(true)}
      onCloseReset={() => controller.setShowReset(false)}
      onFormDataChange={(patch) =>
        controller.setFormData((prev) => ({ ...prev, ...patch }))
      }
      onMarketingConsentChange={controller.setMarketingEmailsConsent}
      onSubmit={controller.handleSubmit}
      onSendReset={controller.handleSendReset}
    />
  );
};
