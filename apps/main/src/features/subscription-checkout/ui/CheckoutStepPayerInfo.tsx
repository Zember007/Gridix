import React from "react";
import { User, Building } from "lucide-react";
import {
  BillingDetails,
  BillingPayerType,
} from "@/entities/subscription/queries/useSubscription";
import { useLanguage } from "@/contexts/LanguageContext";
import { BillingErrors } from "../model/types";

type Props = {
  payerType: BillingPayerType;
  setPayerType: (type: BillingPayerType) => void;
  formData: BillingDetails;
  errors: BillingErrors;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export const CheckoutStepPayerInfo: React.FC<Props> = ({
  payerType,
  setPayerType,
  formData,
  errors,
  onInputChange,
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 duration-300 animate-in slide-in-from-right-4">
      <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-100 p-1">
        <button
          onClick={() => setPayerType("individual")}
          className={`flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold transition-all ${
            payerType === "individual"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <User size={18} />{" "}
          {t("admin.subscriptionPage.checkout.payerType.individual")}
        </button>
        <button
          onClick={() => setPayerType("company")}
          className={`flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold transition-all ${
            payerType === "company"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Building size={18} />{" "}
          {t("admin.subscriptionPage.checkout.payerType.company")}
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">
              {t("admin.subscriptionPage.checkout.fields.contactName")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={onInputChange}
              className={`w-full rounded-lg border bg-white px-4 py-3 transition-all focus:outline-none focus:ring-1 ${
                errors.name
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              }`}
              placeholder={t(
                "admin.subscriptionPage.checkout.placeholders.contactName",
              )}
            />
            {errors.name && (
              <span className="text-xs font-medium text-red-500">
                {errors.name}
              </span>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500">
              {t("admin.subscriptionPage.checkout.fields.email")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={onInputChange}
              className={`w-full rounded-lg border bg-white px-4 py-3 transition-all focus:outline-none focus:ring-1 ${
                errors.email
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : "border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              }`}
              placeholder={t(
                "admin.subscriptionPage.checkout.placeholders.email",
              )}
            />
            {errors.email && (
              <span className="text-xs font-medium text-red-500">
                {errors.email}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold uppercase text-slate-500">
            {t("admin.subscriptionPage.checkout.fields.phone")}{" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={onInputChange}
            className={`w-full rounded-lg border bg-white px-4 py-3 transition-all focus:outline-none focus:ring-1 ${
              errors.phone
                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                : "border-slate-200 focus:border-blue-500 focus:ring-blue-500"
            }`}
            placeholder={t(
              "admin.subscriptionPage.checkout.placeholders.phone",
            )}
          />
          {errors.phone && (
            <span className="text-xs font-medium text-red-500">
              {errors.phone}
            </span>
          )}
        </div>

        {payerType === "company" && (
          <div className="space-y-4 border-t border-slate-100 pt-4 animate-in fade-in">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">
                {t("admin.subscriptionPage.checkout.fields.companyName")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={onInputChange}
                className={`w-full rounded-lg border bg-white px-4 py-3 transition-all focus:outline-none focus:ring-1 ${
                  errors.companyName
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                }`}
                placeholder={t(
                  "admin.subscriptionPage.checkout.placeholders.companyName",
                )}
              />
              {errors.companyName && (
                <span className="text-xs font-medium text-red-500">
                  {errors.companyName}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">
                  {t("admin.subscriptionPage.checkout.fields.taxId")}
                </label>
                <input
                  type="text"
                  name="taxId"
                  value={formData.taxId || ""}
                  onChange={onInputChange}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">
                  {t("admin.subscriptionPage.checkout.fields.address")}
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address || ""}
                  onChange={onInputChange}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
