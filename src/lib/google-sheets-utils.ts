/**
 * Утилиты для работы с Google Sheets
 */

/**
 * Преобразует различные форматы Google Sheets URL в правильный формат для экспорта
 */
export function convertGoogleSheetsUrl(url: string): string {
  // Удаляем пробелы и приводим к нижнему регистру для проверки
  const cleanUrl = url.trim();
  
  // Проверяем, является ли это уже правильным экспортным URL
  if (cleanUrl.includes('/export?format=xlsx') || cleanUrl.includes('/export?format=csv')) {
    return cleanUrl;
  }
  
  // Извлекаем ID документа из различных форматов URL
  let documentId = '';
  let sheetId = '';
  
  // Паттерны для различных форматов Google Sheets URL
  const patterns = [
    // Стандартный формат: https://docs.google.com/spreadsheets/d/{documentId}/edit#gid={sheetId}
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)\/edit.*?gid=([0-9]+)/,
    // Формат без gid: https://docs.google.com/spreadsheets/d/{documentId}/edit
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)\/edit/,
    // Формат просмотра: https://docs.google.com/spreadsheets/d/{documentId}/view
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)\/view/,
    // Короткий формат: https://docs.google.com/spreadsheets/d/{documentId}
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match) {
      documentId = match[1];
      sheetId = match[2] || '0'; // Используем первый лист по умолчанию
      break;
    }
  }
  
  if (!documentId) {
    throw new Error('Не удалось извлечь ID документа из URL Google Sheets');
  }
  
  // Создаем правильный URL для экспорта в формате Excel
  // Если указан конкретный лист, используем его
  if (sheetId && sheetId !== '0') {
    return `https://docs.google.com/spreadsheets/d/${documentId}/export?format=xlsx&gid=${sheetId}`;
  } else {
    return `https://docs.google.com/spreadsheets/d/${documentId}/export?format=xlsx`;
  }
}

/**
 * Проверяет, является ли URL ссылкой на Google Sheets
 */
export function isGoogleSheetsUrl(url: string): boolean {
  const cleanUrl = url.trim().toLowerCase();
  return cleanUrl.includes('docs.google.com/spreadsheets');
}

/**
 * Получает информацию о документе Google Sheets из URL
 */
export function parseGoogleSheetsUrl(url: string): {
  documentId: string;
  sheetId: string;
  isValid: boolean;
} {
  try {
    const cleanUrl = url.trim();
    
    const patterns = [
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)\/edit.*?gid=([0-9]+)/,
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)\/edit/,
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)\/view/,
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = cleanUrl.match(pattern);
      if (match) {
        return {
          documentId: match[1],
          sheetId: match[2] || '0',
          isValid: true
        };
      }
    }
    
    return {
      documentId: '',
      sheetId: '',
      isValid: false
    };
  } catch (error) {
    return {
      documentId: '',
      sheetId: '',
      isValid: false
    };
  }
}

/**
 * Создает инструкции для пользователей по настройке доступа к Google Sheets
 */
export function getGoogleSheetsInstructions(): {
  title: string;
  steps: string[];
  tips: string[];
} {
  return {
    title: 'Как настроить Google Sheets для импорта',
    steps: [
      'Откройте ваш Google Sheets документ',
      'Нажмите кнопку "Поделиться" в правом верхнем углу',
      'В разделе "Общий доступ" выберите "Доступен всем в интернете"',
      'Убедитесь, что установлен режим "Читатель"',
      'Скопируйте ссылку на документ и вставьте её в поле выше'
    ],
    tips: [
      'Первая строка должна содержать заголовки столбцов',
      'Поддерживаются любые форматы ссылок Google Sheets',
      'Документ будет автоматически преобразован в формат Excel для импорта',
      'После настройки данные будут синхронизироваться автоматически'
    ]
  };
}

/**
 * Валидирует доступность Google Sheets документа
 */
export async function validateGoogleSheetsAccess(url: string): Promise<{
  isAccessible: boolean;
  error?: string;
  convertedUrl?: string;
}> {
  try {
    if (!isGoogleSheetsUrl(url)) {
      return {
        isAccessible: false,
        error: 'URL не является ссылкой на Google Sheets'
      };
    }
    
    const convertedUrl = convertGoogleSheetsUrl(url);
    
    // Проверяем доступность документа
    const response = await fetch(convertedUrl, {
      method: 'HEAD',
      mode: 'cors'
    });
    
    if (response.ok) {
      return {
        isAccessible: true,
        convertedUrl
      };
    } else if (response.status === 403) {
      return {
        isAccessible: false,
        error: 'Документ недоступен. Убедитесь, что он открыт для публичного доступа'
      };
    } else {
      return {
        isAccessible: false,
        error: `Ошибка доступа: ${response.status} ${response.statusText}`
      };
    }
  } catch (error) {
    return {
      isAccessible: false,
      error: 'Ошибка при проверке доступа к документу'
    };
  }
}
