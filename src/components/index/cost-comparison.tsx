import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface CostComparisonProps {
  onGoToAdmin: () => void;
}

export const CostComparison = ({ onGoToAdmin }: CostComparisonProps) => {
  const { t } = useLanguage();
  
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 dark:text-white mb-6">{t('landing.costComparison.title')}</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed ">
              {t('landing.costComparison.description')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Разработка с нуля */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border-2 border-gray-200 dark:border-gray-700">
              <div className="text-center mb-6">
                <div className="inline-block px-4 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full text-sm font-semibold mb-4">
                  {t('landing.costComparison.customDevelopment.label')}
                </div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{t('landing.costComparison.customDevelopment.price')}</div>
                <p className="text-gray-500 dark:text-gray-400">{t('landing.costComparison.customDevelopment.priceNote')}</p>
              </div>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 ">•</span>
                  <span>{t('landing.costComparison.customDevelopment.item1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 ">•</span>
                  <span>{t('landing.costComparison.customDevelopment.item2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 ">•</span>
                  <span>{t('landing.costComparison.customDevelopment.item3')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 ">•</span>
                  <span>{t('landing.costComparison.customDevelopment.item4')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 ">•</span>
                  <span>{t('landing.costComparison.customDevelopment.item5')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 ">•</span>
                  <span>{t('landing.costComparison.customDevelopment.item6')}</span>
                </li>
              </ul>
            </div>

            {/* GRIDIX */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -6"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
              <div className="relative z-10">
                <div className="text-center mb-6">
                  <div className="inline-block px-4 py-2 bg-white bg-opacity-20 rounded-full text-sm font-semibold mb-4">
                    <span className="text-green-400 ">✓</span> {t('landing.costComparison.gridix.label')}
                  </div>
                  <div className="text-4xl font-bold mb-2">{t('landing.costComparison.gridix.price')}</div>
                  <p className="text-blue-100">{t('landing.costComparison.gridix.priceNote')}</p>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-green-300 ">✓</span>
                    <span>{t('landing.costComparison.gridix.item1')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-300 ">✓</span>
                    <span>{t('landing.costComparison.gridix.item2')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-300 ">✓</span>
                    <span>{t('landing.costComparison.gridix.item3')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-300 ">✓</span>
                    <span>{t('landing.costComparison.gridix.item4')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-300 ">✓</span>
                    <span>{t('landing.costComparison.gridix.item5')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-300 ">✓</span>
                    <span>{t('landing.costComparison.gridix.item6')}</span>
                  </li>
                </ul>
                <div className="mt-8 text-center">
                  <Button
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-4 font-bold shadow-lg"
                    onClick={onGoToAdmin}
                  >
                    {t('landing.costComparison.gridix.tryFree')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};



