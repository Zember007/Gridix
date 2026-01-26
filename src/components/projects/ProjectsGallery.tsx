
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Slider } from '@/shared/ui/slider';
import { Label } from '@/shared/ui/label';
import { MapPin, Home, Search, Filter, Grid3X3, ExternalLink, Building2 } from 'lucide-react';
import { usePublicProjects } from '@/entities/project/queries/useProjects';
import { useLanguage } from '@/contexts/LanguageContext';
import { Project as BaseProject } from '@/entities/project/queries/useProjects';
import { getCurrencySymbolSafe } from '@/shared/lib/currency-utils';

interface Project {
  id: string;
  name: string;
  description: string;
  address: string;
  slug?: string | null;
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
  const { t } = useLanguage();
  const { projects: rawProjects, loading, error } = usePublicProjects();
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRooms, setSelectedRooms] = useState('all');
  const [priceRange, setPriceRange] = useState<number[]>([0, 10000000]);

  // Обрабатываем проекты для получения дополнительной информации
  const [projects, setProjects] = useState<Project[]>([]);

  const processProjects = (rawProjects: BaseProject[]) => {
    const processedProjects: Project[] = rawProjects.map((project: BaseProject) => {
      // Здесь можно добавить дополнительную логику обработки проектов
      // если нужно получить информацию об квартирах, это нужно делать отдельно
      return {
        id: project.id,
        name: project.name,
        description: project.description || '',
        address: project.address || '',
        slug: (project as any).slug ?? null,
        floors: project.floors,
        building_image_url: project.building_image_url,
        latitude: project.latitude,
        longitude: project.longitude,
        apartment_count: 0, // Пока оставляем 0, можно добавить отдельный запрос если нужно
        available_count: 0,
        price_from: null
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
  };

  const applyFilters = useCallback(() => {
    let filtered = [...projects];

    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCity && selectedCity !== 'all') {
      filtered = filtered.filter(project =>
        project.address.toLowerCase().includes(selectedCity.toLowerCase())
      );
    }

    if (selectedStatus === 'available') {
      filtered = filtered.filter(project => project.available_count > 0);
    } else if (selectedStatus === 'sold') {
      filtered = filtered.filter(project => project.available_count === 0);
    }

    if (selectedRooms && selectedRooms !== 'all') {
      // Здесь можно добавить фильтрацию по количеству комнат
      // Пока оставляем как есть
    }

    const minSelectedPrice = priceRange[0] ?? 0;
    const maxSelectedPrice = priceRange[1] ?? 10000000;

    if (minSelectedPrice > 0 || maxSelectedPrice < 10000000) {
      filtered = filtered.filter(project => {
        const price = project.price_from || 0;
        return price >= minSelectedPrice && price <= maxSelectedPrice;
      });
    }

    setFilteredProjects(filtered);
  }, [projects, searchTerm, selectedCity, selectedStatus, selectedRooms, priceRange]);

  useEffect(() => {
    if (rawProjects.length > 0) {
      processProjects(rawProjects);
    }
  }, [rawProjects]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const formatPrice = (price: number | null) => {
    if (!price) return t('common.priceOnRequest');
    return new Intl.NumberFormat('en-US').format(price) + ' $';
  };

  const cities = Array.from(
    new Set(
      projects
        .map((p) => p.address)
        .filter(Boolean)
        .map((addr) => (addr.split(",")[0] ?? "").trim())
        .filter(Boolean),
    ),
  );

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('gallery.title')}</h1>
            <p className="text-gray-600">{t('gallery.subtitle')}</p>
          </div>

          {/* Расширенные фильтры как на фото */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-4">
              {/* Поиск */}
              <div className="space-y-2">
                <Label htmlFor="search">{t('gallery.search')}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder={t('gallery.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Город */}
              <div className="space-y-2">
                <Label htmlFor="city">{t('gallery.city')}</Label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger id="city">
                    <SelectValue placeholder={t('gallery.allCities')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('gallery.allCities')}</SelectItem>
                    {cities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Статус */}
              <div className="space-y-2">
                <Label htmlFor="status">{t('gallery.status')}</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder={t('gallery.allStatuses')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('gallery.allStatuses')}</SelectItem>
                    <SelectItem value="available">{t('gallery.onSale')}</SelectItem>
                    <SelectItem value="sold">{t('gallery.soldOut')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Стоимость */}
              <div className="space-y-2">
                <Label htmlFor="rooms">{t('gallery.cost')}</Label>
                <Select value={selectedRooms} onValueChange={setSelectedRooms}>
                  <SelectTrigger id="rooms">
                    <SelectValue placeholder={t('gallery.anyCost')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('gallery.anyCost')}</SelectItem>
                    <SelectItem value="studio">{t('gallery.upTo5M')}</SelectItem>
                    <SelectItem value="1">{t('gallery.from5To10M')}</SelectItem>
                    <SelectItem value="2">{t('gallery.from10M')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Ценовой диапазон */}
              <div className="space-y-2 md:col-span-2">
                <Label>
                  {t('gallery.priceRange')}: {formatPrice(priceRange[0] ?? 0)} - {formatPrice(priceRange[1] ?? 10000000)}
                </Label>
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
                  {t('gallery.resetFilters')}
                </Button>
                <Button variant="outline" size="sm">
                  {t('gallery.hideFilters')}
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{t('gallery.foundCount')}: {filteredProjects.length}</span>
                <Button variant="outline" size="sm">
                  {t('gallery.viewAllApartments')}
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
            onClick={() => {
              if (onProjectSelect) {
                onProjectSelect(project.id);
              } else {
                const url = project.slug 
                  ? `/project/${project.slug}` 
                  : `/project/id/${project.id}`;
                window.open(url, '_blank');
              }
            }}
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
                  {t('gallery.installment0')}
                </Badge>
                <Badge className="bg-green-500 text-white text-xs">
                  {t('gallery.downPayment')}
                </Badge>
              </div>

              <div className="absolute bottom-3 left-3">
                <Badge variant="outline" className="bg-white/90 text-xs">
                  {t('gallery.salesStart')}
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
                  <span>{project.floors} {t('gallery.floors')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Home className="h-3 w-3" />
                  <span>{project.apartment_count} {t('gallery.apartments')}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-blue-600 mb-1">
                    {t('gallery.from')} {formatPrice(project.price_from)}
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs bg-green-50 text-green-700 border-green-200"
                  >
                    {project.available_count} {t('gallery.available')}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  {t('gallery.open')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">{t('gallery.noProjects')}</p>
          <p className="text-sm text-gray-400">{t('gallery.changeSearchCriteria')}</p>
        </div>
      )}
    </div>
  );
};

export default ProjectsGallery;
