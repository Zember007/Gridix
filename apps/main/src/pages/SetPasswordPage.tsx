import { SetPasswordForm } from "@/components/Auth/SetPasswordForm";
import { useAuth } from "@/contexts/AuthContext";

const SetPasswordPage = () => {
  const { user } = useAuth();

  return <SetPasswordForm userEmail={user?.email} />;
};

export default SetPasswordPage;
