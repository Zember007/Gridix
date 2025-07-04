import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Link, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface ExcelUrlImporterProps {
  onDataImported: (data: any[], columns: string[]) => void;
  onClose: () => void;
}

const ExcelUrlImporter = ({ onDataImported, onClose }: ExcelUrlImporterProps) => {
  const [excelUrl, setExcelUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [syncInterval, setSyncInterval] = useState('300');
  const [testConnection, setTestConnection] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const testExcelConnection = async () => {
    if (!excelUrl.trim()) {
      toast.error('Введите ссылку на Excel файл');
      return;
    }

    setTestConnection('testing');
    try {
      const response = await fetch(excelUrl, {
        method: 'HEAD',
        mode: 'cors'
      });
      
      if (response.ok) {
        setTestConnection('success');
        toast.success('Ссылка доступна для импорта');
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
      toast.error('Введите ссылку на Excel файл');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(excelUrl);
      
      if (!response.ok) {
        throw new Error('Не удалось загрузить файл');
      }

      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Получаем диапазон данных
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      
      const headers: string[] = [];
      for (let col = range.s.c + 1; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 1, c: col });
        const cell = worksheet[cellAddress];
        const headerValue = cell ? String(cell.v).trim() : '';
        if (headerValue) {
          headers.push(headerValue);
        }
      }
      
      if (headers.length === 0) {
        toast.error('Не найдены заголовки в первой строке');
        return;
      }

      // Читаем данные начиная со второй строки
      const jsonData: any[] = [];
      for (let row = 2; row <= range.e.r; row++) {
        const rowData: any = {};
        let hasData = false;
        
        for (let col = 1; col < headers.length; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = worksheet[cellAddress];
          const cellValue = cell ? cell.v : '';
          rowData[headers[col - 1]] = cellValue;
          if (cellValue) hasData = true;
        }
        
        if (hasData) {
          jsonData.push(rowData);
        }
      }
      
      if (jsonData.length === 0) {
        toast.error('Файл не содержит данных');
        return;
      }

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
            <Link className="h-5 w-5 text-real-estate-600" />
            Импорт по ссылке
          </CardTitle>
          <CardDescription>
            Импортируйте данные напрямую из Excel файла по ссылке
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="excel-url">Ссылка на Excel файл*</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="excel-url"
                value={excelUrl}
                onChange={(e) => setExcelUrl(e.target.value)}
                placeholder="https://example.com/data.xlsx"
                className="flex-1"
              />
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

          <div className="bg-real-estate-50 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-sync" className="font-medium">
                  Автоматическая синхронизация
                </Label>
                <p className="text-sm text-real-estate-600">
                  Отслеживать изменения в Excel файле и автоматически обновлять данные
                </p>
              </div>
              <Switch
                id="auto-sync"
                checked={autoSync}
                onCheckedChange={setAutoSync}
              />
            </div>

            {autoSync && (
              <div>
                <Label htmlFor="sync-interval">Интервал синхронизации</Label>
                <Select value={syncInterval} onValueChange={setSyncInterval}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">1 минута</SelectItem>
                    <SelectItem value="300">5 минут</SelectItem>
                    <SelectItem value="600">10 минут</SelectItem>
                    <SelectItem value="1800">30 минут</SelectItem>
                    <SelectItem value="3600">1 час</SelectItem>
                    <SelectItem value="21600">6 часов</SelectItem>
                    <SelectItem value="86400">24 часа</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-real-estate-600 mt-1">
                  Система будет проверять изменения каждые {getSyncIntervalLabel(syncInterval)}
                </p>
              </div>
            )}
          </div>

          <div className="bg-amber-50 p-4 rounded-lg">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Требования к файлу:</p>
                <ul className="list-disc list-inside text-amber-700 mt-1 space-y-1">
                  <li>Файл должен быть доступен публично (без авторизации)</li>
                  <li>Поддерживаются форматы: .xlsx, .xls</li>
                  <li>Первая строка должна содержать заголовки столбцов</li>
                  <li>Для автосинхронизации файл не должен перемещаться</li>
                </ul>
              </div>
            </div>
          </div>

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
                  <Link className="h-4 w-4 mr-2" />
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
