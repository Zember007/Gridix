import { Navigate, useParams } from "react-router-dom";
import { DEFAULT_LANGUAGE } from "@gridix/utils/lib";
import { useProjectByDomain } from "@/entities/project/queries/useProjectByDomain";
import { Loader2 } from "lucide-react";
import { useLanguage } from '@gridix/utils/react';
import { useProject } from '@/entities/project/queries/useProjects';
import { useFields } from '@/hooks/useFields';
import { formatPriceWithCurrency } from "@gridix/utils/lib";
import { Language } from "@gridix/utils/lib";
import { Badge } from "@gridix/ui";
import { Separator } from "@gridix/ui";
import { Button } from "@gridix/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@gridix/ui";
import { ArrowLeft, ExternalLink, Calculator, FileDown, Home, Square, MapPin, Share2, Heart } from 'lucide-react';
import { toast } from "sonner";
import { useState, useEffect } from 'react';
import { supabase } from "@gridix/utils/api";
import { Apartment, normalizeApartmentData } from '@/entities/apartment/model/types';
import ApartmentPhotosViewer from '@/components/apartment/ApartmentPhotosViewer';
import ApartmentReservationForm from '@/components/apartment/ApartmentReservationForm';
import InstallmentCalculator from '@/components/InstallmentCalculator';
import { useIsMobile } from '@gridix/ui';
import { useFavorites } from '@/hooks/useFavorites';

export default function DomainApartmentPage() {
  const { apartmentId } = useParams<{ apartmentId: string }>();
  const { project: domainProject, loading: domainLoading, error: domainError, isDomainProject } = useProjectByDomain();
  const { t, language } = useLanguage();
  const { project, loading: projectLoading, error: projectError } = useProject(domainProject?.id || '');
  const { isFavorite, toggleFavorite } = useFavorites();

  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReserveDialogOpen, setIsReserveDialogOpen] = useState(false);
  const [isCalculatorDialogOpen, setIsCalculatorDialogOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [viewTracked, setViewTracked] = useState(false);

  // Fetch apartment data
  useEffect(() => {
    const fetchApartment = async () => {
      if (!apartmentId || !domainProject?.id) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('apartments')
          .select('*')
          .eq('id', apartmentId)
          .eq('project_id', domainProject.id)
          .single();

        if (error) throw error;
        if (data) {
          setApartment(normalizeApartmentData(data));
        }
      } catch (error) {
        console.error('Error fetching apartment:', error);
        toast.error(t('apartment.fetchError'));
      } finally {
        setLoading(false);
      }
    };

    fetchApartment();
  }, [apartmentId, domainProject?.id, t]);

  // Трекинг просмотра квартиры
  useEffect(() => {
    const trackApartmentView = async () => {
      if (!apartment || !domainProject?.id || viewTracked) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        await supabase.from('apartment_views').insert({
          apartment_id: apartment.id,
          project_id: domainProject.id,
          user_id: user?.id || null,
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
        });

        setViewTracked(true);
      } catch (error) {
        console.error('Error tracking apartment view:', error);
      }
    };

    if (apartment && domainProject && !loading) {
      trackApartmentView();
    }
  }, [apartment, domainProject, loading, viewTracked]);

  // Show loading spinner while determining the domain
  if (domainLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If there's an error, redirect to main page
  if (domainError) {
    console.error("Domain resolution error:", domainError);
    return <Navigate to={`/${DEFAULT_LANGUAGE}`} replace />;
  }

  // If this is not a custom domain or no project found, redirect to main page
  if (!isDomainProject || !domainProject) {
    return <Navigate to={`/${DEFAULT_LANGUAGE}`} replace />;
  }

  if (!apartmentId) {
    return <Navigate to="/" replace />;
  }

  const handleShare = async () => {
    try {
      const url = window.location.href;
      const title = `${t('apartment.apartment')} № ${apartment?.apartment_number}`;

      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success(t('apartment.linkCopied'));
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleGeneratePDF = async () => {
    if (!apartment || !project) return;

    setIsGeneratingPDF(true);
    try {
      // Динамически загружаем модуль PDF только когда нужен
      const { generateApartmentPDF } = await import('@gridix/utils/lib');

      const pdfUrl = `https://${import.meta.env.VITE_SERVER_DOMAIN}/${language}/project/${project.slug}/apartment/${apartment.apartment_number}/pdf`;


      await generateApartmentPDF({
        apartment,
        pdfUrl,
        pdf_main: project?.pdf_presentation_url || undefined,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(t('apartment.pdfGenerationError'));
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (loading || projectLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!apartment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('apartment.notFound')}</h1>
          <p className="text-gray-600 mb-4">{t('apartment.notFoundDescription')}</p>
          <Button onClick={() => window.history.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('apartment.goBack')}
          </Button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto  py-6">
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('apartment.goBack')}
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => apartment && toggleFavorite({
                id: apartment.id,
                project_id: apartment.project_id,
                apartment_number: apartment.apartment_number,
                rooms: typeof apartment.rooms === 'number' ? apartment.rooms : parseInt(apartment.rooms.toString()),
                area: apartment.area,
                price: apartment.price || 0,
                status: apartment.status,
                floor_number: apartment.floor_number
              })}
            >
              <Heart className={`w-4 h-4 ${isFavorite(apartmentId) ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <ApartmentPhotosViewer apartmentId={apartmentId} projectId={domainProject.id} />
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {t('apartment.apartment')} № {apartment.apartment_number}
              </h1>
              <p className="text-muted-foreground">{project?.name}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Square className="w-5 h-5 text-muted-foreground" />
                <span>{apartment.area} {t('apartment.sqm')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5 text-muted-foreground" />
                <span>{apartment.rooms} {t('apartment.rooms')}</span>
              </div>
            </div>

            {apartment.price && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-foreground">
                  {formatPriceWithCurrency(apartment.price, project.currency || 'USD')}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatPriceWithCurrency(apartment.price / apartment.area, project.currency || 'USD')} / {t('apartment.sqm')}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Dialog open={isReserveDialogOpen} onOpenChange={setIsReserveDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex-1">
                    {t('apartment.reserve')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{t('apartment.reserveTitle')}</DialogTitle>
                  </DialogHeader>
                  <ApartmentReservationForm
                    apartmentId={apartmentId}
                    projectId={domainProject.id}
                    onCancel={() => setIsReserveDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>

              {apartment.price && (
                <Dialog open={isCalculatorDialogOpen} onOpenChange={setIsCalculatorDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Calculator className="w-4 h-4 mr-2" />
                      {t('apartment.calculator')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{t('apartment.installmentCalculator')}</DialogTitle>
                    </DialogHeader>
                    <InstallmentCalculator
                      applyInstallment={() => { setIsCalculatorDialogOpen(false); setIsReserveDialogOpen(true); }}
                      apartmentPrice={apartment.price}
                      currency={project?.currency || 'USD'}
                      minDownPaymentPercent={20}
                      maxInstallmentMonths={60}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF}
            >
              <FileDown className="w-4 h-4 mr-2" />
              {isGeneratingPDF ? t('apartment.generatingPDF') : t('apartment.downloadPDF')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
