import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, createCorsResponse, createJsonResponse } from '../_shared/cors.ts';
import { isServiceRoleRequest } from '../_shared/auth.ts';

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const BUCKET_NAME = 'project-images';
const MAX_SIZE_MB = 1;
const MAX_WIDTH_OR_HEIGHT = 1920;
const WEBP_QUALITY = 0.8;

// Расширения файлов для обработки
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
const WEBP_EXTENSION = '.webp';

interface ImageMapping {
  oldPath: string;
  oldUrl: string;
  newPath: string;
  newUrl: string;
}

/**
 * Проверяет, нужно ли обрабатывать файл
 */
function shouldProcessFile(fileName: string): boolean {
  const lowerName = fileName.toLowerCase();
  
  // Пропускаем уже WebP файлы
  if (lowerName.endsWith(WEBP_EXTENSION)) {
    return false;
  }
  
  // Обрабатываем только указанные форматы
  return IMAGE_EXTENSIONS.some(ext => lowerName.endsWith(ext));
}

/**
 * Получает новое имя файла с расширением .webp
 */
function getWebPFileName(filePath: string): string {
  // Удаляем старое расширение
  let newPath = filePath;
  for (const ext of IMAGE_EXTENSIONS) {
    if (filePath.toLowerCase().endsWith(ext)) {
      newPath = filePath.slice(0, -ext.length);
      break;
    }
  }
  
  // Добавляем .webp
  return newPath + WEBP_EXTENSION;
}

/**
 * Вычисляет размер файла в мегабайтах
 */
function getFileSizeMB(bytes: number): number {
  return bytes / (1024 * 1024);
}

/**
 * Загружает WASM библиотеку для обработки изображений
 */
let imageWasmModule: any = null;

async function getImageWasm() {
  if (imageWasmModule) {
    return imageWasmModule;
  }
  
  try {
    // Используем @squoosh/lib через esm.sh
    // Это WASM библиотека, которая работает в Deno
    const squoosh = await import('https://esm.sh/@squoosh/lib@0.4.0?target=deno');
    imageWasmModule = squoosh;
    return imageWasmModule;
  } catch (error) {
    console.warn('Failed to load @squoosh/lib, trying alternative:', error);
    
    // Альтернатива: используем image-wasm или другую библиотеку
    try {
      const imageWasm = await import('https://esm.sh/image-wasm@0.1.0?target=deno');
      imageWasmModule = imageWasm;
      return imageWasmModule;
    } catch (error2) {
      throw new Error('Image processing library not available');
    }
  }
}

/**
 * Конвертирует изображение в WebP используя WASM библиотеку
 */
async function convertToWebP(
  imageBlob: Blob,
  maxSizeMB: number,
  maxWidthOrHeight: number
): Promise<Blob> {
  try {
    // Пробуем использовать WASM библиотеку
    const imageWasm = await getImageWasm();
    
    // Конвертируем Blob в Uint8Array
    const arrayBuffer = await imageBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Используем @squoosh/lib для обработки
    if (imageWasm.default && imageWasm.ImagePool) {
      const ImagePool = imageWasm.ImagePool;
      const pool = new ImagePool();
      
      const image = pool.ingestImage(uint8Array);
      
      // Получаем метаданные
      const { bitmap } = await image.decoded;
      let { width, height } = bitmap;
      
      // Вычисляем новые размеры
      let newWidth = width;
      let newHeight = height;
      
      if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
        if (width > height) {
          newWidth = maxWidthOrHeight;
          newHeight = Math.round((height * maxWidthOrHeight) / width);
        } else {
          newHeight = maxWidthOrHeight;
          newWidth = Math.round((width * maxWidthOrHeight) / height);
        }
        
        // Изменяем размер
        await image.preprocess({ 
          resize: { enabled: true, width: newWidth, height: newHeight }
        });
      }
      
      // Конвертируем в WebP
      let quality = Math.round(WEBP_QUALITY * 100);
      let webpResult: any;
      
      // Пробуем с разным качеством
      let attempts = 0;
      const maxAttempts = 10;
      
      do {
        await image.encode({
          webp: {
            quality: quality,
            target_size: maxSizeMB * 1024 * 1024,
          }
        });
        
        webpResult = image.encoded.webp;
        const sizeMB = getFileSizeMB(webpResult.binary.length);
        
        if (sizeMB <= maxSizeMB || quality <= 10 || attempts >= maxAttempts) {
          break;
        }
        
        quality = Math.max(10, quality - 5);
        attempts++;
      } while (attempts < maxAttempts);
      
      await pool.close();
      
      return new Blob([webpResult.binary], { type: 'image/webp' });
    }
    
    throw new Error('Image processing library format not supported');
    
  } catch (error) {
    // Если WASM библиотеки не работают, пробуем простой подход:
    // пропускаем файлы, которые не могут быть обработаны
    console.error('WASM conversion failed:', error);
    throw new Error(`Unable to convert image with available libraries: ${error.message}`);
  }
}

/**
 * Обрабатывает один файл: скачивает, конвертирует, загружает, удаляет старый
 */
async function processImageFile(
  filePath: string,
  urlMapping: Map<string, ImageMapping>
): Promise<void> {
  try {
    console.log(`Processing: ${filePath}`);
    
    // Скачиваем оригинал
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(BUCKET_NAME)
      .download(filePath);
    
    if (downloadError) {
      throw new Error(`Failed to download: ${downloadError.message}`);
    }
    
    if (!fileData) {
      throw new Error('No file data received');
    }
    
    // Конвертируем в WebP
    const webpBlob = await convertToWebP(
      fileData,
      MAX_SIZE_MB,
      MAX_WIDTH_OR_HEIGHT
    );
    
    // Получаем новое имя файла
    const newFilePath = getWebPFileName(filePath);
    
    // Получаем старый публичный URL
    const { data: oldUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);
    
    // Загружаем новое WebP изображение
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(newFilePath, webpBlob, {
        contentType: 'image/webp',
        upsert: true // Заменяем, если уже существует
      });
    
    if (uploadError) {
      throw new Error(`Failed to upload: ${uploadError.message}`);
    }
    
    // Получаем новый публичный URL
    const { data: newUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(newFilePath);
    
    // Сохраняем маппинг
    urlMapping.set(oldUrlData.publicUrl, {
      oldPath: filePath,
      oldUrl: oldUrlData.publicUrl,
      newPath: newFilePath,
      newUrl: newUrlData.publicUrl
    });
    
    // Удаляем старый файл
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);
    
    if (deleteError) {
      console.warn(`Failed to delete old file ${filePath}: ${deleteError.message}`);
    } else {
      console.log(`Converted and replaced: ${filePath} -> ${newFilePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    throw error;
  }
}

/**
 * Обновляет ссылки на изображения в базе данных
 */
async function updateDatabaseUrls(
  urlMapping: Map<string, ImageMapping>
): Promise<{ updated: number; errors: string[] }> {
  let totalUpdated = 0;
  const errors: string[] = [];
  
  // Массив всех маппингов для удобства
  const mappings = Array.from(urlMapping.values());
  
  if (mappings.length === 0) {
    return { updated: 0, errors: [] };
  }
  
  // Обновляем apartment_photos используя batch обновление
  try {
    for (const mapping of mappings) {
      const { data, error } = await supabase
        .from('apartment_photos')
        .update({ image_url: mapping.newUrl })
        .eq('image_url', mapping.oldUrl);
      
      if (error) {
        console.warn(`Failed to update apartment_photos for ${mapping.oldUrl}:`, error);
      } else if (data && data.length > 0) {
        totalUpdated += data.length;
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    errors.push(`apartment_photos: ${errorMsg}`);
  }
  
  // Обновляем layout_photos
  try {
    for (const mapping of mappings) {
      const { data, error } = await supabase
        .from('layout_photos')
        .update({ image_url: mapping.newUrl })
        .eq('image_url', mapping.oldUrl);
      
      if (error) {
        console.warn(`Failed to update layout_photos for ${mapping.oldUrl}:`, error);
      } else if (data && data.length > 0) {
        totalUpdated += data.length;
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    errors.push(`layout_photos: ${errorMsg}`);
  }
  
  // Обновляем floor_plans
  try {
    for (const mapping of mappings) {
      const { data, error } = await supabase
        .from('floor_plans')
        .update({ image_url: mapping.newUrl })
        .eq('image_url', mapping.oldUrl);
      
      if (error) {
        console.warn(`Failed to update floor_plans for ${mapping.oldUrl}:`, error);
      } else if (data && data.length > 0) {
        totalUpdated += data.length;
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    errors.push(`floor_plans: ${errorMsg}`);
  }
  
  // Обновляем projects.building_image_url
  try {
    for (const mapping of mappings) {
      const { data, error } = await supabase
        .from('projects')
        .update({ building_image_url: mapping.newUrl })
        .eq('building_image_url', mapping.oldUrl);
      
      if (error) {
        console.warn(`Failed to update projects for ${mapping.oldUrl}:`, error);
      } else if (data && data.length > 0) {
        totalUpdated += data.length;
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    errors.push(`projects: ${errorMsg}`);
  }
  
  return { updated: totalUpdated, errors };
}

/**
 * Главная функция обработки
 */
Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  
  // Обработка CORS preflight
  if (req.method === 'OPTIONS') {
    return createCorsResponse(origin);
  }
  
  try {
    // Restrict to server-to-server calls (Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>)
    if (!isServiceRoleRequest(req)) {
      return createJsonResponse({ error: 'forbidden' }, 403, origin);
    }

    console.log('Starting image optimization...');
    
    // Получаем список всех файлов из bucket
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', {
        limit: 10000, // Максимальное количество файлов
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (listError) {
      throw new Error(`Failed to list files: ${listError.message}`);
    }
    
    if (!files || files.length === 0) {
      return createJsonResponse(
        { message: 'No files found', processed: 0, updated: 0 },
        200,
        origin
      );
    }
    
    // Рекурсивно получаем все файлы из всех папок
    const allFiles: Array<{ path: string; name: string }> = [];
    
    async function getAllFiles(folder: string = ''): Promise<void> {
      const { data: folderFiles, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(folder, {
          limit: 10000,
          sortBy: { column: 'name', order: 'asc' }
        });
      
      if (error) {
        console.warn(`Error listing folder ${folder}:`, error);
        return;
      }
      
      if (!folderFiles) return;
      
      for (const item of folderFiles) {
        const itemPath = folder ? `${folder}/${item.name}` : item.name;
        
        if (item.id === null) {
          // Это папка, рекурсивно обрабатываем
          await getAllFiles(itemPath);
        } else {
          // Это файл
          allFiles.push({ path: itemPath, name: item.name });
        }
      }
    }
    
    await getAllFiles();
    
    // Фильтруем файлы для обработки
    const filesToProcess = allFiles.filter(file => shouldProcessFile(file.name));
    
    console.log(`Found ${filesToProcess.length} files to process out of ${allFiles.length} total files`);
    
    if (filesToProcess.length === 0) {
      return createJsonResponse(
        { message: 'No files to process', processed: 0, updated: 0 },
        200,
        origin
      );
    }
    
    // Обрабатываем файлы и создаем маппинг URL
    const urlMapping = new Map<string, ImageMapping>();
    const processingErrors: string[] = [];
    let processedCount = 0;
    
    // Обрабатываем файлы батчами для избежания тайм-аутов
    const BATCH_SIZE = 10;
    for (let i = 0; i < filesToProcess.length; i += BATCH_SIZE) {
      const batch = filesToProcess.slice(i, i + BATCH_SIZE);
      
      await Promise.allSettled(
        batch.map(file => 
          processImageFile(file.path, urlMapping)
            .then(() => {
              processedCount++;
              console.log(`Progress: ${processedCount}/${filesToProcess.length}`);
            })
            .catch(error => {
              processingErrors.push(`${file.path}: ${error.message}`);
              console.error(`Failed to process ${file.path}:`, error);
            })
        )
      );
    }
    
    console.log(`Processed ${processedCount} files`);
    console.log(`URL mapping size: ${urlMapping.size}`);
    
    // Обновляем ссылки в базе данных
    const { updated, errors: dbErrors } = await updateDatabaseUrls(urlMapping);
    
    const allErrors = [...processingErrors, ...dbErrors];
    
    return createJsonResponse(
      {
        message: 'Image optimization completed',
        processed: processedCount,
        totalFiles: filesToProcess.length,
        urlMappings: urlMapping.size,
        databaseUpdated: updated,
        errors: allErrors.length > 0 ? allErrors : undefined
      },
      200,
      origin
    );
  } catch (error) {
    console.error('Error in optimize-images function:', error);
    return createJsonResponse(
      {
        error: error.message || 'Unknown error occurred',
        details: error.toString()
      },
      500,
      origin
    );
  }
});

