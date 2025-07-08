
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CustomField {
  id?: string;
  field_name: string;
  field_label: string;
  field_type: 'text' | 'number' | 'select' | 'boolean';
  is_required: boolean;
  field_options?: string[];
}

interface CustomFieldsManagerProps {
  projectId: string;
  onFieldsChange?: (fields: CustomField[]) => void;
}

const CustomFieldsManager = ({ projectId, onFieldsChange }: CustomFieldsManagerProps) => {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newField, setNewField] = useState<CustomField>({
    field_name: '',
    field_label: '',
    field_type: 'text',
    is_required: false,
    field_options: []
  });

  useEffect(() => {
    loadCustomFields();
  }, [projectId]);

  const loadCustomFields = async () => {
    try {
      const { data, error } = await supabase
        .from('project_custom_fields')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at');

      if (error) throw error;

      const formattedFields = data.map(field => ({
        id: field.id,
        field_name: field.field_name,
        field_label: field.field_label,
        field_type: field.field_type as any,
        is_required: field.is_required,
        field_options: field.field_options as string[] || []
      }));

      setFields(formattedFields);
      onFieldsChange?.(formattedFields);
    } catch (error) {
      console.error('Error loading custom fields:', error);
      toast.error('Ошибка загрузки кастомных полей');
    } finally {
      setLoading(false);
    }
  };

  const generateFieldName = (label: string) => {
    return label
      .toLowerCase()
      .replace(/[^a-zа-я0-9\s]/gi, '')
      .replace(/\s+/g, '_')
      .slice(0, 30);
  };

  const handleSaveField = async (field: CustomField) => {
    if (!field.field_label.trim()) {
      toast.error('Введите название поля');
      return;
    }

    const fieldName = field.field_name || generateFieldName(field.field_label);
    
    try {
      if (field.id) {
        // Обновление существующего поля
        const { error } = await supabase
          .from('project_custom_fields')
          .update({
            field_name: fieldName,
            field_label: field.field_label,
            field_type: field.field_type,
            is_required: field.is_required,
            field_options: field.field_options
          })
          .eq('id', field.id);

        if (error) throw error;
        toast.success('Поле обновлено');
      } else {
        // Создание нового поля
        const { error } = await supabase
          .from('project_custom_fields')
          .insert([{
            project_id: projectId,
            field_name: fieldName,
            field_label: field.field_label,
            field_type: field.field_type,
            is_required: field.is_required,
            field_options: field.field_options
          }]);

        if (error) throw error;
        toast.success('Поле добавлено');
      }

      setIsAdding(false);
      setEditingField(null);
      setNewField({
        field_name: '',
        field_label: '',
        field_type: 'text',
        is_required: false,
        field_options: []
      });
      loadCustomFields();
    } catch (error) {
      console.error('Error saving field:', error);
      toast.error('Ошибка сохранения поля');
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    try {
      const { error } = await supabase
        .from('project_custom_fields')
        .delete()
        .eq('id', fieldId);

      if (error) throw error;
      toast.success('Поле удалено');
      loadCustomFields();
    } catch (error) {
      console.error('Error deleting field:', error);
      toast.error('Ошибка удаления поля');
    }
  };

  const renderFieldEditor = (field: CustomField, isNew: boolean = false) => (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="field_label">Название поля*</Label>
          <Input
            id="field_label"
            value={field.field_label}
            onChange={(e) => {
              const updatedField = { ...field, field_label: e.target.value };
              if (isNew) {
                setNewField(updatedField);
              } else {
                setEditingField(updatedField);
              }
            }}
            placeholder="Например: Балкон"
          />
        </div>
        
        <div>
          <Label htmlFor="field_type">Тип поля</Label>
          <Select
            value={field.field_type}
            onValueChange={(value: any) => {
              const updatedField = { ...field, field_type: value };
              if (isNew) {
                setNewField(updatedField);
              } else {
                setEditingField(updatedField);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Текст</SelectItem>
              <SelectItem value="number">Число</SelectItem>
              <SelectItem value="select">Выбор из списка</SelectItem>
              <SelectItem value="boolean">Да/Нет</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {field.field_type === 'select' && (
        <div>
          <Label>Варианты выбора (по одному на строку)</Label>
          <textarea
            className="w-full mt-1 p-2 border rounded resize-none"
            rows={3}
            value={field.field_options?.join('\n') || ''}
            onChange={(e) => {
              const options = e.target.value.split('\n').filter(opt => opt.trim());
              const updatedField = { ...field, field_options: options };
              if (isNew) {
                setNewField(updatedField);
              } else {
                setEditingField(updatedField);
              }
            }}
            placeholder="Опция 1&#10;Опция 2&#10;Опция 3"
          />
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Switch
          id="is_required"
          checked={field.is_required}
          onCheckedChange={(checked) => {
            const updatedField = { ...field, is_required: checked };
            if (isNew) {
              setNewField(updatedField);
            } else {
              setEditingField(updatedField);
            }
          }}
        />
        <Label htmlFor="is_required">Обязательное поле</Label>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => handleSaveField(field)}
          className="bg-real-estate-600 hover:bg-real-estate-700"
        >
          <Check className="h-4 w-4 mr-2" />
          Сохранить
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (isNew) {
              setIsAdding(false);
              setNewField({
                field_name: '',
                field_label: '',
                field_type: 'text',
                is_required: false,
                field_options: []
              });
            } else {
              setEditingField(null);
            }
          }}
        >
          <X className="h-4 w-4 mr-2" />
          Отмена
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return <div className="p-4 text-center">Загрузка кастомных полей...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Кастомные поля</CardTitle>
        <CardDescription>
          Создайте дополнительные поля для квартир в вашем проекте
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Существующие поля */}
        {fields.map((field) => (
          <div key={field.id}>
            {editingField?.id === field.id ? (
              renderFieldEditor(editingField)
            ) : (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium">{field.field_label}</div>
                    <div className="text-sm text-gray-500">
                      {field.field_type === 'text' && 'Текст'}
                      {field.field_type === 'number' && 'Число'}
                      {field.field_type === 'select' && 'Выбор из списка'}
                      {field.field_type === 'boolean' && 'Да/Нет'}
                      {field.is_required && <Badge variant="destructive" className="ml-2 text-xs">Обязательно</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingField(field)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteField(field.id!)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Форма добавления нового поля */}
        {isAdding && renderFieldEditor(newField, true)}

        {/* Кнопка добавления */}
        {!isAdding && (
          <Button
            variant="outline"
            onClick={() => setIsAdding(true)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Добавить кастомное поле
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomFieldsManager;
