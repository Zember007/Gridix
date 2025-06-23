
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Edit, 
  Eye, 
  MoreVertical, 
  Trash2,
  Calendar,
  Home,
  Users
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProjectListProps {
  onSelectProject: (projectId: string) => void;
}

const ProjectList = ({ onSelectProject }: ProjectListProps) => {
  // Mock project data
  const [projects] = useState([
    {
      id: '1',
      name: 'ЖК "Северная звезда"',
      description: 'Премиальный жилой комплекс в центре города',
      floors: 12,
      apartments: 45,
      sold: 23,
      status: 'active',
      createdAt: '2024-01-15',
      image: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=400&h=300&fit=crop'
    },
    {
      id: '2', 
      name: 'ЖК "Морские дали"',
      description: 'Жилой комплекс у моря с панорамным видом',
      floors: 18,
      apartments: 67,
      sold: 34,
      status: 'active',
      createdAt: '2024-02-20',
      image: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=400&h=300&fit=crop'
    },
    {
      id: '3',
      name: 'ЖК "Центральный"', 
      description: 'Компактный проект в деловом районе',
      floors: 8,
      apartments: 23,
      sold: 18,
      status: 'completed',
      createdAt: '2023-11-10',
      image: 'https://images.unsplash.com/photo-1496307653780-42ee777d4833?w=400&h=300&fit=crop'
    },
    {
      id: '4',
      name: 'ЖК "Парковый"',
      description: 'Проект в разработке рядом с парком',
      floors: 15,
      apartments: 34,
      sold: 5,
      status: 'draft',
      createdAt: '2024-03-05',
      image: 'https://images.unsplash.com/photo-1431576901776-e539bd916ba2?w=400&h=300&fit=crop'
    }
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success-100 text-success-800 hover:bg-success-100">Активный</Badge>;
      case 'completed':
        return <Badge className="bg-real-estate-100 text-real-estate-800 hover:bg-real-estate-100">Завершен</Badge>;
      case 'draft':
        return <Badge variant="outline" className="border-warning-300 text-warning-700">Черновик</Badge>;
      default:
        return <Badge variant="secondary">Неизвестно</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {projects.length === 0 ? (
        <Card className="border-dashed border-real-estate-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-16 w-16 text-real-estate-300 mb-4" />
            <h3 className="text-xl font-semibold text-real-estate-700 mb-2">
              Пока нет проектов
            </h3>
            <p className="text-real-estate-500 text-center mb-6">
              Создайте свой первый проект недвижимости для начала работы
            </p>
            <Button 
              onClick={() => onSelectProject('new')}
              className="bg-real-estate-600 hover:bg-real-estate-700"
            >
              Создать проект
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card 
              key={project.id} 
              className="hover:shadow-lg transition-all duration-200 border-real-estate-200 hover:border-real-estate-300 group"
            >
              <div className="relative">
                <img 
                  src={project.image} 
                  alt={project.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className="absolute top-3 right-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        className="bg-white/80 backdrop-blur-sm hover:bg-white/90"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white">
                      <DropdownMenuItem 
                        onClick={() => onSelectProject(project.id)}
                        className="hover:bg-real-estate-50"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Редактировать
                      </DropdownMenuItem>
                      <DropdownMenuItem className="hover:bg-real-estate-50">
                        <Eye className="h-4 w-4 mr-2" />
                        Предпросмотр
                      </DropdownMenuItem>
                      <DropdownMenuItem className="hover:bg-red-50 text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="absolute top-3 left-3">
                  {getStatusBadge(project.status)}
                </div>
              </div>
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-real-estate-900 mb-2">
                      {project.name}
                    </CardTitle>
                    <CardDescription className="text-real-estate-600">
                      {project.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-real-estate-600">
                    <Building2 className="h-4 w-4" />
                    <span>{project.floors} этажей</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-real-estate-600">
                    <Home className="h-4 w-4" />
                    <span>{project.apartments} квартир</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-real-estate-600">
                    <Users className="h-4 w-4" />
                    <span>{project.sold} продано</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-real-estate-600">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(project.createdAt)}</span>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-real-estate-600">Прогресс продаж</span>
                    <span className="text-real-estate-700 font-medium">
                      {Math.round((project.sold / project.apartments) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-real-estate-100 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-real-estate-500 to-real-estate-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(project.sold / project.apartments) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 border-real-estate-300 text-real-estate-600 hover:bg-real-estate-50"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Просмотр
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 bg-real-estate-600 hover:bg-real-estate-700"
                    onClick={() => onSelectProject(project.id)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Редактировать
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectList;
