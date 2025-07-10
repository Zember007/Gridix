import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Save, Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import PolygonEditor from './polygon-editor/PolygonEditor';

interface BuildingImageEditorProps {
  projectId: string;
  floors: number;
  onImageUpload: (imageUrl: string) => void;
}

interface BuildingFloor {
  id: string;
  floor_number: number;
  polygon: { x: number; y: number }[];
  color: string;
}

const BuildingImageEditor = ({ projectId, floors, onImageUpload }: BuildingImageEditorProps) => {
  const [buildingImage, setBuildingImage] = useState<string | null>(null);
  const [buildingFloors, setBuildingFloors] = useState<BuildingFloor[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadBuildingData = useCallback(async () => {
    try {
      // Load project image
      const { data: project } = await supabase
        .from('projects')
        .select('building_image_url')
        .eq('id', projectId)
        .single();

      if (project?.building_image_url) {
        setBuildingImage(project.building_image_url);
      }

      // Load building floors
      const { data: floors } = await supabase
        .from('building_floors')
        .select('*')
        .eq('project_id', projectId)
        .order('floor_number');

      // Normalize the polygon data to match the expected type
      const normalizedFloors = (floors || []).map(floor => ({
        ...floor,
        polygon: Array.isArray(floor.polygon) ? floor.polygon as { x: number; y: number }[] : []
      }));

      setBuildingFloors(normalizedFloors);
    } catch (error) {
      console.error('Error loading building data:', error);
    }
  }, [projectId]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !projectId) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}-building.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-images')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('projects')
        .update({ building_image_url: publicUrl })
        .eq('id', projectId);

      if (updateError) throw updateError;

      setBuildingImage(publicUrl);
      onImageUpload(publicUrl);
      toast.success('Изображение здания загружено');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Ошибка загрузки изображения');
    } finally {
      setUploading(false);
    }
  };

  const handlePolygonSave = async (points: { x: number; y: number }[]) => {
    try {
      const existingFloor = buildingFloors.find(f => f.floor_number === selectedFloor);
      
      if (existingFloor) {
        const { error } = await supabase
          .from('building_floors')
          .update({ polygon: points })
          .eq('id', existingFloor.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('building_floors')
          .insert({
            project_id: projectId,
            floor_number: selectedFloor,
            polygon: points,
            color: '#3b82f6'
          });

        if (error) throw error;
      }

      await loadBuildingData();
      setIsEditing(false);
      toast.success(`Полигон для ${selectedFloor} этажа сохранен`);
    } catch (error) {
      console.error('Error saving polygon:', error);
      toast.error('Ошибка сохранения полигона');
    }
  };

  const deleteFloorPolygon = async (floorId: string) => {
    try {
      const { error } = await supabase
        .from('building_floors')
        .delete()
        .eq('id', floorId);

      if (error) throw error;

      await loadBuildingData();
      toast.success('Полигон этажа удален');
    } catch (error) {
      console.error('Error deleting polygon:', error);
      toast.error('Ошибка удаления полигона');
    }
  };

  React.useEffect(() => {
    loadBuildingData();
  }, [loadBuildingData]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Изображение здания</CardTitle>
          <CardDescription>
            Загрузите изображение фасада здания
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="building-image">Изображение фасада</Label>
            <div className="mt-2 flex items-center gap-4">
              <Input
                ref={fileInputRef}
                id="building-image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Загрузка...' : 'Выбрать файл'}
              </Button>
            </div>
          </div>

          {buildingImage && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <img
                src={buildingImage}
                alt="Здание"
                className="max-w-full h-auto max-h-64 object-contain mx-auto"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {buildingImage && (
        <Card>
          <CardHeader>
            <CardTitle>Настройка этажей</CardTitle>
            <CardDescription>
              Отметьте области этажей на изображении здания
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div>
                <Label htmlFor="floor-select">Выберите этаж</Label>
                <select
                  id="floor-select"
                  value={selectedFloor}
                  onChange={(e) => setSelectedFloor(Number(e.target.value))}
                  className="ml-2 px-3 py-1 border rounded"
                >
                  {Array.from({ length: floors }, (_, i) => i + 1).map(floor => (
                    <option key={floor} value={floor}>
                      {floor} этаж
                    </option>
                  ))}
                </select>
              </div>
              
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Редактировать полигон
              </Button>
            </div>

            {buildingFloors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Настроенные этажи:</h4>
                <div className="space-y-2">
                  {buildingFloors.map((floor) => (
                    <div key={floor.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>{floor.floor_number} этаж</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteFloorPolygon(floor.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isEditing && buildingImage && (
        <PolygonEditor
          imageUrl={buildingImage}
          existingPolygons={buildingFloors.find(f => f.floor_number === selectedFloor)?.polygon || []}
          onSave={handlePolygonSave}
          onCancel={() => setIsEditing(false)}
          title={`Настройка полигона для ${selectedFloor} этажа`}
        />
      )}
    </div>
  );
};

export default BuildingImageEditor;
