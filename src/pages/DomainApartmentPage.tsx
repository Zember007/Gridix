import { Navigate, useParams } from "react-router-dom";
import { DEFAULT_LANGUAGE } from "@/lib/language-utils";
import { useProjectByDomain } from "@/hooks/useProjectByDomain";
import { Loader2 } from "lucide-react";
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

export default function DomainApartmentPage() {
  const { apartmentId } = useParams<{ apartmentId: string }>();
  const { project: domainProject, loading: domainLoading, error: domainError, isDomainProject } = useProjectByDomain();
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const { project, loading: projectLoading, error: projectError } = useProject(domainProject?.id || '');
  const { fields: fieldSettings } = useFields(domainProject?.id || '');
  const { isFavorite, toggleFavorite } = useFavorites();

  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReserveDialogOpen, setIsReserveDialogOpen] = useState(false);
  const [isCalculatorDialogOpen, setIsCalculatorDialogOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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
      await generateApartmentPDF({
        apartment,
        projectCurrency: project.currency || 'USD',
        photos: [],
        translations: {
          apartmentDetails: t('apartment.details'),
          apartmentNumber: t('apartment.number'),
          floor: t('apartment.floor'),
          rooms: t('apartment.rooms'),
          area: t('apartment.area'),
          price: t('apartment.price'),
          status: t('apartment.status'),
          photos: t('apartment.photos'),
          layout: t('apartment.layout'),
          apartmentPhoto: t('apartment.photo'),
          studio: t('apartment.studio'),
          available: t('apartment.available'),
          reserved: t('apartment.reserved'),
          sold: t('apartment.sold'),
          generatedOn: t('apartment.generatedOn')
        }
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

  // Render apartment details (simplified version of ApartmentDetailsPage)
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
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
                price: apartment.price,
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
