import React, { useState } from 'react';
import { Button } from "@gridix/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@gridix/ui";
import { Input } from "@gridix/ui";
import { Label } from "@gridix/ui";
import { FileSpreadsheet, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { 
  convertGoogleSheetsUrl, 
  isGoogleSheetsUrl, 
  parseGoogleSheetsUrl,
  validateGoogleSheetsAccess 
} from "@gridix/utils/lib";

/**
 * Демонстрационный компонент для тестирования импорта Google Sheets
 */
const GoogleSheetsImportDemo = () => {
  const [testUrl, setTestUrl] = useState('');
  const [results, setResults] = useState<{
    isGoogleSheets: boolean;
    parsedInfo: any;
    convertedUrl: string;
    validationResult: any;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Примеры URL для тестирования
  const exampleUrls = [
    {
      name: 'Стандартный Google Sheets URL',
      url: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0'
    },
    {
      name: 'URL без gid',
      url: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit'
    },
    {
      name: 'URL просмотра',
      url: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view'
    }
  ];

  const testGoogleSheetsUrl = async () => {
    if (!testUrl.trim()) {
      toast.error('Введите URL для тестирования');
      return;
    }

    setIsLoading(true);
    try {
      // Проверяем, является ли это Google Sheets URL
      const isGoogleSheets = isGoogleSheetsUrl(testUrl);
      
      // Парсим информацию из URL
      const parsedInfo = parseGoogleSheetsUrl(testUrl);
      
      let convertedUrl = '';
      let validationResult = null;
      
      if (isGoogleSheets) {
        // Преобразуем URL
        try {
          convertedUrl = convertGoogleSheetsUrl(testUrl);
        } catch (error) {
          convertedUrl = `Ошибка: ${error}`;
        }
        
        // Валидируем доступ
        validationResult = await validateGoogleSheetsAccess(testUrl);
      }

      setResults({
        isGoogleSheets,
        parsedInfo,
        convertedUrl,
        validationResult
      });

      if (isGoogleSheets) {
        toast.success('Анализ Google Sheets URL завершен');
      } else {
        toast.info('Это не Google Sheets URL');
      }
    } catch (error) {
      toast.error('Ошибка при анализе URL');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Скопировано в буфер обмена');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            Тестирование Google Sheets Import
          </CardTitle>
          <CardDescription>
            Проверьте, как работает импорт с различными форматами Google Sheets URL
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="test-url">URL для тестирования</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="test-url"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="Вставьте ссылку на Google Sheets"
                className="flex-1"
              />
              <Button
                onClick={testGoogleSheetsUrl}
                disabled={isLoading || !testUrl.trim()}
              >
                {isLoading ? 'Анализ...' : 'Анализировать'}
              </Button>
            </div>
          </div>

          {/* Примеры URL */}
          <div>
            <Label>Примеры URL для тестирования:</Label>
            <div className="grid gap-2 mt-2">
              {exampleUrls.map((example, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-sm">{example.name}</p>
                    <p className="text-xs text-gray-600 truncate max-w-md">{example.url}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTestUrl(example.url)}
                  >
                    Использовать
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Результаты анализа */}
          {results && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">Результаты анализа:</h3>
              
              {/* Проверка типа URL */}
              <div className="flex items-center gap-2">
                {results.isGoogleSheets ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <span className={results.isGoogleSheets ? 'text-green-700' : 'text-red-700'}>
                  {results.isGoogleSheets ? 'Это Google Sheets URL' : 'Это НЕ Google Sheets URL'}
                </span>
              </div>

              {results.isGoogleSheets && (
                <>
                  {/* Информация о документе */}
                  <Card className="bg-blue-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Информация о документе</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label>ID документа:</Label>
                          <p className="font-mono bg-white p-1 rounded text-xs break-all">
                            {results.parsedInfo.documentId || 'Не найден'}
                          </p>
                        </div>
                        <div>
                          <Label>ID листа:</Label>
                          <p className="font-mono bg-white p-1 rounded text-xs">
                            {results.parsedInfo.sheetId || '0 (первый лист)'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Преобразованный URL */}
                  <Card className="bg-green-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Преобразованный URL для экспорта</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Input
                          value={results.convertedUrl}
                          readOnly
                          className="font-mono text-xs"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(results.convertedUrl)}
                        >
                          Копировать
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(results.convertedUrl, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Результат валидации */}
                  <Card className={results.validationResult?.isAccessible ? 'bg-green-50' : 'bg-red-50'}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        {results.validationResult?.isAccessible ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                        Проверка доступности
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className={`text-sm ${results.validationResult?.isAccessible ? 'text-green-700' : 'text-red-700'}`}>
                        {results.validationResult?.isAccessible 
                          ? 'Документ доступен для импорта' 
                          : results.validationResult?.error || 'Ошибка проверки доступности'
                        }
                      </p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleSheetsImportDemo;
