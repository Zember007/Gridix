
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  ArrowLeft, 
  Home, 
  Settings, 
  Code,
  User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProjectList from '@/components/ProjectList';
import AdminWidgets from '@/components/AdminWidgets';
import AdminSettings from '@/components/AdminSettings';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';

interface AdminDashboardProps {
  onBack: () => void;
}

const AdminDashboard = ({ onBack }: AdminDashboardProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleCreateNew = () => {
    navigate('/admin/project/new');
  };

  const handleEditProject = (projectId: string, isNew: boolean) => {
    if (isNew) {
      navigate('/admin/project/new');
    } else {
      navigate(`/admin/project/${projectId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{t('admin.dashboard')}</h1>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <Button variant="outline" onClick={onBack}>
                {t('common.back')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Проекты
            </TabsTrigger>
            <TabsTrigger value="widgets" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Виджеты
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Настройки
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Аккаунт
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects">
            <ProjectList 
              onCreateNew={handleCreateNew}
              onEditProject={handleEditProject}
            />
          </TabsContent>

          <TabsContent value="widgets">
            <AdminWidgets />
          </TabsContent>

          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>

          <TabsContent value="account">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
