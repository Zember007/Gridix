import React, { useState } from "react";
import {
  X,
  CreditCard,
  Plus,
  HelpCircle,
  Edit2,
  ArrowLeft,
  User,
  Building2,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { useLanguage } from "@gridix/utils/react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type ViewState = "topup" | "add_requisites";
type PersonType = "individual" | "legal";

export const PartnerTopUpModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [view, setView] = useState<ViewState>("topup");
  const [amount, setAmount] = useState("");

  // Requisites Form State
  const [personType, setPersonType] = useState<PersonType>("individual");
  const [hasNoVat, setHasNoVat] = useState(false);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  const vat = 0;
  const total = numAmount + vat;

  const handleClose = () => {
    setView("topup");
    onClose();
  };

  // --- VIEW: Add Requisites ---
  if (view === "add_requisites") {
    return (
      <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm duration-200">
        <div className="flex max-h-[90vh] w-full max-w-lg scale-100 transform flex-col overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
          {/* Header */}
          <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-gray-100 bg-white p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView("topup")}
                className="rounded-full p-1 transition-colors hover:bg-gray-100"
              >
                <ArrowLeft size={20} className="text-gray-500" />
              </button>
              <h3 className="text-lg font-bold text-gray-900">
                {t("partners.topupAddRequisitesTitle")}
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 transition-colors hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          {/* Info Box */}
          <div className="shrink-0 border-b border-blue-100 bg-blue-50 px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex gap-3">
              <HelpCircle
                size={18}
                className="mt-0.5 flex-shrink-0 text-blue-500"
              />
              <p className="text-xs text-blue-700">
                {t("partners.topupAddRequisitesHint")}
              </p>
            </div>
          </div>

          {/* Form Content */}
          <div className="custom-scrollbar space-y-4 overflow-y-auto p-4 sm:space-y-5 sm:p-6">
            {/* Toggle */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPersonType("individual")}
                className={`flex items-center justify-center gap-2 rounded-lg border p-3 transition-all ${
                  personType === "individual"
                    ? "border-green-500 bg-green-50 text-green-700 shadow-sm"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <User size={18} />
                <span className="text-sm font-medium">
                  {t("partners.topupIndividual")}
                </span>
                {personType === "individual" && (
                  <CheckCircle2 size={16} className="ml-1 hidden sm:block" />
                )}
              </button>
              <button
                onClick={() => setPersonType("legal")}
                className={`flex items-center justify-center gap-2 rounded-lg border p-3 transition-all ${
                  personType === "legal"
                    ? "border-green-500 bg-green-50 text-green-700 shadow-sm"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Building2 size={18} />
                <span className="text-sm font-medium">
                  {t("partners.topupLegal")}
                </span>
                {personType === "legal" && (
                  <CheckCircle2 size={16} className="ml-1 hidden sm:block" />
                )}
              </button>
            </div>

            {/* Fields */}
            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder={
                    personType === "individual"
                      ? t("partners.topupNamePlaceholder")
                      : t("partners.topupCompanyPlaceholder")
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm transition-all outline-none placeholder:text-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
              </div>

              {personType === "individual" && (
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t("partners.topupBirthDatePlaceholder")}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm transition-all outline-none placeholder:text-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  />
                  <Calendar
                    size={18}
                    className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400"
                  />
                </div>
              )}

              <div className="relative">
                <select className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 transition-all outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500">
                  <option value="" disabled selected>
                    {t("partners.topupCountry")}
                  </option>
                  <option value="ge">Georgia</option>
                  <option value="ua">Ukraine</option>
                  <option value="kz">Kazakhstan</option>
                  <option value="tr">Turkey</option>
                </select>
                <div className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2">
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                    <path
                      d="M1 1L5 5L9 1"
                      stroke="#9CA3AF"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <input
                  type="text"
                  placeholder={t("partners.topupZip")}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm transition-all outline-none placeholder:text-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 sm:w-1/3"
                />
                <input
                  type="text"
                  placeholder={t("partners.topupCity")}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm transition-all outline-none placeholder:text-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 sm:w-2/3"
                />
              </div>

              <input
                type="text"
                placeholder={t("partners.topupAddress")}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm transition-all outline-none placeholder:text-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />

              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
                <input
                  type="text"
                  placeholder="VAT No."
                  disabled={hasNoVat}
                  className={`w-full rounded-lg border border-gray-200 px-4 py-3 text-sm transition-all outline-none placeholder:text-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 sm:flex-1 ${
                    hasNoVat ? "bg-gray-100 text-gray-400" : "bg-white"
                  }`}
                />
                <label className="flex cursor-pointer items-center gap-2 py-1 select-none sm:py-0">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                      hasNoVat
                        ? "border-green-500 bg-green-500"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {hasNoVat && (
                      <CheckCircle2 size={14} className="text-white" />
                    )}
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={hasNoVat}
                      onChange={() => setHasNoVat(!hasNoVat)}
                    />
                  </div>
                  <span className="text-sm text-gray-700">
                    {t("partners.topupNoVat")}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="mt-auto flex shrink-0 items-center justify-between gap-4 border-t border-gray-100 bg-gray-50 p-4 sm:p-5">
            <button
              onClick={() => setView("topup")}
              className="px-2 py-2 text-xs font-bold tracking-wider text-gray-500 uppercase transition-colors hover:text-gray-700"
            >
              {t("partners.cancel")}
            </button>
            <button
              onClick={() => setView("topup")}
              className="rounded bg-[#4CAF50] px-6 py-3 text-xs font-bold tracking-wide text-white uppercase shadow-md transition-all hover:bg-[#43A047] hover:shadow-lg"
            >
              {t("partners.topupAdd")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW: Main Top Up ---
  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm duration-200">
      <div className="w-full max-w-lg scale-100 transform overflow-hidden rounded-xl bg-white shadow-xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
            {t("partners.topupTitle")}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-5 p-5 sm:space-y-6">
          {/* Requisites */}
          <div>
            <label className="mb-2 block text-xs font-semibold tracking-wider text-gray-400 uppercase">
              {t("partners.topupRequisites")}
            </label>
            <div className="group relative">
              <div className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-800 shadow-sm transition-colors hover:border-gray-300">
                <span className="truncate pr-2 text-sm font-medium">
                  {t("partners.topupRequisitesSample")}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <button className="p-1 text-gray-300 transition-colors hover:text-black">
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => setView("add_requisites")}
                    className="rounded bg-gray-50 p-1 text-gray-300 transition-colors hover:bg-green-50 hover:text-green-600"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div>
            <div className="relative">
              <span className="absolute top-1/2 left-4 -translate-y-1/2 font-medium text-gray-500">
                $
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t("partners.topupAmountPlaceholder")}
                className="w-full rounded-lg border border-gray-200 bg-white py-3 pr-4 pl-8 font-medium shadow-sm transition-all outline-none placeholder:text-gray-400 hover:border-gray-300 focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-3 rounded-lg bg-gray-50/50 px-4 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {t("partners.topupSummaryAmount")}
              </span>
              <span className="font-bold text-gray-900">{numAmount} $</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-gray-600">
                VAT <HelpCircle size={14} className="text-gray-400" />
              </span>
              <span className="font-bold text-gray-900">{vat} $</span>
            </div>
            <div className="mt-1 flex items-center justify-between border-t border-gray-200 pt-3">
              <span className="text-base font-bold text-gray-900">
                {t("partners.topupSummaryTotal")}
              </span>
              <span className="text-xl font-extrabold text-green-600">
                {total} $
              </span>
            </div>
          </div>

          {/* Card Input */}
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-colors hover:border-gray-300">
            <div className="shrink-0 text-gray-400">
              <CreditCard size={24} />
            </div>
            <input
              type="text"
              placeholder={t("partners.topupCardPlaceholder")}
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-gray-800 outline-none placeholder:text-gray-400"
            />
            <div className="hidden shrink-0 items-center gap-2 rounded bg-gray-900 px-3 py-1.5 text-xs font-bold text-white sm:flex">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              LINK
              <div className="mx-1 h-3 w-px bg-gray-600" />
              <span className="font-mono">VISA •• 6465</span>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-between gap-4 border-t border-gray-100 bg-gray-50 p-5">
          <button
            onClick={handleClose}
            className="px-2 py-2 text-xs font-bold tracking-wider text-gray-500 uppercase transition-colors hover:text-gray-700"
          >
            {t("partners.cancel")}
          </button>
          <button className="rounded bg-[#4CAF50] px-8 py-3 text-xs font-bold tracking-wide text-white uppercase shadow-md transition-all hover:bg-[#43A047] hover:shadow-lg">
            {t("partners.topupSubmit")}
          </button>
        </div>
      </div>
    </div>
  );
};
