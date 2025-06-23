
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Plus, 
  ArrowLeft, 
  Home, 
  Upload, 
  Settings, 
  BarChart3,
  Code,
  FileSpreadsheet
} from 'lucide-react';
import ProjectList from '@/components/ProjectList';
import ProjectEditor from '@/components/ProjectEditor';
import DataImport from '@/components/DataImport';
import Widget from '@/components/Widget';

interface AdminDashboardProps {
  onBack: () => void;
}

const AdminDashboard = ({ onBack }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState('projects');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const handleCreateProject = () => {
    setIsCreatingProject(true);
    setSelectedProject('new');
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProject(projectId);
    setActiveTab('editor');
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
    setIsCreatingProject(false);
    setActiveTab('projects');
  };

  // If we're editing a project, show the project editor
  if (selectedProject && (activeTab === 'editor' || isCreatingProject)) {
    return (
      <ProjectEditor 
        projectId={selectedProject}
        isNew={isCreatingProject}
        onBack={handleBackToProjects}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-real-estate-50 via-white to-real-estate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-real-estate-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onBack}
                className="text-real-estate-600 hover:text-real-estate-700 hover:bg-real-estate-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                На главную
              </Button>
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-real-estate-600" />
                <h1 className="text-2xl font-bold text-real-estate-900">Админ-панель</h1>
              </div>
            </div>
            {activeTab === 'projects' && (
              <Button 
                onClick={handleCreateProject}
                className="bg-real-estate-600 hover:bg-real-estate-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Новый проект
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px] mx-auto">
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Проекты
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Импорт данных
            </TabsTrigger>
            <TabsTrigger value="widget" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Виджет
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Аналитика
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-real-estate-900">Мои проекты</h2>
                <p className="text-real-estate-600 mt-2">Управляйте своими проектами недвижимости</p>
              </div>
            </div>
            <ProjectList onSelectProject={handleSelectProject} />
          </TabsContent>

          <TabsContent value="import" className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-real-estate-900">Импорт данных</h2>
              <p className="text-real-estate-600 mt-2">Загрузите данные о квартирах из Excel файлов</p>
            </div>
            <DataImport />
          </TabsContent>

          <TabsContent value="widget" className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-real-estate-900">Виджет для сайта</h2>
              <p className="text-real-estate-600 mt-2">Интегрируйте интерактивные планы на ваш сайт</p>
            </div>
            <Widget />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-real-estate-900">Аналитика</h2>
              <p className="text-real-estate-600 mt-2">Статистика по вашим проектам</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Всего проектов</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-real-estate-600">12</div>
                  <p className="text-xs text-muted-foreground">
                    +2 за последний месяц
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Активных квартир</CardTitle>
                  <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success-600">284</div>
                  <p className="text-xs text-muted-foreground">
                    +15 за последнюю неделю
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Продано</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-warning-600">97</div>
                  <p className="text-xs text-muted-foreground">
                    +23 за последний месяц
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Конверсия</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-real-estate-600">34.2%</div>
                  <p className="text-xs text-muted-foreground">
                    +2.4% от прошлого периода
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Популярные проекты</CardTitle>
                <CardDescription>
                  Проекты с наибольшим количеством просмотров
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'ЖК "Северная звезда"', views: 1540, apartments: 45 },
                    { name: 'ЖК "Морские дали"', views: 1230, apartments: 67 },
                    { name: 'ЖК "Центральный"', views: 980, apartments: 23 },
                    { name: 'ЖК "Парковый"', views: 750, apartments: 34 },
                  ].map((project, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-real-estate-50">
                      <div>
                        <p className="font-medium text-real-estate-900">{project.name}</p>
                        <p className="text-sm text-real-estate-600">{project.apartments} квартир</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-real-estate-700">{project.views}</p>
                        <p className="text-sm text-real-estate-500">просмотров</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
