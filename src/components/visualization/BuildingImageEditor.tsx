
import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Save, Trash2, Image as ImageIcon, Edit3, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import PolygonAnnotator, { PolygonAnnotatorRef } from './polygon-editor/PolygonAnnotator';
import PolygonCustomizationSettings from './PolygonCustomizationSettings';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/hooks/useProjects';
import { useLanguage } from '@/contexts/LanguageContext';
import { Shape, Point } from './polygon-editor/GeometryShapes';
import { compressToWebP } from '@/hooks/use-upload';

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
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [editingFloorId, setEditingFloorId] = useState<string | null>(null);
  const [isCreatingNewFloor, setIsCreatingNewFloor] = useState(false);
  const [apartmentNumbers, setApartmentNumbers] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const polygonAnnotatorRef = useRef<PolygonAnnotatorRef>(null);
  const { user } = useAuth();
  const { project } = useProject(projectId);
  const { t } = useLanguage();

  // Determine if this is an object project (villas/townhouses) or building
  const isObjectProject = (project)?.project_type === 'object';

  const loadBuildingData = useCallback(async () => {
    try {
      // Use cached project data
      if (project) {
        if (project.building_image_url && !buildingImage) {
          setBuildingImage(project.building_image_url);
        }
        setFloors(project.floors || 1);
      }

      // Load apartments if this is an object project
      if (isObjectProject) {
        const { data: apartmentsData } = await supabase
          .from('apartments')
          .select('apartment_number')
          .eq('project_id', project?.id || projectId)
          .order('apartment_number');

        const numbers = (apartmentsData || [])
          .map(a => typeof a.apartment_number === 'number' ? a.apartment_number : Number(a.apartment_number))
          .filter((n): n is number => !isNaN(n));
        const uniqueNumbers = [...new Set(numbers)].sort((a, b) => a - b);
        setApartmentNumbers(uniqueNumbers);
      }

      // Load building floors
      const { data: floorsData } = await supabase
        .from('building_floors')
        .select('*')
        .eq('project_id', project?.id || projectId)
        .order('floor_number');

      // Normalize the polygon data to match the expected type
      const normalizedFloors = (floorsData || []).map(floor => ({
        ...floor,
        polygon: Array.isArray(floor.polygon) ? floor.polygon as { x: number; y: number }[] : []
      }));

      setBuildingFloors(normalizedFloors);

      // Convert floors to shapes for display
      const floorShapes: Shape[] = normalizedFloors.map(floor => ({
        id: floor.id,
        type: 'polygon',
        points: floor.polygon,
        color: floor.color || '#3b82f6',
        isSelected: false
      }));

      setShapes(floorShapes);
    } catch (error) {
      console.error('Error loading building data:', error);
    }
  }, [projectId, buildingImage, project, isObjectProject]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file_get = event.target.files?.[0];
    if (!file_get || !projectId) return;

    // Проверяем аутентификацию пользователя
    if (!user) {
      toast.error(t('buildingImage.authRequired'));
      return;
    }

    setUploading(true);
    try {


      const file = await compressToWebP(file_get);

      const fileName = `${Date.now()}.webp`;

      


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
        .eq('id', project?.id || projectId);

      if (updateError) throw updateError;

      setBuildingImage(publicUrl);
      onImageUpdate?.(publicUrl);
      toast.success(t('buildingImage.uploadSuccess'));
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(t('buildingImage.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const startEditingFloor = (floorId: string) => {
    const floor = buildingFloors.find(f => f.id === floorId);
    if (floor) {
      setEditingFloorId(floorId);
      setSelectedFloor(floor.floor_number);
      setIsEditing(true);
      setIsCreatingNewFloor(false);

      // Set current shape for editing
      const editingShape: Shape = {
        id: floor.id,
        type: 'polygon',
        points: floor.polygon,
        color: floor.color || '#3b82f6',
        isSelected: true
      };
      setCurrentShape(editingShape);
    }
  };

  const startCreatingNewFloor = () => {
    setIsCreatingNewFloor(true);
    setIsEditing(true);
    setEditingFloorId(null);

    // Create a new empty shape for the new floor
    const newShape: Shape = {
      id: `new-floor-${selectedFloor}`,
      type: 'polygon',
      points: [],
      color: '#3b82f6',
      isSelected: true
    };
    setCurrentShape(newShape);
  };



  const handleCurrentShapeUpdate = (shape: Shape | null) => {
    setCurrentShape(shape);

  };



  const handlePolygonSave = async () => {
    if (!currentShape) return;

    try {
      // Получаем актуальные координаты из аннотатора
      let shapeToSave = currentShape;
      if (polygonAnnotatorRef.current) {
        const actualShape = await polygonAnnotatorRef.current.getCurrentShape();
        if (actualShape) {
          shapeToSave = actualShape;
        }
      }

      let savedFloorId = editingFloorId;

      if (isCreatingNewFloor) {
        // Create new floor
        const { data, error } = await supabase
          .from('building_floors')
          .insert({
            project_id: project?.id || projectId,
            floor_number: selectedFloor,
            polygon: shapeToSave.points as { x: number; y: number }[],
            color: shapeToSave.color
          })
          .select()
          .single();

        if (error) throw error;
        savedFloorId = data?.id;

        // Update project floors count if this is higher than current max
        if (project && selectedFloor > project.floors) {
          const { error: projectError } = await supabase
            .from('projects')
            .update({ floors: selectedFloor })
            .eq('id', project?.id || projectId);

          if (projectError) throw projectError;
        }

        toast.success(t('buildingImage.polygon.createSuccess', { floor: selectedFloor }));
      } else if (editingFloorId) {
        // Update existing floor
        const { error } = await supabase
          .from('building_floors')
          .update({ polygon: shapeToSave.points as { x: number; y: number }[] })
          .eq('id', editingFloorId);

        if (error) throw error;
        toast.success(t('buildingImage.polygon.saveSuccess', { floor: selectedFloor }));
      }

      // Перезагружаем данные из БД
      await loadBuildingData();

      // Сбрасываем состояние редактирования
      setEditingFloorId(null);
      setIsCreatingNewFloor(false);
      setCurrentShape(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving polygon:', error);
      toast.error(isCreatingNewFloor ? t('buildingImage.polygon.createError') : t('buildingImage.polygon.saveError'));
    }
  };

  const handlePolygonCancel = () => {
    setIsEditing(false);
    setEditingFloorId(null);
    setIsCreatingNewFloor(false);
    setCurrentShape(null);
    // Reload data to reset any changes
    loadBuildingData();
  };

  const deleteFloorPolygon = async (floorId: string) => {
    try {
      const { error } = await supabase
        .from('building_floors')
        .delete()
        .eq('id', floorId);

      if (error) throw error;

      await loadBuildingData();
      toast.success(t('buildingImage.polygon.deleteSuccess'));
    } catch (error) {
      console.error('Error deleting polygon:', error);
      toast.error(t('buildingImage.polygon.deleteError'));
    }
  };

  React.useEffect(() => {
    if (projectId && project) {
      loadBuildingData();
    }
  }, [loadBuildingData, projectId, project]);

  React.useEffect(() => {
    if (currentImageUrl !== buildingImage) {
      setBuildingImage(currentImageUrl || null);
    }
  }, [currentImageUrl, buildingImage]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <CardDescription>
            {t('buildingImage.description')}
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
              {uploading ? t('buildingImage.uploading') : t('buildingImage.upload')}
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
            <CardTitle className="text-lg">
              {isObjectProject ? t('buildingImage.object.polygonsTitle') : t('buildingImage.floors.title')}
            </CardTitle>
            <CardDescription>
              {isObjectProject
                ? t('buildingImage.object.polygonsDescription')
                : t('buildingImage.floors.description')
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Label htmlFor="floor-select" className="text-sm font-medium">
                  {isObjectProject ? t('buildingImage.object.number') : t('buildingImage.floors.floor')}
                </Label>
                <select
                  id="floor-select"
                  value={selectedFloor}
                  onChange={(e) => setSelectedFloor(Number(e.target.value))}
                  className="px-2 py-1 border rounded text-sm min-w-[80px]"
                  disabled={isEditing}
                >
                  {isObjectProject ? (
                    // For object projects, show actual apartment numbers
                    apartmentNumbers.length > 0 ? (
                      apartmentNumbers.map(num => (
                        <option key={num} value={num}>
                          {num}
                        </option>
                      ))
                    ) : (
                      // If no apartments yet, show range 1-20
                      Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>
                          {num}
                        </option>
                      ))
                    )
                  ) : (
                    // For building projects, show floors from 0 to max + 2
                    Array.from({ length: Math.max(floors, buildingFloors.length > 0 ? Math.max(...buildingFloors.map(f => f.floor_number)) : 0) + 3 }, (_, i) => i).map(floor => (
                      <option key={floor} value={floor}>
                        {floor}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {!isEditing && (
                <Button
                  onClick={startCreatingNewFloor}
                  size="sm"
                  variant="outline"
                  className="h-8"
                >
                  <ImageIcon className="h-3 w-3 mr-1" />
                  {isObjectProject ? t('buildingImage.object.addNew') : t('buildingImage.floors.addNew')}
                </Button>
              )}
            </div>

            {/* Canvas with all polygons */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-sm">
                  {isCreatingNewFloor
                    ? (isObjectProject
                      ? t('buildingImage.object.creating', { number: selectedFloor })
                      : t('buildingImage.floors.creatingNew', { floor: selectedFloor })
                    )
                    : (isObjectProject ? t('buildingImage.object.plan') : t('buildingImage.floors.canvas'))
                  }
                </h4>
                {(isEditing || currentShape) && (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handlePolygonSave}
                      size="sm"
                      className="h-8"
                      disabled={isCreatingNewFloor && currentShape?.points.length === 0}
                    >
                      <Save className="h-3 w-3 mr-1" />
                      {isCreatingNewFloor ? t('buildingImage.polygon.create') : t('buildingImage.polygon.save')}
                    </Button>
                    <Button
                      onClick={handlePolygonCancel}
                      variant="outline"
                      size="sm"
                      className="h-8"
                    >
                      <X className="h-3 w-3 mr-1" />
                      {t('buildingImage.polygon.cancel')}
                    </Button>
                  </div>
                )}
              </div>

              <PolygonAnnotator
                ref={polygonAnnotatorRef}
                imageUrl={buildingImage}
                shapes={shapes}
                currentShape={currentShape}
                onCurrentShapeUpdate={handleCurrentShapeUpdate}
                drawingEnabled={isEditing}
              />

            </div>

            {buildingFloors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">
                  {isObjectProject ? t('buildingImage.object.configured') : t('buildingImage.floors.configured')}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {buildingFloors.map((floor) => (
                    <div key={floor.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                      <span>
                        {isObjectProject
                          ? t('buildingImage.object.objectNumber', { number: floor.floor_number })
                          : t('buildingImage.floors.floorNumber', { floor: floor.floor_number })
                        }
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditingFloor(floor.id)}
                          className="h-6 w-6 p-0"
                          disabled={isEditing}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteFloorPolygon(floor.id)}
                          className="h-6 w-6 p-0"
                          disabled={isEditing}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <PolygonCustomizationSettings
        projectId={project?.id || projectId}
        type="building"
      />
    </div>
  );
};

export default BuildingImageEditor;
