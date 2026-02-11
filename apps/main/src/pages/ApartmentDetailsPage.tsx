import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProject } from '@/entities/project/queries/useProjects';
import { useApartment } from '@/entities/apartment/queries/useApartment';
import { useFields } from '@/hooks/useFields';
import { formatPriceWithCurrency, convertPrice } from "@gridix/utils/lib";
import CurrencyToggle from '@/components/common/CurrencyToggle';
import { Language } from "@gridix/utils/lib";
import { Badge } from "@gridix/ui";
import { Button } from "@gridix/ui";
import { Loader } from "@gridix/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@gridix/ui";
import { ArrowLeft, Calculator, FileDown, Home, Square, Share2, Heart, Loader2 } from 'lucide-react';
import { toast } from "sonner";
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from "@gridix/utils/api";
import { Apartment, normalizeApartmentData } from '@/entities/apartment/model/types';
import ApartmentPhotosViewer from '@/components/apartment/ApartmentPhotosViewer';
import ApartmentReservationForm from '@/components/apartment/ApartmentReservationForm';
import InstallmentCalculator from '@/components/InstallmentCalculator';
import { useInstallment } from '@/hooks/useInstallment';
import { useFavorites } from '@/hooks/useFavorites';

interface ApartmentDetailsPageProps {
  useId?: boolean;
  apartmentIdProp?: string;
  projectIdProp?: string;
  onClose?: () => void;
}

const ApartmentDetailsPage = ({ useId = false, apartmentIdProp = '', projectIdProp = '', onClose }: ApartmentDetailsPageProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    projectId,
    projectSlug,
    apartmentId,
    apartmentNumber,
    lang
  } = useParams<{
    projectId?: string;
    projectSlug?: string;
    apartmentId?: string;
    apartmentNumber?: string;
    lang?: string;
  }>();

  // Определяем идентификаторы в зависимости от типа маршрута
  const projectIdentifier = useId ? projectIdProp : (projectSlug || projectId);
  const apartmentIdentifier = useId ? apartmentIdProp : (apartmentNumber || apartmentId);

  const { t, language } = useLanguage();
  const { project, loading: projectLoading, error: projectError } = useProject(projectIdentifier || '');
  const { apartment, loading: apartmentLoading, error: apartmentError } = useApartment(
    projectIdentifier,
    apartmentIdentifier,
    { useId }
  );
  const { fields: fieldSettings } = useFields(project?.id || '');
  const { isFavorite, toggleFavorite } = useFavorites();
  const { calculateMonthlyPayment } = useInstallment(
    project?.installment_enabled && project ? {
      ...project,
      installment_enabled: project.installment_enabled,
      min_down_payment_percent: project.min_down_payment_percent || 20,
      max_installment_months: project.max_installment_months || 24
    } : undefined
  );




  const [isReserveDialogOpen, setIsReserveDialogOpen] = useState(false);
  const [isCalculatorDialogOpen, setIsCalculatorDialogOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [bitrixBusy, setBitrixBusy] = useState(false);
  const [isBitrixDealPickerOpen, setIsBitrixDealPickerOpen] = useState(false);
  const [bitrixDealsLoading, setBitrixDealsLoading] = useState(false);
  const [bitrixDeals, setBitrixDeals] = useState<Array<{ id: number; title: string; stage_id?: string | null }>>([]);
  const [bitrixDealsQuery, setBitrixDealsQuery] = useState("");
  const [recommendedApartments, setRecommendedApartments] = useState<Apartment[]>([]);
  const [recommendationThumbnails, setRecommendationThumbnails] = useState<Record<string, string | null>>({});
  const [selectedCurrency, setSelectedCurrency] = useState<string>('RUB');
  const [viewTracked, setViewTracked] = useState(false);

  const bitrixContext = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    const crm = sp.get('crm');
    const dealIdRaw = sp.get('deal_id');
    const dealIdNum = dealIdRaw ? Number(dealIdRaw) : NaN;
    return {
      isBitrix: crm === 'bitrix',
      dealId: Number.isFinite(dealIdNum) && dealIdNum > 0 ? dealIdNum : null,
    };
  }, [location.search]);

  const [bitrixDealId, setBitrixDealId] = useState<number | null>(bitrixContext.dealId);

  useEffect(() => {
    setBitrixDealId(bitrixContext.dealId);
  }, [bitrixContext.dealId]);

  const patchSearchParams = useCallback((patch: Record<string, string | null>) => {
    const url = new URL(window.location.href);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === undefined || v === '') url.searchParams.delete(k);
      else url.searchParams.set(k, v);
    }
    navigate({ search: url.search }, { replace: true });
  }, [navigate]);

  const selectBitrixDealId = async (): Promise<number> => {
    if (typeof BX24 === 'undefined') throw new Error('BX24 недоступен');
    const bx = BX24 as unknown as {
      selectCRM?: (opts: { entityType: string | string[]; multiple?: boolean }, cb: (res: unknown) => void) => void;
    };
    const fn = bx.selectCRM;
    if (typeof fn !== 'function') throw new Error('BX24.selectCRM недоступен');

    return await new Promise<number>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Bitrix: таймаут выбора сделки')), 15000);
      try {
        // Some portals expect entityType as array, some accept string.
        const opts: { entityType: string | string[]; multiple?: boolean } = { entityType: ['deal', 'DEAL'], multiple: false };
        fn(opts, (res: unknown) => {
          clearTimeout(timeout);
          const first = Array.isArray(res)
            ? res[0]
            : (typeof res === 'object' && res !== null && '0' in (res as Record<string, unknown>))
              ? (res as Record<string, unknown>)['0']
              : res;
          const obj = first as { id?: unknown; ID?: unknown } | unknown;
          const id = Number((obj as { id?: unknown })?.id ?? (obj as { ID?: unknown })?.ID ?? obj);
          if (Number.isFinite(id) && id > 0) return resolve(id);
          return reject(new Error('Сделка не выбрана'));
        });
      } catch (e) {
        clearTimeout(timeout);
        reject(e instanceof Error ? e : new Error('Не удалось открыть выбор сделки'));
      }
    });
  };

  const ensureGridixAuth = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) throw new Error('Нужно подключить Bitrix к аккаунту Gridix (SSO)');
    return data.user;
  }, []);

  const loadBitrixUnlinkedDeals = useCallback(async () => {
    if (!apartment) return;
    try {
      setBitrixDealsLoading(true);
      await ensureGridixAuth();
      const { data, error } = await supabase.functions.invoke("bitrix-app", {
        body: { action: "bitrix_list_unlinked_deals", project_id: apartment.project_id, limit: 50 },
      });
      if (error) throw error;
      const deals = ((data as any)?.deals ?? []) as Array<any>;
      const normalized = Array.isArray(deals)
        ? deals
          .map((d) => ({
            id: Number(d?.id),
            title: String(d?.title ?? ""),
            stage_id: d?.stage_id ? String(d.stage_id) : null,
          }))
          .filter((d) => Number.isFinite(d.id) && d.id > 0 && d.title.trim().length > 0)
        : [];
      setBitrixDeals(normalized);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Не удалось загрузить сделки Bitrix");
    } finally {
      setBitrixDealsLoading(false);
    }
  }, [apartment, ensureGridixAuth]);

  const bitrixCreateDeal = async () => {
    if (!apartment || !project) return;
    try {
      setBitrixBusy(true);
      await ensureGridixAuth();

      const { data, error } = await supabase.functions.invoke('bitrix-app', {
        body: { action: 'create_deal_from_apartment', project_id: apartment.project_id, apartment_id: apartment.id },
      });
      if (error) throw error;

      const createdDealId = Number((data as { bitrix_deal_id?: unknown } | null)?.bitrix_deal_id);
      if (Number.isFinite(createdDealId) && createdDealId > 0) {
        setBitrixDealId(createdDealId);
        patchSearchParams({ crm: 'bitrix', deal_id: String(createdDealId) });
      }

      toast.success(createdDealId ? `Сделка создана (#${createdDealId})` : 'Сделка создана');
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Не удалось создать сделку в Bitrix');
    } finally {
      setBitrixBusy(false);
    }
  };

  const linkApartmentToBitrixDeal = useCallback(async (dealId: number) => {
    if (!apartment || !project) return;
    try {
      setBitrixBusy(true);
      await ensureGridixAuth();

      setBitrixDealId(dealId);
      patchSearchParams({ crm: 'bitrix', deal_id: String(dealId) });

      const { error } = await supabase.functions.invoke('bitrix-app', {
        body: {
          action: 'link_apartment_to_deal',
          bitrix_deal_id: dealId,
          project_id: apartment.project_id,
          apartment_id: apartment.id,
        },
      });
      if (error) throw error;

      toast.success(`Квартира привязана к сделке #${dealId}`);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Не удалось привязать квартиру к сделке');
    } finally {
      setBitrixBusy(false);
    }
  }, [apartment, ensureGridixAuth, patchSearchParams, project]);

  const bitrixLinkToDeal = async () => {
    if (!apartment || !project) return;

    // If deal already known (Bitrix placement passed deal_id), link immediately.
    if (bitrixDealId) {
      await linkApartmentToBitrixDeal(bitrixDealId);
      return;
    }

    // Otherwise show our non-blocking picker (instead of waiting on BX24.selectCRM).
    setIsBitrixDealPickerOpen(true);
    if (!bitrixDeals.length) {
      void loadBitrixUnlinkedDeals();
    }
  };

  // Трекинг просмотра квартиры
  useEffect(() => {
    const trackApartmentView = async () => {
      if (!apartment || !project?.id || viewTracked) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();

        await supabase.from('apartment_views').insert({
          apartment_id: apartment.id,
          project_id: project.id,
          user_id: user?.id || null,
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
        });

        setViewTracked(true);
      } catch (error) {
        console.error('Error tracking apartment view:', error);
      }
    };

    if (apartment && project && !apartmentLoading && !projectLoading) {
      trackApartmentView();
    }
  }, [apartment, project, apartmentLoading, projectLoading, viewTracked]);

  // Photos preloading moved to parent component
  interface CombinedPhoto {
    id: string;
    image_url: string;
    description?: string | null;
    order_index: number;
    type: 'layout' | 'apartment';
  }
  const [photos, setPhotos] = useState<CombinedPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState<boolean>(true);



  const handleShare = async () => {
    try {
      const url = window.location.href;
      const title = `${apartment?.type === 'apartment' ? t('apartment.apartment') : apartment?.type} № ${apartment?.apartment_number}`;
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

  // Initialize currency from project if available
  useEffect(() => {
    if (project?.currency) {
      setSelectedCurrency(project.currency);
    }
  }, [project?.currency]);

  const getLayoutType = (rooms: number): string => {
    return rooms == 0 ? 'studio' : `${rooms}-room`;
  };

  // Load photos (layout + apartment) in parent and pass down
  useEffect(() => {
    const loadPhotos = async () => {
      if (!apartment || !project?.id) return;
      setPhotosLoading(true);
      try {

        const currentRooms = apartment.rooms;
        const layoutType = getLayoutType(typeof currentRooms === 'number' ? currentRooms : Number(currentRooms));


        const [aptRes, layoutRes] = await Promise.all([
          supabase
            .from('apartment_photos')
            .select('*')
            .eq('apartment_id', apartment.id)
            .order('order_index', { ascending: true }),
          supabase
            .from('layout_photos')
            .select('*')
            .eq('project_id', project.id)
            .eq('layout_type', layoutType)
            .order('order_index', { ascending: true })
        ]);


        const apartmentPhotos = (aptRes.data || []).map((photo) => ({
          id: photo.id as string,
          image_url: photo.image_url as string,
          description: (photo as { description?: string | null }).description ?? null,
          order_index: (photo as { order_index: number }).order_index,
          type: 'apartment' as const
        }));

        const layoutPhotos = project.id !== '04bcb797-a155-479c-a9ae-131ce850375f' ? [] : (layoutRes.data || []).map((photo) => ({
          id: photo.id,
          image_url: photo.image_url,
          description: photo.description ?? null,
          order_index: photo.order_index,
          type: 'layout' as const
        }))

        setPhotos([...layoutPhotos, ...apartmentPhotos].sort((a, b) => a.order_index - b.order_index));
      } catch (err) {
        console.error('Error loading photos in parent:', err);
        setPhotos([]);
      } finally {
        setPhotosLoading(false);
      }
    };

    loadPhotos();
  }, [apartment, project?.id]);

  const handleToggleFavorite = () => {
    if (!apartment) return;

    toggleFavorite({
      id: apartment.id,
      project_id: apartment.project_id,
      apartment_number: apartment.apartment_number,
      rooms: !isNaN(Number(apartment.rooms)) ? Number(apartment.rooms) : 0,
      area: apartment.area,
      price: apartment.price || 0,
      status: apartment.status,
      floor_number: apartment.floor_number
    });
  };

  // Get project colors from polygon settings
  const getProjectColors = () => {
    const themeColor = (project as unknown as Record<string, unknown>)?.theme_color as string || '#000000';

    return {
      available: themeColor,
      sold: '#ef4444',
      reserved: '#f59e0b'
    };
  };


  const getStatusColor = (status: string) => {
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
      if (Number.isNaN(value)) return '-';
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
    if (onClose) {
      onClose();
      return;
    }

    const projectUrl = useId
      ? `/${lang}/project/id/${projectId}`
      : `/${lang}/project/${project?.slug || projectIdentifier}`;
    window.location.href = projectUrl;
  };

  const openApartmentDetails = (apartment: Apartment) => {
    // Используем slug если он есть, иначе ID с префиксом
    const projectPath = project?.slug ? project.slug : `id/${project?.id || projectIdentifier}`;
    const url = `/${language}/project/${projectPath}/apartment/${apartment.apartment_number}`;
    window.location.href = url;
  };

  // Load recommended apartments
  const loadRecommendedApartments = useCallback(async () => {
    if (!apartment || !project?.id) return;

    try {
      const { data, error } = await supabase
        .from('apartments')
        .select('id, apartment_number, floor_number, rooms, area, price, status, project_id, created_at, updated_at, floor_plan_id, custom_fields, type')
        .eq('project_id', project.id)
        .eq('rooms', apartment.rooms.toString())
        .neq('id', apartment.id)
        .eq('status', 'available')
        .limit(4);

      if (error) throw error;

      const normalizedApartments = (data || []).map(normalizeApartmentData);
      setRecommendedApartments(normalizedApartments);
      // После загрузки рекомендаций загрузим для них превью (фото квартиры или планировки)
      try {
        const thumbnails: Record<string, string | null> = {};
        for (const apt of normalizedApartments) {
          // Сначала пробуем первое фото квартиры
          const { data: aptPhotos, error: aptPhotosError } = await supabase
            .from('apartment_photos')
            .select('image_url, order_index')
            .eq('apartment_id', apt.id)
            .order('order_index', { ascending: true })
            .limit(1);
          if (!aptPhotosError && aptPhotos && aptPhotos.length > 0) {
            thumbnails[apt.id] = aptPhotos[0]!.image_url;
            continue;
          }

          // Если у квартиры нет фото — берём первую планировку по типу комнат
          const layoutType = apt.rooms == 0
            ? 'studio'
            : apt.rooms === 'free_layout'
              ? 'free_layout'
              : `${apt.rooms}-room`;
          const { data: layoutPhotos, error: layoutError } = await supabase
            .from('layout_photos')
            .select('image_url, order_index')
            .eq('project_id', project.id)
            .eq('layout_type', layoutType)
            .order('order_index', { ascending: true })
            .limit(1);
          if (!layoutError && layoutPhotos && layoutPhotos.length > 0) {
            thumbnails[apt.id] = layoutPhotos[0]!.image_url;
          } else {
            thumbnails[apt.id] = null;
          }
        }
        setRecommendationThumbnails(thumbnails);
      } catch (thumbError) {
        console.error('Error loading recommendation thumbnails:', thumbError);
      }
    } catch (error) {
      console.error('Error loading recommended apartments:', error);
    }
  }, [apartment, project?.id]);

  useEffect(() => {
    if (apartment && project?.id) {
      loadRecommendedApartments();
    }
  }, [apartment, project?.id, loadRecommendedApartments]);

  const handleGeneratePDF = async () => {
    if (!apartment || !project?.id) return;

    setIsGeneratingPDF(true);
    try {
      // Динамически загружаем модуль PDF только когда нужен
      const { generateApartmentPDF } = await import('@gridix/utils/lib');

      // Формируем URL для API
      const projectSlug = project.slug || `id/${project.id}`;
      const pdfUrl = `https://${import.meta.env.VITE_SERVER_DOMAIN}/${language}/project/${projectSlug}/apartment/${apartment.apartment_number}/pdf`;

      // Генерируем PDF через API
      await generateApartmentPDF({
        apartment,
        pdfUrl,
        pdf_main: project?.pdf_presentation_url || undefined,

      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(t('common.error'));
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const priceVisible = fieldSettings.find(field => field.field_name === 'price')?.is_visible;
  const areaVisible = fieldSettings.find(field => field.field_name === 'area')?.is_visible;
  const roomsVisible = fieldSettings.find(field => field.field_name === 'rooms')?.is_visible;
  const statusVisible = fieldSettings.find(field => field.field_name === 'status')?.is_visible;
  const floorVisible = fieldSettings.find(field => field.field_name === 'floor')?.is_visible;
  const numberVisible = fieldSettings.find(field => field.field_name === 'number')?.is_visible;


  const loading = projectLoading || apartmentLoading || photosLoading;



  // Обработка ошибок
  if (projectError || apartmentError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground mb-2">{t('common.error')}</h1>
          <p className="text-muted-foreground">{projectError || apartmentError}</p>
        </div>
      </div>
    );
  }

  // Перенаправляем только если проект или квартира не найдены после завершения загрузки
  if (!loading && (!project || !apartment)) {
    console.warn('Project or apartment not found after loading completed:', {
      projectIdentifier,
      apartmentIdentifier,
      project: !!project,
      apartment: !!apartment
    });
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground mb-2">{t('apartment.notFound')}</h1>
          <p className="text-muted-foreground">{t('apartment.invalidId')}</p>
        </div>
      </div>
    );
  }

  // Если данные еще не загружены, не рендерим основной контент
  if (!apartment || !project || loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader size="lg" className="mx-auto mb-4"
        color={project?.theme_color || '#000000'}
      />
    </div>
  }

  return (
    <div className="min-h-screen ">
      <div className="container px-0 lg:px-6 mx-auto">
        {/* Mobile Layout */}
        <div className="lg:hidden ">
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
            {statusVisible && (
              <div className="absolute top-4 right-4 z-10">
                <Badge
                  className={`${getStatusColor(apartment.status)} px-3 py-1 rounded-full font-medium`}
                  style={getStatusStyle(apartment.status)}
                >
                  {getStatusLabel(apartment.status)}
                </Badge>
              </div>
            )}

            {/* Main apartment image */}
            <div className="relative overflow-hidden ">

              <ApartmentPhotosViewer
                preloadedLayoutPhotos={photos}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 pb-32 bg-white -mt-6 relative z-10 border">
            {/* Title and floor */}
            <div className="mb-4">

              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {apartment.type === 'apartment' ? ((project as unknown as Record<string, unknown>)?.project_type === 'object'
                    ? `Object ${numberVisible ? `№ ${apartment.apartment_number}` : ''}`
                    : `${t('apartment.apartment')} ${numberVisible ? `№ ${apartment.apartment_number}` : ''}`) : `${apartment.type} ${numberVisible ? `№ ${apartment.apartment_number}` : ''}`}
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
              {floorVisible && (
                <p className="text-gray-500">{apartment.floor_number} {t('apartment.floor')}</p>
              )}
            </div>

            {/* Room and area info */}
            <div className="flex items-center gap-4 mb-6">
              {roomsVisible && (
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">
                    {apartment.rooms == 0 ? t('apartment.studio') : `${apartment.rooms} ${!isNaN(Number(apartment.rooms)) ? t('apartment.rooms') : ''}`}
                  </span>
                </div>
              )}
              {areaVisible && (
                <div className="flex items-center gap-2">
                  <Square className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">{apartment.area} м² {t('apartment.area')}</span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="mb-6">
              {apartment.status === 'available' ?
                <div className="text-3xl font-bold text-gray-900">
                  {apartment.price && priceVisible
                    ? formatPriceWithCurrency(
                      convertPrice(apartment.price, project?.currency || null, selectedCurrency),
                      selectedCurrency
                    )
                    : t('common.priceOnRequest')
                  }
                </div>
                :
                <div className="text-3xl leading-[1] font-bold text-[red] mb-1 font-poppins text-shadow">
                  {t('apartment.sold')}
                </div>
              }
            </div>


            {/* Дополнительные поля */}
            {getVisibleFields().length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {(project as unknown as Record<string, unknown>)?.project_type === 'object'
                    ? 'Object details'
                    : t('apartment.details')
                  }
                </h3>

                <div className="space-y-3">
                  {getVisibleFields().map((field) => {
                    let value: unknown = null;
                    if (field.is_custom) {
                      value = getCustomFieldValue(apartment, field.field_name);
                    } else {
                      switch (field.field_name) {
                        case 'rooms':
                          if (!isNaN(Number(apartment.rooms))) {
                            value = apartment.rooms;
                          }
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
                          {field.field_name === 'price'
                            ? formatPriceWithCurrency(
                              convertPrice(value as number, project?.currency || null, selectedCurrency),
                              selectedCurrency
                            )
                            : formatFieldValue(value, field.field_type, field.field_name)}
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
        <div className="hidden lg:block py-6">
          <div className="max-w-7xl mx-auto px-6">
            {/* Back button and title section */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goBackToProject}
                  className="rounded-full w-10 h-10 border border-gray-200 hover:bg-gray-50"
                  aria-label={t('admin.back')}
                >
                  <ArrowLeft className="h-5 w-5 text-gray-700" />
                </Button>
                <h1 className="text-2xl font-semibold text-gray-900 font-poppins">
                  {apartment.type === 'apartment' ? ((project as unknown as Record<string, unknown>)?.project_type === 'object'
                    ? `Object ${numberVisible ? `№ ${apartment.apartment_number}` : ''}`
                    : `${t('apartment.apartment')} ${numberVisible ? `№ ${apartment.apartment_number}` : ''}`) : `${apartment.type} ${numberVisible ? `№ ${apartment.apartment_number}` : ''}`}
                </h1>
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

            {/* Main content grid */}
            <div className="flex gap-8">
              {/* Left side - Gallery and details */}
              <div className="flex-1 space-y-4">
                {/* Gallery */}
                <div className="relative">
                  {statusVisible && (
                    <div className="absolute top-4 left-4 z-10">
                      <Badge
                        className={`${getStatusColor(apartment.status)} px-3 py-1 rounded-full font-medium font-poppins`}
                        style={getStatusStyle(apartment.status)}
                      >
                        {getStatusLabel(apartment.status)}
                      </Badge>
                    </div>
                  )}

                  <ApartmentPhotosViewer
                    preloadedLayoutPhotos={photos}
                  />
                  {/* Gallery navigation line */}

                </div>

                <div className="flex h-[70px] items-center justify-center">
                  <div className="h-0.5 w-full bg-gray-300 rounded-full"></div>
                </div>



                {/* Additional Information Section */}
                {getVisibleFields().length > 0 && (
                  <div className="space-y-6">
                    <h2 className="text-3xl font-medium text-gray-900 font-poppins">
                      {(project as unknown as Record<string, unknown>)?.project_type === 'object'
                        ? 'Object details'
                        : t('apartment.details')
                      }
                    </h2>

                    <div className="space-y-4">
                      {getVisibleFields().map((field) => {
                        let value: unknown = null;
                        if (field.is_custom) {
                          value = getCustomFieldValue(apartment, field.field_name);
                        } else {
                          switch (field.field_name) {
                            case 'rooms':
                              if (!isNaN(Number(apartment.rooms))) {
                                value = apartment.rooms;
                              }
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
                          <div key={field.id} className="flex items-center justify-between py-3">
                            <span className="text-gray-600 font-poppins">{field.is_custom ? getFieldLabel(field) : t(`project.${field.field_name}`)}</span>
                            <span className="font-medium text-gray-900 font-poppins">
                              {formatFieldValue(value, field.field_type, field.field_name)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right side - Price and actions */}
              <div className="w-[400px]">
                <div className="sticky top-6">
                  <div className="bg-gray-50 rounded-2xl p-6 space-y-[24px] flex flex-col justify-between min-h-[340px]">
                    {/* Currency selector */}
                    <div className="space-y-[24px]">
                      <div className="flex items-center justify-between">
                        <div className="text-xl font-medium text-gray-900  font-poppins">
                          {apartment.rooms == 0
                            ? t('apartment.studio')
                            : apartment.rooms === 'free_layout'
                              ? t('apartment.freeLayout')
                              : `${apartment.rooms} ${!isNaN(Number(apartment.rooms)) ? t('apartment.rooms') : ''}`} {apartment.area} m2
                        </div>
                        <div className="text-xl font-light text-gray-500  font-poppins">
                          {apartment.floor_number} floor
                        </div>
                      </div>
                      <div className="flex justify-between gap-[15px]">
                        {apartment.status === 'available' ?
                          <>

                            <div className="flex flex-col items-start gap-4 whitespace-nowrap">
                              <div className="text-4xl leading-[1] font-medium text-gray-900 mb-1 font-poppins">
                                {apartment.price && priceVisible
                                  ? formatPriceWithCurrency(
                                    convertPrice(apartment.price, project?.currency || null, selectedCurrency),
                                    selectedCurrency
                                  )
                                  : t('common.priceOnRequest')
                                }
                              </div>

                              {project?.installment_enabled && apartment.price && priceVisible && (
                                <div className="text-xl font-light text-gray-700 mb-2 font-poppins">
                                  {t('project.from')} {formatPriceWithCurrency(
                                    convertPrice(
                                      calculateMonthlyPayment(apartment.price),
                                      project?.currency || null,
                                      selectedCurrency
                                    ),
                                    selectedCurrency
                                  )} / {t('installment.perMonth')}
                                </div>
                              )}

                              <Badge className=" rounded-[10px] px-[16px] text-sm font-medium bg-green-500 hover:bg-green-600 text-white font-poppins">
                                {t('installment.low')}
                              </Badge>
                            </div>
                            {priceVisible &&
                              <div className="flex-col gap-[10px] flex">
                                <div className="flex ">
                                  <CurrencyToggle
                                    selectedCurrency={selectedCurrency}
                                    onChange={(c) => setSelectedCurrency(c)}
                                    projectCurrency={project?.currency}
                                    themeColor={(project as unknown as Record<string, unknown>)?.theme_color as string || '#000000'}
                                  />
                                </div>
                                <div>
                                  {project?.installment_enabled && project?.max_installment_months && priceVisible && (
                                    <>
                                      <div className="text-[14px] font-light text-gray-700 font-poppins">
                                        {t('installment.period')} {project.max_installment_months} {t('installment.months')}
                                      </div>
                                      <div className="text-[14px] font-light text-gray-700 font-poppins">
                                        {t('installment.downPaymentFrom')} {project?.min_down_payment_percent ?? 20}%
                                      </div>
                                    </>
                                  )}

                                </div>
                              </div>
                            }
                          </>
                          :
                          <div className="text-4xl leading-[1] font-bold text-[red] mb-1 font-poppins text-shadow">
                            {t('apartment.sold')}
                          </div>
                        }
                      </div>
                    </div>

                    {/* Price */}


                    {/* Action buttons */}
                    {apartment.status === 'available' && (
                      <div className="space-y-3">
                        {/* Green installment button */}


                        {/* Main reserve / Bitrix actions */}
                        {bitrixContext.isBitrix ? (
                          <div className="space-y-2">
                            <Button
                              className="w-full text-white py-3 rounded-lg text-sm font-medium hover:opacity-90 font-poppins"
                              style={getButtonStyle('available')}
                              onClick={bitrixLinkToDeal}
                              disabled={bitrixBusy}
                            >
                              {bitrixBusy
                                ? '...'
                                : bitrixDealId
                                  ? `Привязать к сделке #${bitrixDealId}`
                                  : 'Привязать к существующей сделке'}
                            </Button>
                            <Button variant="outline" className="w-full py-3 rounded-lg font-poppins text-sm" onClick={bitrixCreateDeal} disabled={bitrixBusy}>
                              {bitrixBusy ? '...' : 'Создать сделку в Bitrix'}
                            </Button>
                            <div className="text-xs text-muted-foreground">
                              В Bitrix сделку будут записаны данные квартиры (цена/номер/проект/адрес и т.д.), а в Gridix создастся локальный лид для синхронизации.
                            </div>
                          </div>
                        ) : (
                          <Button
                            className="w-full text-white py-3 rounded-lg text-sm font-medium hover:opacity-90 font-poppins"
                            style={getButtonStyle('available')}
                            onClick={() => setIsReserveDialogOpen(true)}
                          >
                            {t('common.leaveRequest')}
                          </Button>
                        )}

                        {/* Secondary buttons row */}
                        <div className="flex gap-3">
                          {project?.installment_enabled && apartment.price && priceVisible && (
                            <Button
                              variant="outline"
                              className="flex-1 py-3 rounded-lg border border-gray-300 bg-white font-poppins text-sm"
                              onClick={() => setIsCalculatorDialogOpen(true)}
                            >
                              {t('installment.calculator')}
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            onClick={handleGeneratePDF}
                            disabled={isGeneratingPDF}
                            className={`px-6 py-3 rounded-lg border border-gray-300 bg-white font-poppins text-sm ${project?.installment_enabled && apartment.price && priceVisible ? '' : 'w-full'}`}
                          >
                            {isGeneratingPDF ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>PDF</span>
                              </div>
                            ) : (
                              'PDF'
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations Section */}
            {recommendedApartments.length > 0 && (
              <div className="mt-12 space-y-6 bg-gray-50 rounded-2xl p-10">
                <h2 className="text-3xl font-medium text-gray-900 font-poppins">Recommended apartments</h2>
                <div className="grid grid-cols-4 gap-6">
                  {recommendedApartments.map((recApartment) => (
                    <div
                      key={recApartment.id}
                      className="bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => openApartmentDetails(recApartment)}
                    >
                      <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                        {recommendationThumbnails[recApartment.id] ? (
                          <img
                            src={recommendationThumbnails[recApartment.id]!}
                            alt={`Apartment ${recApartment.apartment_number}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <Home className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <Badge
                            className={`${getStatusColor(recApartment.status)} px-2 py-1 rounded-full text-xs font-medium font-poppins`}
                            style={getStatusStyle(recApartment.status)}
                          >
                            {getStatusLabel(recApartment.status)}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-gray-900 font-poppins">
                            {recApartment.type === 'apartment' ? ((project as unknown as Record<string, unknown>)?.project_type === 'object'
                              ? `Object № ${recApartment.apartment_number}`
                              : `${t('apartment.apartment')} № ${recApartment.apartment_number}`) : `${recApartment.type} № ${recApartment.apartment_number}`}
                          </h3>
                          <span className="text-sm text-gray-500 font-poppins">
                            {recApartment.floor_number} {t('project.floor')}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2 font-poppins">
                          {recApartment.rooms == 0 ? t('apartment.studio') : `${recApartment.rooms} ${typeof recApartment.rooms === 'number' ? t('apartment.room') : ''}`} • {recApartment.area} m²
                        </div>
                        {recApartment.price && priceVisible && (
                          <div className="text-lg font-medium text-gray-900 font-poppins">
                            {formatPriceWithCurrency(
                              convertPrice(recApartment.price, project?.currency || null, selectedCurrency),
                              selectedCurrency
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Action Buttons - Mobile (bottom) */}
        {apartment.status === 'available' && (
          <div className="lg:hidden sticky bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-50">
            <div className="max-w-sm mx-auto space-y-3">
              {bitrixContext.isBitrix ? (
                <div className="space-y-2">
                  <Button
                    className="w-full text-white py-3 rounded-2xl text-lg font-semibold hover:opacity-90"
                    style={getButtonStyle('available')}
                    onClick={bitrixLinkToDeal}
                    disabled={bitrixBusy}
                  >
                    {bitrixBusy
                      ? '...'
                      : bitrixDealId
                        ? `Привязать к сделке #${bitrixDealId}`
                        : 'Привязать к сделке'}
                  </Button>
                  <Button variant="outline" className="w-full py-3 rounded-2xl border-2 border-gray-200 hover:border-gray-300" onClick={bitrixCreateDeal} disabled={bitrixBusy}>
                    {bitrixBusy ? '...' : 'Создать сделку'}
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full text-white py-3 rounded-2xl text-lg font-semibold hover:opacity-90"
                  style={getButtonStyle('available')}
                  onClick={() => setIsReserveDialogOpen(true)}
                >
                  {t('common.reserve')}
                </Button>
              )}

              <div className="flex gap-3">
                {project?.installment_enabled && apartment.price && priceVisible && (
                  <Button
                    variant="outline"
                    className="flex-1 py-3 rounded-2xl border-2 border-gray-200 hover:border-gray-300"
                    onClick={() => setIsCalculatorDialogOpen(true)}
                  >
                    <Calculator className="h-5 w-5 mr-2" />
                    {t('installment.calculator')}
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={handleGeneratePDF}
                  disabled={isGeneratingPDF}
                  className={`px-4 py-3 rounded-2xl border-2 border-gray-200 hover:border-gray-300 ${project?.installment_enabled && apartment.price && priceVisible ? '' : 'w-full'}`}
                >

                  {isGeneratingPDF ? (

                    <Loader2 className="h-4 w-4 animate-spin" />

                  ) : (
                    <FileDown className="h-5 w-5" />

                  )}
                  <span className="hidden xs:block">PDF</span>
                </Button>

              </div>
            </div>
          </div>
        )}



        {/* Dialogs rendered once (avoid double-open on shared state) */}
        {!bitrixContext.isBitrix && (
          <Dialog open={isReserveDialogOpen} onOpenChange={setIsReserveDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {t('common.reserve')} {t('apartment.apartment')} {apartment.apartment_number}
                </DialogTitle>
              </DialogHeader>
              <ApartmentReservationForm
                apartmentId={apartment.id}
                projectId={apartment.project_id}
                onCancel={() => setIsReserveDialogOpen(false)}
                themeColor={(project as unknown as Record<string, unknown>)?.theme_color as string || '#000000'}
              />
            </DialogContent>
          </Dialog>
        )}

        {project?.installment_enabled && apartment.price && priceVisible && (
          <Dialog open={isCalculatorDialogOpen} onOpenChange={setIsCalculatorDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{t('installment.calculator')}</DialogTitle>
              </DialogHeader>
              <InstallmentCalculator
                applyInstallment={() => {
                  setIsCalculatorDialogOpen(false);
                  if (!bitrixContext.isBitrix) setIsReserveDialogOpen(true);
                }}
                apartmentPrice={apartment.price}
                currency={project.currency}
                minDownPaymentPercent={project.min_down_payment_percent || 20}
                maxInstallmentMonths={project.max_installment_months || 24}
                themeColor={(project as unknown as Record<string, unknown>)?.theme_color as string || '#000000'}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Bitrix deal picker (avoid UI freeze on BX24.selectCRM) */}
        {bitrixContext.isBitrix && (
          <Dialog
            open={isBitrixDealPickerOpen}
            onOpenChange={(open) => {
              setIsBitrixDealPickerOpen(open);
              if (open) void loadBitrixUnlinkedDeals();
              if (!open) setBitrixDealsQuery("");
            }}
          >
            <DialogContent className="sm:max-w-[650px]">
              <DialogHeader>
                <DialogTitle>Выберите сделку Bitrix</DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Показываем сделки без привязки к квартире (не “зафиксированные” в Gridix).
                </div>

                <div className="flex gap-2">
                  <input
                    value={bitrixDealsQuery}
                    onChange={(e) => setBitrixDealsQuery(e.target.value)}
                    placeholder="Поиск по названию или #ID"
                    className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    disabled={bitrixDealsLoading || bitrixBusy}
                  />
                  <Button
                    variant="outline"
                    onClick={() => void loadBitrixUnlinkedDeals()}
                    disabled={bitrixDealsLoading || bitrixBusy}
                  >
                    Обновить
                  </Button>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    try {
                      const id = await selectBitrixDealId();
                      setIsBitrixDealPickerOpen(false);
                      await linkApartmentToBitrixDeal(id);
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Не удалось открыть выбор сделки");
                    }
                  }}
                  disabled={bitrixDealsLoading || bitrixBusy}
                >
                  Выбрать через Bitrix (BX24)
                </Button>

                {bitrixDealsLoading ? (
                  <div className="py-8 flex items-center justify-center">
                    <Loader />
                  </div>
                ) : (
                  <div className="max-h-[360px] overflow-auto rounded-md border border-border">
                    {bitrixDeals
                      .filter((d) => {
                        const q = bitrixDealsQuery.trim().toLowerCase();
                        if (!q) return true;
                        return String(d.id).includes(q) || d.title.toLowerCase().includes(q);
                      })
                      .map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-muted transition-colors border-b last:border-b-0 disabled:opacity-50"
                          onClick={async () => {
                            setIsBitrixDealPickerOpen(false);
                            await linkApartmentToBitrixDeal(d.id);
                          }}
                          disabled={bitrixBusy}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-medium">#{d.id}</div>
                            {d.stage_id ? (
                              <div className="text-xs text-muted-foreground">{d.stage_id}</div>
                            ) : null}
                          </div>
                          <div className="text-sm text-muted-foreground break-words">{d.title}</div>
                        </button>
                      ))}

                    {!bitrixDeals.length && (
                      <div className="px-3 py-6 text-sm text-muted-foreground">
                        Не найдено доступных сделок для привязки.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

      </div>
    </div>
  );
};

export default ApartmentDetailsPage;
