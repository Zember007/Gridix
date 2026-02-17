import { useState, useCallback } from "react";
import { supabase } from "../../api/supabase";
import { useLanguage } from "../language/LanguageContext";

export function useAccountSecurity() {
  const { t } = useLanguage();

  const [newEmail, setNewEmail] = useState("");
  const [updatingEmail, setUpdatingEmail] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handleUpdateEmail = useCallback(async (): Promise<{
    success: boolean;
    errorKey?: string;
  }> => {
    if (!newEmail) {
      return { success: false, errorKey: "adminSettings.errorUpdatingEmail" };
    }

    setUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });

      if (error) {
        console.error("Error updating email:", error);
        if (error.message?.includes("same") || error.code === "same_email") {
          return { success: false, errorKey: "adminSettings.sameEmail" };
        }
        if (
          error.message?.includes("already") ||
          error.code === "email_exists"
        ) {
          return { success: false, errorKey: "adminSettings.emailExists" };
        }
        return { success: false, errorKey: "adminSettings.errorUpdatingEmail" };
      }

      setNewEmail("");
      return { success: true };
    } catch (error) {
      console.error("Error updating email:", error);
      return { success: false, errorKey: "adminSettings.errorUpdatingEmail" };
    } finally {
      setUpdatingEmail(false);
    }
  }, [newEmail]);

  const handleUpdatePassword = useCallback(async (): Promise<{
    success: boolean;
    errorKey?: string;
  }> => {
    if (!newPassword || !confirmPassword) {
      return {
        success: false,
        errorKey: "adminSettings.errorUpdatingPassword",
      };
    }
    if (newPassword !== confirmPassword) {
      return { success: false, errorKey: "adminSettings.passwordsDoNotMatch" };
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error("Error updating password:", error);
        if (error.code === "same_password") {
          return { success: false, errorKey: "adminSettings.samePassword" };
        }
        return {
          success: false,
          errorKey: "adminSettings.errorUpdatingPassword",
        };
      }

      setNewPassword("");
      setConfirmPassword("");
      return { success: true };
    } catch (error) {
      console.error("Error updating password:", error);
      return {
        success: false,
        errorKey: "adminSettings.errorUpdatingPassword",
      };
    } finally {
      setUpdatingPassword(false);
    }
  }, [newPassword, confirmPassword]);

  return {
    newEmail,
    setNewEmail,
    updatingEmail,
    handleUpdateEmail,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    updatingPassword,
    handleUpdatePassword,
    t,
  };
}
