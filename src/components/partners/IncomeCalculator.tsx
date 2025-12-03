import React, { useState } from 'react';
import { X, Calculator } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const PartnerIncomeCalculator: React.FC<Props> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useLanguage();
  const [projects, setProjects] = useState(5);

  const SUBSCRIPTION_COST = 1815; // Средняя годовая подписка (заглушка по дизайну)
  const COMMISSION_RATE_REFERRAL = 0.2;
  const integratorRate = projects > 10 ? 0.5 : 0.4;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl transform transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 p-2 rounded-lg">
              <Calculator size={24} className="text-gray-700" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              {t('partners.calculatorTitle') || 'Рассчитайте ваш потенциальный доход'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            <p className="text-gray-500 text-sm">
              {t('partners.calculatorSubtitle') || 'Узнайте, сколько вы можете заработать, выбрав количество проектов в год'}
            </p>
          </div>

          {/* Slider Section */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium text-gray-900">
                {t('partners.calculatorProjectsLabel') || 'Количество проектов в год'}
              </span>
              <span className="text-2xl font-bold text-black">{projects}</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={projects}
              onChange={(e) => setProjects(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Partner */}
            <div className="p-6 rounded-xl bg-white border border-gray-200 flex flex-col justify-between h-full hover:border-gray-300 transition-colors">
              <div>
                <div className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                  {t('partners.calculatorBasicTitle') || 'Базовый партнёр'}
                </div>
                <div className="text-xs text-gray-400 mb-4">
                  {t('partners.calculatorBasicRate') || '20% комиссия'}
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {(
                    projects *
                    SUBSCRIPTION_COST *
                    COMMISSION_RATE_REFERRAL
                  ).toLocaleString('en-US')}
                </div>
                <div className="text-xs text-gray-500">
                  {t('partners.calculatorPerYear', { projects: projects.toString() }) || `год / ${projects} проектов`}
                </div>
              </div>
            </div>

            {/* Integrator */}
            <div className="p-6 rounded-xl bg-gray-50 border border-gray-200 flex flex-col justify-between h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold">
                {t('partners.calculatorBadge') || 'ВЫГОДНО'}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900 mb-1 uppercase tracking-wide">
                  {t('partners.calculatorIntegratorTitle') || 'Интегратор'}
                </div>
                <div className="text-xs text-gray-500 mb-4 transition-all duration-300">
                  {integratorRate === 0.5
                    ? (t('partners.calculatorIntegratorRateHigh') || '50% комиссия')
                    : (t('partners.calculatorIntegratorRateLow') || '40% комиссия')}
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-black mb-1 transition-all duration-300">
                  {(
                    projects *
                    SUBSCRIPTION_COST *
                    integratorRate
                  ).toLocaleString('en-US')}
                </div>
                <div className="text-xs text-gray-500">
                  {t('partners.calculatorPerYear', { projects: projects.toString() }) || `год / ${projects} проектов`}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg flex items-start gap-3">
            <div className="text-blue-500 mt-0.5">💡</div>
            <p className="text-xs text-blue-800 leading-relaxed">
              {t('partners.calculatorNote', {
                amount: SUBSCRIPTION_COST.toString(),
              }) || `Все расчёты основаны на средней стоимости годовой подписки Gridix — $${SUBSCRIPTION_COST}. Ваш доход растёт с каждым активным клиентом. Интеграторы самостоятельно принимают оплату от клиентов.`}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-lg transition-colors"
          >
            {t('partners.cancel') || 'Закрыть'}
          </button>
        </div>
      </div>
    </div>
  );
};
