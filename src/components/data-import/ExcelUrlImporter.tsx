import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Link, RefreshCw, FileSpreadsheet, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { 
  convertGoogleSheetsUrl, 
  isGoogleSheetsUrl, 
  validateGoogleSheetsAccess,
  getGoogleSheetsInstructions 
} from '@/lib/google-sheets-utils';

interface ExcelUrlImporterProps {
  onDataImported: (data: any[], columns: string[]) => void;
  onClose: () => void;
}

const ExcelUrlImporter = ({ onDataImported, onClose }: ExcelUrlImporterProps) => {
  const [excelUrl, setExcelUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testConnection, setTestConnection] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [urlType, setUrlType] = useState<'unknown' | 'excel' | 'google_sheets'>('unknown');
  const [showInstructions, setShowInstructions] = useState(false);

  // Определяем тип URL при изменении
  const handleUrlChange = (url: string) => {
    setExcelUrl(url);
    setTestConnection('idle');
    
    if (!url.trim()) {
      setUrlType('unknown');
      return;
    }
    
    if (isGoogleSheetsUrl(url)) {
      setUrlType('google_sheets');
    } else {
      setUrlType('excel');
    }
  };

  const testExcelConnection = async () => {
    if (!excelUrl.trim()) {
      toast.error('Введите ссылку на файл');
      return;
    }

    setTestConnection('testing');
    try {
      let urlToTest = excelUrl;
      
      // Если это Google Sheets, преобразуем URL
      if (isGoogleSheetsUrl(excelUrl)) {
        const validation = await validateGoogleSheetsAccess(excelUrl);
        if (!validation.isAccessible) {
          setTestConnection('error');
          toast.error(validation.error || 'Google Sheets недоступен');
          setShowInstructions(true);
          return;
        }
        urlToTest = validation.convertedUrl!;
      }
      
      const response = await fetch(urlToTest, {
        method: 'HEAD',
        mode: 'cors'
      });
      
      if (response.ok) {
        setTestConnection('success');
        if (urlType === 'google_sheets') {
          toast.success('Google Sheets доступен для импорта');
        } else {
          toast.success('Ссылка доступна для импорта');
        }
      } else {
        setTestConnection('error');
        toast.error('Файл недоступен по указанной ссылке');
      }
    } catch (error) {
      setTestConnection('error');
      toast.error('Ошибка при проверке ссылки. Убедитесь, что файл доступен публично');
    }
  };

  const importFromUrl = async () => {
    if (!excelUrl.trim()) {
      toast.error('Введите ссылку на файл');
      return;
    }
  
    setIsLoading(true);
    try {
      let urlToFetch = excelUrl;
      
      // Если это Google Sheets, преобразуем URL для экспорта
      if (isGoogleSheetsUrl(excelUrl)) {
        try {
          urlToFetch = convertGoogleSheetsUrl(excelUrl);
          console.log('Converted Google Sheets URL:', urlToFetch);
        } catch (error) {
          toast.error('Некорректная ссылка Google Sheets');
          setIsLoading(false);
          return;
        }
      }
      
      const response = await fetch(urlToFetch);
      
      if (!response.ok) {
        throw new Error('Не удалось загрузить файл');
      }
  
      const arrayBuffer = await response.arrayBuffer();
      // Добавляем опции для правильного чтения чисел
    
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Читаем данные как JSON с первой строкой в качестве заголовков
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        defval: '' // Заполняем пустые ячейки пустой строкой
      }) as any[];
      
      if (jsonData.length === 0) {
        toast.error('Файл не содержит данных');
        return;
      }

      // Получаем заголовки из первой записи
      const headers = Object.keys(jsonData[0]).filter(header => header.trim() !== '');
     
  
      console.log('Извлеченные заголовки:', headers);
      console.log('Обработанные данные:', jsonData.slice(0, 3));
      
      onDataImported(jsonData, headers);
      toast.success(`Импортировано ${jsonData.length} записей`);
      
    } catch (error) {
      console.error('Ошибка импорта:', error);
      toast.error('Ошибка при импорте файла по ссылке');
    } finally {
      setIsLoading(false);
    }
  };

  const getSyncIntervalLabel = (seconds: string) => {
    const sec = parseInt(seconds);
    if (sec < 60) return `${sec} секунд`;
    if (sec < 3600) return `${Math.floor(sec / 60)} минут`;
    return `${Math.floor(sec / 3600)} часов`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {urlType === 'google_sheets' ? (
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
            ) : (
              <Link className="h-5 w-5 text-real-estate-600" />
            )}
            {urlType === 'google_sheets' ? 'Импорт из Google Sheets' : 'Импорт по ссылке'}
          </CardTitle>
          <CardDescription>
            {urlType === 'google_sheets' 
              ? 'Импортируйте данные напрямую из Google Sheets документа'
              : 'Импортируйте данные напрямую из Excel файла по ссылке'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="excel-url">
              {urlType === 'google_sheets' ? 'Ссылка на Google Sheets*' : 'Ссылка на Excel файл*'}
            </Label>
            <div className="flex gap-2 mt-1">
              <div className="flex-1 relative">
                <Input
                  id="excel-url"
                  value={excelUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder={urlType === 'google_sheets' 
                    ? "https://docs.google.com/spreadsheets/d/..." 
                    : "https://example.com/data.xlsx"}
                  className="pr-10"
                />
                {urlType === 'google_sheets' && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                onClick={testExcelConnection}
                disabled={testConnection === 'testing'}
                className="shrink-0"
              >
                {testConnection === 'testing' ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  'Проверить'
                )}
              </Button>
            </div>
            {testConnection === 'success' && (
              <p className="text-sm text-green-600 mt-1">✓ Ссылка доступна</p>
            )}
            {testConnection === 'error' && (
              <p className="text-sm text-red-600 mt-1">✗ Ссылка недоступна</p>
            )}
          </div>

   

          {/* Динамические инструкции в зависимости от типа URL */}
          {urlType === 'google_sheets' ? (
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-green-800">Google Sheets обнаружен</p>
                  <p className="text-green-700 mt-1">
                    Ссылка будет автоматически преобразована для импорта данных
                  </p>
                  {showInstructions && (
                    <div className="mt-3 p-3 bg-white rounded border">
                      <p className="font-medium text-gray-800 mb-2">Как настроить доступ:</p>
                      <ol className="list-decimal list-inside text-gray-700 text-xs space-y-1">
                        <li>Откройте ваш Google Sheets документ</li>
                        <li>Нажмите "Поделиться" → "Изменить доступ"</li>
                        <li>Выберите "Доступен всем в интернете"</li>
                        <li>Режим доступа: "Читатель"</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 p-4 rounded-lg">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">Требования к файлу:</p>
                  <ul className="list-disc list-inside text-amber-700 mt-1 space-y-1">
                    <li>Файл должен быть доступен публично (без авторизации)</li>
                    <li>Поддерживаются: Excel (.xlsx, .xls) и Google Sheets</li>
                    <li>Первая строка должна содержать заголовки столбцов</li>
                    <li>Для автосинхронизации файл не должен перемещаться</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={importFromUrl}
              disabled={isLoading || !excelUrl.trim()}
              className="flex-1 bg-real-estate-600 hover:bg-real-estate-700"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Импорт...
                </>
              ) : (
                <>
                  {urlType === 'google_sheets' ? (
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                  ) : (
                    <Link className="h-4 w-4 mr-2" />
                  )}
                  Импортировать данные
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExcelUrlImporter;
