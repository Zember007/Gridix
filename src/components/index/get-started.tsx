import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Zap, Users, Settings } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface GetStartedProps {
  onGoToAdmin: () => void;
  onScrollToPricing: () => void;
}

export const GetStarted = ({ onGoToAdmin, onScrollToPricing }: GetStartedProps) => {
  const { t } = useLanguage();
  
  return (
    <section className="py-24 bg-black dark:bg-white">
      <div className="container mx-auto">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
       
            <h2 className="text-4xl md:text-5xl font-light text-white dark:text-gray-900 mb-6">
              {t('landing.getStarted.title')}
            </h2>
        
            <div className="flex flex-wrap items-center justify-center gap-6 text-white text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                <span>{t('landing.getStarted.freeTrial')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                <span>{t('landing.getStarted.noCard')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                <span>{t('landing.getStarted.oneDayLaunch')}</span>
              </div>
            </div>
          </div>

          {/* 3 Steps */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Step 1 */}
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 text-center text-white relative">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-white text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg">
                1
              </div>
              <div className="mt-4">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{t('landing.getStarted.steps.registration.title')}</h3>
                <p className="text-blue-100">{t('landing.getStarted.steps.registration.description')}</p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 -translate-y-1/2">
                <ArrowRight className="w-8 h-8 text-white opacity-50" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 text-center text-white relative">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-white text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg">
                2
              </div>
              <div className="mt-4">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{t('landing.getStarted.steps.projectCreation.title')}</h3>
                <p className="text-blue-100">{t('landing.getStarted.steps.projectCreation.description')}</p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 -translate-y-1/2">
                <ArrowRight className="w-8 h-8 text-white opacity-50" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 text-center text-white relative">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-white text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg">
                3
              </div>
              <div className="mt-4">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{t('landing.getStarted.steps.leads.title')}</h3>
                <p className="text-blue-100">{t('landing.getStarted.steps.leads.description')}</p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-white text-gray-900 hover:bg-white hover:opacity-80 text-lg px-8 py-4 font-bold shadow-2xl"
              onClick={onGoToAdmin}
            >
              {t('landing.getStarted.tryFree')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white bg-opacity-10 backdrop-blur-lg text-white hover:text-white border-2 border-white hover:opacity-80 hover:bg-opacity-20 text-lg px-8 py-4 font-bold"
              onClick={onScrollToPricing}
            >
              {t('landing.getStarted.choosePlan')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};


