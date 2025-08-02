import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, GripVertical, Eye, EyeOff, Edit, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import CustomFieldsManager from './CustomFieldsManager';

interface FieldSetting {
  id?: string;
  field_name: string;
  field_label: string;
  field_type: 'text' | 'number' | 'select' | 'boolean';
  is_custom: boolean;
  is_visible: boolean;
  sort_order: number;
}

interface AllFieldsManagerProps {
  projectId: string;
}

const AllFieldsManager = ({ projectId }: AllFieldsManagerProps) => {
  const [fields, setFields] = useState<FieldSetting[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingField, setEditingField] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { t } = useLanguage();

  const loadFieldSettings = useCallback(async () => {
    try {
      // Сначала инициализируем стандартные поля для проекта
      await supabase.rpc('initialize_default_fields', { p_project_id: projectId });

      // Загружаем настройки полей
      const { data: settingsData, error: settingsError } = await supabase
        .from('project_field_settings')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order');

      if (settingsError) throw settingsError;

      // Загружаем кастомные поля
      const { data: customData, error: customError } = await supabase
        .from('project_custom_fields')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order');

      if (customError) throw customError;

      // Объединяем данные
      const allFields: FieldSetting[] = [
        ...settingsData.map(field => ({
          id: field.id,
          field_name: field.field_name,
          field_label: field.field_label,
          field_type: field.field_type as 'text' | 'number' | 'select' | 'boolean',
          is_custom: field.is_custom,
          is_visible: field.is_visible,
          sort_order: field.sort_order
        })),
        ...customData.map(field => ({
          id: field.id,
          field_name: field.field_name,
          field_label: field.field_label,
          field_type: field.field_type as 'text' | 'number' | 'select' | 'boolean',
          is_custom: true,
          is_visible: field.is_visible !== false,
          sort_order: field.sort_order || 999
        }))
      ];

      // Сортируем по sort_order
      allFields.sort((a, b) => a.sort_order - b.sort_order);
      setFields(allFields);
    } catch (error) {
      console.error('Error loading field settings:', error);
      toast.error(t('customFields.loadError'));
    } finally {
      setLoading(false);
    }
  }, [projectId, t]);

  useEffect(() => {
    loadFieldSettings();
  }, [loadFieldSettings]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = useCallback(async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex || isSaving) {
      setDraggedIndex(null);
      return;
    }

    const newFields = [...fields];
    const [draggedField] = newFields.splice(draggedIndex, 1);
    newFields.splice(dropIndex, 0, draggedField);

    // Обновляем sort_order для всех полей
    const updatedFields = newFields.map((field, index) => ({
      ...field,
      sort_order: index
    }));

    setIsSaving(true);
    try {
      // Обновляем порядок в базе данных
      for (const field of updatedFields) {
        if (field.is_custom) {
          // Обновляем кастомные поля
          await supabase
            .from('project_custom_fields')
            .update({ sort_order: field.sort_order })
            .eq('id', field.id);
        } else {
          // Обновляем настройки стандартных полей
          await supabase
            .from('project_field_settings')
            .update({ sort_order: field.sort_order })
            .eq('id', field.id);
        }
      }
      
      setFields(updatedFields);
      toast.success(t('customFields.orderUpdated'));
    } catch (error) {
      console.error('Error updating field order:', error);
      toast.error(t('customFields.orderUpdateError'));
    } finally {
      setIsSaving(false);
    }

    setDraggedIndex(null);
  }, [draggedIndex, fields, t, isSaving]);

  const handleVisibilityToggle = async (field: FieldSetting) => {
    if (isSaving) return; // Запрещаем изменение во время сохранения

    setIsSaving(true);
    try {
      const updatedField = { ...field, is_visible: !field.is_visible };
      
      if (field.is_custom) {
        await supabase
          .from('project_custom_fields')
          .update({ is_visible: updatedField.is_visible })
          .eq('id', field.id);
      } else {
        await supabase
          .from('project_field_settings')
          .update({ is_visible: updatedField.is_visible })
          .eq('id', field.id);
      }

      const updatedFields = fields.map(f => 
        f.id === field.id ? updatedField : f
      );
      
      setFields(updatedFields);
      toast.success(t('customFields.visibilityUpdated'));
    } catch (error) {
      console.error('Error updating field visibility:', error);
      toast.error(t('customFields.visibilityUpdateError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteField = async (field: FieldSetting) => {
    if (!field.is_custom || isSaving) {
      if (!field.is_custom) {
        toast.error(t('customFields.cannotDeleteBuiltIn'));
      }
      return;
    }

    setIsSaving(true);
    try {
      await supabase
        .from('project_custom_fields')
        .delete()
        .eq('id', field.id);

      const updatedFields = fields.filter(f => f.id !== field.id);
      setFields(updatedFields);
      toast.success(t('customFields.deleteSuccess'));
    } catch (error) {
      console.error('Error deleting field:', error);
      toast.error(t('customFields.deleteError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditField = (field: FieldSetting) => {
    if (!field.is_custom || isSaving) {
      if (!field.is_custom) {
        toast.error(t('customFields.cannotEditBuiltIn'));
      }
      return;
    }

    setEditingField({
      id: field.id,
      field_name: field.field_name,
      field_label: field.field_label,
      field_type: field.field_type,
      is_required: false, // Нужно будет добавить это поле
      field_options: [],
      sort_order: field.sort_order,
      is_visible: field.is_visible
    });
  };

  if (showAddForm || editingField) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setShowAddForm(false);
              setEditingField(null);
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('customFields.back')}
          </Button>
        </div>
        <CustomFieldsManager 
          projectId={projectId} 
          onFieldsChange={() => {
            loadFieldSettings();
          }}
          editingField={editingField}
          onClose={() => {
            setShowAddForm(false);
            setEditingField(null);
          }}
        />
      </div>
    );
  }

  if (loading) {
    return <div className="p-4 text-center">{t('customFields.loading')}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t('customFields.allFieldsOrder')}
          {isSaving && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </CardTitle>
        <CardDescription>
          {isSaving ? t('customFields.saving') : t('customFields.allFieldsOrderDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              {t('customFields.noFields')}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div
                key={field.id}
                draggable={!isSaving}
                onDragStart={(e) => !isSaving && handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => !isSaving && handleDrop(e, index)}
                className={`
                  flex items-center gap-3 p-3 border rounded-lg bg-background
                  hover:shadow-sm transition-shadow
                  ${isSaving ? 'cursor-not-allowed opacity-50' : 'cursor-move'}
                  ${draggedIndex === index ? 'opacity-50' : ''}
                  ${!field.is_visible ? 'opacity-60' : ''}
                `}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{field.field_label}</span>
                    {field.is_custom ? (
                      <Badge variant="secondary" className="text-xs">
                        {t('customFields.custom')}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        {t('customFields.builtin')}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {field.field_type === 'text' && t('customFields.fieldTypeText')}
                      {field.field_type === 'number' && t('customFields.fieldTypeNumber')}
                      {field.field_type === 'select' && t('customFields.fieldTypeSelect')}
                      {field.field_type === 'boolean' && t('customFields.fieldTypeBoolean')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {field.field_name}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => !isSaving && handleVisibilityToggle(field)}
                    disabled={isSaving}
                    title={field.is_visible ? t('customFields.hide') : t('customFields.show')}
                  >
                    {field.is_visible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  
                  {field.is_custom && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => !isSaving && handleEditField(field)}
                        disabled={isSaving}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => !isSaving && handleDeleteField(field)}
                        disabled={isSaving}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={() => !isSaving && setShowAddForm(true)}
          disabled={isSaving}
          className="w-full"
          variant="outline"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('customFields.addField')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AllFieldsManager;