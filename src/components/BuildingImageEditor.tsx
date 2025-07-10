
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
  currentImageUrl?: string | null;
  onImageUpdate?: (imageUrl: string) => void;
}

interface BuildingFloor {
  id: string;
  floor_number: number;
  polygon: { x: number; y: number }[];
  color: string;
}

const BuildingImageEditor = ({ projectId, currentImageUrl, onImageUpdate }: BuildingImageEditorProps) => {
  const [buildingImage, setBuildingImage] = useState<string | null>(currentImageUrl || null);
  const [buildingFloors, setBuildingFloors] = useState<BuildingFloor[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [floors, setFloors] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadBuildingData = useCallback(async () => {
    try {
      // Load project data including floors count
      const { data: project } = await supabase
        .from('projects')
        .select('building_image_url, floors')
        .eq('id', projectId)
        .single();

      if (project) {
        if (project.building_image_url && !buildingImage) {
          setBuildingImage(project.building_image_url);
        }
        setFloors(project.floors || 1);
      }

      // Load building floors
      const { data: floorsData } = await supabase
        .from('building_floors')
        .select('*')
        .eq('project_id', projectId)
        .order('floor_number');

      // Normalize the polygon data to match the expected type
      const normalizedFloors = (floorsData || []).map(floor => ({
        ...floor,
        polygon: Array.isArray(floor.polygon) ? floor.polygon as { x: number; y: number }[] : []
      }));

      setBuildingFloors(normalizedFloors);
    } catch (error) {
      console.error('Error loading building data:', error);
    }
  }, [projectId, buildingImage]);

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
      onImageUpdate?.(publicUrl);
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
    if (projectId) {
      loadBuildingData();
    }
  }, [loadBuildingData, projectId]);

  React.useEffect(() => {
    if (currentImageUrl !== buildingImage) {
      setBuildingImage(currentImageUrl || null);
    }
  }, [currentImageUrl]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Изображение здания</CardTitle>
          <CardDescription>
            Загрузите изображение фасада здания для настройки этажей
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Загружается...' : 'Загрузить изображение'}
            </Button>
          </div>

          {buildingImage && (
            <div className="border rounded-lg p-3 bg-muted/30">
              <img
                src={buildingImage}
                alt="Здание"
                className="max-w-full h-auto max-h-48 object-contain mx-auto rounded"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {buildingImage && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Настройка этажей</CardTitle>
            <CardDescription>
              Выберите этаж и отметьте его область на изображении здания
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Label htmlFor="floor-select" className="text-sm font-medium">Этаж:</Label>
                <select
                  id="floor-select"
                  value={selectedFloor}
                  onChange={(e) => setSelectedFloor(Number(e.target.value))}
                  className="px-2 py-1 border rounded text-sm min-w-[80px]"
                >
                  {Array.from({ length: floors }, (_, i) => i + 1).map(floor => (
                    <option key={floor} value={floor}>
                      {floor}
                    </option>
                  ))}
                </select>
              </div>
              
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="sm"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Редактировать
              </Button>
            </div>

            {buildingFloors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Настроенные этажи:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {buildingFloors.map((floor) => (
                    <div key={floor.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                      <span>{floor.floor_number} этаж</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteFloorPolygon(floor.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
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
        />
      )}
    </div>
  );
};

export default BuildingImageEditor;
