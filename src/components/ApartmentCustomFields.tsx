
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface CustomField {
  id: string;
  field_name: string;
  field_label: string;
  field_type: 'text' | 'number' | 'select' | 'boolean';
  is_required: boolean;
  field_options?: string[];
  sort_order: number;
  is_visible: boolean;
}

interface ApartmentCustomFieldsProps {
  projectId: string;
  apartmentId?: string;
  customFieldsData: Record<string, any>;
  onCustomFieldsChange: (data: Record<string, any>) => void;
  readOnly?: boolean;
}

const ApartmentCustomFields = ({ 
  projectId, 
  apartmentId,
  customFieldsData, 
  onCustomFieldsChange,
  readOnly = false 
}: ApartmentCustomFieldsProps) => {
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomFields();
  }, [projectId]);

  const loadCustomFields = async () => {
    try {
      const { data, error } = await supabase
        .from('project_custom_fields')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_visible', true)
        .order('sort_order');

      if (error) throw error;

      const formattedFields = data.map(field => ({
        id: field.id,
        field_name: field.field_name,
        field_label: field.field_label,
        field_type: field.field_type as 'text' | 'number' | 'select' | 'boolean',
        is_required: field.is_required,
        field_options: field.field_options as string[] || [],
        sort_order: field.sort_order || 0,
        is_visible: field.is_visible !== false
      }));

      setCustomFields(formattedFields);
    } catch (error) {
      console.error('Error loading custom fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    const updatedData = { ...customFieldsData, [fieldName]: value };
    onCustomFieldsChange(updatedData);
  };

  const renderField = (field: CustomField) => {
    const fieldValue = customFieldsData[field.field_name];

    switch (field.field_type) {
      case 'text':
        return (
          <Input
            value={fieldValue || ''}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
            disabled={readOnly}
            placeholder={`Введите ${field.field_label.toLowerCase()}`}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={fieldValue || ''}
            onChange={(e) => handleFieldChange(field.field_name, parseFloat(e.target.value) || 0)}
            disabled={readOnly}
            placeholder={`Введите ${field.field_label.toLowerCase()}`}
          />
        );

      case 'select':
        return (
          <Select
            value={fieldValue || ''}
            onValueChange={(value) => handleFieldChange(field.field_name, value)}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Выберите ${field.field_label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Не выбрано</SelectItem>
              {field.field_options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={fieldValue || false}
              onCheckedChange={(checked) => handleFieldChange(field.field_name, checked)}
              disabled={readOnly}
            />
            <span className="text-sm text-gray-600">
              {fieldValue ? 'Да' : 'Нет'}
            </span>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Загрузка полей...</div>;
  }

  if (customFields.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        Кастомные поля не настроены для этого проекта
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-real-estate-900">Дополнительные поля</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {customFields.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label className="flex items-center gap-2">
              {field.field_label}
              {field.is_required && (
                <Badge variant="destructive" className="text-xs">
                  Обязательно
                </Badge>
              )}
            </Label>
            {renderField(field)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApartmentCustomFields;
