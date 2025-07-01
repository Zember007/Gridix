
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileSpreadsheet, Settings, Building2, Download, X, Link } from 'lucide-react';
import { toast } from 'sonner';
import ExcelColumnMapper from '@/components/ExcelColumnMapper';
import ExcelUrlImporter from '@/components/ExcelUrlImporter';
import * as XLSX from 'xlsx';

interface ProjectCreationModalProps {
  open: boolean;
  onClose: () => void;
  onManualCreate: (sameLayout?: boolean) => void;
}

interface ImportedRow {
  [key: string]: any;
}

const ProjectCreationModal = ({ open, onClose, onManualCreate }: ProjectCreationModalProps) => {
  const [importedData, setImportedData] = useState<ImportedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showColumnMapper, setShowColumnMapper] = useState(false);
  const [showLayoutQuestion, setShowLayoutQuestion] = useState(false);
  const [showUrlImporter, setShowUrlImporter] = useState(false);
  const [sameLayoutForAllFloors, setSameLayoutForAllFloors] = useState<boolean | null>(null);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [importMethod, setImportMethod] = useState<'file' | 'url'>('file');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      toast.error('Поддерживаются только Excel (.xlsx, .xls) и CSV файлы');
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
          
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          if (jsonData.length < 2) {
            toast.error('Файл должен содержать как минимум заголовки и одну строку данных');
            setIsProcessing(false);
            return;
          }

          const headers = jsonData[0].filter(header => header && header.toString().trim() !== '');
          console.log('Извлеченные заголовки:', headers);
          
          const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''));
          
          const processedData = rows.map(row => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });

          console.log('Обработанные данные:', processedData.slice(0, 3));
          
          setExcelColumns(headers.map(h => h.toString()));
          setImportedData(processedData);
          setShowColumnMapper(true);
          setProgress(100);
          toast.success(`Файл обработан успешно! Найдено ${processedData.length} записей`);
          
        } catch (error) {
          console.error('Ошибка обработки файла:', error);
          toast.error('Ошибка при обработке файла');
        } finally {
          setIsProcessing(false);
        }
      };

      reader.onerror = () => {
        toast.error('Ошибка при чтении файла');
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

      toast.info('Обработка Excel файла...');
      
    } catch (error) {
      console.error('Ошибка:', error);
      toast.error('Ошибка при загрузке файла');
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
    toast.success('Шаблон загружен');
  };

  const handleManualCreateClick = () => {
    setShowLayoutQuestion(true);
  };

  const handleLayoutSelection = (sameLayout: boolean) => {
    setSameLayoutForAllFloors(sameLayout);
    onManualCreate(sameLayout);
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setImportedData([]);
    setShowColumnMapper(false);
    setShowLayoutQuestion(false);
    setShowUrlImporter(false);
    setSameLayoutForAllFloors(null);
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
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <Settings className="h-6 w-6 text-real-estate-600" />
                  Соотнести столбцы Excel
                </DialogTitle>
                <DialogDescription>
                  Укажите, какие столбцы из вашего Excel файла соответствуют полям квартир
                </DialogDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>
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
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <Link className="h-6 w-6 text-real-estate-600" />
                  Импорт по ссылке
                </DialogTitle>
                <DialogDescription>
                  Импортируйте данные из Excel файла по прямой ссылке
                </DialogDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowUrlImporter(false)}>
                <X className="h-4 w-4" />
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

  if (showLayoutQuestion) {
    return (
      <Dialog open={open} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-real-estate-600" />
              Планировка этажей
            </DialogTitle>
            <DialogDescription>
              Одинаковая ли планировка на всех этажах здания?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <RadioGroup 
              value={sameLayoutForAllFloors === null ? undefined : sameLayoutForAllFloors.toString()}
              onValueChange={(value) => setSameLayoutForAllFloors(value === 'true')}
            >
              <div className="space-y-4">
                <Card className="p-4 cursor-pointer hover:bg-real-estate-50 transition-colors">
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="true" id="same-layout" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="same-layout" className="cursor-pointer">
                        <div className="font-medium text-real-estate-900">Да, планировка одинаковая</div>
                        <div className="text-sm text-real-estate-600 mt-1">
                          Вы сможете один раз выделить квартиры на плане, и они автоматически применятся ко всем этажам
                        </div>
                      </Label>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 cursor-pointer hover:bg-real-estate-50 transition-colors">
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="false" id="different-layout" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="different-layout" className="cursor-pointer">
                        <div className="font-medium text-real-estate-900">Нет, планировка разная</div>
                        <div className="text-sm text-real-estate-600 mt-1">
                          Вам нужно будет отдельно настроить каждый этаж
                        </div>
                      </Label>
                    </div>
                  </div>
                </Card>
              </div>
            </RadioGroup>

            <div className="flex gap-3">
              <Button
                onClick={() => handleLayoutSelection(sameLayoutForAllFloors || false)}
                disabled={sameLayoutForAllFloors === null}
                className="flex-1 bg-real-estate-600 hover:bg-real-estate-700"
              >
                Продолжить
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowLayoutQuestion(false)}
                className="border-real-estate-300 text-real-estate-600 hover:bg-real-estate-50"
              >
                Назад
              </Button>
            </div>
          </div>
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
            Создать новый проект
          </DialogTitle>
          <DialogDescription>
            Выберите способ создания проекта
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Ручное создание */}
          <Card className="cursor-pointer hover:bg-real-estate-50 transition-colors" onClick={handleManualCreateClick}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-real-estate-600" />
                Ручная настройка
              </CardTitle>
              <CardDescription>
                Создать проект с нуля и настроить все самостоятельно
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-real-estate-600 hover:bg-real-estate-700">
                Начать ручное создание
              </Button>
            </CardContent>
          </Card>

          {/* Импорт из Excel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-real-estate-600" />
                Импорт из Excel
              </CardTitle>
              <CardDescription>
                Загрузить Excel файл с данными квартир и автоматически создать проект
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={importMethod} onValueChange={(value) => setImportMethod(value as 'file' | 'url')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Загрузить файл
                  </TabsTrigger>
                  <TabsTrigger value="url" className="flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    По ссылке
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="file" className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessing}
                      className="bg-real-estate-600 hover:bg-real-estate-700"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isProcessing ? 'Обработка...' : 'Загрузить Excel файл'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={downloadTemplate}
                      className="border-real-estate-300 text-real-estate-600 hover:bg-real-estate-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Скачать шаблон
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
                        <span>Обработка файла...</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="w-full" />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="url" className="space-y-4">
                  <Button
                    onClick={() => setShowUrlImporter(true)}
                    className="w-full bg-real-estate-600 hover:bg-real-estate-700"
                  >
                    <Link className="h-4 w-4 mr-2" />
                    Импорт по ссылке
                  </Button>
                  
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Преимущества импорта по ссылке:</strong>
                    </p>
                    <ul className="list-disc list-inside text-sm text-blue-600 mt-1">
                      <li>Автоматическая синхронизация при изменении данных</li>
                      <li>Не нужно загружать файл повторно</li>
                      <li>Данные всегда актуальны</li>
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="text-sm text-real-estate-600 bg-real-estate-50 p-3 rounded-md">
                <p><strong>Поддерживаемые форматы:</strong> Excel (.xlsx, .xls) и CSV</p>
                <p><strong>Необходимые данные:</strong> Номера квартир, этажи, комнаты, площадь, цена, статус</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectCreationModal;
