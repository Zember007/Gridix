
import { useLanguageNavigation } from '@/hooks/useLanguageNavigation';
import AdminDashboard from '@/components/AdminDashboard';

const AdminPage = () => {
  const { navigate } = useLanguageNavigation();

  const goBack = () => {
    navigate('/');
  };

  return <AdminDashboard onBack={goBack} />;
};

export default AdminPage;
