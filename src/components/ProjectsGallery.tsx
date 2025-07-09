
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { MapPin, Home, Search, Filter, Grid3X3, ExternalLink, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Project {
  id: string;
  name: string;
  description: string;
  address: string;
  floors: number;
  building_image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  apartment_count: number;
  available_count: number;
  price_from: number | null;
}

interface ProjectsGalleryProps {
  showHeader?: boolean;
  embedMode?: boolean;
  onProjectSelect?: (projectId: string) => void;
}

const ProjectsGallery = ({ showHeader = true, embedMode = false, onProjectSelect }: ProjectsGalleryProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedRooms, setSelectedRooms] = useState('');
  const [priceRange, setPriceRange] = useState<number[]>([0, 10000000]);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [projects, searchTerm, selectedCity, selectedStatus, selectedRooms, priceRange]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          apartments (
            id,
            status,
            price,
            rooms
          )
        `);

      if (error) throw error;

      const processedProjects = data.map(project => {
        const apartments = project.apartments || [];
        const availableApartments = apartments.filter((apt: any) => apt.status === 'available');
        const prices = apartments.map((apt: any) => apt.price).filter((p: any) => p > 0);
        
        return {
          id: project.id,
          name: project.name,
          description: project.description || '',
          address: project.address || '',
          floors: project.floors,
          building_image_url: project.building_image_url,
          latitude: project.latitude,
          longitude: project.longitude,
          apartment_count: apartments.length,
          available_count: availableApartments.length,
          price_from: prices.length > 0 ? Math.min(...prices) : null
        };
      });

      setProjects(processedProjects);

      // Устанавливаем диапазон цен
      const allPrices = processedProjects
        .map(p => p.price_from)
        .filter((p): p is number => p !== null);
      
      if (allPrices.length > 0) {
        setPriceRange([Math.min(...allPrices), Math.max(...allPrices)]);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...projects];

    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCity) {
      filtered = filtered.filter(project =>
        project.address.toLowerCase().includes(selectedCity.toLowerCase())
      );
    }

    if (selectedStatus === 'available') {
      filtered = filtered.filter(project => project.available_count > 0);
    } else if (selectedStatus === 'sold') {
      filtered = filtered.filter(project => project.available_count === 0);
    }

    if (selectedRooms) {
      // Здесь можно добавить фильтрацию по количеству комнат
      // Пока оставляем как есть
    }

    if (priceRange[0] > 0 || priceRange[1] < 10000000) {
      filtered = filtered.filter(project => {
        const price = project.price_from || 0;
        return price >= priceRange[0] && price <= priceRange[1];
      });
    }

    setFilteredProjects(filtered);
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'По запросу';
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  };

  const cities = Array.from(new Set(
    projects
      .map(p => p.address)
      .filter(addr => addr)
      .map(addr => addr.split(',')[0])
  ));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`w-full ${embedMode ? '' : 'max-w-7xl mx-auto'}`}>
      {showHeader && (
        <div className={`${embedMode ? 'p-4' : 'mb-8'}`}>
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Наши проекты</h1>
            <p className="text-gray-600">Выберите подходящий жилой комплекс</p>
          </div>

          {/* Расширенные фильтры как на фото */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-4">
              {/* Поиск */}
              <div className="space-y-2">
                <Label htmlFor="search">Поиск</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Название или адрес..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {/* Город */}
              <div className="space-y-2">
                <Label htmlFor="city">Город</Label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger id="city">
                    <SelectValue placeholder="Все города" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Все города</SelectItem>
                    {cities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Статус */}
              <div className="space-y-2">
                <Label htmlFor="status">Статус</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Все статусы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Все статусы</SelectItem>
                    <SelectItem value="available">В продаже</SelectItem>
                    <SelectItem value="sold">Распроданы</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Стоимость */}
              <div className="space-y-2">
                <Label htmlFor="rooms">Стоимость</Label>
                <Select value={selectedRooms} onValueChange={setSelectedRooms}>
                  <SelectTrigger id="rooms">
                    <SelectValue placeholder="Любая стоимость" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Любая стоимость</SelectItem>
                    <SelectItem value="studio">до 5 млн</SelectItem>
                    <SelectItem value="1">5-10 млн</SelectItem>
                    <SelectItem value="2">от 10 млн</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Ценовой диапазон */}
              <div className="space-y-2 md:col-span-2">
                <Label>Цена: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}</Label>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={10000000}
                  min={0}
                  step={100000}
                  className="w-full"
                />
              </div>
            </div>

            {/* Дополнительные фильтры в одну строку */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Сбросить фильтры
                </Button>
                <Button variant="outline" size="sm">
                  Скрыть фильтры
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Найдено: {filteredProjects.length}</span>
                <Button variant="outline" size="sm">
                  Смотреть все апартаменты
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Сетка проектов */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${embedMode ? 'p-4' : ''}`}>
        {filteredProjects.map((project) => (
          <Card 
            key={project.id}
            className="hover:shadow-lg transition-shadow cursor-pointer group overflow-hidden"
            onClick={() => onProjectSelect ? onProjectSelect(project.id) : window.open(`/project/${project.id}`, '_blank')}
          >
            <div className="aspect-video bg-gray-100 overflow-hidden relative">
              {project.building_image_url ? (
                <img 
                  src={project.building_image_url} 
                  alt={project.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Building2 className="h-12 w-12 text-gray-400" />
                </div>
              )}
              
              {/* Бейджи как на фото */}
              <div className="absolute top-3 left-3 flex gap-2">
                <Badge className="bg-blue-500 text-white text-xs">
                  Рассрочка 0%
                </Badge>
                <Badge className="bg-green-500 text-white text-xs">
                  первый взнос от 5%
                </Badge>
              </div>
              
              <div className="absolute bottom-3 left-3">
                <Badge variant="outline" className="bg-white/90 text-xs">
                  Старт продаж
                </Badge>
              </div>
            </div>
            
            <CardContent className="p-4">
              <div className="mb-3">
                <h3 className="font-bold text-lg mb-1 group-hover:text-blue-600 transition-colors">
                  {project.name}
                </h3>
                {project.address && (
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span>{project.address}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <Grid3X3 className="h-3 w-3" />
                  <span>{project.floors} этажей</span>
                </div>
                <div className="flex items-center gap-1">
                  <Home className="h-3 w-3" />
                  <span>{project.apartment_count} квартир</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-blue-600 mb-1">
                    от {formatPrice(project.price_from)}
                  </div>
                  <Badge 
                    variant="outline" 
                    className="text-xs bg-green-50 text-green-700 border-green-200"
                  >
                    {project.available_count} доступно
                  </Badge>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Открыть
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Проекты не найдены</p>
          <p className="text-sm text-gray-400">Попробуйте изменить критерии поиска</p>
        </div>
      )}
    </div>
  );
};

export default ProjectsGallery;
