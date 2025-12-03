import React, { useState } from 'react';
import {
  PlayCircle,
  Download,
  ExternalLink,
  Calculator,
  CheckCircle2,
  DollarSign,
  Wallet,
} from 'lucide-react';
import { PartnerIncomeCalculator } from './IncomeCalculator';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

type MaterialItem = {
  titleKey: string;
  type: 'ppt' | 'pdf';
  languages?: string[];
};

type VideoItem = {
  titleKey: string;
  duration: string;
};

type FaqItem = {
  questionKey: string;
  answerKey: string;
};

const MATERIALS: MaterialItem[] = [
  {
    titleKey: 'instructionsMaterial1',
    type: 'ppt',
    languages: ['RU', 'EN', 'GE'],
  },
  {
    titleKey: 'instructionsMaterial2',
    type: 'pdf',
    languages: ['RU', 'EN', 'GE'],
  },
  {
    titleKey: 'instructionsMaterial3',
    type: 'pdf',
  },
  {
    titleKey: 'instructionsMaterial4',
    type: 'pdf',
  },
];

const VIDEOS: VideoItem[] = [
  { titleKey: 'instructionsVideo1', duration: '5:00' },
  { titleKey: 'instructionsVideo2', duration: '3:00' },
  { titleKey: 'instructionsVideo3', duration: '4:00' },
  { titleKey: 'instructionsVideo4', duration: '5:00' },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    questionKey: 'instructionsFaq1Question',
    answerKey: 'instructionsFaq1Answer',
  },
  {
    questionKey: 'instructionsFaq2Question',
    answerKey: 'instructionsFaq2Answer',
  },
  {
    questionKey: 'instructionsFaq3Question',
    answerKey: 'instructionsFaq3Answer',
  },
  {
    questionKey: 'instructionsFaq4Question',
    answerKey: 'instructionsFaq4Answer',
  },
  {
    questionKey: 'instructionsFaq5Question',
    answerKey: 'instructionsFaq5Answer',
  },
];

const TARGET_AUDIENCE_KEYS = [
  'instructionsAudience1',
  'instructionsAudience2',
  'instructionsAudience3',
  'instructionsAudience4',
  'instructionsAudience5',
];

export const PartnerInstructionsSection: React.FC = () => {
  const { t } = useLanguage();
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PartnerIncomeCalculator
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />

      {/* Как работает партнёрка */}
      <section className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {t('partners.instructionsHowTitle') || 'Как работает партнёрская программа'}
            </h2>
            <p className="text-sm text-gray-500">
              {t('partners.instructionsHowSubtitle') || 'Простые шаги для старта заработка с Gridix'}
            </p>
          </div>
          <button
            onClick={() => setIsCalculatorOpen(true)}
            className="mt-4 md:mt-0 flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-gray-200"
          >
            <Calculator size={16} />
            {t('partners.calculatorCta') || 'Калькулятор дохода'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm text-blue-600">
              <ExternalLink size={20} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              {t('partners.instructionsStep1Title') || 'Привлекайте'}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t('partners.instructionsStep1Text') || 'Используйте вашу реферальную ссылку или добавляйте клиентов вручную через кабинет.'}
            </p>
          </div>

          <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm text-green-600">
              <DollarSign size={20} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              {t('partners.instructionsStep2Title') || 'Зарабатывайте'}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t('partners.instructionsStep2Text') || 'Получайте 20% от всех оплат клиентов. Для интеграторов комиссия 40–50%.'}
            </p>
          </div>

          <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm text-purple-600">
              <Wallet size={20} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              {t('partners.instructionsStep3Title') || 'Выводите'}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t('partners.instructionsStep3Text') || 'Минимальная сумма вывода $100. Выплаты на карту или USDT.'}
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 border border-blue-100 bg-blue-50/50 rounded-lg">
          <div className="flex gap-3">
            <div className="mt-1 text-blue-600">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-900">
                {t('partners.instructionsIntegratorTitle') || 'Вы интегратор?'}
              </h4>
              <p className="text-sm text-blue-800 mt-1">
                {t('partners.instructionsIntegratorText') || 'Если вы добавляете клиентов как интегратор, вы самостоятельно пополняете свой счёт через раздел «Клиенты» и оплачиваете подписки за них, удерживая свою комиссию сразу. Вам не нужно ждать выплаты!'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Готовые материалы */}
        <section className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm h-full">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Download size={20} className="text-gray-400" />
            {t('partners.instructionsMaterialsTitle') || 'Готовые материалы'}
          </h2>
          <div className="space-y-3">
            {MATERIALS.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${
                      item.type === 'ppt'
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {item.type.toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800 group-hover:text-black">
                      {t(`partners.${item.titleKey}`)}
                    </div>
                    {item.languages && (
                      <div className="flex gap-1 mt-1">
                        {item.languages.map((lang) => (
                          <span
                            key={lang}
                            className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded border border-gray-200"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <Download
                  size={16}
                  className="text-gray-300 group-hover:text-black"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Видео */}
        <section className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm h-full">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <PlayCircle size={20} className="text-gray-400" />
            {t('partners.instructionsVideosTitle') || 'Обучающие видео'}
          </h2>
          <div className="space-y-4">
            {VIDEOS.map((video, idx) => (
              <div
                key={idx}
                className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer"
              >
                <div className="w-24 h-16 bg-gray-200 rounded-md flex-shrink-0 relative overflow-hidden">
                  <img
                    src={`https://picsum.photos/150/100?random=${idx}`}
                    alt={t(`partners.${video.titleKey}`)}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/50 text-white rounded-full p-1 group-hover:bg-black/70 transition-colors">
                      <PlayCircle size={16} />
                    </div>
                  </div>
                  <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1 rounded">
                    {video.duration}
                  </span>
                </div>
                <div className="flex flex-col justify-center">
                  <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {t(`partners.${video.titleKey}`)}
                  </h4>
                  <span className="text-xs text-gray-500 mt-1">
                    {t('partners.instructionsVideosCta') || 'Смотреть урок'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Как находить клиентов */}
        <section className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {t('partners.instructionsAudienceTitle') || 'Как находить клиентов'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TARGET_AUDIENCE_KEYS.map((key, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="w-2 h-2 bg-black rounded-full" />
                <span className="text-sm text-gray-700 font-medium">
                  {t(`partners.${key}`)}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100 sm:col-span-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-sm text-blue-900 font-medium">
                {t('partners.instructionsAudienceExtra') || 'Все компании, связанные с застройщиками и девелоперами'}
              </span>
            </div>
          </div>
        </section>

        {/* Демо */}
        <section className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-6 text-white shadow-lg flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold mb-2">
              {t('partners.instructionsDemoTitle') || 'Демонстрация'}
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              {t('partners.instructionsDemoText') || 'Покажите клиенту, как работает интерактивная шахматка в реальном времени.'}
            </p>
          </div>
          <a
            href="#"
            className="flex items-center justify-center gap-2 bg-white text-black py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            <ExternalLink size={18} />
            {t('partners.instructionsDemoCta') || 'Открыть демо'}
          </a>
        </section>
      </div>

      {/* FAQ */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {t('partners.instructionsFaqTitle') || 'FAQ (Вопросы партнёров)'}
          </h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border-b border-gray-100">
              <AccordionTrigger className="px-6 py-4 text-left hover:bg-gray-50">
                <span className="font-medium text-gray-900 text-sm md:text-base">
                  {t(`partners.${item.questionKey}`)}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 text-gray-600 text-sm leading-relaxed">
                {t(`partners.${item.answerKey}`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <div className="text-center py-8">
        <p className="text-gray-500 text-sm">
          {t('partners.instructionsSupportText') || 'Есть вопросы? Напишите в нашу'}{' '}
          <a href="#" className="text-blue-600 hover:underline font-medium">
            {t('partners.instructionsSupportLink') || 'Telegram-поддержку'}
          </a>
        </p>
      </div>
    </div>
  );
};
