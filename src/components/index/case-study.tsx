import { AlertCircle, CheckCircle2, TrendingUp, Quote } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const CaseStudy = () => {
  const { t } = useLanguage();

  return (
    <section id="case" className="py-20 bg-gray-50">
      <div className="container mx-auto">
        {/* Заголовок секции */}
        <div className="mb-16 text-center">
          <div className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold mb-6">
            {t('landing.caseStudy.badge')}
          </div>
          <h2 className="text-4xl md:text-5xl font-light text-gray-900 dark:text-white mb-4">
            {t('landing.caseStudy.title')}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {t('landing.caseStudy.description')}
          </p>
        </div>

        {/* Основной заголовок кейса */}
        <div className="mb-12 text-center">
          <h3 className="text-2xl md:text-3xl lg:text-4xl  mb-4 text-gray-900 dark:text-white leading-tight">
            {t('landing.caseStudy.mainTitle', { percent: '43%' })}
          </h3>
        </div>

        {/* Три карточки: Проблема, Решение, Результаты */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Проблема */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border-2 border-red-100 dark:border-red-900/30 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="inline-block px-4 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full text-sm font-semibold">
                {t('landing.caseStudy.problem.label')}
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">
              {t('landing.caseStudy.problem.text')}
            </p>
          </div>

          {/* Решение */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border-2 border-blue-100 dark:border-blue-900/30 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold">
                {t('landing.caseStudy.solution.label')}
              </div>
            </div>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <span className="leading-relaxed">{t('landing.caseStudy.solution.item1')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <span className="leading-relaxed">{t('landing.caseStudy.solution.item2')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <span className="leading-relaxed">{t('landing.caseStudy.solution.item3')}</span>
              </li>
            </ul>
          </div>

          {/* Результаты */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl shadow-lg p-8 border-2 border-green-200 dark:border-green-800 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="inline-block px-4 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm font-semibold">
                {t('landing.caseStudy.results.label')}
              </div>
            </div>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <span className="leading-relaxed">
                  <strong className="text-green-700 dark:text-green-300">+43%</strong> {t('landing.caseStudy.results.conversion')}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <span className="leading-relaxed">
                  <strong className="text-green-700 dark:text-green-300">78%</strong> {t('landing.caseStudy.results.selfSelection')}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <span className="leading-relaxed">
                  <strong className="text-green-700 dark:text-green-300">–35%</strong> {t('landing.caseStudy.results.timeSavings')}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <span className="leading-relaxed">
                  <strong className="text-green-700 dark:text-green-300">–28%</strong> {t('landing.caseStudy.results.costReduction')}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <span className="leading-relaxed">
                  <strong className="text-green-700 dark:text-green-300">⭐ 9.2/10</strong> {t('landing.caseStudy.results.convenience')}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <span className="leading-relaxed text-sm">
                  {t('landing.caseStudy.results.marketing')}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Отзыв клиента */}
        <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 rounded-3xl shadow-2xl p-8 md:p-12 border-2 border-blue-100 dark:border-blue-900/30 relative overflow-hidden">
          {/* Декоративные элементы */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-200/20 to-purple-200/20 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-200/20 to-pink-200/20 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8">
              {/* Аватар */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  ЗК
                </div>
              </div>

              {/* Контент отзыва */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <Quote className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                  <span className="text-yellow-400 text-xl">⭐⭐⭐⭐⭐</span>
                </div>

                <blockquote className="text-gray-700 dark:text-gray-200 text-lg md:text-xl leading-relaxed mb-6 italic font-light">
                  "{t('landing.caseStudy.testimonial.quote')}"
                </blockquote>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white text-lg">
                      {t('landing.caseStudy.testimonial.author')}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      {t('landing.caseStudy.testimonial.company')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

