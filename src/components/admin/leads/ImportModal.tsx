import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Database,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { showToast } from '@/shared/lib/toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any[]) => void;
}

type Step = 'upload' | 'mapping' | 'processing' | 'result';

const MOCK_CSV_HEADERS = [
  'Имя клиента',
  'Телефон',
  'Email',
  'Бюджет',
  'ЖК',
  'Источник',
];

const getCrmFields = (t: any) => [
  { id: 'name', label: t('leads.import.fields.name') },
  { id: 'phone', label: t('leads.import.fields.phone') },
  { id: 'email', label: t('leads.import.fields.email') },
  { id: 'price', label: t('leads.import.fields.price') },
  { id: 'project', label: t('leads.import.fields.project') },
  { id: 'source', label: t('leads.import.fields.source') },
  { id: 'skip', label: t('leads.import.fields.skip') },
];

const GENERATED_MOCK_DATA = [
  {
    name: 'Иван Петров',
    phone: '+995555112233',
    email: 'ivan@mail.com',
    price: 45000,
    project: 'Skyline Towers',
    source: 'instagram',
  },
  {
    name: 'Мария Сидорова',
    phone: '+995555445566',
    email: 'maria@test.com',
    price: 60000,
    project: 'Lemon Garden',
    source: 'website',
  },
  {
    name: 'Ахмед Юсуф',
    phone: '+905551234567',
    email: '',
    price: 120000,
    project: 'Modern Residence',
    source: 'referral',
  },
  {
    name: 'Елена Смирнова',
    phone: '+79991112233',
    email: 'elena@ya.ru',
    price: 35000,
    project: 'Skyline Towers',
    source: 'facebook',
  },
  {
    name: 'John Doe',
    phone: '+12025550101',
    email: 'john@usa.com',
    price: 250000,
    project: 'BI Residence',
    source: 'website',
  },
];

export const ImportModal: React.FC<Props> = ({ isOpen, onClose, onImport }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mapping, setMapping] = useState<Record<number, string>>({
    0: 'name',
    1: 'phone',
    2: 'email',
    3: 'price',
    4: 'project',
    5: 'source',
  });

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
      setStep('mapping');
    }
  };

  const handleProcess = () => {
    setStep('processing');
    let p = 0;
    const interval = setInterval(() => {
      p += 5;
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setStep('result');
        onImport(GENERATED_MOCK_DATA);
        showToast('success', t('leads.toast.importDone.title'), t('leads.toast.importDone.desc'));
      }
    }, 50);
  };

  const reset = () => {
    setStep('upload');
    setFileName('');
    setProgress(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {t('leads.import.title')}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('leads.import.step', { step: step === 'upload' ? 1 : step === 'mapping' ? 2 : 3 })}
            </p>
          </div>
          <button
            onClick={reset}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div
                className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:border-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-1">
                  {t('leads.import.dragFile')}
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  {t('leads.import.orClick')}
                </p>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
                  {t('leads.import.supportedFormats')}
                </span>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                />
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex gap-3">
                <AlertCircle size={20} className="text-amber-600 shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-bold mb-1">{t('leads.import.important')}</p>
                  <p>
                    {t('leads.import.headersNote')}
                  </p>
                  <a
                    href="#"
                    className="text-amber-700 underline mt-2 inline-block hover:text-amber-900"
                  >
                    {t('leads.import.downloadTemplate')}
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: MAPPING */}
          {step === 'mapping' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <FileSpreadsheet size={20} className="text-green-600" />
                <span className="font-medium text-slate-700">{fileName}</span>
                <span className="text-xs text-slate-400 ml-auto">~5 строк</span>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-4">
                  {t('leads.import.fieldMapping')}
                </h3>
                <div className="space-y-3">
                  {MOCK_CSV_HEADERS.map((header, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div
                        className="w-1/3 text-sm font-medium text-slate-600 truncate text-right"
                        title={header}
                      >
                        {header}
                      </div>
                      <ArrowRight size={16} className="text-slate-300 shrink-0" />
                      <div className="flex-1">
                        <select
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
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
          {(step === 'processing' || step === 'result') && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              {step === 'processing' ? (
                <>
                  <div className="w-20 h-20 relative mb-6">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
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
                    <div className="absolute inset-0 flex items-center justify-center font-bold text-lg text-blue-600">
                      {progress}%
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {t('leads.import.importing')}
                  </h3>
                  <p className="text-sm text-slate-500 mt-2">
                    {t('leads.import.dontClose')}
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-in zoom-in">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{t('leads.import.done')}</h3>
                  <p className="text-slate-600 mt-2 mb-6">
                    {t('leads.import.successfullyAdded', { count: 5 })}
                    <br />
                  </p>
                  <button
                    onClick={reset}
                    className="bg-slate-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors"
                  >
                    {t('leads.import.backToList')}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'processing' && step !== 'result' && (
          <div className="p-5 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
            <button
              onClick={reset}
              className="text-slate-500 hover:text-slate-700 font-medium text-sm"
            >
              {t('leads.import.cancel')}
            </button>
            {step === 'upload' ? (
              <button
                disabled
                className="bg-slate-200 text-slate-400 px-6 py-2.5 rounded-lg font-bold text-sm cursor-not-allowed"
              >
                {t('leads.import.next')}
              </button>
            ) : (
              <button
                onClick={handleProcess}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-md transition-all flex items-center gap-2"
              >
                <Database size={16} /> {t('leads.import.startImport')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
