import React from "react";
import { CreditCard, Download, FileText as FileTextIcon } from "lucide-react";
import {
  BillingDetails,
  BillingPayerType,
  SubscriptionPlan,
} from "@/entities/subscription/queries/useSubscription";
import { useLanguage } from "@/contexts/LanguageContext";
import { CheckoutPaymentMethod } from "../model/types";

type Props = {
  finalTotal: number;
  currentPlan?: SubscriptionPlan;
  currentPricing?: SubscriptionPlan["pricing"][number];
  selectedProjectIds: string[];
  payerType: BillingPayerType;
  formData: BillingDetails;
  isLoading: boolean;
  onConfirm: (method: CheckoutPaymentMethod) => void;
};

export const CheckoutStepPaymentMethod: React.FC<Props> = ({
  finalTotal,
  currentPlan,
  currentPricing,
  selectedProjectIds,
  payerType,
  formData,
  isLoading,
  onConfirm,
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 duration-300 animate-in slide-in-from-right-4">
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-5">
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-blue-400 to-purple-500"></div>
        <div className="mb-4 flex items-start justify-between border-b border-slate-200 pb-4">
          <div>
            <div className="text-xs font-bold uppercase text-slate-500">
              {t("admin.subscriptionPage.checkout.summary.totalToPay")}
            </div>
            <div className="text-3xl font-bold text-slate-900">
              ${finalTotal}
            </div>
          </div>
          <div className="text-right">
            <div className="mb-1 text-xs font-bold uppercase text-slate-500">
              {t("admin.subscriptionPage.checkout.summary.plan")}
            </div>
            <div className="text-sm font-bold uppercase text-slate-800">
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
            <span>{t("admin.subscriptionPage.checkout.summary.projects")}</span>
            <span className="font-medium text-slate-900">
              {selectedProjectIds.length} шт.
            </span>
          </div>
          <div className="flex justify-between">
            <span>{t("admin.subscriptionPage.checkout.summary.payer")}</span>
            <span className="font-medium text-slate-900">
              {payerType === "company"
                ? formData.companyName || formData.name
                : formData.name}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <button
          type="button"
          onClick={() => onConfirm("card")}
          disabled={isLoading}
          className={`group relative flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-blue-500 hover:shadow-md ${
            isLoading ? "cursor-not-allowed opacity-60" : ""
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <CreditCard size={24} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">
                {t("admin.subscriptionPage.checkout.methods.card.title")}
              </h4>
              <p className="text-xs text-slate-500">
                {t("admin.subscriptionPage.checkout.methods.card.description")}
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onConfirm("invoice")}
          disabled={isLoading}
          className="group relative flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-blue-500 hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
              <FileTextIcon size={24} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">
                {t("admin.subscriptionPage.checkout.methods.invoice.title")}
              </h4>
              <p className="text-xs text-slate-500">
                {t(
                  "admin.subscriptionPage.checkout.methods.invoice.description",
                )}
              </p>
            </div>
          </div>
          <div className="text-slate-300 group-hover:text-blue-500">
            <Download size={24} />
          </div>
        </button>
      </div>
    </div>
  );
};
