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
import { ArrowLeft, ExternalLink, Calculator, FileDown, Home, Square, MapPin, Share2, Heart } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Apartment, normalizeApartmentData } from '@/types/apartment';
import ApartmentPhotosViewer from '@/components/apartment/ApartmentPhotosViewer';
import ApartmentReservationForm from '@/components/apartment/ApartmentReservationForm';
import InstallmentCalculator from '@/components/InstallmentCalculator';
import { useIsMobile } from '@/hooks/use-mobile';
import { generateApartmentPDF } from '@/lib/pdf-utils';
import { useFavorites } from '@/hooks/useFavorites';

const ApartmentDetailsPage = () => {
  const { projectId, apartmentId, lang } = useParams();
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const { project, loading: projectLoading, error: projectError } = useProject(projectId || '');
  const { fields: fieldSettings } = useFields(projectId || '');
  const { isFavorite, toggleFavorite } = useFavorites();

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

  const handleShare = async () => {
    try {
      const url = window.location.href;
      const title = `${t('apartment.apartment')} № ${apartment?.apartment_number}`;
      const text = project?.name ? project.name : '';
      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success(t('common.copied'));
      }
    } catch (error) {
      // User might cancel share; fallback to copying link
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success(t('common.copied'));
      } catch (error) {
        console.error('Error copying link to clipboard:', error);
      }
    }
  };

  const handleToggleFavorite = () => {
    if (!apartment) return;

    toggleFavorite({
      id: apartment.id,
      project_id: apartment.project_id,
      apartment_number: apartment.apartment_number,
      rooms: typeof apartment.rooms === 'number' ? apartment.rooms : Number(apartment.rooms),
      area: apartment.area,
      price: typeof apartment.price === 'number' ? apartment.price : undefined,
      status: apartment.status,
      floor_number: apartment.floor_number
    });
  };

  // Get project colors from polygon settings
  const getProjectColors = () => {
    const themeColor = (project as unknown as Record<string, unknown>)?.theme_color as string || '#000000';
    /* if (project && 'polygon_settings' in project) {
      const projectWithSettings = project as Record<string, unknown>;
      const settings = projectWithSettings.polygon_settings as { colors?: { available: string; sold: string; reserved: string } };
      if (settings && settings.colors) {
        return settings.colors;
      }
    } */
    return {
      available: themeColor,
      sold: '#ef4444',
      reserved: '#f59e0b'
    };
  };

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
    const colors = getProjectColors();
    switch (status) {
      case 'sold': return 'text-white';
      case 'reserved': return 'text-white';
      case 'available': return 'text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusStyle = (status: string) => {
    const colors = getProjectColors();
    switch (status) {
      case 'sold': return { backgroundColor: colors.sold };
      case 'reserved': return { backgroundColor: colors.reserved };
      case 'available': return { backgroundColor: colors.available };
      default: return { backgroundColor: '#6b7280' };
    }
  };

  const getButtonStyle = (status: string = 'available') => {
    const colors = getProjectColors();
    return {
      backgroundColor: colors[status as keyof typeof colors] || colors.available,
    };
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
        pdf_main: project?.pdf_presentation_url || undefined,
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
      toast.error(t('common.error'));
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
    <div className="min-h-screen ">
      <div className="container px-0 md:px-6 mx-auto">
        {/* Mobile Layout */}
        <div className="md:hidden ">
          {/* Header with back button and status badge */}
          <div className="relative">
            <div className="absolute top-4 left-4 z-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={goBackToProject}
                className="bg-black/20 hover:bg-black/30 text-white rounded-full w-10 h-10"
                aria-label={t('admin.back')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
            <div className="absolute top-4 right-4 z-10">
              <Badge
                className={`${getStatusColor(apartment.status)} px-3 py-1 rounded-full font-medium`}
                style={getStatusStyle(apartment.status)}
              >
                {getStatusLabel(apartment.status)}
              </Badge>
            </div>

            {/* Main apartment image */}
            <div className="h-70  relative overflow-hidden rounded-t-3xl">
              <ApartmentPhotosViewer apartmentId={apartment.id} projectId={apartment.project_id} />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 pb-32 rounded-t-3xl bg-white -mt-6 relative z-10 border">
            {/* Title and floor */}
            <div className="mb-4">

              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {t('apartment.apartment')} № {apartment.apartment_number}
                </h1>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleToggleFavorite}
                    className={`px-4 py-3 rounded-2xl border-2 hover:border-gray-300 h-15 w-15 ${isFavorite(apartment?.id || '')
                        ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <Heart className={`!h-5 !w-5 ${isFavorite(apartment?.id || '') ? 'fill-current' : ''}`} />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="px-4 py-3 rounded-2xl border-2 border-gray-200 hover:border-gray-300 h-15 w-15"
                  >
                    <Share2 className="!h-5 !w-5 " />
                  </Button>
                </div>
              </div>
              <p className="text-gray-500">{apartment.floor_number} {t('apartment.floor')}</p>
            </div>

            {/* Room and area info */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Home className="h-5 w-5 text-gray-400" />
                <span className="text-gray-700">
                  {apartment.rooms === 0 ? t('apartment.studio') : `${apartment.rooms} ${t('apartment.rooms')}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Square className="h-5 w-5 text-gray-400" />
                <span className="text-gray-700">{apartment.area} м² {t('apartment.area')}</span>
              </div>
            </div>

            {/* Price */}
            {apartment.price && (
              <div className="mb-6">
                <div className="text-3xl font-bold text-gray-900">
                  {formatPriceWithCurrency(apartment.price, project?.currency || null)}
                </div>
              </div>
            )}

            {/* Description section */}
            {/*  {project?.description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('projectEditor.description')}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {project.description}
                </p>
              </div>
            )} */}

            {/* Details section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('apartment.details')}</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Home className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600">{t('apartment.number')}: {apartment.apartment_number}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600">{t('apartment.floor')}: {apartment.floor_number}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Square className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600">{t('apartment.area')}: {apartment.area} м²</span>
                </div>
              </div>
            </div>

            {/* Дополнительные поля */}
            {getVisibleFields().length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('apartment.additionalInfo')}</h3>
                <div className="space-y-3">
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
                      <div key={field.id} className="flex justify-between items-center py-2">
                        <span className="text-gray-600">{field.is_custom ? getFieldLabel(field) : t(`project.${field.field_name}`)}</span>
                        <span className="font-medium text-gray-900">
                          {formatFieldValue(value, field.field_type, field.field_name)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block py-10">
          <div className="max-w-6xl mx-auto">
            {/* Gallery at top */}
            <div className="relative mb-8">
              <div className="relative rounded-xl border bg-white shadow-sm overflow-hidden">
                <div className="absolute top-4 left-4 z-10">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goBackToProject}
                    className="bg-black/20 hover:bg-black/30 text-white rounded-full w-10 h-10"
                    aria-label={t('admin.back')}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </div>
                <div className="absolute top-4 right-4 z-10">
                  <Badge
                    className={`${getStatusColor(apartment.status)} px-3 py-1 rounded-full font-medium`}
                    style={getStatusStyle(apartment.status)}
                  >
                    {getStatusLabel(apartment.status)}
                  </Badge>
                </div>
                <ApartmentPhotosViewer apartmentId={apartment.id} projectId={apartment.project_id} />
              </div>
            </div>

            {/* Title and basic info section */}
            <div className="mb-8">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">
                    {t('apartment.apartment')} № {apartment.apartment_number}
                  </h1>
                  <p className="mt-2 text-lg text-gray-500">{apartment.floor_number} {t('apartment.floor')}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleToggleFavorite}
                    className={`px-3 py-2 rounded-lg border hover:border-gray-300 ${isFavorite(apartment?.id || '')
                        ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100'
                        : 'border-gray-200'
                      }`}
                    aria-label="favorite"
                  >
                    <Heart className={`h-5 w-5 ${isFavorite(apartment?.id || '') ? 'fill-current' : ''}`} />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300"
                    aria-label="share"
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Basic metrics */}
              <div className="flex items-center gap-8 text-lg">
                <div className="flex items-center gap-2 text-gray-700">
                  <Home className="h-6 w-6 text-gray-400" />
                  <span>{apartment.rooms === 0 ? t('apartment.studio') : `${apartment.rooms} ${t('apartment.rooms')}`}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Square className="h-6 w-6 text-gray-400" />
                  <span>{apartment.area} м²</span>
                </div>
              </div>
            </div>

            {/* Two-column layout: Data on left, Price and actions on right */}
            <div className="grid grid-cols-3 gap-8">
              {/* Left column - Apartment data (2/3 width) */}
              <div className="col-span-2 space-y-6">
                {/* Project description */}
                {project?.description && (
                  <div className="rounded-xl border bg-white shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('projectEditor.description')}</h3>
                    <p className="text-gray-600 leading-relaxed">{project.description}</p>
                  </div>
                )}

                {/* Basic apartment details */}
                <div className="rounded-xl border bg-white shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('apartment.details')}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">{t('apartment.number')}</span>
                      <span className="font-medium text-gray-900">{apartment.apartment_number}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">{t('apartment.floor')}</span>
                      <span className="font-medium text-gray-900">{apartment.floor_number}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">{t('apartment.area')}</span>
                      <span className="font-medium text-gray-900">{apartment.area} м²</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-gray-600">{t('apartment.rooms')}</span>
                      <span className="font-medium text-gray-900">
                        {apartment.rooms === 0 ? t('apartment.studio') : `${apartment.rooms} ${t('apartment.rooms')}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional fields */}
                {getVisibleFields().length > 0 && (
                  <div className="rounded-xl border bg-white shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('apartment.additionalInfo')}</h3>
                    <div className="space-y-3">
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
                          <div key={field.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                            <span className="text-gray-600">{field.is_custom ? getFieldLabel(field) : t(`project.${field.field_name}`)}</span>
                            <span className="font-medium text-gray-900">
                              {formatFieldValue(value, field.field_type, field.field_name)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative h-full">
                {/* Right column - Price and actions (1/3 width) */}
                <div className="space-y-6 w-full sticky top-10">
                  {/* Price card */}
                  {apartment.price && (
                    <div className="rounded-xl border bg-white shadow-sm p-6 text-center">
                      <div className="text-3xl font-bold text-gray-900 mb-2">
                        {formatPriceWithCurrency(apartment.price, project?.currency || null)}
                      </div>
                      <p className="text-gray-500 text-sm">{t('project.price')}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  {apartment.status === 'available' && (
                    <div className="space-y-3">
                      <Dialog open={isReserveDialogOpen} onOpenChange={setIsReserveDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            className="w-full text-white py-4 rounded-xl text-lg font-semibold hover:opacity-90"
                            style={getButtonStyle('available')}
                          >
                            {t('common.reserve')}
                          </Button>
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
                            themeColor={(project as unknown as Record<string, unknown>)?.theme_color as string || '#000000'}
                          />
                        </DialogContent>
                      </Dialog>

                      {project?.installment_enabled && apartment.price && (
                        <Dialog open={isCalculatorDialogOpen} onOpenChange={setIsCalculatorDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full py-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 bg-white">
                              <Calculator className="h-5 w-5 mr-2" />
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
                              themeColor={(project as unknown as Record<string, unknown>)?.theme_color as string || '#000000'}
                            />
                          </DialogContent>
                        </Dialog>
                      )}

                      <Button
                        variant="outline"
                        onClick={handleGeneratePDF}
                        disabled={isGeneratingPDF}
                        className="w-full py-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 bg-white"
                      >
                        <FileDown className="h-5 w-5 mr-2" />
                        PDF
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Action Buttons - Mobile (bottom) */}
        {apartment.status === 'available' && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-50">
            <div className="max-w-sm mx-auto space-y-3">
              <Dialog open={isReserveDialogOpen} onOpenChange={setIsReserveDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="w-full text-white py-3 rounded-2xl text-lg font-semibold hover:opacity-90"
                    style={getButtonStyle('available')}
                  >
                    {t('common.reserve')}
                  </Button>
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
                    themeColor={(project as unknown as Record<string, unknown>)?.theme_color as string || '#000000'}
                  />
                </DialogContent>
              </Dialog>

              <div className="flex gap-3">
                {project?.installment_enabled && apartment.price && (
                  <Dialog open={isCalculatorDialogOpen} onOpenChange={setIsCalculatorDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1 py-3 rounded-2xl border-2 border-gray-200 hover:border-gray-300">
                        <Calculator className="h-5 w-5 mr-2" />
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
                        themeColor={(project as unknown as Record<string, unknown>)?.theme_color as string || '#000000'}
                      />
                    </DialogContent>
                  </Dialog>
                )}

                <Button
                  variant="outline"
                  onClick={handleGeneratePDF}
                  disabled={isGeneratingPDF}
                  className="px-4 py-3 rounded-2xl border-2 border-gray-200 hover:border-gray-300"
                >
                  <FileDown className="h-5 w-5" />
                  <span className="hidden xs:block">PDF</span>
                </Button>

              </div>
            </div>
          </div>
        )}



      </div>
    </div>
  );
};

export default ApartmentDetailsPage;
