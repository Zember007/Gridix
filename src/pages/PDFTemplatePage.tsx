import { useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProject } from '@/hooks/useProjects';
import { useApartment } from '@/hooks/useApartment';
import { useFields } from '@/hooks/useFields';
import { formatPriceWithCurrency, convertPrice } from '@/lib/currency-utils';
import { Language } from '@/lib/language-utils';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { ArrowLeft, Download, Share2, Heart } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Apartment } from '@/types/apartment';
import { useFavorites } from '@/hooks/useFavorites';
import { generateApartmentPDF } from '@/lib/pdf-utils';
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
        apartmentId,
        lang
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
    const { isFavorite, toggleFavorite } = useFavorites();

    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [photos, setPhotos] = useState<Array<{
        id: string;
        image_url: string;
        description?: string | null;
        order_index: number;
        type: 'layout' | 'apartment';
    }>>([]);
    const [photosLoading, setPhotosLoading] = useState<boolean>(true);
    const [selectedCurrency, setSelectedCurrency] = useState<string>('RUB');

    // Initialize currency from project if available
    useEffect(() => {
        if (project?.currency) {
            setSelectedCurrency(project.currency);
        }
    }, [project?.currency]);

    // Load photos (layout + apartment)
    useEffect(() => {
        const loadPhotos = async () => {
            if (!apartment || !project?.id) return;
            setPhotosLoading(true);
            try {
                const layoutType = apartment.type === 'apartment' ? apartment.rooms === 0 ? 'studio' : `${apartment.rooms}-room` : apartment.type;

                const [layoutRes, aptRes] = await Promise.all([
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
                        .order('order_index', { ascending: true })
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
    }, [apartment, project?.id]);

    const handleToggleFavorite = () => {
        if (!apartment) return;

        toggleFavorite({
            id: apartment.id,
            project_id: apartment.project_id,
            apartment_number: apartment.apartment_number,
            rooms: typeof apartment.rooms === 'number' ? apartment.rooms : 0,
            area: apartment.area,
            price: typeof apartment.price === 'number' ? apartment.price : 0,
            status: apartment.status,
            floor_number: apartment.floor_number
        });
    };

    const handleShare = async () => {
        try {
            const url = window.location.href.replace('/pdf', '');
            const title = `${apartment?.type === 'apartment' ? t('apartment.apartment') : apartment?.type} № ${apartment?.apartment_number}`;
            const text = project?.name ? project.name : '';
            if (navigator.share) {
                await navigator.share({ title, text, url });
            } else {
                await navigator.clipboard.writeText(url);
                toast.success(t('common.copied'));
            }
        } catch (error) {
            try {
                await navigator.clipboard.writeText(window.location.href.replace('/pdf', ''));
                toast.success(t('common.copied'));
            } catch (error) {
                console.error('Error copying link to clipboard:', error);
            }
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
        <div className="min-h-screen bg-white font-poppins">

            {/* PDF Template Content */}
            <div className="max-w-4xl mx-auto p-8">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <span className="text-gray-700 font-semibold text-lg">S2 CAPITAL</span>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-semibold text-gray-900">{project.name}</h2>
                    </div>
                </div>

                {/* Main Apartment Info Card */}
                <div className="bg-gray-50 rounded-[40px] p-4 px-8 mb-8">
                    <div className="flex justify-between gap-8 items-center">
                        <div className="flex-1">
                            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
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
                            <div className="text-4xl font-semibold text-gray-900 mb-2">
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
                        <div className="flex flex-col ">
                            <Badge className="mb-1 rounded-[10px] px-[16px] text-sm font-medium bg-green-500 hover:bg-green-600 text-white font-poppins">
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
                    <div className="mb-8">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-6">
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
                                        <span className="text-gray-600 font-poppins text-sm">{field.is_custom ? getFieldLabel(field) : t(`project.${field.field_name}`)}</span>
                                        <span className="font-medium text-gray-900 font-poppins text-sm">
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

                {/* Photos Section */}
                {photos.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-6">{t('pdf.photos')}</h3>
                        <div className="grid grid-cols-3 gap-6">
                            {photos.slice(0, 3).map((photo, index) => (
                                <div key={photo.id} className="relative">
                                    <img
                                        src={photo.image_url}
                                        alt={`${photo.type === 'layout' ? t('pdf.layout') : t('pdf.apartmentPhoto')} ${index + 1}`}
                                        className="w-full h-48 object-cover rounded-lg border border-gray-200"
                                    />
                                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                                        {photo.type === 'layout' ? t('pdf.layout') : t('pdf.apartmentPhoto')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

              
            </div>
        </div>
    );
};

export default PDFTemplatePage;
