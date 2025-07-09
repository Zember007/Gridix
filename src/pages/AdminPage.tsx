
import { useNavigate } from 'react-router-dom';
import AdminDashboard from '@/components/AdminDashboard';

const AdminPage = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  return <AdminDashboard onBack={handleBack} />;
};

export default AdminPage;
