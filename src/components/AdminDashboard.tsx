
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Plus, 
  ArrowLeft, 
  Home, 
  Settings, 
  BarChart3,
  Code
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProjectList from '@/components/ProjectList';
import ProjectCreationModal from '@/components/ProjectCreationModal';
import Widget from '@/components/Widget';
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
        <ProjectList 
          onCreateNew={handleCreateNew}
          onEditProject={handleEditProject}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
