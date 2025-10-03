import { SetPasswordForm } from "@/components/Auth/SetPasswordForm";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { DEFAULT_LANGUAGE } from "@/lib/language-utils";

const SetPasswordPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSuccess = () => {
    // После успешной установки пароля перенаправляем пользователя
    navigate(`/${DEFAULT_LANGUAGE}/admin`);
  };

  return (
    <SetPasswordForm 
      onSuccess={handleSuccess}
      userEmail={user?.email}
    />
  );
};

export default SetPasswordPage;

