import { useState, useRef } from 'react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Progress } from '@/shared/ui/progress';
import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Upload, FileSpreadsheet, Settings, Building2, Download, X, Link, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import ExcelColumnMapper from '@/components/data-import/ExcelColumnMapper';
import ExcelUrlImporter from '@/components/data-import/ExcelUrlImporter';
import * as XLSX from 'xlsx';
import { adminThemeClasses as admin } from '@/shared/lib/admin-theme-config';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProjectCreationModalProps {
  open: boolean;
  onClose: () => void;
  onManualCreate: () => void;
}

type ImportedCell = string | number | null | undefined;
interface ImportedRow {
  [key: string]: ImportedCell;
}

const ProjectCreationModal = ({ open, onClose, onManualCreate }: ProjectCreationModalProps) => {
  const { t } = useLanguage();
  const [importedData, setImportedData] = useState<ImportedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showColumnMapper, setShowColumnMapper] = useState(false);
  const [showUrlImporter, setShowUrlImporter] = useState(false);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [importMethod, setImportMethod] = useState<'file' | 'url'>('file');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      toast.error(t('admin.project.create.supportedFormats') || 'Поддерживаемые форматы: Excel (.xlsx, .xls) и CSV');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });

          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // Читаем данные как JSON с первой строкой в качестве заголовков
          const jsonData = XLSX.utils.sheet_to_json<ImportedRow>(worksheet, {
            defval: '' // Заполняем пустые ячейки пустой строкой
          });

          if (jsonData.length === 0) {
            toast.error(t('errors.file.noData') || 'Файл не содержит данных');
            setIsProcessing(false);
            return;
          }

          // Получаем заголовки из первой записи
          const headers = Object.keys(jsonData[0]).filter(header => header.trim() !== '');


          setExcelColumns(headers);
          setImportedData(jsonData);
          setShowColumnMapper(true);
          setProgress(100);
          toast.success((t('messages.fileProcessed') || 'Файл обработан успешно! Найдено {{count}} записей').replace('{{count}}', String(jsonData.length)));

        } catch (error) {
          console.error('Ошибка обработки файла:', error);
          toast.error(t('errors.file.process') || 'Ошибка при обработке файла');
        } finally {
          setIsProcessing(false);
        }
      };

      reader.onerror = () => {
        toast.error(t('errors.file.read') || 'Ошибка при чтении файла');
        setIsProcessing(false);
      };

      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      if (file.name.endsWith('.csv')) {
        reader.readAsText(file, 'UTF-8');
      } else {
        reader.readAsArrayBuffer(file);
      }

      toast.info(t('admin.project.create.import.processing') || 'Обработка Excel файла...');

    } catch (error) {
      console.error('Ошибка:', error);
      toast.error(t('errors.file.upload') || 'Ошибка при загрузке файла');
      setIsProcessing(false);
    }
  };

  const handleUrlImport = (data: ImportedRow[], columns: string[]) => {
    setImportedData(data);
    setExcelColumns(columns);
    setShowUrlImporter(false);
    setShowColumnMapper(true);
  };

  const downloadTemplate = () => {
    const csvContent = `Номер квартиры,Этаж,Комнаты,Площадь (м²),Цена (руб),Статус
101,1,1,45.5,5500000,свободна
102,1,2,68.2,7200000,свободна
103,1,3,92.1,9800000,продана
201,2,1,44.8,5400000,свободна
202,2,2,67.5,7100000,забронирована`;

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'apartment_template.csv';
    link.click();
    toast.success(t('messages.templateDownloaded') || 'Шаблон загружен');
  };

  const handleManualCreateClick = () => {
    onManualCreate();
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setImportedData([]);
    setShowColumnMapper(false);
    setShowUrlImporter(false);
    setExcelColumns([]);
    setProgress(0);
    setIsProcessing(false);
    setImportMethod('file');
    onClose();
  };

  if (showColumnMapper) {
    return (
      <Dialog open={open} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
          
          </DialogHeader>
          <ExcelColumnMapper
            excelColumns={excelColumns}
            importedData={importedData}
            onComplete={handleCloseModal}
          />
        </DialogContent>
      </Dialog>
    );
  }

  if (showUrlImporter) {
    return (
      <Dialog open={open} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>

            <div className="flex">
              <Button variant="ghost" size="sm" onClick={() => setShowUrlImporter(false)}>
                <ArrowLeft className="h-4 w-4" />
                Назад
              </Button>


            </div>
          </DialogHeader>
          <ExcelUrlImporter
            onDataImported={handleUrlImport}
            onClose={() => setShowUrlImporter(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }


  return (
    <Dialog open={open} onOpenChange={handleCloseModal}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-real-estate-600" />
            {t('admin.project.create.title') || 'Создать новый проект'}
          </DialogTitle>
          <DialogDescription>
            {t('admin.project.create.description') || 'Выберите способ создания проекта'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Ручное создание */}
          <Card className="cursor-pointer hover:bg-real-estate-50 transition-colors" onClick={handleManualCreateClick}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-real-estate-600" />
                {t('admin.project.create.manual.title') || 'Ручная настройка'}
              </CardTitle>
              <CardDescription>
                {t('admin.project.create.manual.description') || 'Создать проект с нуля и настроить все самостоятельно'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className={`w-full ${admin.primary} ${admin.primaryHover}`}>
                {t('admin.project.create.manual.start') || 'Начать ручное создание'}
              </Button>
            </CardContent>
          </Card>

          {/* Импорт из Excel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-real-estate-600" />
                {t('admin.project.create.import.title') || 'Импорт из Excel'}
              </CardTitle>
              <CardDescription>
                {t('admin.project.create.import.description') || 'Загрузить Excel файл с данными квартир и автоматически создать проект'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={importMethod} onValueChange={(value) => setImportMethod(value as 'file' | 'url')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    {t('admin.project.create.import.uploadTab') || 'Загрузить файл'}
                  </TabsTrigger>
                  <TabsTrigger value="url" className="flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    {t('admin.project.create.import.urlTab') || 'По ссылке'}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessing}
                      className={`${admin.primary} ${admin.primaryHover}`}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isProcessing ? (t('admin.project.create.import.processing') || 'Обработка...') : (t('admin.project.create.import.uploadButton') || 'Загрузить Excel файл')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={downloadTemplate}
                      className="border-real-estate-300 text-real-estate-600 hover:bg-real-estate-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {t('admin.project.create.import.template') || 'Скачать шаблон'}
                    </Button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {isProcessing && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{t('admin.project.create.import.processing') || 'Обработка файла...'}</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="w-full" />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="url" className="space-y-4">
                  <Button
                    onClick={() => setShowUrlImporter(true)}
                    className={`w-full ${admin.primary} ${admin.primaryHover}`}
                  >
                    <Link className="h-4 w-4 mr-2" />
                    {t('admin.project.create.import.byLink') || 'Импорт по ссылке'}
                  </Button>

                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>{t('admin.project.create.import.benefitsTitle') || 'Преимущества импорта по ссылке:'}</strong>
                    </p>
                    <ul className="list-disc list-inside text-sm text-blue-600 mt-1">
                      <li>{t('admin.project.create.import.benefit.sync') || 'Автоматическая синхронизация при изменении данных'}</li>
                      <li>{t('admin.project.create.import.benefit.noReupload') || 'Не нужно загружать файл повторно'}</li>
                      <li>{t('admin.project.create.import.benefit.fresh') || 'Данные всегда актуальны'}</li>
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="text-sm text-real-estate-600 bg-real-estate-50 p-3 rounded-md">
                <p><strong>{t('admin.project.create.supportedFormats') || 'Поддерживаемые форматы:'}</strong> Excel (.xlsx, .xls), CSV {t('admin.project.create.googleSheets') || 'и Google Sheets'}</p>
                <p><strong>{t('admin.project.create.requiredData') || 'Необходимые данные:'}</strong> {t('admin.project.create.requiredData.fields') || 'Номера квартир, этажи, комнаты, площадь, цена, статус'}</p>
                <p><strong>{t('admin.project.create.googleSheets') || 'Google Sheets:'}</strong> {t('admin.project.create.infoText') || 'Любой формат ссылки, автоматическое преобразование и синхронизация'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectCreationModal;
