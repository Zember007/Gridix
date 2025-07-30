
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, MapPin, Eye, SlidersHorizontal, DollarSign, Calendar, Grid, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import InteractiveProjectsMap from '@/components/InteractiveProjectsMap';

interface Project {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  floors: number;
  building_image_url: string | null;
  latitude: number | null;
  longitude: number | null;
}

const EmbedProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const { t } = useLanguage();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, description, address, floors, building_image_url, latitude, longitude')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProject = (projectId: string) => {
    window.open(`/widget/${projectId}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E1E1E]"></div>
      </div>
    );
  }

  // Если выбран режим карты, отображаем InteractiveProjectsMap
  if (viewMode === 'map') {
    return (
      <InteractiveProjectsMap
        onProjectSelect={(project) => {
          handleViewProject(project.id);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header with filters */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">{t('embed.title')}</h1>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <Button 
                variant={viewMode === 'grid' ? 'default' : 'outline'} 
                size="sm"
                className={viewMode === 'grid' ? 'bg-[#1E1E1E] text-white' : 'border-gray-300'}
                onClick={() => setViewMode('grid')}
              >
                {t('project.listView')}
              </Button>
              <Button 
                variant={viewMode === 'map' ? 'default' : 'outline'} 
                size="sm"
                className={viewMode === 'map' ? 'bg-[#1E1E1E] text-white' : 'border-gray-300'}
                onClick={() => setViewMode('map')}
              >
                {/* {t('gallery.open')} */}
                На карте
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Parameters filter */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border">
              <SlidersHorizontal className="h-4 w-4 text-gray-600" />
              <Select defaultValue="all">
                <SelectTrigger className="border-0 shadow-none h-auto p-0 bg-transparent">
                  <SelectValue placeholder={t('project.parameters')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('project.allTypes')}</SelectItem>
                  <SelectItem value="studio">{t('apartment.studio')}</SelectItem>
                  <SelectItem value="1">1 {t('apartment.room')}</SelectItem>
                  <SelectItem value="2">2 {t('apartment.rooms')}</SelectItem>
                  <SelectItem value="3">3 {t('apartment.rooms')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price filter */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border">
              <DollarSign className="h-4 w-4 text-gray-600" />
              <Select defaultValue="all">
                <SelectTrigger className="border-0 shadow-none h-auto p-0 bg-transparent">
                  <SelectValue placeholder={t('gallery.cost')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('gallery.anyCost')}</SelectItem>
                  <SelectItem value="low">{t('gallery.upTo5M')}</SelectItem>
                  <SelectItem value="medium">{t('gallery.from5To10M')}</SelectItem>
                  <SelectItem value="high">{t('gallery.from10M')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Delivery date filter */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border">
              <Calendar className="h-4 w-4 text-gray-600" />
              <Select defaultValue="all">
                <SelectTrigger className="border-0 shadow-none h-auto p-0 bg-transparent">
                  <SelectValue placeholder={t('gallery.salesStart')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('gallery.salesStart')}</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset filters */}
            <Button variant="ghost" size="sm" className="text-gray-600">
              {t('filters.resetFilters')}
            </Button>

            {/* Main CTA */}
            <Button className="bg-[#1E1E1E] hover:bg-[#1E1E1E]/90 text-white ml-auto">
              {t('project.viewApartments', { count: projects.length })}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Grid view */}
        {projects.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500">{t('embed.noProjects')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white rounded-2xl">
                <CardContent className="p-0">
                  {/* Project image */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {project.building_image_url ? (
                      <img
                        src={project.building_image_url}
                        alt={project.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600" />
                    )}
                    
                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-gray-700">
                        {t('gallery.installment0')}
                      </div>
                      <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-gray-700">
                        {t('gallery.downPayment')}
                      </div>
                    </div>

                    <div className="absolute bottom-4 left-4">
                      <div className="bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 text-white">
                        <div className="text-xs opacity-80">{t('gallery.salesStart')}</div>
                      </div>
                    </div>
                  </div>

                  {/* Project info */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#1E1E1E] transition-colors">
                      {project.name}
                    </h3>
                    
                    <div className="text-gray-600 text-sm mb-4">
                      {t('gallery.from')} {Math.floor(Math.random() * 2000) + 1000}$ {t('apartment.sqm')}
                    </div>

                    {project.address && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                        <MapPin className="h-4 w-4" />
                        {project.address}
                      </div>
                    )}

                    <Button
                      onClick={() => handleViewProject(project.id)}
                      className="w-full bg-[#1E1E1E] hover:bg-[#1E1E1E]/90 text-white py-3 rounded-lg font-medium"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {t('embed.viewApartments')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmbedProjectsPage;
