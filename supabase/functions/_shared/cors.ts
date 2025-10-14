/**
 * Единая CORS конфигурация для всех Supabase функций
 */

export interface CorsHeaders {
  'Access-Control-Allow-Origin': string;
  'Access-Control-Allow-Headers': string;
  'Access-Control-Allow-Methods': string;
  'Access-Control-Max-Age': string;
}

/**
 * Получает CORS заголовки для ответа
 * @param origin - Origin из запроса
 * @param allowedOrigins - Массив разрешенных origins (по умолчанию разрешены все)
 * @returns Объект с CORS заголовками
 */
export function getCorsHeaders(
  origin: string | null,
  allowedOrigins: string[] = ['*']
): CorsHeaders {
  const headers: CorsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  // Если указаны конкретные origins, проверяем их
  if (allowedOrigins.length > 0 && !allowedOrigins.includes('*')) {
    if (origin && allowedOrigins.includes(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
    } else if (origin) {
      // Если origin не разрешен, не устанавливаем заголовок
      delete headers['Access-Control-Allow-Origin'];
    }
  }

  return headers;
}

/**
 * Создает CORS ответ для OPTIONS запроса
 * @param origin - Origin из запроса
 * @param allowedOrigins - Массив разрешенных origins
 * @returns Response для OPTIONS запроса
 */
export function createCorsResponse(
  origin: string | null,
  allowedOrigins: string[] = ['*']
): Response {
  const corsHeaders = getCorsHeaders(origin, allowedOrigins);
  
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

/**
 * Создает JSON ответ с CORS заголовками
 * @param data - Данные для ответа
 * @param status - HTTP статус
 * @param origin - Origin из запроса
 * @param allowedOrigins - Массив разрешенных origins
 * @returns Response с JSON данными и CORS заголовками
 */
export function createJsonResponse(
  data: any,
  status: number = 200,
  origin: string | null = null,
  allowedOrigins: string[] = ['*']
): Response {
  const corsHeaders = getCorsHeaders(origin, allowedOrigins);
  
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Проверяет, разрешен ли origin
 * @param origin - Origin из запроса
 * @param allowedOrigins - Массив разрешенных origins
 * @returns true если origin разрешен
 */
export function isOriginAllowed(
  origin: string | null,
  allowedOrigins: string[] = ['*']
): boolean {
  if (allowedOrigins.includes('*')) {
    return true;
  }
  
  if (!origin) {
    return false;
  }
  
  return allowedOrigins.includes(origin);
}
