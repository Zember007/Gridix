import React, { useState } from 'react';
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
} from 'lucide-react';
import { useLanguage } from '@gridix/utils/react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type ViewState = 'topup' | 'add_requisites';
type PersonType = 'individual' | 'legal';

export const PartnerTopUpModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [view, setView] = useState<ViewState>('topup');
  const [amount, setAmount] = useState('');

  // Requisites Form State
  const [personType, setPersonType] = useState<PersonType>('individual');
  const [hasNoVat, setHasNoVat] = useState(false);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  const vat = 0;
  const total = numAmount + vat;

  const handleClose = () => {
    setView('topup');
    onClose();
  };

  // --- VIEW: Add Requisites ---
  if (view === 'add_requisites') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10 shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView('topup')}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-500" />
              </button>
              <h3 className="text-lg font-bold text-gray-900">
                {t('partners.topupAddRequisitesTitle')}
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Info Box */}
          <div className="px-4 py-3 sm:px-6 sm:py-4 bg-blue-50 border-b border-blue-100 shrink-0">
            <div className="flex gap-3">
              <HelpCircle
                size={18}
                className="text-blue-500 flex-shrink-0 mt-0.5"
              />
              <p className="text-xs text-blue-700">
                {t('partners.topupAddRequisitesHint')}
              </p>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-4 sm:space-y-5">
            {/* Toggle */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPersonType('individual')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                  personType === 'individual'
                    ? 'bg-green-50 border-green-500 text-green-700 shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <User size={18} />
                <span className="font-medium text-sm">
                  {t('partners.topupIndividual')}
                </span>
                {personType === 'individual' && (
                  <CheckCircle2
                    size={16}
                    className="ml-1 hidden sm:block"
                  />
                )}
              </button>
              <button
                onClick={() => setPersonType('legal')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                  personType === 'legal'
                    ? 'bg-green-50 border-green-500 text-green-700 shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Building2 size={18} />
                <span className="font-medium text-sm">
                  {t('partners.topupLegal')}
                </span>
                {personType === 'legal' && (
                  <CheckCircle2
                    size={16}
                    className="ml-1 hidden sm:block"
                  />
                )}
              </button>
            </div>

            {/* Fields */}
            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder={
                    personType === 'individual'
                      ? t('partners.topupNamePlaceholder')
                      : t('partners.topupCompanyPlaceholder')
                  }
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder:text-gray-400"
                />
              </div>

              {personType === 'individual' && (
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t('partners.topupBirthDatePlaceholder')}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder:text-gray-400"
                  />
                  <Calendar
                    size={18}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
              )}

              <div className="relative">
                <select className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all text-gray-700 appearance-none">
                  <option value="" disabled selected>
                    {t('partners.topupCountry')}
                  </option>
                  <option value="ge">Georgia</option>
                  <option value="ua">Ukraine</option>
                  <option value="kz">Kazakhstan</option>
                  <option value="tr">Turkey</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    fill="none"
                  >
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

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <input
                  type="text"
                  placeholder={t('partners.topupZip')}
                  className="w-full sm:w-1/3 px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder:text-gray-400"
                />
                <input
                  type="text"
                  placeholder={t('partners.topupCity')}
                  className="w-full sm:w-2/3 px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder:text-gray-400"
                />
              </div>

              <input
                type="text"
                placeholder={t('partners.topupAddress')}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder:text-gray-400"
              />

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <input
                  type="text"
                  placeholder="VAT No."
                  disabled={hasNoVat}
                  className={`w-full sm:flex-1 px-4 py-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder:text-gray-400 ${
                    hasNoVat ? 'bg-gray-100 text-gray-400' : 'bg-white'
                  }`}
                />
                <label className="flex items-center gap-2 cursor-pointer select-none py-1 sm:py-0">
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                      hasNoVat
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300 bg-white'
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
                    {t('partners.topupNoVat')}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-4 mt-auto shrink-0">
            <button
              onClick={() => setView('topup')}
              className="text-gray-500 font-bold text-xs hover:text-gray-700 transition-colors uppercase tracking-wider px-2 py-2"
            >
              {t('partners.cancel')}
            </button>
            <button
              onClick={() => setView('topup')}
              className="bg-[#4CAF50] hover:bg-[#43A047] text-white font-bold text-xs px-6 py-3 rounded shadow-md hover:shadow-lg transition-all uppercase tracking-wide"
            >
              {t('partners.topupAdd')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW: Main Top Up ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl overflow-hidden transform transition-all scale-100">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">
            {t('partners.topupTitle')}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-5 space-y-5 sm:space-y-6">
          {/* Requisites */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {t('partners.topupRequisites')}
            </label>
            <div className="relative group">
              <div className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-800 flex items-center justify-between bg-white cursor-pointer hover:border-gray-300 transition-colors shadow-sm">
                <span className="truncate text-sm font-medium pr-2">
                  {t('partners.topupRequisitesSample')}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button className="text-gray-300 hover:text-black transition-colors p-1">
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => setView('add_requisites')}
                    className="text-gray-300 hover:text-green-600 transition-colors p-1 bg-gray-50 hover:bg-green-50 rounded"
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
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                $
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t('partners.topupAmountPlaceholder')}
                className="w-full bg-white border border-gray-200 rounded-lg pl-8 pr-4 py-3 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder:text-gray-400 font-medium shadow-sm hover:border-gray-300"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-3 py-3 bg-gray-50/50 rounded-lg px-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">
                {t('partners.topupSummaryAmount')}
              </span>
              <span className="font-bold text-gray-900">{numAmount} $</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 flex items-center gap-1">
                VAT <HelpCircle size={14} className="text-gray-400" />
              </span>
              <span className="font-bold text-gray-900">{vat} $</span>
            </div>
            <div className="flex justify-between items-center pt-3 mt-1 border-t border-gray-200">
              <span className="text-base font-bold text-gray-900">
                {t('partners.topupSummaryTotal')}
              </span>
              <span className="text-xl font-extrabold text-green-600">
                {total} $
              </span>
            </div>
          </div>

          {/* Card Input */}
          <div className="border border-gray-200 rounded-lg p-3 flex items-center gap-3 bg-white shadow-sm hover:border-gray-300 transition-colors">
            <div className="text-gray-400 shrink-0">
              <CreditCard size={24} />
            </div>
            <input
              type="text"
              placeholder={t('partners.topupCardPlaceholder')}
              className="flex-1 outline-none text-gray-800 placeholder:text-gray-400 text-sm font-medium bg-transparent min-w-0"
            />
            <div className="hidden sm:flex items-center gap-2 bg-gray-900 text-white px-3 py-1.5 rounded text-xs font-bold shrink-0">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              LINK
              <div className="h-3 w-px bg-gray-600 mx-1" />
              <span className="font-mono">VISA •• 6465</span>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-4">
          <button
            onClick={handleClose}
            className="text-gray-500 font-bold text-xs hover:text-gray-700 transition-colors uppercase tracking-wider px-2 py-2"
          >
            {t('partners.cancel')}
          </button>
          <button className="bg-[#4CAF50] hover:bg-[#43A047] text-white font-bold text-xs px-8 py-3 rounded shadow-md hover:shadow-lg transition-all uppercase tracking-wide">
            {t('partners.topupSubmit')}
          </button>
        </div>
      </div>
    </div>
  );
};



