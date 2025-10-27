import { useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProject } from '@/hooks/useProjects';
import { useApartment } from '@/hooks/useApartment';
import { useFields } from '@/hooks/useFields';
import { formatPriceWithCurrency, convertPrice } from '@/lib/currency-utils';
import { Language } from '@/lib/language-utils';
import { Loader } from '@/components/ui/loader';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Apartment } from '@/types/apartment';
import { Badge } from '@/components/ui/badge';

interface PDFTemplatePageProps {
    useId?: boolean;
    apartmentIdProp?: string;
    projectIdProp?: string;
}

const PDFTemplatePage = ({ useId = false, apartmentIdProp = '', projectIdProp = '' }: PDFTemplatePageProps) => {
    const {
        projectSlug,
        projectId,
        apartmentNumber,
        apartmentId
    } = useParams<{
        projectSlug?: string;
        projectId?: string;
        apartmentNumber?: string;
        apartmentId?: string;
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

    const [photos, setPhotos] = useState<Array<{
        id: string;
        image_url: string;
        description?: string | null;
        order_index: number;
        type: 'layout' | 'apartment';
    }>>([]);
    const [floorPlan, setFloorPlan] = useState<{
        id: string;
        image_url: string;
        description: string;
        floor_number: number;
    } | null>(null);
    const [photosLoading, setPhotosLoading] = useState<boolean>(true);
    const [selectedCurrency, setSelectedCurrency] = useState<string>('RUB');
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

    // Initialize currency from project if available
    useEffect(() => {
        if (project?.currency) {
            setSelectedCurrency(project.currency);
        }
    }, [project?.currency]);

    // Generate QR code when data is ready
    useEffect(() => {
        const updateQRCode = async () => {
            if (!project || !apartment) return;

            try {
                const baseDomain = await getBaseDomain();
                const url = `${baseDomain}/${language}/project/${project.slug}/apartment/${apartment.apartment_number}`;
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
                setQrCodeUrl(qrUrl);
            } catch (err) {
                console.error('Error generating QR code:', err);
                setQrCodeUrl('');
            }
        };

        updateQRCode();
    }, [project, apartment, language]);

    // Load photos (layout + apartment + floor plan)
    useEffect(() => {
        const loadPhotos = async () => {
            if (!apartment || !project?.id) return;
            setPhotosLoading(true);
            try {
                const layoutType = apartment.type === 'apartment' ? apartment.rooms === 0 ? 'studio' : `${apartment.rooms}-room` : apartment.type;

                const [layoutRes, aptRes, floorPlanRes] = await Promise.all([
                    supabase
                        .from('layout_photos')
                        .select('*')
                        .eq('project_id', project.id)
                        .eq('layout_type', layoutType)
                        .order('order_index', { ascending: true }),
                    supabase
                        .from('apartment_photos')
                        .select('*')
                        .eq('apartment_id', apartment.id)
                        .order('order_index', { ascending: true }),
                    supabase
                        .from('floor_plans')
                        .select('image_url')
                        .eq('project_id', project.id)
                        .eq('floor_number', apartment.floor_number)
                        .maybeSingle()
                ]);

                const layoutPhotos = (layoutRes.data || []).map((photo) => ({
                    id: photo.id as string,
                    image_url: photo.image_url as string,
                    description: (photo as { description?: string | null }).description ?? null,
                    order_index: (photo as { order_index: number }).order_index,
                    type: 'layout' as const
                }));

                const apartmentPhotos = (aptRes.data || []).map((photo) => ({
                    id: photo.id as string,
                    image_url: photo.image_url as string,
                    description: (photo as { description?: string | null }).description ?? null,
                    order_index: (photo as { order_index: number }).order_index,
                    type: 'apartment' as const
                }));

                // Set floor plan separately if available
                if (floorPlanRes.data?.image_url) {
                    setFloorPlan({
                        id: `floor-plan-${apartment.floor_number}`,
                        image_url: floorPlanRes.data.image_url,
                        description: `${t('pdf.floorPlan')} ${apartment.floor_number} ${t('project.floor').toLowerCase()}`,
                        floor_number: apartment.floor_number
                    });
                } else {
                    setFloorPlan(null);
                }

                const combined = [...layoutPhotos, ...apartmentPhotos];
                setPhotos(combined);
            } catch (err) {
                console.error('Error loading photos:', err);
                setPhotos([]);
            } finally {
                setPhotosLoading(false);
            }
        };

        loadPhotos();
    }, [apartment, project?.id, t]);

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

    const getBaseDomain = async () => {


        if (!project && !projectId) return '';

        // Получаем текущий домен
        const currentHostname = window.location.hostname;

        // Получаем домены проекта из project_domains
        const { data: projectDomains } = await supabase
            .from('project_domains')
            .select('domain, is_primary, status')
            .eq('project_id', project?.id || projectId || '')
            .eq('status', 'active');

        // Проверяем, есть ли текущий домен среди доменов проекта
        const isProjectDomain = projectDomains?.some(
            pd => pd.domain.toLowerCase() === currentHostname.toLowerCase()
        );
        // Определяем базовый домен
        let baseDomain: string;
        if (isProjectDomain) {
            // Используем текущий домен
            baseDomain = window.location.origin;
        } else {

            const primaryDomain = projectDomains?.find(pd => pd.is_primary)?.domain;
            if (primaryDomain) {
                baseDomain = 'https://' + primaryDomain;
            } else {
                baseDomain = 'https://' + import.meta.env.VITE_SERVER_DOMAIN || 'https://gridix.live';
            }

        }

        return baseDomain;
    };

    const priceVisible = fieldSettings.find(field => field.field_name === 'price')?.is_visible;
    const floorVisible = fieldSettings.find(field => field.field_name === 'floor')?.is_visible;
    const numberVisible = fieldSettings.find(field => field.field_name === 'number')?.is_visible;

    const loading = projectLoading || apartmentLoading || photosLoading;



    if (!project) return null;

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader size="lg" className="mx-auto mb-4"
                    color={project?.theme_color || '#000000'}
                />
            </div>
        );
    }

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

    if (!loading && (!project || !apartment)) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-xl font-bold text-foreground mb-2">{t('apartment.notFound')}</h1>
                    <p className="text-muted-foreground">{t('apartment.invalidId')}</p>
                </div>
            </div>
        );
    }

    if (!apartment || !project) {
        return null;
    }

    return (
        <div className="min-h-screen bg-white">

            {/* PDF Template Content */}
            <div className="max-w-4xl mx-auto p-8 flex flex-col gap-3">
                {/* Header Section */}
                <div className="flex justify-between items-center ">
                    <div className="flex items-center gap-3">
                        <span className="text-gray-700 font-semibold text-lg">S2 CAPITAL</span>
                    </div>
                    <div className="text-right flex items-center gap-8">
                        <h2 className="text-xl font-semibold text-gray-900">{project.name}</h2>
                        <div className="bg-white w-14 aspect-square flex items-center justify-center">
                            <img
                                src={qrCodeUrl}
                                alt="Telegram QR Code"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>
                </div>

                {/* Main Apartment Info Card */}
                <div className="bg-gray-50 rounded-[40px] p-2 px-8">
                    <div className="flex justify-between gap-8 items-center">
                        <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {apartment.rooms === 0 ? t('apartment.studio') : `${apartment.rooms} ${typeof apartment.rooms === 'number' ? t('apartment.rooms') : ''}`} {apartment.area} m²
                            </h3>
                            <p className="text-gray-600">
                                {apartment.type === 'apartment' ? ((project as unknown as Record<string, unknown>)?.project_type === 'object'
                                    ? `Object ${numberVisible ? `№ ${apartment.apartment_number}` : ''}`
                                    : `${t('apartment.apartment')} ${numberVisible ? `№ ${apartment.apartment_number}` : ''}`) : `${apartment.type} ${numberVisible ? `№ ${apartment.apartment_number}` : ''}`}
                                {floorVisible && ` • ${apartment.floor_number} ${t('apartment.floor')}`}
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-semibold text-gray-900 mb-2">
                                {apartment.price && priceVisible
                                    ? formatPriceWithCurrency(
                                        convertPrice(apartment.price, project?.currency || null, selectedCurrency),
                                        selectedCurrency
                                    )
                                    : t('common.priceOnRequest')
                                }
                            </div>
                            {project?.installment_enabled && apartment.price && (
                                <div className="text-lg text-gray-600 mb-3">
                                    {t('project.from')} {formatPriceWithCurrency(
                                        convertPrice(
                                            Math.round(apartment.price / (project?.max_installment_months || 24)),
                                            project?.currency || null,
                                            selectedCurrency
                                        ),
                                        selectedCurrency
                                    )} / {t('installment.perMonth')}
                                </div>
                            )}

                        </div>
                        <div className="flex flex-col items-start">
                            <Badge className="mb-1 rounded-[10px] px-[16px] text-sm font-medium bg-green-500 hover:bg-green-600 text-white">
                                {t('installment.low')}
                            </Badge>
                            <div className="text-sm text-gray-600">
                                {t('installment.period')} {project?.max_installment_months || 12} {t('installment.months')}
                            </div>
                            <div className="text-sm text-gray-600">
                                {t('installment.downPaymentFrom')} {project?.min_down_payment_percent ?? 30}%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Information */}
                {getVisibleFields().length > 0 && (
                    <>
                        <h3 className="text-xl font-semibold text-gray-900">
                            {(project as unknown as Record<string, unknown>)?.project_type === 'object'
                                ? 'Object details'
                                : t('apartment.details')
                            }
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            {getVisibleFields().map((field) => {
                                let value: unknown = null;
                                if (field.is_custom) {
                                    value = getCustomFieldValue(apartment, field.field_name);
                                } else {
                                    switch (field.field_name) {
                                        case 'rooms':
                                            if (typeof apartment.rooms === 'number') {
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
                                    <div key={field.id} className="flex justify-between items-center py-1 border-b border-gray-100">
                                        <span className="text-gray-600 text-sm">{field.is_custom ? getFieldLabel(field) : t(`project.${field.field_name}`)}</span>
                                        <span className="font-medium text-gray-900 text-sm">
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
                    </>
                )}

                {/* Photos Section */}
                {photos.length > 0 && (
                    <>
                        <h3 className="text-xl font-semibold text-gray-900">{t('pdf.photos')}</h3>
                        <div className="grid grid-cols-3 gap-6">
                            {photos.slice(0, 3).map((photo, index) => (
                                <div key={photo.id} className="relative">
                                    <img
                                        src={photo.image_url}
                                        alt={`${photo.type === 'layout' ? t('pdf.layout') : t('pdf.apartmentPhoto')} ${index + 1}`}
                                        className="w-full h-40 object-cover rounded-lg border border-gray-200"
                                    />
                                    {photo.type === 'layout' &&
                                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">

                                            {t('pdf.layout')}
                                        </div>
                                    }
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Floor Plan Section */}
                {floorPlan && (
                    <>
                        <h3 className="text-xl font-semibold text-gray-900 ">{t('pdf.floorPlan')}</h3>
                        <img
                            src={floorPlan.image_url}
                            alt={floorPlan.description}
                            className="h-full max-h-[300px] w-auto mx-auto"
                        />

                    </>
                )}


            </div>
        </div>
    );
};

export default PDFTemplatePage;
