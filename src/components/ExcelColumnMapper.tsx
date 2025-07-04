import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Check, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ExcelColumnMapperProps {
  excelColumns: string[];
  importedData: any[];
  onComplete: () => void;
}

interface ColumnMapping {
  apartmentNumber: string;
  floor: string;
  rooms: string;
  area: string;
  price: string;
  status: string;
}

interface ProjectData {
  name: string;
  description: string;
  floors: number;
}

const ExcelColumnMapper = ({ excelColumns, importedData, onComplete }: ExcelColumnMapperProps) => {
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    apartmentNumber: '',
    floor: '',
    rooms: '',
    area: '',
    price: '',
    status: ''
  });

  const [projectData, setProjectData] = useState<ProjectData>({
    name: '',
    description: '',
    floors: 1
  });

  const [isCreating, setIsCreating] = useState(false);

  const fieldLabels = {
    apartmentNumber: 'Номер квартиры',
    floor: 'Этаж',
    rooms: 'Количество комнат',
    area: 'Площадь (м²)',
    price: 'Цена',
    status: 'Статус'
  };

  const requiredFields = ['apartmentNumber', 'floor', 'rooms', 'area'];
  const isValid = requiredFields.every(field => columnMapping[field as keyof ColumnMapping] && columnMapping[field as keyof ColumnMapping] !== '__none__');

  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    setColumnMapping(prev => ({ ...prev, [field]: value }));
  };

  const getPreviewValue = (field: keyof ColumnMapping) => {
    const columnName = columnMapping[field];
    if (!columnName || columnName === '__none__' || !importedData.length) return 'Нет данных';
    const value = importedData[0][columnName];
    return value !== null && value !== undefined && value !== '' ? value : 'Нет данных';
  };

  const createProjectWithData = async () => {
    if (!isValid || !projectData.name.trim()) {
      toast.error('Пожалуйста, заполните все обязательные поля');
      return;
    }

    setIsCreating(true);
    try {
      console.log('Начало создания проекта с данными:', importedData.length, 'записей');
      
      // Вычисляем максимальный этаж из данных
      const maxFloor = Math.max(...importedData.map(row => {
        const floorValue = row[columnMapping.floor];
        const parsedFloor = parseInt(String(floorValue)) || 1;
        console.log('Этаж из строки:', floorValue, 'преобразован в:', parsedFloor);
        return parsedFloor;
      }));

      console.log('Максимальный этаж:', maxFloor);

      // Создаем проект
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert([{
          name: projectData.name.trim(),
          description: projectData.description.trim() || null,
          floors: Math.max(maxFloor, projectData.floors)
        }])
        .select()
        .single();

      if (projectError) throw projectError;
      console.log('Проект создан:', project);

      // Создаем этажи здания для визуализации
      const floorData = [];
      for (let i = 1; i <= Math.max(maxFloor, projectData.floors); i++) {
        floorData.push({
          project_id: project.id,
          floor_number: i,
          polygon: [],
          color: '#3b82f6'
        });
      }

      const { error: floorError } = await supabase
        .from('building_floors')
        .insert(floorData);

      if (floorError) {
        console.error('Ошибка при создании этажей:', floorError);
      } else {
        console.log('Этажи созданы для визуализации');
      }

      // Обрабатываем и вставляем данные квартир
      const apartmentData = importedData.map((row, index) => {
        const floorNumber = parseInt(String(row[columnMapping.floor])) || 1;
        const apartmentNumber = String(row[columnMapping.apartmentNumber] || `${index + 1}`);
        const rooms = parseInt(String(row[columnMapping.rooms])) || 1;
        const area = parseFloat(String(row[columnMapping.area])) || 0;
        const price = columnMapping.price && columnMapping.price !== '__none__' 
          ? (parseInt(String(row[columnMapping.price])) || 0) 
          : 0;
        const status = columnMapping.status && columnMapping.status !== '__none__' 
          ? (String(row[columnMapping.status]) || 'available') 
          : 'available';

        console.log(`Квартира ${apartmentNumber}: этаж ${floorNumber}, комнат ${rooms}, площадь ${area}`);

        return {
          project_id: project.id,
          apartment_number: apartmentNumber,
          floor_number: floorNumber,
          rooms: rooms,
          area: area,
          price: price,
          status: status === 'продана' || status === 'sold' ? 'sold' : 
                 status === 'забронирована' || status === 'reserved' ? 'reserved' : 'available',
          polygon: [] // Пустой полигон, будет заполнен позже при редактировании
        };
      });

      console.log('Данные квартир для вставки:', apartmentData.slice(0, 3));

      const { error: apartmentError } = await supabase
        .from('apartments')
        .insert(apartmentData);

      if (apartmentError) throw apartmentError;

      // Группируем квартиры по этажам для отчета
      const apartmentsByFloor = apartmentData.reduce((acc, apt) => {
        acc[apt.floor_number] = (acc[apt.floor_number] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      console.log('Квартиры по этажам:', apartmentsByFloor);

      toast.success(
        `Проект "${projectData.name}" создан с ${apartmentData.length} квартирами на ${Math.max(maxFloor, projectData.floors)} этажах`
      );
      
      // Перенаправляем на созданный проект
      setTimeout(() => {
        window.location.href = `/admin/project/${project.id}`;
      }, 1000);
      
    } catch (error) {
      console.error('Ошибка создания проекта:', error);
      toast.error('Ошибка при создании проекта');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Информация о проекте */}
      <Card>
        <CardHeader>
          <CardTitle>Информация о проекте</CardTitle>
          <CardDescription>Основная информация о вашем проекте</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="projectName">Название проекта*</Label>
            <Input
              id="projectName"
              value={projectData.name}
              onChange={(e) => setProjectData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Введите название проекта"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="projectDescription">Описание</Label>
            <Input
              id="projectDescription"
              value={projectData.description}
              onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Краткое описание проекта"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="floors">Количество этажей</Label>
            <Input
              id="floors"
              type="number"
              value={projectData.floors}
              onChange={(e) => setProjectData(prev => ({ ...prev, floors: parseInt(e.target.value) || 1 }))}
              min="1"
              max="50"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Будет автоматически скорректировано на основе данных из таблицы
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Соотнесение столбцов */}
      <Card>
        <CardHeader>
          <CardTitle>Соотнести столбцы Excel</CardTitle>
          <CardDescription>
            Укажите, какие столбцы из вашего Excel файла соответствуют полям квартир
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(fieldLabels).map(([field, label]) => {
              const isRequired = requiredFields.includes(field);
              const currentValue = columnMapping[field as keyof ColumnMapping];
              
              return (
                <div key={field} className="space-y-2">
                  <Label className="flex items-center gap-2">
                    {label}
                    {isRequired && <Badge variant="destructive" className="text-xs">Обязательно</Badge>}
                  </Label>
                  <Select
                    value={currentValue}
                    onValueChange={(value) => handleMappingChange(field as keyof ColumnMapping, value)}
                  >
                    <SelectTrigger className={(!currentValue || currentValue === '__none__') && isRequired ? 'border-red-300' : ''}>
                      <SelectValue placeholder="Выберите столбец" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">-- Выберите столбец --</SelectItem>
                      {excelColumns.map((column) => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {currentValue && currentValue !== '__none__' && (
                    <div className="flex items-center gap-2 text-sm text-real-estate-600 bg-real-estate-50 p-2 rounded">
                      <span>Пример:</span>
                      <ArrowRight className="h-3 w-3" />
                      <strong>{getPreviewValue(field as keyof ColumnMapping)}</strong>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Предварительный просмотр данных */}
      <Card>
        <CardHeader>
          <CardTitle>Предварительный просмотр данных</CardTitle>
          <CardDescription>
            Как будут импортированы ваши данные ({importedData.length} записей)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold text-real-estate-900">Статус</th>
                  {Object.entries(fieldLabels).map(([field, label]) => (
                    <th key={field} className="text-left p-3 font-semibold text-real-estate-900">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {importedData.slice(0, 5).map((row, index) => (
                  <tr key={index} className="border-b hover:bg-real-estate-50">
                    <td className="p-3">
                      <Check className="h-5 w-5 text-success-500" />
                    </td>
                    {Object.entries(fieldLabels).map(([field]) => {
                      const columnName = columnMapping[field as keyof ColumnMapping];
                      const value = columnName && columnName !== '__none__' ? row[columnName] : '';
                      return (
                        <td key={field} className="p-3">
                          {value !== null && value !== undefined && value !== '' ? String(value) : <span className="text-gray-400">--</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {importedData.length > 5 && (
              <p className="text-sm text-real-estate-600 mt-2 text-center">
                ... и еще {importedData.length - 5} записей
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Кнопки действий */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onComplete}>
          Отмена
        </Button>
        <Button
          onClick={createProjectWithData}
          disabled={!isValid || !projectData.name.trim() || isCreating}
          className="bg-real-estate-600 hover:bg-real-estate-700"
        >
          {isCreating ? 'Создание проекта...' : 'Создать проект с данными'}
        </Button>
      </div>
    </div>
  );
};

export default ExcelColumnMapper;
