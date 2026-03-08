import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Database,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { showToast } from "@gridix/utils/lib";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any[]) => void;
}

type Step = "upload" | "mapping" | "processing" | "result";

const MOCK_CSV_HEADERS = [
  "Имя клиента",
  "Телефон",
  "Email",
  "Бюджет",
  "ЖК",
  "Источник",
];

const getCrmFields = (t: any) => [
  { id: "name", label: t("leads.import.fields.name") },
  { id: "phone", label: t("leads.import.fields.phone") },
  { id: "email", label: t("leads.import.fields.email") },
  { id: "price", label: t("leads.import.fields.price") },
  { id: "project", label: t("leads.import.fields.project") },
  { id: "source", label: t("leads.import.fields.source") },
  { id: "skip", label: t("leads.import.fields.skip") },
];

const GENERATED_MOCK_DATA = [
  {
    name: "Иван Петров",
    phone: "+995555112233",
    email: "ivan@mail.com",
    price: 45000,
    project: "Skyline Towers",
    source: "instagram",
  },
  {
    name: "Мария Сидорова",
    phone: "+995555445566",
    email: "maria@test.com",
    price: 60000,
    project: "Lemon Garden",
    source: "website",
  },
  {
    name: "Ахмед Юсуф",
    phone: "+905551234567",
    email: "",
    price: 120000,
    project: "Modern Residence",
    source: "referral",
  },
  {
    name: "Елена Смирнова",
    phone: "+79991112233",
    email: "elena@ya.ru",
    price: 35000,
    project: "Skyline Towers",
    source: "facebook",
  },
  {
    name: "John Doe",
    phone: "+12025550101",
    email: "john@usa.com",
    price: 250000,
    project: "BI Residence",
    source: "website",
  },
];

export const ImportModal: React.FC<Props> = ({ isOpen, onClose, onImport }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mapping, setMapping] = useState<Record<number, string>>({
    0: "name",
    1: "phone",
    2: "email",
    3: "price",
    4: "project",
    5: "source",
  });

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
      setStep("mapping");
    }
  };

  const handleProcess = () => {
    setStep("processing");
    let p = 0;
    const interval = setInterval(() => {
      p += 5;
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setStep("result");
        onImport(GENERATED_MOCK_DATA);
        showToast(
          "success",
          t("leads.toast.importDone.title"),
          t("leads.toast.importDone.desc"),
        );
      }
    }, 50);
  };

  const reset = () => {
    setStep("upload");
    setFileName("");
    setProgress(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm duration-200 animate-in fade-in">
      <div className="flex max-h-[90vh] w-full max-w-2xl transform flex-col overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {t("leads.import.title")}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {t("leads.import.step", {
                step: step === "upload" ? 1 : step === "mapping" ? 2 : 3,
              })}
            </p>
          </div>
          <button
            onClick={reset}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="custom-scrollbar overflow-y-auto p-6">
          {/* STEP 1: UPLOAD */}
          {step === "upload" && (
            <div className="space-y-6">
              <div
                className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-10 text-center transition-all hover:border-blue-500 hover:bg-blue-50/30"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-transform group-hover:scale-110">
                  <Upload size={32} />
                </div>
                <h3 className="mb-1 text-lg font-bold text-slate-700">
                  {t("leads.import.dragFile")}
                </h3>
                <p className="mb-4 text-sm text-slate-500">
                  {t("leads.import.orClick")}
                </p>
                <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-400">
                  {t("leads.import.supportedFormats")}
                </span>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                />
              </div>

              <div className="flex gap-3 rounded-lg border border-amber-100 bg-amber-50 p-4">
                <AlertCircle size={20} className="shrink-0 text-amber-600" />
                <div className="text-sm text-amber-800">
                  <p className="mb-1 font-bold">
                    {t("leads.import.important")}
                  </p>
                  <p>{t("leads.import.headersNote")}</p>
                  <a
                    href="#"
                    className="mt-2 inline-block text-amber-700 underline hover:text-amber-900"
                  >
                    {t("leads.import.downloadTemplate")}
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: MAPPING */}
          {step === "mapping" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <FileSpreadsheet size={20} className="text-green-600" />
                <span className="font-medium text-slate-700">{fileName}</span>
                <span className="ml-auto text-xs text-slate-400">~5 строк</span>
              </div>

              <div>
                <h3 className="mb-4 font-bold text-slate-800">
                  {t("leads.import.fieldMapping")}
                </h3>
                <div className="space-y-3">
                  {MOCK_CSV_HEADERS.map((header, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div
                        className="w-1/3 truncate text-right text-sm font-medium text-slate-600"
                        title={header}
                      >
                        {header}
                      </div>
                      <ArrowRight
                        size={16}
                        className="shrink-0 text-slate-300"
                      />
                      <div className="flex-1">
                        <select
                          className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm outline-none focus:border-blue-500"
                          value={mapping[idx]}
                          onChange={(e) =>
                            setMapping({ ...mapping, [idx]: e.target.value })
                          }
                        >
                          {getCrmFields(t).map((field) => (
                            <option key={field.id} value={field.id}>
                              {field.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PROCESSING */}
          {(step === "processing" || step === "result") && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              {step === "processing" ? (
                <>
                  <div className="relative mb-6 h-20 w-20">
                    <svg className="h-full w-full" viewBox="0 0 36 36">
                      <path
                        className="text-slate-100"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        className="text-blue-600 transition-all duration-200"
                        strokeDasharray={`${progress}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-blue-600">
                      {progress}%
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {t("leads.import.importing")}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {t("leads.import.dontClose")}
                  </p>
                </>
              ) : (
                <>
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 animate-in zoom-in">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {t("leads.import.done")}
                  </h3>
                  <p className="mb-6 mt-2 text-slate-600">
                    {t("leads.import.successfullyAdded", { count: 5 })}
                    <br />
                  </p>
                  <button
                    onClick={reset}
                    className="rounded-lg bg-slate-900 px-8 py-3 font-bold text-white transition-colors hover:bg-slate-800"
                  >
                    {t("leads.import.backToList")}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== "processing" && step !== "result" && (
          <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-slate-50 p-5">
            <button
              onClick={reset}
              className="text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              {t("leads.import.cancel")}
            </button>
            {step === "upload" ? (
              <button
                disabled
                className="cursor-not-allowed rounded-lg bg-slate-200 px-6 py-2.5 text-sm font-bold text-slate-400"
              >
                {t("leads.import.next")}
              </button>
            ) : (
              <button
                onClick={handleProcess}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-700"
              >
                <Database size={16} /> {t("leads.import.startImport")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
