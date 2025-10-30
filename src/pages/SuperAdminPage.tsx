import { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SuperAdminSidebar } from '@/components/superadmin/SuperAdminSidebar';
import { UsersManagement } from '@/components/superadmin/UsersManagement';
import { SubscriptionsManagement } from '@/components/superadmin/SubscriptionsManagement';
import { ProjectsManagement } from '@/components/superadmin/ProjectsManagement';
const Statistics = lazy(() => import('@/components/superadmin/Statistics').then(m => ({ default: m.Statistics })));
import { SystemSettings } from '@/components/superadmin/SystemSettings';
import { PartnersManagement } from '@/components/superadmin/PartnersManagement';
import { PartnerPayoutsManagement } from '@/components/superadmin/PartnerPayoutsManagement';
import { Loader2 } from 'lucide-react';

const SuperAdminPage = () => {
  const { isSuperAdmin, loading } = useSuperAdmin();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      navigate('/');
    }
  }, [isSuperAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <UsersManagement />;
      case 'subscriptions':
        return <SubscriptionsManagement />;
      case 'projects':
        return <ProjectsManagement />;
      case 'stats':
        return (
          <Suspense fallback={<div className="flex items-center justify-center p-6">Загрузка статистики...</div>}>
            <Statistics />
          </Suspense>
        );
      case 'partners':
        return <PartnersManagement />;
      case 'partner-payouts':
        return <PartnerPayoutsManagement />;
      case 'settings':
        return <SystemSettings />;
      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <SuperAdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 overflow-auto">{renderContent()}</main>
      </div>
    </SidebarProvider>
  );
};

export default SuperAdminPage;
