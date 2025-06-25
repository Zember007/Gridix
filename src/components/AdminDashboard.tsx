
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
import ProjectList from '@/components/ProjectList';
import ProjectEditor from '@/components/ProjectEditor';
import ProjectCreationModal from '@/components/ProjectCreationModal';
import Widget from '@/components/Widget';

interface AdminDashboardProps {
  onBack: () => void;
}

const AdminDashboard = ({ onBack }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState('projects');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [showCreationModal, setShowCreationModal] = useState(false);

  const handleCreateProject = () => {
    setShowCreationModal(true);
  };

  const handleManualProject = () => {
    setShowCreationModal(false);
    setIsCreatingProject(true);
    setSelectedProject('new');
  };

  const handleEditProject = (projectId: string, isNew: boolean) => {
    setSelectedProject(projectId);
    setIsCreatingProject(isNew);
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
                Home
              </Button>
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-real-estate-600" />
                <h1 className="text-2xl font-bold text-real-estate-900">Admin Panel</h1>
              </div>
            </div>
            {activeTab === 'projects' && (
              <Button 
                onClick={handleCreateProject}
                className="bg-real-estate-600 hover:bg-real-estate-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[500px] mx-auto">
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="widget" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Widget
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-real-estate-900">My Projects</h2>
                <p className="text-real-estate-600 mt-2">Manage your real estate projects</p>
              </div>
            </div>
            <ProjectList 
              onCreateNew={handleCreateProject}
              onEditProject={handleEditProject}
            />
          </TabsContent>

          <TabsContent value="widget" className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-real-estate-900">Website Widget</h2>
              <p className="text-real-estate-600 mt-2">Integrate interactive plans into your website</p>
            </div>
            <Widget />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-real-estate-900">Analytics</h2>
              <p className="text-real-estate-600 mt-2">Statistics for your projects</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-real-estate-600">12</div>
                  <p className="text-xs text-muted-foreground">
                    +2 this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Apartments</CardTitle>
                  <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success-600">284</div>
                  <p className="text-xs text-muted-foreground">
                    +15 this week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sold</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-warning-600">97</div>
                  <p className="text-xs text-muted-foreground">
                    +23 this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversion</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-real-estate-600">34.2%</div>
                  <p className="text-xs text-muted-foreground">
                    +2.4% from last period
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Popular Projects</CardTitle>
                <CardDescription>
                  Projects with the most views
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Modern Heights Complex', views: 1540, apartments: 45 },
                    { name: 'Oceanview Residences', views: 1230, apartments: 67 },
                    { name: 'City Center Tower', views: 980, apartments: 23 },
                    { name: 'Park View Apartments', views: 750, apartments: 34 },
                  ].map((project, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-real-estate-50">
                      <div>
                        <p className="font-medium text-real-estate-900">{project.name}</p>
                        <p className="text-sm text-real-estate-600">{project.apartments} apartments</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-real-estate-700">{project.views}</p>
                        <p className="text-sm text-real-estate-500">views</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ProjectCreationModal 
        open={showCreationModal}
        onClose={() => setShowCreationModal(false)}
        onManualCreate={handleManualProject}
      />
    </div>
  );
};

export default AdminDashboard;
