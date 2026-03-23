import React from "react";
import { ArrowLeft, X, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gridix/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCheckoutFlow } from "../model/useCheckoutFlow";
import { CheckoutModalProps } from "../model/types";
import { CheckoutStepSelectProjects } from "./CheckoutStepSelectProjects";
import { CheckoutStepPayerInfo } from "./CheckoutStepPayerInfo";
import { CheckoutStepPaymentMethod } from "./CheckoutStepPaymentMethod";

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  projects,
  initialSelectedProjectIds,
  plans,
  selectedPlanId,
  selectedDuration,
  planChangeProjectId,
  billingDetails,
  onPlanChange,
  onDurationChange,
  onConfirm,
}) => {
  const { t } = useLanguage();
  const {
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
  } = useCheckoutFlow({
    isOpen,
    initialSelectedProjectIds,
    billingDetails,
    plans,
    selectedPlanId,
    selectedDuration,
    planChangeProjectId,
    onConfirm,
  });

  if (!isOpen) return null;

  const durationOptions = [
    { value: 1, label: t("admin.subscriptionPage.durations.1") },
    { value: 3, label: t("admin.subscriptionPage.durations.3") },
    { value: 6, label: t("admin.subscriptionPage.durations.6") },
    { value: 12, label: t("admin.subscriptionPage.durations.12") },
    { value: 24, label: t("admin.subscriptionPage.durations.24") },
    { value: 36, label: t("admin.subscriptionPage.durations.36") },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm duration-200 animate-in fade-in">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6">
          <div className="flex items-center gap-4">
            {step !== "select_projects" && (
              <button
                onClick={handleBack}
                className="rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-200"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div className="flex items-center gap-5">
              <h2 className="text-xl font-bold text-slate-900">
                {t("admin.subscriptionPage.checkout.title")}
              </h2>
              {currentPricing && (
                <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-2 py-1">
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                    {t("admin.subscriptionPage.checkout.summary.period")}
                  </span>
                  <Select
                    value={String(selectedDuration)}
                    onValueChange={(val) => onDurationChange(Number(val))}
                  >
                    <SelectTrigger className="h-8 w-[min(11rem,100%)] min-w-[7.5rem] bg-white px-2 text-xs font-semibold">
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
                  <span className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-blue-700">
                    <span>
                      {t("admin.subscriptionPage.checkout.summary.totalToPay")}
                    </span>
                    <span className="font-bold text-blue-900">
                      ${finalTotal}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 transition-colors hover:text-slate-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto p-6 md:p-8">
          {step === "select_projects" && (
            <CheckoutStepSelectProjects
              plans={plans}
              selectedPlanId={selectedPlanId}
              selectedDuration={selectedDuration}
              planChangeProjectId={planChangeProjectId}
              onPlanChange={onPlanChange}
              projects={projects}
              selectedProjectIds={selectedProjectIds}
              currentPricing={currentPricing}
              onToggleProject={toggleProject}
            />
          )}

          {step === "payer_info" && (
            <CheckoutStepPayerInfo
              payerType={payerType}
              setPayerType={setPayerType}
              formData={formData}
              errors={errors}
              onInputChange={handleInputChange}
            />
          )}

          {step === "payment_method" && (
            <CheckoutStepPaymentMethod
              finalTotal={finalTotal}
              currentPlan={currentPlan}
              currentPricing={currentPricing}
              selectedProjectIds={selectedProjectIds}
              payerType={payerType}
              formData={formData}
              isLoading={isLoading}
              onConfirm={handleConfirm}
            />
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50/50 p-6">
          {step !== "payment_method" ? (
            <>
              <div className="text-sm text-slate-500">
                {t("admin.subscriptionPage.checkout.footer.total")}{" "}
                <span className="font-bold text-slate-900">${finalTotal}</span>
              </div>
              <button
                onClick={handleNext}
                className="rounded-lg bg-slate-900 px-8 py-3 font-bold text-white shadow-sm transition-colors hover:bg-slate-800"
              >
                {t("admin.subscriptionPage.checkout.footer.next")}
              </button>
            </>
          ) : (
            <div className="flex w-full justify-center">
              {isLoading && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Loader2 size={20} className="animate-spin" />{" "}
                  {t("admin.subscriptionPage.checkout.footer.processing")}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
