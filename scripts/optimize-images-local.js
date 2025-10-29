/**
 * Локальный скрипт для оптимизации изображений в Supabase Storage
 * Использует sharp для конвертации изображений в WebP
 * 
 * Требования:
 * npm install sharp @supabase/supabase-js dotenv
 * 
 * Использование:
 * 1. Создайте .env файл с вашими Supabase credentials:
 *    SUPABASE_URL=your_url
 *    SUPABASE_SERVICE_ROLE_KEY=your_key
 * 2. Запустите: node scripts/optimize-images-local.js
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import 'dotenv/config';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const BUCKET_NAME = 'project-images';
const MAX_SIZE_MB = 1;
const MAX_WIDTH_OR_HEIGHT = 1920;
const WEBP_QUALITY = 80;

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
const WEBP_EXTENSION = '.webp';

/**
 * Получает новое имя файла с расширением .webp
 */
function getWebPFileName(filePath) {
  let newPath = filePath;
  for (const ext of IMAGE_EXTENSIONS) {
    if (filePath.toLowerCase().endsWith(ext)) {
      newPath = filePath.slice(0, -ext.length);
      break;
    }
  }
  return newPath + WEBP_EXTENSION;
}

/**
 * Проверяет, нужно ли обрабатывать файл
 */
function shouldProcessFile(fileName) {
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith(WEBP_EXTENSION)) {
    return false;
  }
  return IMAGE_EXTENSIONS.some(ext => lowerName.endsWith(ext));
}

/**
 * Конвертирует изображение в WebP с сжатием
 */
async function convertToWebP(imageBuffer, maxSizeMB, maxWidthOrHeight) {
  try {
    // Получаем метаданные
    const metadata = await sharp(imageBuffer).metadata();
    let { width, height } = metadata;
    
    if (!width || !height) {
      throw new Error('Failed to get image dimensions');
    }
    
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
    }
    
    // Конвертируем в WebP с начальным качеством
    let quality = WEBP_QUALITY;
    let webpBuffer;
    
    // Пробуем с разным качеством пока не достигнем нужного размера
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      webpBuffer = await sharp(imageBuffer)
        .resize(newWidth, newHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: quality, effort: 4 })
        .toBuffer();
      
      const sizeMB = webpBuffer.length / (1024 * 1024);
      
      if (sizeMB <= maxSizeMB || quality <= 10 || attempts >= maxAttempts) {
        break;
      }
      
      quality = Math.max(10, quality - 5);
      attempts++;
    } while (attempts < maxAttempts);
    
    return webpBuffer;
  } catch (error) {
    throw new Error(`Conversion failed: ${error.message}`);
  }
}

/**
 * Обрабатывает один файл
 */
async function processImageFile(filePath, urlMapping) {
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
    
    // Конвертируем в buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Конвертируем в WebP
    const webpBuffer = await convertToWebP(buffer, MAX_SIZE_MB, MAX_WIDTH_OR_HEIGHT);
    
    // Получаем новое имя файла
    const newFilePath = getWebPFileName(filePath);
    
    // Получаем старый публичный URL
    const { data: oldUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);
    
    // Загружаем новое WebP изображение
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(newFilePath, webpBuffer, {
        contentType: 'image/webp',
        upsert: true
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
      console.log(`✓ Converted and replaced: ${filePath} -> ${newFilePath}`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    throw error;
  }
}

/**
 * Обновляет ссылки в базе данных
 */
async function updateDatabaseUrls(urlMapping) {
  let totalUpdated = 0;
  const errors = [];
  
  const mappings = Array.from(urlMapping.values());
  
  if (mappings.length === 0) {
    return { updated: 0, errors: [] };
  }
  
  // Обновляем apartment_photos
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
    errors.push(`apartment_photos: ${error.message}`);
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
    errors.push(`layout_photos: ${error.message}`);
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
    errors.push(`floor_plans: ${error.message}`);
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
    errors.push(`projects: ${error.message}`);
  }
  
  return { updated: totalUpdated, errors };
}

/**
 * Рекурсивно получает все файлы из папки
 */
async function getAllFiles(folder = '') {
  const allFiles = [];
  
  async function recurse(currentFolder) {
    const { data: folderFiles, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(currentFolder, {
        limit: 10000,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (error) {
      console.warn(`Error listing folder ${currentFolder}:`, error);
      return;
    }
    
    if (!folderFiles) return;
    
    for (const item of folderFiles) {
      const itemPath = currentFolder ? `${currentFolder}/${item.name}` : item.name;
      
      if (item.id === null) {
        // Это папка, рекурсивно обрабатываем
        await recurse(itemPath);
      } else {
        // Это файл
        allFiles.push({ path: itemPath, name: item.name });
      }
    }
  }
  
  await recurse(folder);
  return allFiles;
}

/**
 * Главная функция
 */
async function main() {
  try {
    console.log('Starting image optimization...\n');
    
    // Получаем все файлы
    const allFiles = await getAllFiles();
    console.log(`Found ${allFiles.length} total files\n`);
    
    // Фильтруем файлы для обработки
    const filesToProcess = allFiles.filter(file => shouldProcessFile(file.name));
    console.log(`Files to process: ${filesToProcess.length}\n`);
    
    if (filesToProcess.length === 0) {
      console.log('No files to process');
      return;
    }
    
    // Обрабатываем файлы
    const urlMapping = new Map();
    const processingErrors = [];
    let processedCount = 0;
    
    // Обрабатываем файлы батчами
    const BATCH_SIZE = 5; // Меньше батч для локального выполнения
    for (let i = 0; i < filesToProcess.length; i += BATCH_SIZE) {
      const batch = filesToProcess.slice(i, i + BATCH_SIZE);
      
      await Promise.allSettled(
        batch.map(file => 
          processImageFile(file.path, urlMapping)
            .then(() => {
              processedCount++;
              console.log(`Progress: ${processedCount}/${filesToProcess.length}\n`);
            })
            .catch(error => {
              processingErrors.push(`${file.path}: ${error.message}`);
              console.error(`Failed to process ${file.path}: ${error.message}\n`);
            })
        )
      );
    }
    
    console.log(`\nProcessed ${processedCount} files`);
    console.log(`URL mapping size: ${urlMapping.size}\n`);
    
    // Обновляем ссылки в базе данных
    console.log('Updating database URLs...\n');
    const { updated, errors: dbErrors } = await updateDatabaseUrls(urlMapping);
    
    const allErrors = [...processingErrors, ...dbErrors];
    
    console.log('\n=== Summary ===');
    console.log(`Processed: ${processedCount}`);
    console.log(`Total files: ${filesToProcess.length}`);
    console.log(`URL mappings: ${urlMapping.size}`);
    console.log(`Database updated: ${updated}`);
    
    if (allErrors.length > 0) {
      console.log(`\nErrors: ${allErrors.length}`);
      allErrors.forEach(err => console.log(`  - ${err}`));
    }
    
  } catch (error) {
    console.error('Error in main function:', error);
    process.exit(1);
  }
}

// Запускаем
main();

