import { useParams, Navigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProject } from '@/hooks/useProjects';
import { useFields } from '@/hooks/useFields';
import { formatPriceWithCurrency } from '@/lib/currency-utils';
import { Language } from '@/lib/language-utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, ExternalLink, Calculator, FileDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Apartment, normalizeApartmentData } from '@/types/apartment';
import ApartmentPhotosViewer from '@/components/ApartmentPhotosViewer';
import ApartmentReservationForm from '@/components/ApartmentReservationForm';
import InstallmentCalculator from '@/components/InstallmentCalculator';
import { useIsMobile } from '@/hooks/use-mobile';
import { generateApartmentPDF } from '@/lib/pdf-utils';

const ApartmentDetailsPage = () => {
  const { projectId, apartmentId, lang } = useParams();
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const { project, loading: projectLoading, error: projectError } = useProject(projectId || '');
  const { fields: fieldSettings } = useFields(projectId || '');

  // Логируем состояние проекта для диагностики
  useEffect(() => {
    console.log('Project state:', {
      projectId,
      project: project ? 'loaded' : 'not loaded',
      projectLoading,
      projectError
    });
  }, [projectId, project, projectLoading, projectError]);

  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReserveDialogOpen, setIsReserveDialogOpen] = useState(false);
  const [isCalculatorDialogOpen, setIsCalculatorDialogOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    const fetchApartment = async () => {
      if (!projectId || !apartmentId) {
        console.warn('Missing projectId or apartmentId:', { projectId, apartmentId });
        setLoading(false);
        return;
      }

      console.log('Fetching apartment:', { projectId, apartmentId });

      try {
        const { data, error } = await supabase
          .from('apartments')
          .select('*')
          .eq('id', apartmentId)
          .eq('project_id', projectId)
          .single();

        if (error) {
          console.error('Error fetching apartment:', error);
          setLoading(false);
          return;
        }

        console.log('Apartment data received:', data);
        setApartment(normalizeApartmentData(data));
      } catch (error) {
        console.error('Error fetching apartment:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApartment();
  }, [projectId, apartmentId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sold': return 'bg-red-100 text-red-800';
      case 'reserved': return 'bg-yellow-100 text-yellow-800';
      case 'available': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'sold': return t('apartment.sold');
      case 'reserved': return t('apartment.reserved');
      case 'available': return t('apartment.available');
      default: return status;
    }
  };

  const getFieldLabel = (field: { field_label: string; field_label_translations?: Partial<Record<Language, string>> }) => {
    if (field.field_label_translations && field.field_label_translations[language]) {
      return field.field_label_translations[language] as string;
    }
    return field.field_label;
  };

  const getVisibleFields = () => {
    return fieldSettings
      .filter(field => field.is_visible)
      .sort((a, b) => a.sort_order - b.sort_order);
  };

  const getCustomFieldValue = (apt: Apartment, fieldName: string) => {
    if (!apt.custom_fields) return null;
    const customFields = apt.custom_fields as Record<string, unknown>;
    return customFields[fieldName] || null;
  };

  const formatFieldValue = (value: unknown, fieldType: string, fieldName: string) => {
    if (value === null || value === undefined) return '-';

    if (fieldName === 'price') {
      return typeof value === 'number' ? formatPriceWithCurrency(value, project?.currency || null) : '-';
    }

    if (fieldName === 'area') {
      return `${value} м²`;
    }

    if (fieldName === 'floor_number' || fieldName === 'floor') {
      return `${value} ${t('project.floor').toLowerCase()}`;
    }

    if (fieldName === 'rooms') {
      if (value === 0) {
        return t('apartment.studio');
      }
      return `${value} ${t('apartment.room').toLowerCase()}`;
    }

    switch (fieldType) {
      case 'boolean':
        return value ? 'Да' : 'Нет';
      case 'number':
        return typeof value === 'number' ? value.toString() : String(value);
      case 'select':
        return Array.isArray(value) ? value.join(', ') : String(value);
      default:
        return String(value);
    }
  };

  const goBackToProject = () => {
    window.close(); // Закрываем текущую вкладку
    // Если вкладка не закрылась (например, не была открыта через JS), перенаправляем назад
    setTimeout(() => {
      window.location.href = `/${lang}/project/${projectId}`;
    }, 100);
  };

  const handleGeneratePDF = async () => {
    if (!apartment || !projectId) return;

    setIsGeneratingPDF(true);
    try {
      // Получаем фотографии квартиры
      const layoutType = apartment.rooms === 0 ? 'studio' : `${apartment.rooms}-room`;

      // Загружаем планировки
      const { data: layoutPhotos, error: layoutError } = await supabase
        .from('layout_photos')
        .select('*')
        .eq('project_id', projectId)
        .eq('layout_type', layoutType)
        .order('order_index', { ascending: true });

      if (layoutError) {
        console.error('Error loading layout photos:', layoutError);
      }

      // Загружаем индивидуальные фотографии квартиры
      const { data: apartmentPhotos, error: apartmentPhotosError } = await supabase
        .from('apartment_photos')
        .select('*')
        .eq('apartment_id', apartment.id)
        .order('order_index', { ascending: true });

      if (apartmentPhotosError) {
        console.error('Error loading apartment photos:', apartmentPhotosError);
      }

      // Объединяем фотографии
      const allPhotos = [
        ...(layoutPhotos || []).map(photo => ({
          id: photo.id,
          image_url: photo.image_url,
          description: photo.description,
          type: 'layout' as const
        })),
        ...(apartmentPhotos || []).map(photo => ({
          id: photo.id,
          image_url: photo.image_url,
          description: photo.description,
          type: 'apartment' as const
        }))
      ];

      // Генерируем PDF
      await generateApartmentPDF({
        apartment,
        projectCurrency: project?.currency || null,
        photos: allPhotos,
        translations: {
          apartmentDetails: t('pdf.apartmentDetails'),
          apartmentNumber: t('pdf.apartmentNumber'),
          floor: t('apartment.floor'),
          rooms: t('apartment.rooms'),
          area: t('apartment.area'),
          price: t('apartment.price'),
          status: t('apartment.status'),
          photos: t('pdf.photos'),
          layout: t('pdf.layout'),
          apartmentPhoto: t('pdf.apartmentPhoto'),
          studio: t('apartment.studio'),
          available: t('apartment.available'),
          reserved: t('apartment.reserved'),
          sold: t('apartment.sold'),
          generatedOn: t('pdf.generatedOn')
        }
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(t('common.error')); // Используем общую ошибку или можно добавить специфичную
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Показываем загрузку, если данные еще загружаются
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Перенаправляем только если проект не найден после завершения загрузки
  if (!projectLoading && !project) {
    console.warn('Project not found after loading completed:', { projectId, apartmentId });
  }

  return (
    <div className=" bg-background">
      <div className="container mx-auto ">
        <div className="flex h-full flex-col">
          <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background p-4">
            <Button variant="ghost" size="icon" onClick={goBackToProject} aria-label={t('admin.back')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className={`flex flex-1 items-center justify-between ${isMobile ? '' : ''}`}>
              <div className="flex items-center gap-3">
                <span className={isMobile ? 'text-lg' : 'text-xl font-semibold'}>
                  {t('apartment.number')} {apartment.apartment_number}
                </span>
                <Badge className={getStatusColor(apartment.status)}>
                  {getStatusLabel(apartment.status)}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/${lang}/project/${projectId}`, '_blank')}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                {!isMobile && t('projectList.viewProject')}
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="flex gap-6 flex-col p-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Фотографии квартиры */}
                <ApartmentPhotosViewer apartmentId={apartment.id} projectId={apartment.project_id} />

                <div className="flex flex-col gap-4 justify-between">
                  {/* Основная информация */}
                  <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'}`}>
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">{t('apartment.floor')}</h3>
                      <p className="text-lg">{apartment.floor_number}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">{t('apartment.rooms')}</h3>
                      <p className="text-lg">{apartment.rooms === 0 ? t('apartment.studio') : apartment.rooms}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">{t('apartment.area')}</h3>
                      <p className="text-lg">{apartment.area} м²</p>
                    </div>
                    {apartment.price && (
                      <div>
                        <h3 className="font-medium text-sm text-muted-foreground">{t('apartment.price')}</h3>
                        <p className="text-lg font-semibold">{formatPriceWithCurrency(apartment.price, project?.currency || null)}</p>
                      </div>
                    )}
                  </div>

                  {apartment.status === 'available' && (
                    <div className=" flex gap-2 flex-col">
                      <Dialog open={isReserveDialogOpen} onOpenChange={setIsReserveDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="flex-1 md:flex-none">{t('common.reserve')}</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>{t('common.reserve')} {t('apartment.apartment')} {apartment.apartment_number}</DialogTitle>
                          </DialogHeader>
                          <ApartmentReservationForm
                            apartmentId={apartment.id}
                            projectId={apartment.project_id}
                            onSubmit={() => setIsReserveDialogOpen(false)}
                            onCancel={() => setIsReserveDialogOpen(false)}
                          />
                        </DialogContent>
                      </Dialog>

                      <div className="flex gap-2 sm:flex-row flex-col">
                        {project?.installment_enabled && apartment.price && (
                          <Dialog open={isCalculatorDialogOpen} onOpenChange={setIsCalculatorDialogOpen}>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="flex-1">
                                <Calculator className="h-4 w-4" />
                                {t('installment.calculator')}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                              <DialogHeader>
                                <DialogTitle>{t('installment.calculator')}</DialogTitle>
                              </DialogHeader>
                              <InstallmentCalculator
                                apartmentPrice={apartment.price}
                                currency={project.currency}
                                minDownPaymentPercent={project.min_down_payment_percent || 20}
                                maxInstallmentMonths={project.max_installment_months || 24}
                              />
                            </DialogContent>
                          </Dialog>
                        )}

                        <Button
                          className="flex-1"
                          variant="outline"
                          onClick={handleGeneratePDF}
                          disabled={isGeneratingPDF}
                        >
                          <FileDown className="h-4 w-4" />
                          {isGeneratingPDF ? t('common.loading') : 'PDF'}
                        </Button>
                      </div>

                    </div>
                  )}
                </div>
              </div>


              {/* Дополнительные поля */}
              {getVisibleFields().length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-3">{t('apartment.additionalInfo')}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {getVisibleFields().map((field) => {
                        let value: unknown = null;
                        if (field.is_custom) {
                          value = getCustomFieldValue(apartment, field.field_name);
                        } else {
                          switch (field.field_name) {
                            case 'rooms':
                              value = apartment.rooms;
                              break;
                            case 'area':
                              value = apartment.area;
                              break;
                            case 'price':
                              value = apartment.price;
                              break;
                            case 'status':
                              value = apartment.status;
                              break;
                            case 'floor':
                              value = apartment.floor_number;
                              break;
                            case 'number':
                              value = apartment.apartment_number;
                              break;
                            default:
                              value = null;
                          }
                        }

                        if (value === null) return null;

                        return (
                          <div key={field.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                            <span className="text-sm text-gray-600">{field.is_custom ? getFieldLabel(field) : t(`project.${field.field_name}`)}</span>
                            <span className="text-sm font-medium text-gray-900">
                              {formatFieldValue(value, field.field_type, field.field_name)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApartmentDetailsPage;
