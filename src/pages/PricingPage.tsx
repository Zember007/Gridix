import React, { useState, useEffect } from 'react';
import { useSubscription, SubscriptionPlan } from '../hooks/useSubscription';
import PricingCard, { PricingCardProps } from '../components/pricing/PricingCard';
import InfoCard from '../components/pricing/InfoCard';
import HeroHeader from '@/components/index/header';
import Footer from '@/components/index/footer';
import {
  MapIcon,
  BarChartSquareIcon,
  FileTextIcon,
  FilePdfIcon,
  LinkIconComponent,
  GlobeIcon,
  TrendingUpIcon,
  BuildingIcon,
  UploadCloudIcon,
  PenToolIcon,
  WrenchIcon,
  UsersIcon,
  PaletteIcon,
  CodeIcon,
  RocketIcon,
  HandshakeIcon,
  PiggyBankIcon,
  GiftIcon,
  ClockIcon,
  CreditCardIcon,
  BriefcaseIcon,
  LockIcon,
  SparklesIcon,
  CheckIcon,
  XCircleIcon,
} from '@/components/pricing/pricing-icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

// Feature mapping - maps feature keys to icons
const getFeatureMap = (): Record<string, { icon: React.ReactNode; textKey: string }> => ({
  'interactive_floor_plan': { icon: <MapIcon />, textKey: 'features.interactive_floor_plan' },
  'apartment_management': { icon: <BarChartSquareIcon />, textKey: 'features.apartment_management' },
  'lead_management': { icon: <FileTextIcon />, textKey: 'features.lead_management' },
  'pdf_presentations': { icon: <FilePdfIcon />, textKey: 'features.pdf_presentations' },
  'public_link': { icon: <LinkIconComponent />, textKey: 'features.public_link' },
  'widget_embedding': { icon: <GlobeIcon />, textKey: 'features.widget_embedding' },
  'analytics': { icon: <TrendingUpIcon />, textKey: 'features.analytics' },
  'project_types': { icon: <BuildingIcon />, textKey: 'features.project_types' },
  'bulk_import': { icon: <UploadCloudIcon />, textKey: 'features.bulk_import' },
  'gridix_label': { icon: <PenToolIcon />, textKey: 'features.gridix_label' },
  'support': { icon: <WrenchIcon />, textKey: 'features.support' },
  'team_management': { icon: <UsersIcon />, textKey: 'features.team_management' },
  'crm_integration': { icon: <LinkIconComponent />, textKey: 'features.crm_integration' },
  'custom_domain': { icon: <GlobeIcon />, textKey: 'features.custom_domain' },
  'branding': { icon: <PaletteIcon />, textKey: 'features.branding' },
  'api_access': { icon: <CodeIcon />, textKey: 'features.api_access' },
  'white_label': { icon: <HandshakeIcon />, textKey: 'features.white_label' },
  'priority_support': { icon: <RocketIcon />, textKey: 'features.priority_support' },
});

const getLimitationMap = (): Record<string, { icon: React.ReactNode; textKey: string }> => ({
  'no_crm': { icon: <XCircleIcon />, textKey: 'limitations.no_crm' },
  'no_custom_domain': { icon: <XCircleIcon />, textKey: 'limitations.no_custom_domain' },
  'no_branding': { icon: <XCircleIcon />, textKey: 'limitations.no_branding' },
  'no_team': { icon: <XCircleIcon />, textKey: 'limitations.no_team' },
});

export default function PricingPage() {
  const { projectSubscriptions, loading, plansLoading, plans: plansData, requestInvoice } = useSubscription();
  const [selectedDuration, setSelectedDuration] = useState<number>(1);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedProjectForInvoice, setSelectedProjectForInvoice] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { language, t } = useLanguage();

  useEffect(() => {
    if (projectSubscriptions && projectSubscriptions.length === 1 && projectSubscriptions[0]) {
      setSelectedProjectForInvoice(projectSubscriptions[0].id);
    }
  }, [projectSubscriptions]);

  const getDurationLabel = (months: number) => {
    const key = `pricing.duration.${months}`;
    if (t(key) !== key) {
      return t(key);
    }
    return `${months} ${t('pricing.duration.months')}`;
  };

  const handlePlanSelect = (planId: string, durationMonths: number) => {
    if (!projectSubscriptions || projectSubscriptions.length === 0) {
      // Redirect to auth if not authenticated
      window.location.href = `/${language}/auth`;
      return;
    }

    setSelectedPlanId(planId);
    setSelectedDuration(durationMonths);

    if (projectSubscriptions.length === 1 && projectSubscriptions[0]) {
      setSelectedProjectForInvoice(projectSubscriptions[0].id);
    }

    setIsInvoiceDialogOpen(true);
  };

  const handleRequestInvoice = async () => {
    if (!selectedProjectForInvoice || !selectedPlanId) {
      toast.error(t('pricing.toast.selectProjectAndPlan'));
      return;
    }

    setIsProcessing(true);
    try {
      await requestInvoice(selectedProjectForInvoice, selectedPlanId, selectedDuration);
      toast.success(t('pricing.toast.invoiceRequestSuccess'));
      setIsInvoiceDialogOpen(false);
    } catch (error) {
      console.error('Error requesting invoice:', error);
      toast.error(t('pricing.toast.invoiceRequestError'));
    } finally {
      setIsProcessing(false);
    }
  };

  const convertPlanToCardProps = (plan: SubscriptionPlan, durationMonths: number): PricingCardProps | null => {
    const selectedPricing = plan.pricing.find(p => p.durationMonths === durationMonths);
    if (!selectedPricing) return null;

    const featureMap = getFeatureMap();
    const limitationMap = getLimitationMap();
    const features: { icon: React.ReactNode; text: string }[] = [];
    const limitations: { icon: React.ReactNode; text: string }[] = [];

    // Process features from database
    if (Array.isArray(plan.features)) {
      plan.features.forEach((feature: string) => {
        const mapped = featureMap[feature];
        if (mapped) {
          features.push({ icon: mapped.icon, text: t(`pricing.${mapped.textKey}`) });
        } else {
          // Fallback for unmapped features
          features.push({ icon: <CheckIcon className="text-blue-600" />, text: feature });
        }
      });
    }

    // Add limitations based on plan slug
    if (plan.slug === 'basic') {
      const noCrm = limitationMap['no_crm'];
      const noCustomDomain = limitationMap['no_custom_domain'];
      const noBranding = limitationMap['no_branding'];
      const noTeam = limitationMap['no_team'];

      if (noCrm) limitations.push({ icon: noCrm.icon, text: t(`pricing.${noCrm.textKey}`) });
      if (noCustomDomain) limitations.push({ icon: noCustomDomain.icon, text: t(`pricing.${noCustomDomain.textKey}`) });
      if (noBranding) limitations.push({ icon: noBranding.icon, text: t(`pricing.${noBranding.textKey}`) });
      if (noTeam) limitations.push({ icon: noTeam.icon, text: t(`pricing.${noTeam.textKey}`) });
    }

    // For Pro plan, add "Все из BASIC" at the beginning if it's not already there
    if (plan.slug === 'pro' && features.length > 0 && features[0] && !features[0].text.includes(t('pricing.allFromBasic'))) {
      features.unshift({ icon: <CheckIcon className="text-blue-600" />, text: t('pricing.allFromBasic') });
    }

    const price = `$${selectedPricing.monthlyPrice.toFixed(0)}`;
    const pricePeriod = t('pricing.pricePeriod');
    const isFeatured = plan.slug === 'pro';

    let suitability = '';
    if (plan.slug === 'basic') {
      suitability = t('pricing.suitability.basic');
    } else if (plan.slug === 'pro') {
      suitability = t('pricing.suitability.pro');
    }

    const ctaText = isFeatured ? t('pricing.cta.pro') : t('pricing.cta.basic');

    return {
      title: plan.name.toUpperCase(),
      price,
      pricePeriod,
      description: plan.description || '',
      features,
      limitations,
      suitability,
      ctaText,
      isFeatured,
      onClick: () => handlePlanSelect(plan.id, durationMonths),
      disabled: false,
      includedLabel: t('pricing.included'),
      limitationsLabel: t('pricing.limitationsLabel'),
    };
  };

  if (loading || plansLoading) {
    return (
      <div className="antialiased bg-white text-gray-900 font-sans min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!plansData || plansData.length === 0) {
    return (
      <div className="antialiased bg-white text-gray-900 font-sans min-h-screen flex items-center justify-center">
        <p className="text-gray-600">{t('pricing.loadingError')}</p>
      </div>
    );
  }

  // Get available durations from the first plan
  const availableDurations = plansData[0]?.pricing || [];
  const basicPlan = plansData.find(p => p.slug === 'basic');
  const proPlan = plansData.find(p => p.slug === 'pro');

  const basicCardProps = basicPlan ? convertPlanToCardProps(basicPlan, selectedDuration) : null;
  const proCardProps = proPlan ? convertPlanToCardProps(proPlan, selectedDuration) : null;

  // Get discount information for InfoCard
  const discountInfo = availableDurations
    .filter(p => p.durationMonths > 1)
    .map(p => ({
      months: p.durationMonths,
      discount: p.discountPercentage,
      label: getDurationLabel(p.durationMonths),
    }))
    .sort((a, b) => a.months - b.months);

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroHeader />



      <main className="container mx-auto py-20 md:py-32">
        {/* Header */}
        <header className="text-center mb-12 md:mb-20">

          <h1 className="relative z-10 inline-block animate-appear bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-4xl font-semibold leading-tight text-transparent drop-shadow-2xl sm:text-6xl sm:leading-tight md:text-7xl">
          {t('pricing.title')}
        </h1>

          {/* Description */}
          <p className="text-md relative z-10  animate-appear font-medium text-muted-foreground opacity-0 delay-100 sm:text-xl">
          {t('pricing.subtitle')}
        </p>
        </header>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {basicCardProps && <PricingCard {...basicCardProps} />}
          {proCardProps && <PricingCard {...proCardProps} />}
      </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <InfoCard icon={<PiggyBankIcon />} title={t('pricing.infoCards.discounts.title')}>
            <p className="font-semibold text-gray-800">{t('pricing.infoCards.discounts.description')}</p>
            <div className="grid grid-cols-[auto_1fr] items-center gap-2">
              {discountInfo.map((info) => (
                <React.Fragment key={info.months}>
                  <span className="text-blue-600 font-mono text-sm">{info.discount}%</span> {info.label}
                </React.Fragment>
              ))}
            </div>
            <p className="text-sm mt-2">{t('pricing.infoCards.discounts.paymentNote')}</p>
          </InfoCard>

          <InfoCard icon={<GiftIcon />} title={t('pricing.infoCards.trial.title')}>
            <ul className="list-inside space-y-2">
              <li className="flex items-center gap-3"><ClockIcon /> {t('pricing.infoCards.trial.item1')}</li>
              <li className="flex items-center gap-3"><CreditCardIcon /> {t('pricing.infoCards.trial.item2')}</li>
              <li className="flex items-center gap-3"><SparklesIcon /> {t('pricing.infoCards.trial.item3')}</li>
            </ul>
          </InfoCard>

          <InfoCard icon={<CreditCardIcon />} title={t('pricing.infoCards.payment.title')}>
            <ul className="list-inside space-y-2">
              <li className="flex items-center gap-3"><CreditCardIcon /> {t('pricing.infoCards.payment.item1')}</li>
              <li className="flex items-center gap-3"><BriefcaseIcon /> {t('pricing.infoCards.payment.item2')}</li>
              <li className="flex items-center gap-3"><LockIcon /> {t('pricing.infoCards.payment.item3')}</li>
            </ul>
          </InfoCard>
      </div>
      </main>

      <Footer />

      {/* Invoice Request Dialog */}
      <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent className="bg-white border-gray-200 text-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-900">{t('pricing.dialog.title')}</DialogTitle>
            <DialogDescription className="text-gray-600">
              {t('pricing.dialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!selectedProjectForInvoice && projectSubscriptions && projectSubscriptions.length > 1 && (
              <div>
                <Label className="text-gray-700">{t('pricing.dialog.selectProject')}</Label>
                <Select value={selectedProjectForInvoice} onValueChange={setSelectedProjectForInvoice}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder={t('pricing.dialog.selectProjectPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {projectSubscriptions.map((project) => (
                      <SelectItem key={project.id} value={project.id} className="text-gray-900">
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(selectedProjectForInvoice || (projectSubscriptions && projectSubscriptions.length === 1)) && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">
                  {t('pricing.dialog.selectedProject')} {projectSubscriptions?.find(p => p.id === selectedProjectForInvoice)?.name || t('pricing.dialog.selectedProjectDefault')}
                </p>
              </div>
            )}

            <Button
              onClick={handleRequestInvoice}
              disabled={isProcessing || !selectedProjectForInvoice || !selectedPlanId}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isProcessing && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />}
              {t('pricing.dialog.requestButton')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

