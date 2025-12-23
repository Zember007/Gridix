
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';
import { Badge } from '@/shared/ui/badge';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/shared/api/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { SUPPORTED_LANGUAGES, LANGUAGE_CONFIG, Language } from '@/shared/lib/language-utils';

interface CustomField {
  id?: string;
  field_name: string;
  field_label: string;
  field_label_translations?: Partial<Record<Language, string>>;
  field_type: 'text' | 'number' | 'select' | 'boolean';
  is_required: boolean;
  field_options?: string[];
  sort_order: number;
  is_visible: boolean;
}

interface CustomFieldsManagerProps {
  projectId?: string | null;
  onFieldsChange?: (fields: CustomField[]) => void;
  editingField?: CustomField | null;
  onClose?: () => void;
}

const CustomFieldsManager = ({ 
  projectId, 
  onFieldsChange, 
  editingField: initialEditingField = null,
  onClose 
}: CustomFieldsManagerProps) => {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [editingField, setEditingField] = useState<CustomField | null>(initialEditingField);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage();

  // Функция для получения локализованного названия поля
  const getFieldLabel = (field: CustomField) => {
    if (field.field_label_translations && field.field_label_translations[language]) {
      return field.field_label_translations[language];
    }
    return field.field_label;
  };

  const [newField, setNewField] = useState<CustomField>({
    field_name: '',
    field_label: '',
    field_label_translations: {},
    field_type: 'text',
    is_required: false,
    field_options: [],
    sort_order: 0,
    is_visible: true
  });

  // Stabilize external deps to avoid refetch loops when parent re-renders
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }, [t]);

  const onFieldsChangeRef = useRef(onFieldsChange);
  useEffect(() => { onFieldsChangeRef.current = onFieldsChange; }, [onFieldsChange]);

  const loadCustomFields = useCallback(async () => {
    if (!projectId) {
      setFields([]);
      onFieldsChangeRef.current?.([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('project_custom_fields')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order');

      if (error) throw error;

      type DbCustomFieldRow = {
        id: string;
        field_name: string;
        field_label: string;
        field_label_translations?: Partial<Record<Language, string>> | null;
        field_type: 'text' | 'number' | 'select' | 'boolean';
        is_required: boolean;
        field_options?: string[] | null;
        sort_order?: number | null;
        is_visible?: boolean | null;
      };

      const formattedFields = (data as DbCustomFieldRow[]).map(field => ({
        id: field.id,
        field_name: field.field_name,
        field_label: field.field_label,
        field_label_translations: field.field_label_translations || {},
        field_type: field.field_type,
        is_required: field.is_required,
        field_options: field.field_options || [],
        sort_order: field.sort_order || 0,
        is_visible: field.is_visible !== false
      }));

      setFields(formattedFields);
      onFieldsChangeRef.current?.(formattedFields);
    } catch (error) {
      console.error('Error loading custom fields:', error);
      toast.error(tRef.current('customFields.loadError'));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadCustomFields();
  }, [loadCustomFields]);

  useEffect(() => {
    if (initialEditingField) {
      setEditingField(initialEditingField);
    }
  }, [initialEditingField]);

  const generateFieldName = (label: string) => {
    return label
      .toLowerCase()
      .replace(/[^a-zа-я0-9\s]/gi, '')
      .replace(/\s+/g, '_')
      .slice(0, 30);
  };

  const handleSaveField = async (field: CustomField) => {
    if (!field.field_label.trim()) {
      toast.error(t('customFields.enterFieldName'));
      return;
    }

    const fieldName = field.field_name || generateFieldName(field.field_label);
    
    try {
      if (!projectId) {
        // Локальный режим: сохраняем только в памяти
        let updatedFields;
        if (field.id) {
          updatedFields = fields.map(f => f.id === field.id ? { 
            ...field, 
            field_name: fieldName,
            field_label_translations: field.field_label_translations || {}
          } : f);
          setFields(updatedFields);
        } else {
          const localField: CustomField = {
            ...field,
            id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            field_name: fieldName,
            sort_order: field.sort_order || fields.length,
            is_visible: field.is_visible ?? true,
            field_label_translations: field.field_label_translations || {}
          };
          updatedFields = [...fields, localField];
          setFields(updatedFields);
        }
        onFieldsChange?.(updatedFields);
        toast.success(t('customFields.saveSuccess'));
      } else if (field.id) {
        // Обновление существующего поля
        const { error } = await supabase
          .from('project_custom_fields')
          .update({
            field_name: fieldName,
            field_label: field.field_label,
            field_label_translations: field.field_label_translations,
            field_type: field.field_type,
            is_required: field.is_required,
            field_options: field.field_options,
            sort_order: field.sort_order,
            is_visible: field.is_visible
          })
          .eq('id', field.id);

        if (error) throw error;
        toast.success(t('customFields.updateSuccess'));
      } else {
        // Создание нового поля
        const { error } = await supabase
          .from('project_custom_fields')
          .insert([{
            project_id: projectId,
            field_name: fieldName,
            field_label: field.field_label,
            field_label_translations: field.field_label_translations,
            field_type: field.field_type,
            is_required: field.is_required,
            field_options: field.field_options,
            sort_order: field.sort_order || fields.length,
            is_visible: field.is_visible
          }]);

        if (error) throw error;
        toast.success(t('customFields.saveSuccess'));
      }

      setIsAdding(false);
      setEditingField(null);
      setNewField({
        field_name: '',
        field_label: '',
        field_label_translations: {},
        field_type: 'text',
        is_required: false,
        field_options: [],
        sort_order: 0,
        is_visible: true
      });
      if (!projectId) {
        // В локальном режиме поля уже обновлены выше
      } else {
        loadCustomFields();
      }
    } catch (error) {
      console.error('Error saving field:', error);
      toast.error(t('customFields.saveError'));
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    try {
      if (!projectId) {
        const updatedFields = fields.filter(f => f.id !== fieldId);
        setFields(updatedFields);
        onFieldsChange?.(updatedFields);
        toast.success(t('customFields.deleteSuccess'));
        return;
      }
      const { error } = await supabase
        .from('project_custom_fields')
        .delete()
        .eq('id', fieldId);

      if (error) throw error;
      toast.success(t('customFields.deleteSuccess'));
      loadCustomFields();
    } catch (error) {
      console.error('Error deleting field:', error);
      toast.error(t('customFields.deleteError'));
    }
  };

  const renderFieldEditor = (field: CustomField, isNew: boolean = false) => (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="field_label">{t('customFields.fieldName')}</Label>
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
            placeholder={t('customFields.fieldNamePlaceholder')}
          />
        </div>
        
        <div>
          <Label htmlFor="field_type">{t('customFields.fieldType')}</Label>
          <Select
            value={field.field_type}
            onValueChange={(value: 'text' | 'number' | 'select' | 'boolean') => {
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
              <SelectItem value="text">{t('customFields.fieldTypeText')}</SelectItem>
              <SelectItem value="number">{t('customFields.fieldTypeNumber')}</SelectItem>
              <SelectItem value="select">{t('customFields.fieldTypeSelect')}</SelectItem>
              <SelectItem value="boolean">{t('customFields.fieldTypeBoolean')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Переводы названий полей */}
      <div>
        <Label>{t('customFields.translations')}</Label>
        <div className="space-y-2 mt-2">
          {SUPPORTED_LANGUAGES.map((lang) => {
            
            return (
            <div key={lang} className="flex items-center gap-2">
              <span className="text-sm w-12 flex items-center gap-1">
                {LANGUAGE_CONFIG[lang].flag} {LANGUAGE_CONFIG[lang].code.toUpperCase()}
              </span>
              <Input
                value={field.field_label_translations?.[lang] || ''}
                onChange={(e) => {
                  const updatedTranslations = {
                    ...field.field_label_translations,
                    [lang]: e.target.value
                  };
                  const updatedField = { 
                    ...field, 
                    field_label_translations: updatedTranslations 
                  };
                  if (isNew) {
                    setNewField(updatedField);
                  } else {
                    setEditingField(updatedField);
                  }
                }}
                placeholder={`${t('customFields.fieldNamePlaceholder')} (${LANGUAGE_CONFIG[lang].name})`}
                className="flex-1"
              />
            </div>
          )})}
        </div>
      </div>

      {field.field_type === 'select' && (
        <div>
          <Label>{t('customFields.options')}</Label>
          <textarea
            className="w-full mt-1 p-2 border rounded resize-none"
            rows={3}
            value={field.field_options?.join('\n') || ''}
            onChange={(e) => {
              const options = e.target.value.split('\n');
              const updatedField = { ...field, field_options: options };
              if (isNew) {
                setNewField(updatedField);
              } else {
                setEditingField(updatedField);
              }
            }}
            placeholder={t('customFields.optionsPlaceholder')}
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
        <Label htmlFor="is_required">{t('customFields.required')}</Label>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => handleSaveField(field)}
        >
          <Check className="h-4 w-4 mr-2" />
          {t('customFields.save')}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (isNew) {
              setIsAdding(false);
              setNewField({
                field_name: '',
                field_label: '',
                field_label_translations: {},
                field_type: 'text',
                is_required: false,
                field_options: [],
                sort_order: 0,
                is_visible: true
              });
            } else {
              setEditingField(null);
            }
            onClose?.();
          }}
        >
          <X className="h-4 w-4 mr-2" />
          {t('customFields.cancel')}
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return <div className="p-4 text-center">{t('customFields.loading')}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('customFields.title')}</CardTitle>
        <CardDescription>
          {t('customFields.description')}
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
                    <div className="font-medium">{getFieldLabel(field)}</div>
                    <div className="text-sm text-gray-500">
                      {field.field_type === 'text' && t('customFields.fieldTypeText')}
                      {field.field_type === 'number' && t('customFields.fieldTypeNumber')}
                      {field.field_type === 'select' && t('customFields.fieldTypeSelect')}
                      {field.field_type === 'boolean' && t('customFields.fieldTypeBoolean')}
                      {field.is_required && <Badge variant="destructive" className="ml-2 text-xs">{t('customFields.requiredBadge')}</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const normalizedTranslations = SUPPORTED_LANGUAGES.reduce(
                        (acc, lang) => {
                          acc[lang] = field.field_label_translations?.[lang] ?? '';
                          return acc;
                        },
                        {} as Partial<Record<Language, string>>
                      );
                      setEditingField({ ...field, field_label_translations: normalizedTranslations });
                    }}
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
            {t('customFields.addField')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomFieldsManager;
