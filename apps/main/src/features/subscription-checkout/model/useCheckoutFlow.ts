import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  BillingDetails,
  BillingPayerType,
  SubscriptionPlan,
} from "@/entities/subscription/queries/useSubscription";
import { BillingErrors, CheckoutStep } from "./types";

interface UseCheckoutFlowParams {
  isOpen: boolean;
  initialSelectedProjectIds: string[];
  billingDetails: BillingDetails | null;
  plans: SubscriptionPlan[];
  selectedPlanId: string;
  selectedDuration: number;
  onConfirm: (payer: BillingDetails, projectIds: string[]) => Promise<void>;
}

export const useCheckoutFlow = ({
  isOpen,
  initialSelectedProjectIds,
  billingDetails,
  plans,
  selectedPlanId,
  selectedDuration,
  onConfirm,
}: UseCheckoutFlowParams) => {
  const { t } = useLanguage();
  const [step, setStep] = useState<CheckoutStep>("select_projects");
  const [payerType, setPayerType] = useState<BillingPayerType>("company");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(
    initialSelectedProjectIds,
  );
  const [formData, setFormData] = useState<BillingDetails>({
    type: "company",
    name: "",
    email: "",
    phone: "",
    companyName: "",
    taxId: "",
    address: "",
  });
  const [errors, setErrors] = useState<BillingErrors>({});

  useEffect(() => {
    if (isOpen && initialSelectedProjectIds.length > 0) {
      setSelectedProjectIds(initialSelectedProjectIds);
    }
  }, [isOpen, initialSelectedProjectIds]);

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

  const currentPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];
  const currentPricing =
    currentPlan?.pricing?.find((p) => p.durationMonths === selectedDuration) ||
    currentPlan?.pricing?.[0];
  const baseTotal = currentPricing ? currentPricing.totalPrice : 0;
  const finalTotal = baseTotal * selectedProjectIds.length;

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
    const newErrors: BillingErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t("admin.subscriptionPage.checkout.errors.enterName");
    }

    if (!formData.email.trim()) {
      newErrors.email = t("admin.subscriptionPage.checkout.errors.enterEmail");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t(
        "admin.subscriptionPage.checkout.errors.invalidEmail",
      );
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t("admin.subscriptionPage.checkout.errors.enterPhone");
    } else if (formData.phone.length < 6) {
      newErrors.phone = t("admin.subscriptionPage.checkout.errors.shortPhone");
    }

    if (payerType === "company" && !formData.companyName?.trim()) {
      newErrors.companyName = t(
        "admin.subscriptionPage.checkout.errors.enterCompanyName",
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === "select_projects") {
      if (selectedProjectIds.length === 0) {
        alert(
          t("admin.subscriptionPage.checkout.errors.selectAtLeastOneProject"),
        );
        return;
      }
      setStep("payer_info");
      return;
    }

    if (step === "payer_info" && validateForm()) {
      setStep("payment_method");
    }
  };

  const handleBack = () => {
    if (step === "payment_method") {
      setStep("payer_info");
    } else if (step === "payer_info") {
      setStep("select_projects");
    }
  };

  const handleConfirm = async () => {
    if (!currentPlan) {
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(
        {
          ...formData,
          type: payerType,
        },
        selectedProjectIds,
      );
      setStep("select_projects");
      setSelectedProjectIds([]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    step,
    payerType,
    setPayerType,
    isLoading,
    selectedProjectIds,
    formData,
    errors,
    currentPlan,
    currentPricing,
    finalTotal,
    handleInputChange,
    toggleProject,
    handleNext,
    handleBack,
    handleConfirm,
  };
};
