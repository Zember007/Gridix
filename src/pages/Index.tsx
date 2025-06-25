
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Settings, BarChart3, Upload, Eye } from 'lucide-react';
import AdminDashboard from '@/components/AdminDashboard';

const Index = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'admin'>('landing');

  if (currentView === 'admin') {
    return <AdminDashboard onBack={() => setCurrentView('landing')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-real-estate-50 via-white to-real-estate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-real-estate-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-real-estate-600" />
              <h1 className="text-2xl font-bold text-real-estate-900">RealEstate SaaS</h1>
            </div>
            <Button 
              onClick={() => setCurrentView('admin')}
              className="bg-real-estate-600 hover:bg-real-estate-700"
            >
              Login to Panel
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold text-real-estate-900 mb-6">
            Create Interactive
            <span className="block text-real-estate-600">Real Estate Floor Plans</span>
          </h2>
          <p className="text-xl text-real-estate-700 mb-8 max-w-3xl mx-auto">
            Professional platform for creating interactive building and apartment floor plans 
            with Excel data integration and embeddable widgets
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-real-estate-600 hover:bg-real-estate-700 text-lg px-8 py-4"
              onClick={() => setCurrentView('admin')}
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-real-estate-600 text-real-estate-600 hover:bg-real-estate-50 text-lg px-8 py-4"
            >
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white/50">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-real-estate-900 mb-12">
            Platform Features
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-real-estate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Upload className="h-12 w-12 text-real-estate-600 mb-4" />
                <CardTitle className="text-real-estate-900">Plan Upload</CardTitle>
                <CardDescription>
                  Upload high-resolution building images and floor plans
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-real-estate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Settings className="h-12 w-12 text-real-estate-600 mb-4" />
                <CardTitle className="text-real-estate-900">Interactive Editing</CardTitle>
                <CardDescription>
                  Outline floors with polygons and create interactive apartment zones
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-real-estate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-real-estate-600 mb-4" />
                <CardTitle className="text-real-estate-900">Excel Integration</CardTitle>
                <CardDescription>
                  Import apartment data from Excel files with automatic synchronization
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-real-estate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Eye className="h-12 w-12 text-real-estate-600 mb-4" />
                <CardTitle className="text-real-estate-900">Embeddable Widget</CardTitle>
                <CardDescription>
                  Easily integrate interactive plans into any website with one line of code
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-real-estate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-12 w-12 text-real-estate-600 mb-4" />
                <CardTitle className="text-real-estate-900">Status Management</CardTitle>
                <CardDescription>
                  Track apartment statuses: available, sold, reserved
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-real-estate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Building2 className="h-12 w-12 text-real-estate-600 mb-4" />
                <CardTitle className="text-real-estate-900">Multi-Project</CardTitle>
                <CardDescription>
                  Manage multiple real estate projects from a single dashboard
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-real-estate-600 to-real-estate-800">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-4xl font-bold text-white mb-6">
            Ready to Start?
          </h3>
          <p className="text-xl text-real-estate-100 mb-8 max-w-2xl mx-auto">
            Create your first interactive real estate project today
          </p>
          <Button 
            size="lg" 
            className="bg-white text-real-estate-600 hover:bg-real-estate-50 text-lg px-8 py-4"
            onClick={() => setCurrentView('admin')}
          >
            Enter Admin Panel
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-real-estate-900 text-real-estate-100 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Building2 className="h-6 w-6" />
            <span className="text-lg font-semibold">RealEstate SaaS</span>
          </div>
          <p className="text-real-estate-300">
            © 2024 RealEstate SaaS. Professional real estate solutions.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
