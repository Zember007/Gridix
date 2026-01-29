import React, { useEffect, useState } from 'react';
import {
  Crown,
  CheckCircle2,
  ArrowLeft,
  X,
  User,
  Building,
  CreditCard,
  FileText as FileTextIcon,
  Download,
  Loader2,
  Briefcase,
} from 'lucide-react';
import {
  ProjectSubscription,
  SubscriptionPlan,
  BillingDetails,
  BillingPayerType,
} from '@/entities/subscription/queries/useSubscription';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gridix/ui";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectSubscription[];
  initialSelectedProjectIds: string[];
  plans: SubscriptionPlan[];
  selectedPlanId: string;
  selectedDuration: number;
  billingDetails: BillingDetails | null;
  onPlanChange: (planId: string) => void;
  onDurationChange: (duration: number) => void;
  onConfirm: (payer: BillingDetails, projectIds: string[]) => Promise<void>;
}

type CheckoutStep = 'select_projects' | 'payer_info' | 'payment_method';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  projects,
  initialSelectedProjectIds,
  plans,
  selectedPlanId,
  selectedDuration,
  billingDetails,
  onPlanChange,
  onDurationChange,
  onConfirm,
}) => {
  const { t } = useLanguage();
  const [step, setStep] = useState<CheckoutStep>('select_projects');
  const [payerType, setPayerType] = useState<BillingPayerType>('company');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(initialSelectedProjectIds);

  const [formData, setFormData] = useState<BillingDetails>({
    type: 'company',
    name: '',
    email: '',
    phone: '',
    companyName: '',
    taxId: '',
    address: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof BillingDetails, string>>>({});

  // Sync selected projects from parent when modal opens
  useEffect(() => {
    if (isOpen && initialSelectedProjectIds.length > 0) {
      setSelectedProjectIds(initialSelectedProjectIds);
    }
  }, [isOpen, initialSelectedProjectIds]);

  // Prefill from billingDetails when available
  useEffect(() => {
    if (isOpen && billingDetails) {
      setFormData((prev) => ({
        ...prev,
        type: billingDetails.type,
        name: billingDetails.name || prev.name,
        email: billingDetails.email || prev.email,
        phone: billingDetails.phone || prev.phone,
        companyName: billingDetails.companyName || prev.companyName,
        taxId: billingDetails.taxId || prev.taxId,
        address: billingDetails.address || prev.address,
      }));
      setPayerType(billingDetails.type);
    }
  }, [isOpen, billingDetails]);

  if (!isOpen) return null;

  const currentPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];
  const currentPricing =
    currentPlan?.pricing?.find((p) => p.durationMonths === selectedDuration) ||
    currentPlan?.pricing?.[0];
  const baseTotal = currentPricing ? currentPricing.totalPrice : 0;
  const finalTotal = baseTotal * selectedProjectIds.length;
  const durationOptions = [
    { value: 1, label: t('admin.subscriptionPage.durations.1') },
    { value: 3, label: t('admin.subscriptionPage.durations.3') },
    { value: 6, label: t('admin.subscriptionPage.durations.6') },
    { value: 12, label: t('admin.subscriptionPage.durations.12') },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof BillingDetails]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const toggleProject = (id: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    );
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof BillingDetails, string>> = {};

    if (!formData.name.trim()) newErrors.name = t('admin.subscriptionPage.checkout.errors.enterName');

    if (!formData.email.trim()) {
      newErrors.email = t('admin.subscriptionPage.checkout.errors.enterEmail');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('admin.subscriptionPage.checkout.errors.invalidEmail');
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t('admin.subscriptionPage.checkout.errors.enterPhone');
    } else if (formData.phone.length < 6) {
      newErrors.phone = t('admin.subscriptionPage.checkout.errors.shortPhone');
    }

    if (payerType === 'company') {
      if (!formData.companyName?.trim()) {
        newErrors.companyName = t('admin.subscriptionPage.checkout.errors.enterCompanyName');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 'select_projects') {
      if (selectedProjectIds.length === 0) {
        alert(t('admin.subscriptionPage.checkout.errors.selectAtLeastOneProject'));
        return;
      }
      setStep('payer_info');
      return;
    }

    if (step === 'payer_info') {
      if (validateForm()) {
        setStep('payment_method');
      }
    }
  };

  const handleBack = () => {
    if (step === 'payment_method') setStep('payer_info');
    else if (step === 'payer_info') setStep('select_projects');
  };

  const handleConfirm = async () => {
    if (!currentPlan) return;
    setIsLoading(true);
    try {
      await onConfirm(
        {
          ...formData,
          type: payerType,
        },
        selectedProjectIds,
      );
      setStep('select_projects');
      setSelectedProjectIds([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-4">
            {step !== 'select_projects' && (
              <button
                onClick={handleBack}
                className="p-1 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {t('admin.subscriptionPage.checkout.title')}
              </h2>
              {currentPricing && (
                <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                  <span>{t('admin.subscriptionPage.checkout.summary.totalToPay')}</span>
                  <Select
                    value={String(selectedDuration)}
                    onValueChange={(val) => onDurationChange(Number(val))}
                  >
                    <SelectTrigger className="h-7 px-2 py-1 text-xs font-medium w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map((opt) => (
                        <SelectItem key={opt.value} value={String(opt.value)}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {/* STEP 1: SELECT PROJECTS */}
          {step === 'select_projects' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              {/* Plan Selector */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-3">
                  {t('admin.subscriptionPage.checkout.selectPlan')}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {plans.map((p) => {
                    const isSelected = p.id === selectedPlanId;
                    const planPricing =
                      p.pricing?.find((pr) => pr.durationMonths === selectedDuration) ||
                      p.pricing?.[0];
                    return (
                      <button
                        key={p.id}
                        onClick={() => onPlanChange(p.id)}
                        className={`relative p-4 border rounded-xl text-left transition-all group ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div
                            className={`font-bold uppercase text-sm ${
                              isSelected ? 'text-blue-700' : 'text-slate-800'
                            }`}
                          >
                            {p.name}
                          </div>
                          {p.slug === 'pro' && (
                            <Crown size={16} className="text-amber-400 fill-amber-400" />
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          <span className="font-bold text-base text-slate-900">
                            ${planPricing?.monthlyPrice || p.base_price}
                          </span>{' '}
                          / мес
                        </div>
                        {isSelected && (
                          <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1">
                            <CheckCircle2 size={12} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Project Selector */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-900">
                    {t('admin.subscriptionPage.checkout.selectProjects')}
                  </h4>
                  <span className="text-xs text-slate-500">
                    {t('admin.subscriptionPage.checkout.projectsSelected', {
                      count: selectedProjectIds.length,
                    })}
                  </span>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start gap-3 mb-3">
                  <Briefcase size={18} className="text-blue-600 mt-0.5" />
                  <p className="text-xs text-blue-700 leading-relaxed">
                    {t('admin.subscriptionPage.checkout.projectsHint')}
                  </p>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => toggleProject(project.id)}
                      className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${
                        selectedProjectIds.includes(project.id)
                          ? 'border-blue-500 bg-blue-50/30'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                            selectedProjectIds.includes(project.id)
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {selectedProjectIds.includes(project.id) && (
                            <CheckCircle2 size={14} className="text-white" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{project.name}</div>
                          <div className="text-xs text-slate-500">
                            {project.user_profiles?.company_name ||
                              project.user_profiles?.full_name ||
                              project.user_profiles?.email ||
                              project.user_id.substring(0, 8)}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {currentPricing ? `$${currentPricing.totalPrice}` : '—'}
                      </div>
                    </div>
                  ))}
                  {projects.length === 0 && (
                    <div className="text-center text-slate-500 py-8">
                      {t('admin.subscriptionPage.checkout.noProjects')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PAYER INFO */}
          {step === 'payer_info' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-4 p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setPayerType('individual')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
                    payerType === 'individual'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <User size={18} /> {t('admin.subscriptionPage.checkout.payerType.individual')}
                </button>
                <button
                  onClick={() => setPayerType('company')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
                    payerType === 'company'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Building size={18} /> {t('admin.subscriptionPage.checkout.payerType.company')}
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      {t('admin.subscriptionPage.checkout.fields.contactName')}{' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-1 transition-all ${
                        errors.name
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                          : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'
                      }`}
                      placeholder={t(
                        'admin.subscriptionPage.checkout.placeholders.contactName',
                      )}
                    />
                    {errors.name && (
                      <span className="text-xs text-red-500 font-medium">{errors.name}</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      {t('admin.subscriptionPage.checkout.fields.email')}{' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-1 transition-all ${
                        errors.email
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                          : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'
                      }`}
                      placeholder={t('admin.subscriptionPage.checkout.placeholders.email')}
                    />
                    {errors.email && (
                      <span className="text-xs text-red-500 font-medium">{errors.email}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    {t('admin.subscriptionPage.checkout.fields.phone')}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-1 transition-all ${
                      errors.phone
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                    placeholder={t('admin.subscriptionPage.checkout.placeholders.phone')}
                  />
                  {errors.phone && (
                    <span className="text-xs text-red-500 font-medium">{errors.phone}</span>
                  )}
                </div>

                {payerType === 'company' && (
                  <div className="pt-4 border-t border-slate-100 space-y-4 animate-in fade-in">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">
                      {t('admin.subscriptionPage.checkout.fields.companyName')}{' '}
                      <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-1 transition-all ${
                          errors.companyName
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                            : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'
                        }`}
                        placeholder={t(
                          'admin.subscriptionPage.checkout.placeholders.companyName',
                        )}
                      />
                      {errors.companyName && (
                        <span className="text-xs text-red-500 font-medium">
                          {errors.companyName}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">
                          {t('admin.subscriptionPage.checkout.fields.taxId')}
                        </label>
                        <input
                          type="text"
                          name="taxId"
                          value={formData.taxId || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">
                          {t('admin.subscriptionPage.checkout.fields.address')}
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT METHOD */}
          {step === 'payment_method' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-500"></div>
                <div className="flex justify-between items-start mb-4 border-b border-slate-200 pb-4">
                  <div>
                    <div className="text-xs text-slate-500 uppercase font-bold">
                      {t('admin.subscriptionPage.checkout.summary.totalToPay')}
                    </div>
                    <div className="text-3xl font-bold text-slate-900">${finalTotal}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">
                      {t('admin.subscriptionPage.checkout.summary.plan')}
                    </div>
                    <div className="text-sm font-bold text-slate-800 uppercase">
                      {currentPlan?.name}
                    </div>
                    {currentPricing && (
                      <div className="text-xs text-slate-500">
                        {currentPricing.durationMonths} месяцев
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span>{t('admin.subscriptionPage.checkout.summary.projects')}</span>
                    <span className="font-medium text-slate-900">
                      {selectedProjectIds.length} шт.
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('admin.subscriptionPage.checkout.summary.payer')}</span>
                    <span className="font-medium text-slate-900">
                      {payerType === 'company'
                        ? formData.companyName || formData.name
                        : formData.name}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => {}}
                  disabled={true}
                  className="group relative flex items-center justify-between p-5 border border-slate-200 rounded-xl bg-white opacity-60 cursor-not-allowed"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                      <CreditCard size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">
                        {t('admin.subscriptionPage.checkout.methods.card.title')}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {t('admin.subscriptionPage.checkout.methods.card.description')}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold rounded uppercase">
                    {t('admin.subscriptionPage.checkout.methods.card.unavailable')}
                  </span>
                </button>

                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="group relative flex items-center justify-between p-5 border border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all text-left bg-white"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <FileTextIcon size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">
                        {t('admin.subscriptionPage.checkout.methods.invoice.title')}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {t('admin.subscriptionPage.checkout.methods.invoice.description')}
                      </p>
                    </div>
                  </div>
                  <div className="text-slate-300 group-hover:text-blue-500">
                    <Download size={24} />
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
          {step !== 'payment_method' ? (
            <>
              <div className="text-sm text-slate-500">
                {t('admin.subscriptionPage.checkout.footer.total')}{' '}
                <span className="font-bold text-slate-900">${finalTotal}</span>
              </div>
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition-colors shadow-sm"
              >
                {t('admin.subscriptionPage.checkout.footer.next')}
              </button>
            </>
          ) : (
            <div className="w-full flex justify-center">
              {isLoading && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Loader2 size={20} className="animate-spin" />{' '}
                  {t('admin.subscriptionPage.checkout.footer.processing')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

