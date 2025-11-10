import { X, Check, Settings, ShoppingCart, BarChart3, UserCheck } from 'lucide-react';
import { Compare } from "@/components/ui/compare";
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';

export const Problems = () => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  return (
    <section id="problems" className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto">
        <div className="text-center mb-16">

          <h2 className="text-4xl md:text-5xl font-light text-gray-900 dark:text-white mb-6">{t('landing.problems.title')}</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {t('landing.problems.description')}
          </p>
        </div>

        {/* Было/Стало Comparison */}
        <div className="flex gap-8 ">


          {typeof isMobile !== 'undefined' &&
            <Compare
              initialSliderPercentage={isMobile ? 15 : 4.5}
              className="w-full h-[700px] md:h-[500px]"
              secondElement={
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border-2 border-red-100 dark:border-red-900 relative h-full w-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                      <X className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="md:text-2xl text-xl font-bold text-gray-900 dark:text-white">{t('landing.problems.before')}</h3>
                  </div>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3">
                      <X className="w-5 h-5 text-red-500 dark:text-red-400" />
                      <span className="text-gray-700 dark:text-gray-300">{t('landing.problems.beforeItems.item1')}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <X className="w-5 h-5 text-red-500 dark:text-red-400" />

                      <span className="text-gray-700 dark:text-gray-300">{t('landing.problems.beforeItems.item2')}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <X className="w-5 h-5 text-red-500 dark:text-red-400" />

                      <span className="text-gray-700 dark:text-gray-300">{t('landing.problems.beforeItems.item3')}</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <X className="w-5 h-5 text-red-500 dark:text-red-400" />

                      <span className="text-gray-700 dark:text-gray-300">{t('landing.problems.beforeItems.item4')}</span>
                    </li>
                  </ul>
                </div>
              }
              firstElement={
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-8 shadow-lg border-2 border-blue-200 dark:border-blue-800 h-full w-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="md:text-2xl text-xl font-bold text-gray-900 dark:text-white">{t('landing.problems.after')}</h3>
                  </div>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <span className="text-green-400 ">✓</span>
                      <span className="text-gray-700 dark:text-gray-300">{t('landing.problems.afterItems.item1')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-400 ">✓</span>
                      <span className="text-gray-700 dark:text-gray-300">{t('landing.problems.afterItems.item2')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-400 ">✓</span>
                      <span className="text-gray-700 dark:text-gray-300">{t('landing.problems.afterItems.item3')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-400 ">✓</span>
                      <span className="text-gray-700 dark:text-gray-300">{t('landing.problems.afterItems.item4')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-400 ">✓</span>
                      <span className="text-gray-700 dark:text-gray-300">{t('landing.problems.afterItems.item5')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-400 ">✓</span>
                      <span className="text-gray-700 dark:text-gray-300">{t('landing.problems.afterItems.item6')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-400 ">✓</span>
                      <span className="text-gray-700 dark:text-gray-300 font-semibold">{t('landing.problems.afterItems.item7')}</span>
                    </li>
                  </ul>
                </div>
              }
            />
          }


        </div>

        {/* Problem Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          {/* Отдел продаж */}
          <div className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-red-500/20">
                <ShoppingCart className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-5 text-gray-900 dark:text-white tracking-tight">{t('landing.problems.departments.sales.title')}</h3>
              <ul className="space-y-3.5">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{t('landing.problems.departments.sales.item1')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{t('landing.problems.departments.sales.item2')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{t('landing.problems.departments.sales.item3')}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Маркетинг */}
          <div className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-5 text-gray-900 dark:text-white tracking-tight">{t('landing.problems.departments.marketing.title')}</h3>
              <ul className="space-y-3.5">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{t('landing.problems.departments.marketing.item1')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{t('landing.problems.departments.marketing.item2')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{t('landing.problems.departments.marketing.item3')}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Управление */}
          <div className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                <Settings className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-5 text-gray-900 dark:text-white tracking-tight">{t('landing.problems.departments.management.title')}</h3>
              <ul className="space-y-3.5">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{t('landing.problems.departments.management.item1')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{t('landing.problems.departments.management.item2')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{t('landing.problems.departments.management.item3')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{t('landing.problems.departments.management.item4')}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Для клиента */}
          <div className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                <UserCheck className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-5 text-gray-900 dark:text-white tracking-tight">{t('landing.problems.departments.client.title')}</h3>
              <ul className="space-y-3.5">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{t('landing.problems.departments.client.item1')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{t('landing.problems.departments.client.item2')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{t('landing.problems.departments.client.item3')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


