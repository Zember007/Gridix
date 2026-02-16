import React, { useState } from "react";
import {
  PlayCircle,
  Download,
  ExternalLink,
  Calculator,
  CheckCircle2,
  DollarSign,
  Wallet,
} from "lucide-react";
import { PartnerIncomeCalculator } from "./IncomeCalculator";
import { useLanguage } from "@gridix/utils/react";
import { VideoModalPlayer, type VideoChapter } from "./VideoModalPlayer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@gridix/ui";

type MaterialItem = {
  titleKey: string;
  languages: Array<"RU" | "EN">;
  files: Record<"RU" | "EN", string>;
};

type VideoItem = {
  id: string;
  titleKey: string;
  src: string;
  chapters?: VideoChapter[];
};

type FaqItem = {
  questionKey: string;
  answerKey: string;
};

const MATERIALS: MaterialItem[] = [
  {
    titleKey: "instructionsMaterial1",
    languages: ["RU", "EN"],
    files: {
      RU: "/instructions/pdf/GRIDIX-RU.pdf",
      EN: "/instructions/pdf/GRIDIX-EN.pdf",
    },
  },
];

const VIDEOS: VideoItem[] = [
  {
    id: "explore_service",
    titleKey: "instructionsVideo3",
    src: "/instructions/videos/Explore_service_.mp4",
    chapters: [],
  },
  {
    id: "create_project",
    titleKey: "instructionsVideo1",
    src: "/instructions/videos/Create_project_.mp4",
    chapters: [],
  },
  {
    id: "edit_project",
    titleKey: "instructionsVideo2",
    src: "/instructions/videos/Edit_project_gridix_.mp4",
    chapters: [],
  },
  {
    id: "explore_crm",
    titleKey: "instructionsVideo5",
    src: "/instructions/videos/Gridix_explore_crm.mp4",
    chapters: [],
  },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    questionKey: "instructionsFaq1Question",
    answerKey: "instructionsFaq1Answer",
  },
  {
    questionKey: "instructionsFaq2Question",
    answerKey: "instructionsFaq2Answer",
  },
  {
    questionKey: "instructionsFaq3Question",
    answerKey: "instructionsFaq3Answer",
  },
  {
    questionKey: "instructionsFaq4Question",
    answerKey: "instructionsFaq4Answer",
  },
  {
    questionKey: "instructionsFaq5Question",
    answerKey: "instructionsFaq5Answer",
  },
];

const TARGET_AUDIENCE_KEYS = [
  "instructionsAudience1",
  "instructionsAudience2",
  "instructionsAudience3",
  "instructionsAudience4",
  "instructionsAudience5",
];

export const PartnerInstructionsSection: React.FC = () => {
  const { t, language } = useLanguage();
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [materialsLang, setMaterialsLang] = useState<"RU" | "EN">(() => {
    const normalized = String(language || "").toLowerCase();
    return normalized.startsWith("ru") ? "RU" : "EN";
  });

  const activeVideo = activeVideoId
    ? VIDEOS.find((v) => v.id === activeVideoId) || null
    : null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
      <PartnerIncomeCalculator
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />

      <VideoModalPlayer
        open={Boolean(activeVideo)}
        onOpenChange={(open) => {
          if (!open) setActiveVideoId(null);
        }}
        title={activeVideo ? t(`partners.${activeVideo.titleKey}`) : ""}
        src={activeVideo?.src || ""}
        chapters={activeVideo?.chapters ?? []}
      />

      {/* Как работает партнёрка */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-start justify-between md:flex-row md:items-center">
          <div>
            <h2 className="mb-1 text-xl font-bold text-gray-900">
              {t("partners.instructionsHowTitle") ||
                "Как работает партнёрская программа"}
            </h2>
            <p className="text-sm text-gray-500">
              {t("partners.instructionsHowSubtitle") ||
                "Простые шаги для старта заработка с Gridix"}
            </p>
          </div>
          <button
            onClick={() => setIsCalculatorOpen(true)}
            className="mt-4 flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-gray-200 transition-colors hover:bg-gray-800 md:mt-0"
          >
            <Calculator size={16} />
            {t("partners.calculatorCta") || "Калькулятор дохода"}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
              <ExternalLink size={20} />
            </div>
            <h3 className="mb-2 font-semibold text-gray-900">
              {t("partners.instructionsStep1Title") || "Привлекайте"}
            </h3>
            <p className="text-sm leading-relaxed text-gray-600">
              {t("partners.instructionsStep1Text") ||
                "Используйте вашу реферальную ссылку или добавляйте клиентов вручную через кабинет."}
            </p>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-green-600 shadow-sm">
              <DollarSign size={20} />
            </div>
            <h3 className="mb-2 font-semibold text-gray-900">
              {t("partners.instructionsStep2Title") || "Зарабатывайте"}
            </h3>
            <p className="text-sm leading-relaxed text-gray-600">
              {t("partners.instructionsStep2Text") ||
                "Получайте 20% от всех оплат клиентов. Для интеграторов комиссия 40–50%."}
            </p>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-purple-600 shadow-sm">
              <Wallet size={20} />
            </div>
            <h3 className="mb-2 font-semibold text-gray-900">
              {t("partners.instructionsStep3Title") || "Выводите"}
            </h3>
            <p className="text-sm leading-relaxed text-gray-600">
              {t("partners.instructionsStep3Text") ||
                "Минимальная сумма вывода $100. Выплаты на карту или USDT."}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
          <div className="flex gap-3">
            <div className="mt-1 text-blue-600">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-900">
                {t("partners.instructionsIntegratorTitle") || "Вы интегратор?"}
              </h4>
              <p className="mt-1 text-sm text-blue-800">
                {t("partners.instructionsIntegratorText") ||
                  "Если вы добавляете клиентов как интегратор, вы самостоятельно пополняете свой счёт через раздел «Клиенты» и оплачиваете подписки за них, удерживая свою комиссию сразу. Вам не нужно ждать выплаты!"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Готовые материалы */}
        <section className="h-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
            <Download size={20} className="text-gray-400" />
            {t("partners.instructionsMaterialsTitle") || "Готовые материалы"}
          </h2>
          <div className="space-y-2">
            {MATERIALS.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-gray-900">
                    {t(`partners.${item.titleKey}`)}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[11px] text-gray-500">
                      {t("partners.materialsLanguageLabel") || "Язык"}:
                    </span>
                    {item.languages.map((langCode) => {
                      const isActive = materialsLang === langCode;
                      return (
                        <button
                          key={langCode}
                          type="button"
                          onClick={() => setMaterialsLang(langCode)}
                          className={`rounded border px-2 py-0.5 text-[11px] transition-colors ${
                            isActive
                              ? "border-black bg-black text-white"
                              : "border-gray-200 bg-white text-gray-700 hover:bg-white"
                          }`}
                        >
                          {langCode}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <a
                  href={item.files[materialsLang]}
                  download
                  className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-lg border border-gray-200 bg-white transition-colors hover:bg-gray-100"
                  aria-label={t("partners.download") || "Скачать"}
                  title={t("partners.download") || "Скачать"}
                >
                  <Download size={16} className="text-gray-800" />
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Видео */}
        <section className="h-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
            <PlayCircle size={20} className="text-gray-400" />
            {t("partners.instructionsVideosTitle") || "Обучающие видео"}
          </h2>
          <div className="space-y-4">
            {VIDEOS.map((video) => (
              <div
                key={video.id}
                className="group flex cursor-pointer gap-4 rounded-lg border border-transparent p-3 transition-colors hover:border-gray-100 hover:bg-gray-50"
                onClick={() => setActiveVideoId(video.id)}
              >
                <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-md border border-slate-200 bg-black">
                  <video
                    src={video.src}
                    preload="metadata"
                    muted
                    playsInline
                    className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
                    onLoadedData={(e) => {
                      const el = e.currentTarget;

                      try {
                        if (el.currentTime === 0) el.currentTime = 0.1;
                      } catch {
                        // ignore
                      }
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full bg-black/50 p-1 text-white transition-colors group-hover:bg-black/70">
                      <PlayCircle size={16} />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <h4 className="text-sm font-medium text-gray-900 transition-colors group-hover:text-blue-600">
                    {t(`partners.${video.titleKey}`)}
                  </h4>
                  <span className="mt-1 text-xs text-gray-500">
                    {t("partners.instructionsVideosCta") || "Смотреть урок"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Как находить клиентов */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            {t("partners.instructionsAudienceTitle") || "Как находить клиентов"}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {TARGET_AUDIENCE_KEYS.map((key, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3"
              >
                <div className="h-2 w-2 rounded-full bg-black" />
                <span className="text-sm font-medium text-gray-700">
                  {t(`partners.${key}`)}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3 sm:col-span-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-sm font-medium text-blue-900">
                {t("partners.instructionsAudienceExtra") ||
                  "Все компании, связанные с застройщиками и девелоперами"}
              </span>
            </div>
          </div>
        </section>

        {/* Демо */}
        <section className="flex flex-col justify-between rounded-xl bg-gradient-to-br from-gray-900 to-black p-6 text-white shadow-lg">
          <div>
            <h2 className="mb-2 text-lg font-bold">
              {t("partners.instructionsDemoTitle") || "Демонстрация"}
            </h2>
            <p className="mb-6 text-sm text-gray-400">
              {t("partners.instructionsDemoText") ||
                "Покажите клиенту, как работает интерактивная шахматка в реальном времени."}
            </p>
          </div>
          <a
            href={`https://app.gridix.live/embed/project/85a56cab-d420-4d3e-aa37-2c21bce021a8?lang=${language}`}
            className="flex items-center justify-center gap-2 rounded-lg bg-white py-3 font-medium text-black transition-colors hover:bg-gray-100"
          >
            <ExternalLink size={18} />
            {t("partners.instructionsDemoCta")}
          </a>
        </section>
      </div>

      {/* FAQ */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900">
            {t("partners.instructionsFaqTitle") || "FAQ (Вопросы партнёров)"}
          </h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((item, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border-b border-gray-100"
            >
              <AccordionTrigger className="px-6 py-4 text-left hover:bg-gray-50">
                <span className="text-sm font-medium text-gray-900 md:text-base">
                  {t(`partners.${item.questionKey}`)}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 text-sm leading-relaxed text-gray-600">
                {t(`partners.${item.answerKey}`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <div className="py-8 text-center">
        <p className="text-sm text-gray-500">
          {t("partners.instructionsSupportText") ||
            "Есть вопросы? Напишите в нашу"}{" "}
          <a
            href="https://t.me/gridix_bot"
            className="font-medium text-blue-600 hover:underline"
          >
            {t("partners.instructionsSupportLink")}
          </a>
        </p>
      </div>
    </div>
  );
};
