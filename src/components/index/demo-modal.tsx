import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { X, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect } from 'react';

interface DemoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

declare global {
  interface Window {
    Cal: any;
  }
}

export const DemoModal = ({ open, onOpenChange }: DemoModalProps) => {
  const { t } = useLanguage();

  useEffect(() => {
    if (open) {
      window.Cal("init", "gridix-15min-demo", { origin: "https://app.cal.com" });

      window.Cal.ns["gridix-15min-demo"]("inline", {
        elementOrSelector: "#my-cal-inline-gridix-15min-demo",
        config: { "layout": "month_view" },
        calLink: "klaster-digital/gridix-15min-demo",
      });

      window.Cal.ns["gridix-15min-demo"]("ui", { "hideEventTypeDetails": false, "layout": "month_view" });
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-hidden p-0 gap-0">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Left Side - Text Content */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-8 md:p-12 text-white flex flex-col justify-center">
            <div className="mb-8">
              <div className="inline-block px-4 py-2 bg-white bg-opacity-20 backdrop-blur-lg rounded-full text-sm font-semibold mb-6">
                {t('landing.demoModal.badge')}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                {t('landing.demoModal.title')}
              </h2>
              <p className="text-lg text-blue-100 mb-8 leading-relaxed">
                {t('landing.demoModal.description')}
              </p>
            </div>

            {/* Benefits List */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold">{t('landing.demoModal.benefits.personalDemo.title')}</p>
                  <p className="text-sm text-blue-100">{t('landing.demoModal.benefits.personalDemo.description')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold">{t('landing.demoModal.benefits.answers.title')}</p>
                  <p className="text-sm text-blue-100">{t('landing.demoModal.benefits.answers.description')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold">{t('landing.demoModal.benefits.help.title')}</p>
                  <p className="text-sm text-blue-100">{t('landing.demoModal.benefits.help.description')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Cal.com Widget */}
          <div className="bg-gray-50 dark:bg-gray-800 relative">
            {/* Close Button */}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-white dark:bg-gray-700 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-300 z-10"
            >
              <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>

            {/* Cal.com Embed */}
            <div className="h-full min-h-[500px]">
              <div style={{ width: '100%', height: '100%', overflow: 'scroll' }} id="my-cal-inline-gridix-15min-demo" ></div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

