
import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Button } from "@gridix/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@gridix/ui";
import { Input } from "@gridix/ui";
import { Label } from "@gridix/ui";
import { Upload, Save, Trash2, Image as ImageIcon, Edit3, X, Plus, Check, Undo2, Redo2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from "@gridix/utils/api";
import PolygonAnnotator, { PolygonAnnotatorRef } from './polygon-editor/PolygonAnnotator';
import PolygonCustomizationSettings from './PolygonCustomizationSettings';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/entities/project/queries/useProjects';
import { useLanguage } from '@gridix/utils/react';
import { Shape } from './polygon-editor/GeometryShapes';
import { compressToWebP } from '@gridix/utils/lib';
import { trackUsertourEvent } from '@gridix/utils/integrations';
import PolygonAnnotatorTest from '@/components/visualization/polygon-editor/PolygonAnnotatorTest'

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

interface ProjectFacade {
  id: string;
  project_id: string;
  name: string;
  image_url: string | null;
  order_index: number;
}

interface FacadeDisplaySettings {
  colors: { building: string };
  opacity: { normal: number; hover: number };
}

const BuildingImageEditor = ({ projectId, currentImageUrl, onImageUpdate }: BuildingImageEditorProps) => {
  const [facades, setFacades] = useState<ProjectFacade[]>([]);
  const [selectedFacadeId, setSelectedFacadeId] = useState<string | null>(null);
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
  const [isAddingFacade, setIsAddingFacade] = useState(false);
  const [newFacadeName, setNewFacadeName] = useState('');
  const [newFacadeFile, setNewFacadeFile] = useState<File | null>(null);
  const [savingFacade, setSavingFacade] = useState(false);

  // Facade polygon display settings (loaded from projects.polygon_settings_facade)
  const [facadeDisplaySettings, setFacadeDisplaySettings] = useState<FacadeDisplaySettings>({
    colors: { building: '#3b82f6' },
    opacity: { normal: 0.4, hover: 0.7 },
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const newFacadeFileInputRef = useRef<HTMLInputElement>(null);
  const polygonAnnotatorRef = useRef<PolygonAnnotatorRef>(null);

  // Undo / Redo stacks for polygon point editing
  const undoStackRef = useRef<Shape[]>([]);
  const redoStackRef = useRef<Shape[]>([]);
  const { user } = useAuth();
  const { project } = useProject(projectId);
  const { t } = useLanguage();

  // Determine if this is an object project (villas/townhouses) or building
  const isObjectProject = (project)?.project_type === 'object';

  const activeFacade = useMemo(
    () => facades.find((f) => f.id === selectedFacadeId) ?? facades[0] ?? null,
    [facades, selectedFacadeId],
  );

  const facadeConfigured =
    !!buildingImage &&
    buildingFloors.some((f) => Array.isArray(f.polygon) && f.polygon.length > 0);

  React.useEffect(() => {
    if (!facadeConfigured) return;
    void trackUsertourEvent({
      eventName: 'gridix_project_facade_configured',
      properties: { project_id: project?.id || projectId },
      onceKey: 'gridix_project_facade_configured',
    });
  }, [facadeConfigured, project?.id, projectId]);

  const syncPrimaryFacadeToProject = useCallback(async (nextFacades?: ProjectFacade[]) => {
    const list = nextFacades ?? facades;
    const primary = list.slice().sort((a, b) => a.order_index - b.order_index)[0];
    const primaryUrl = primary?.image_url ?? null;

    try {
      const { error } = await supabase
        .from('projects')
        .update({ building_image_url: primaryUrl })
        .eq('id', project?.id || projectId);
      if (error) throw error;
      if (primaryUrl) onImageUpdate?.(primaryUrl);
    } catch (e) {
      console.error('Error syncing primary facade to project:', e);
    }
  }, [facades, onImageUpdate, project?.id, projectId]);

  const normalizeFacadeOrder = useCallback(async (list: ProjectFacade[]) => {
    const sorted = list.slice().sort((a, b) => a.order_index - b.order_index);
    const normalized = sorted.map((f, idx) => ({ ...f, order_index: idx }));

    // Update DB only if something changed
    const changed = normalized.some((f, idx) => f.order_index !== sorted[idx]?.order_index);
    if (!changed) return normalized;

    await Promise.all(
      normalized.map((f) =>
        supabase
          // Cast because generated types may not yet include this table; fixed later in types update.
            .from('project_facades')
          .update({ order_index: f.order_index })
          .eq('id', f.id),
      ),
    );

    return normalized;
  }, []);

  const loadBuildingData = useCallback(async () => {
    try {
      // Use cached project data
      if (project) {
        setFloors(project.floors || 1);
      }

      // Load facades
      const { data: facadesData, error: facadesError } = await supabase
        .from('project_facades')
        .select('*')
        .eq('project_id', project?.id || projectId)
        .order('order_index');
      if (facadesError) throw facadesError;

      const loadedFacades = (facadesData as unknown as ProjectFacade[]) || [];
      setFacades(loadedFacades);

      // Ensure selection
      let nextSelectedFacadeId = selectedFacadeId;
      if (!nextSelectedFacadeId) {
        nextSelectedFacadeId = loadedFacades[0]?.id ?? null;
        setSelectedFacadeId(nextSelectedFacadeId);
      } else if (!loadedFacades.some((f) => f.id === nextSelectedFacadeId)) {
        nextSelectedFacadeId = loadedFacades[0]?.id ?? null;
        setSelectedFacadeId(nextSelectedFacadeId);
      }

      const active = loadedFacades.find((f) => f.id === nextSelectedFacadeId) ?? loadedFacades[0] ?? null;
      const activeUrl = active?.image_url ?? project?.building_image_url ?? currentImageUrl ?? null;
      setBuildingImage(activeUrl);

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
      if (!nextSelectedFacadeId) {
        setBuildingFloors([]);
        setShapes([]);
        return;
      }

      const { data: floorsData } = await supabase
        .from('building_floors')
        .select('*')
        .eq('project_id', project?.id || projectId)
        .eq('facade_id', nextSelectedFacadeId)
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
  }, [projectId, project, isObjectProject, selectedFacadeId, currentImageUrl]);

  const uploadFacadeImage = useCallback(async (file_get: File): Promise<string> => {
    const file = await compressToWebP(file_get);
    const fileName = `${project?.id || projectId}-facade-${Date.now()}.webp`;

    const { error: uploadError } = await supabase.storage
      .from('project-images')
      .upload(fileName, file, { upsert: true });
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('project-images')
      .getPublicUrl(fileName);
    return publicUrl;
  }, [project?.id, projectId]);

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
      if (!activeFacade?.id) {
        toast.error(t('buildingImage.facades.selectFirst'));
        return;
      }

      const publicUrl = await uploadFacadeImage(file_get);

      const { error: updateFacadeError } = await supabase
        .from('project_facades')
        .update({ image_url: publicUrl })
        .eq('id', activeFacade.id);
      if (updateFacadeError) throw updateFacadeError;

      // Update local state
      setFacades((prev) => prev.map((f) => (f.id === activeFacade.id ? { ...f, image_url: publicUrl } : f)));
      setBuildingImage(publicUrl);

      // Keep legacy field in sync (primary facade => projects.building_image_url)
      if (activeFacade.order_index === 0) {
        await syncPrimaryFacadeToProject(
          facades.map((f) => (f.id === activeFacade.id ? { ...f, image_url: publicUrl } : f)),
        );
      }

      toast.success(t('buildingImage.facades.uploadSuccess'));
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(t('buildingImage.facades.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const handleCreateFacade = async () => {
    if (!user) {
      toast.error(t('buildingImage.authRequired'));
      return;
    }
    if (!newFacadeName.trim()) {
      toast.error(t('buildingImage.facades.nameRequired'));
      return;
    }
    if (!newFacadeFile) {
      toast.error(t('buildingImage.facades.imageRequired'));
      return;
    }

    setSavingFacade(true);
    try {
      const nextOrderIndex = (facades.length > 0 ? Math.max(...facades.map((f) => f.order_index)) : -1) + 1;

      const { data: inserted, error: insertError } = await supabase
        .from('project_facades')
        .insert({
          project_id: project?.id || projectId,
          name: newFacadeName.trim(),
          image_url: null,
          order_index: nextOrderIndex,
        })
        .select('*')
        .single();
      if (insertError) throw insertError;

      const insertedFacade = inserted as unknown as ProjectFacade;
      const publicUrl = await uploadFacadeImage(newFacadeFile);

      const { error: updateError } = await supabase
        .from('project_facades')
        .update({ image_url: publicUrl })
        .eq('id', insertedFacade.id);
      if (updateError) throw updateError;

      const nextFacades = [...facades, { ...insertedFacade, image_url: publicUrl }];
      setFacades(nextFacades);
      setSelectedFacadeId(insertedFacade.id);
      setBuildingImage(publicUrl);
      setBuildingFloors([]);
      setShapes([]);
      setCurrentShape(null);

      setIsAddingFacade(false);
      setNewFacadeName('');
      setNewFacadeFile(null);
      if (newFacadeFileInputRef.current) newFacadeFileInputRef.current.value = '';

      toast.success(t('buildingImage.facades.created'));
    } catch (e) {
      console.error('Error creating facade:', e);
      toast.error(t('buildingImage.facades.createError'));
    } finally {
      setSavingFacade(false);
    }
  };

  const handleRenameFacade = async (facadeId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const { error } = await supabase
        .from('project_facades')
        .update({ name: trimmed })
        .eq('id', facadeId);
      if (error) throw error;
      setFacades((prev) => prev.map((f) => (f.id === facadeId ? { ...f, name: trimmed } : f)));
    } catch (e) {
      console.error('Error renaming facade:', e);
      toast.error(t('buildingImage.facades.renameError'));
    }
  };

  const handleDeleteFacade = async (facadeId: string) => {
    const facade = facades.find((f) => f.id === facadeId);
    if (!facade) return;
    if (facades.length <= 1) {
      toast.error(t('buildingImage.facades.cantDeleteLast'));
      return;
    }
    if (!confirm(t('buildingImage.facades.deleteConfirm', { name: facade.name }))) return;

    try {
      const { error } = await supabase
        .from('project_facades')
        .delete()
        .eq('id', facadeId);
      if (error) throw error;

      let next = facades.filter((f) => f.id !== facadeId);
      next = await normalizeFacadeOrder(next);
      setFacades(next);

      const nextSelected = next[0]?.id ?? null;
      setSelectedFacadeId(nextSelected);
      setBuildingImage(next[0]?.image_url ?? null);

      await syncPrimaryFacadeToProject(next);
      toast.success(t('buildingImage.facades.deleted'));
      await loadBuildingData();
    } catch (e) {
      console.error('Error deleting facade:', e);
      toast.error(t('buildingImage.facades.deleteError'));
    }
  };

  const startEditingFloor = (floorId: string) => {
    const floor = buildingFloors.find(f => f.id === floorId);
    if (floor) {
      setEditingFloorId(floorId);
      setSelectedFloor(floor.floor_number);
      setIsEditing(true);
      setIsCreatingNewFloor(false);
      // Clear undo/redo stacks when starting a new editing session
      undoStackRef.current = [];
      redoStackRef.current = [];

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
    // Clear undo/redo stacks when starting a new editing session
    undoStackRef.current = [];
    redoStackRef.current = [];

    // IMPORTANT:
    // Do NOT set a placeholder currentShape with a non-existent annotation ID.
    // Let the annotator create a real annotation via drawing; then createAnnotation
    // event will populate currentShape with the correct id + points.
    setCurrentShape(null);
  };



  // Provide annotation styles based on facade display settings
  const getStyleById = useCallback((_id: string) => {
    return {
      fill: facadeDisplaySettings.colors.building,
      fillOpacity: facadeDisplaySettings.opacity.normal,
      stroke: facadeDisplaySettings.colors.building,
      strokeOpacity: 1,
      strokeWidth: 2,
    };
  }, [facadeDisplaySettings]);

  const handleCurrentShapeUpdate = useCallback((shape: Shape | null) => {
    setCurrentShape(prev => {
      // Push previous version onto undo stack if points actually changed
      if (prev && shape && prev.id === shape.id) {
        const prevPts = JSON.stringify(prev.points);
        const nextPts = JSON.stringify(shape.points);
        if (prevPts !== nextPts) {
          undoStackRef.current = [...undoStackRef.current, prev];
          // Any new edit clears the redo stack
          redoStackRef.current = [];
        }
      }
      return shape;
    });
  }, []);



  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length === 0) return;
    const prev = undoStackRef.current[undoStackRef.current.length - 1];
    if (!prev) return;
    undoStackRef.current = undoStackRef.current.slice(0, -1);
    setCurrentShape(cur => {
      if (cur) {
        redoStackRef.current = [...redoStackRef.current, cur];
      }
      return prev;
    });
  }, []);

  const handleRedo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const next = redoStackRef.current[redoStackRef.current.length - 1];
    if (!next) return;
    redoStackRef.current = redoStackRef.current.slice(0, -1);
    setCurrentShape(cur => {
      if (cur) {
        undoStackRef.current = [...undoStackRef.current, cur];
      }
      return next;
    });
  }, []);

  // Keyboard shortcuts for Undo/Redo while editing
  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;

      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, handleUndo, handleRedo]);

  const handlePolygonSave = async () => {
    if (!currentShape) return;
    if (!activeFacade?.id) return;

    try {
      // Получаем актуальные координаты из аннотатора
      let shapeToSave = currentShape;
      if (polygonAnnotatorRef.current) {
        const actualShape = await polygonAnnotatorRef.current.getCurrentShape();
        if (actualShape) {
          shapeToSave = actualShape;
        }
      }

      if (isCreatingNewFloor) {
        // Create or update floor polygon for this facade
        const { error } = await supabase
          .from('building_floors')
          .upsert({
            project_id: project?.id || projectId,
            facade_id: activeFacade.id,
            floor_number: selectedFloor,
            polygon: shapeToSave.points as { x: number; y: number }[],
            color: shapeToSave.color
          }, { onConflict: 'project_id,facade_id,floor_number' });

        if (error) throw error;
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
        // Update existing floor (persist both polygon and color)
        const { error } = await supabase
          .from('building_floors')
          .update({
            polygon: shapeToSave.points as { x: number; y: number }[],
            color: shapeToSave.color,
          })
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
      undoStackRef.current = [];
      redoStackRef.current = [];
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
    undoStackRef.current = [];
    redoStackRef.current = [];
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

  // Load facade display settings from DB
  useEffect(() => {
    const loadFacadeSettings = async () => {
      const pid = project?.id || projectId;
      if (!pid) return;
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('polygon_settings_facade')
          .eq('id', pid)
          .single();
        if (error) throw error;
        if (data && 'polygon_settings_facade' in data && data.polygon_settings_facade) {
          const s = data.polygon_settings_facade as Record<string, unknown>;
          const colors = s?.colors as Record<string, unknown> | undefined;
          const opacity = s?.opacity as Record<string, unknown> | undefined;
          setFacadeDisplaySettings({
            colors: {
              building: (typeof colors?.building === 'string' ? colors.building : '#3b82f6'),
            },
            opacity: {
              normal: typeof opacity?.normal === 'number' ? opacity.normal : 0.4,
              hover: typeof opacity?.hover === 'number' ? opacity.hover : 0.7,
            },
          });
        }
      } catch (e) {
        console.error('Error loading facade display settings:', e);
      }
    };
    void loadFacadeSettings();
  }, [project?.id, projectId]);

  React.useEffect(() => {
    // Keep local image in sync if parent provides an updated legacy image URL AND we have no facade selected yet.
    if (!activeFacade && currentImageUrl && currentImageUrl !== buildingImage) {
      setBuildingImage(currentImageUrl);
    }
  }, [currentImageUrl, buildingImage, activeFacade]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <CardDescription>
            {t('buildingImage.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {facades.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`px-3 py-1.5 rounded border text-sm flex items-center gap-2 ${
                      (activeFacade?.id === f.id) ? 'bg-white border-primary' : 'bg-muted/30 hover:bg-muted/50'
                    }`}
                    onClick={() => {
                      if (isEditing) return;
                      setSelectedFacadeId(f.id);
                      setBuildingImage(f.image_url ?? null);
                      setBuildingFloors([]);
                      setShapes([]);
                      setCurrentShape(null);
                      setIsEditing(false);
                    }}
                    disabled={isEditing}
                    title={f.name}
                  >
                    <span className="font-medium truncate max-w-[180px]">{f.name}</span>
                    {f.order_index === 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted border">primary</span>
                    )}
                  </button>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => setIsAddingFacade((v) => !v)}
                  disabled={isEditing}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {t('buildingImage.facades.add')}
                </Button>
              </div>

              <div className="flex items-center gap-2">
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
                  disabled={uploading || !activeFacade?.id}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? t('buildingImage.uploading') : t('buildingImage.facades.upload')}
                </Button>
              </div>
            </div>

            {isAddingFacade && (
              <div className="border rounded-lg p-3 bg-muted/20 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div className="md:col-span-2">
                    <Label htmlFor="new-facade-name">{t('buildingImage.facades.name')}</Label>
                    <Input
                      id="new-facade-name"
                      value={newFacadeName}
                      onChange={(e) => setNewFacadeName(e.target.value)}
                      placeholder={t('buildingImage.facades.namePlaceholder')}
                      disabled={savingFacade}
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-facade-file">{t('buildingImage.facades.image')}</Label>
                    <Input
                      id="new-facade-file"
                      ref={newFacadeFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewFacadeFile(e.target.files?.[0] ?? null)}
                      disabled={savingFacade}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateFacade}
                    disabled={savingFacade}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {savingFacade ? t('buildingImage.facades.creating') : t('buildingImage.facades.create')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsAddingFacade(false);
                      setNewFacadeName('');
                      setNewFacadeFile(null);
                      if (newFacadeFileInputRef.current) newFacadeFileInputRef.current.value = '';
                    }}
                    disabled={savingFacade}
                  >
                    {t('buildingImage.facades.cancel')}
                  </Button>
                </div>
              </div>
            )}

            {activeFacade && (
              <div className="flex items-center gap-2 flex-wrap">
                <Label htmlFor="facade-name" className="text-sm font-medium">
                  {t('buildingImage.facades.current')}
                </Label>
                <Input
                  id="facade-name"
                  className="max-w-[340px]"
                  value={activeFacade.name}
                  onChange={(e) => {
                    const nextName = e.target.value;
                    setFacades((prev) => prev.map((f) => (f.id === activeFacade.id ? { ...f, name: nextName } : f)));
                  }}
                  onBlur={(e) => void handleRenameFacade(activeFacade.id, e.target.value)}
                  disabled={isEditing}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => void handleDeleteFacade(activeFacade.id)}
                  disabled={isEditing || facades.length <= 1}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('buildingImage.facades.delete')}
                </Button>
              </div>
            )}
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

      {buildingImage && activeFacade?.id && (
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
                      onClick={handleUndo}
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      disabled={undoStackRef.current.length === 0}
                      title="Undo (Ctrl+Z)"
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      onClick={handleRedo}
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      disabled={redoStackRef.current.length === 0}
                      title="Redo (Ctrl+Shift+Z)"
                    >
                      <Redo2 className="h-3.5 w-3.5" />
                    </Button>
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

              {/* <PolygonAnnotatorTest /> */}

              <PolygonAnnotator
                ref={polygonAnnotatorRef}
                imageUrl={buildingImage}
                shapes={shapes}
                currentShape={currentShape}
                onCurrentShapeUpdate={handleCurrentShapeUpdate}
                mode={isEditing ? 'edit' : 'view'}
                drawingEnabled={isEditing}
                getStyleById={getStyleById}
                onSelectAnnotationId={(id) => {
                  // In view mode, clicking a polygon enters editing for that floor
                  if (!isEditing && id) {
                    const floor = buildingFloors.find(f => f.id === id);
                    if (floor) {
                      startEditingFloor(floor.id);
                    }
                  }
                }}
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
        onSettingsChange={(settings) => {
          // Sync local display settings from the settings panel for live preview
          setFacadeDisplaySettings({
            colors: {
              building: settings.colors.building || '#3b82f6',
            },
            opacity: {
              normal: settings.opacity.normal,
              hover: settings.opacity.hover,
            },
          });
        }}
      />
    </div>
  );
};

export default BuildingImageEditor;
