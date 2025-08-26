import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/lib/language-utils';

interface FieldSetting {
  id: string;
  field_name: string;
  field_label: string;
  field_type: 'text' | 'number' | 'select' | 'boolean';
  is_custom: boolean;
  is_visible: boolean;
  sort_order: number;
  field_options?: string[];
  is_required?: boolean;
}

interface ApartmentData {
  number?: string;
  floor?: number;
  rooms?: number;
  area?: number;
  price?: number;
  status?: string;
  custom_fields?: Record<string, any>;
}

interface ApartmentDetailsWithFieldsProps {
  projectId: string;
  apartmentId?: string;
  apartmentData: ApartmentData;
  onApartmentDataChange: (data: ApartmentData) => void;
  readOnly?: boolean;
}

const ApartmentDetailsWithFields = ({ 
  projectId, 
  apartmentId,
  apartmentData, 
  onApartmentDataChange,
  readOnly = false 
}: ApartmentDetailsWithFieldsProps) => {
  const [allFields, setAllFields] = useState<FieldSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage();

  // Функция для получения локализованного названия поля
  const getFieldLabel = (field: { field_label: string; field_label_translations?: Partial<Record<Language, string>> }) => {
    if (field.field_label_translations && field.field_label_translations[language]) {
      return field.field_label_translations[language];
    }
    return field.field_label;
  };

  useEffect(() => {
    loadAllFields();
  }, [projectId]);

  const loadAllFields = async () => {
    try {
      // Загружаем настройки стандартных полей
      const { data: settingsData, error: settingsError } = await supabase
        .from('project_field_settings')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_visible', true)
        .order('sort_order');

      if (settingsError) throw settingsError;

      // Загружаем кастомные поля
      const { data: customData, error: customError } = await supabase
        .from('project_custom_fields')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_visible', true)
        .order('sort_order');

      if (customError) throw customError;

      // Объединяем данные
      const combinedFields: FieldSetting[] = [
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
          sort_order: field.sort_order || 999,
          field_options: field.field_options as string[] || [],
          is_required: field.is_required
        }))
      ];

      // Сортируем по sort_order
      combinedFields.sort((a, b) => a.sort_order - b.sort_order);
      setAllFields(combinedFields);
    } catch (error) {
      console.error('Error loading fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: any, isCustom: boolean) => {
    if (isCustom) {
      const updatedData = { 
        ...apartmentData, 
        custom_fields: { 
          ...apartmentData.custom_fields, 
          [fieldName]: value 
        } 
      };
      onApartmentDataChange(updatedData);
    } else {
      const updatedData = { ...apartmentData, [fieldName]: value };
      onApartmentDataChange(updatedData);
    }
  };

  const renderField = (field: FieldSetting) => {
    const fieldValue = field.is_custom 
      ? apartmentData.custom_fields?.[field.field_name]
      : apartmentData[field.field_name as keyof ApartmentData];

    switch (field.field_type) {
      case 'text':
        return (
          <Input
            value={fieldValue || ''}
            onChange={(e) => handleFieldChange(field.field_name, e.target.value, field.is_custom)}
            disabled={readOnly}
            placeholder={`${t('apartment.enter')} ${getFieldLabel(field).toLowerCase()}`}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={fieldValue || ''}
            onChange={(e) => handleFieldChange(field.field_name, parseFloat(e.target.value) || 0, field.is_custom)}
            disabled={readOnly}
            placeholder={`${t('apartment.enter')} ${getFieldLabel(field).toLowerCase()}`}
          />
        );

      case 'select':
        if (field.field_name === 'status') {
          return (
            <Select
              value={fieldValue || ''}
              onValueChange={(value) => handleFieldChange(field.field_name, value, field.is_custom)}
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Доступно</SelectItem>
                <SelectItem value="reserved">Забронировано</SelectItem>
                <SelectItem value="sold">Продано</SelectItem>
              </SelectContent>
            </Select>
          );
        }
        
        return (
          <Select
            value={fieldValue || ''}
            onValueChange={(value) => handleFieldChange(field.field_name, value, field.is_custom)}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder={`${t('apartment.select')} ${getFieldLabel(field).toLowerCase()}`} />
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
              onCheckedChange={(checked) => handleFieldChange(field.field_name, checked, field.is_custom)}
              disabled={readOnly}
            />
            <span className="text-sm text-gray-600">
              {fieldValue ? t('apartment.yes') : t('apartment.no')}
            </span>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">{t('customFields.loading')}</div>;
  }

  if (allFields.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        {t('customFields.noFields')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-real-estate-900">{t('apartment.additionalFields')}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allFields.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label className="flex items-center gap-2">
              {getFieldLabel(field)}
              {field.is_required && (
                <Badge variant="destructive" className="text-xs">
                  {t('customFields.requiredBadge')}
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

export default ApartmentDetailsWithFields;