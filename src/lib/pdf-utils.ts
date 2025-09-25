import jsPDF from 'jspdf';
import { PDFDocument } from 'pdf-lib';
import { Apartment } from '@/types/apartment';
import { formatPriceWithCurrency } from './currency-utils';

interface PDFGenerationOptions {
  apartment: Apartment;
  projectCurrency: string | null;
  photos: Array<{
    id: string;
    image_url: string;
    description?: string;
    type: 'layout' | 'apartment';
  }>;
  pdf_main?: string | ArrayBuffer | Uint8Array;
  translations: {
    apartmentDetails: string;
    apartmentNumber: string;
    floor: string;
    rooms: string;
    area: string;
    price: string;
    status: string;
    photos: string;
    layout: string;
    apartmentPhoto: string;
    studio: string;
    available: string;
    reserved: string;
    sold: string;
    generatedOn: string;
  };
}

// Современная цветовая палитра
const COLORS = {
  primary: { r: 79, g: 70, b: 229 },      // Indigo-600
  secondary: { r: 71, g: 85, b: 105 },     // Slate-600  
  success: { r: 34, g: 197, b: 94 },       // Emerald-500
  warning: { r: 245, g: 158, b: 11 },      // Amber-500
  danger: { r: 239, g: 68, b: 68 },        // Red-500
  light: { r: 248, g: 250, b: 252 },       // Slate-50
  dark: { r: 15, g: 23, b: 42 },           // Slate-900
  border: { r: 226, g: 232, b: 240 },      // Slate-200
  accent: { r: 168, g: 85, b: 247 },       // Purple-500
  surface: { r: 255, g: 255, b: 255 },     // White
  muted: { r: 148, g: 163, b: 184 }        // Slate-400
};

// Функция для загрузки PDF файла
const loadPDFFile = async (pdfSource: string | ArrayBuffer | Uint8Array): Promise<ArrayBuffer> => {
  if (typeof pdfSource === 'string') {
    const response = await fetch(pdfSource);
    if (!response.ok) {
      throw new Error(`Failed to load PDF from URL: ${pdfSource}`);
    }
    return await response.arrayBuffer();
  } else if (pdfSource instanceof ArrayBuffer) {
    return pdfSource;
  } else if (pdfSource instanceof Uint8Array) {
    const buffer = new ArrayBuffer(pdfSource.byteLength);
    const view = new Uint8Array(buffer);
    view.set(pdfSource);
    return buffer;
  } else {
    throw new Error('Unsupported PDF source type');
  }
};

// Функция для загрузки изображения как base64
const loadImageAsBase64 = async (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      try {
        const dataURL = canvas.toDataURL('image/jpeg', 0.9);
        resolve(dataURL);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
};

// Функция для получения размеров изображения с сохранением пропорций
const getImageDimensions = (imgWidth: number, imgHeight: number, maxWidth: number, maxHeight: number) => {
  const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
  return {
    width: imgWidth * ratio,
    height: imgHeight * ratio
  };
};

// Утилиты
const capitalizeFirstLetter = (str: string) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const setColor = (pdf: jsPDF, color: {r: number, g: number, b: number}, type: 'fill' | 'text' | 'draw' = 'fill') => {
  if (type === 'fill') pdf.setFillColor(color.r, color.g, color.b);
  else if (type === 'text') pdf.setTextColor(color.r, color.g, color.b);
  else pdf.setDrawColor(color.r, color.g, color.b);
};

// Современные компоненты дизайна
const drawModernCard = (pdf: jsPDF, x: number, y: number, width: number, height: number, scale: (n: number) => number, elevated = false) => {
  // Тень (для elevated карточек)
  if (elevated) {
    setColor(pdf, { r: 0, g: 0, b: 0 });
    pdf.setGState(new (pdf as any).GState({ opacity: 0.1 }));
    pdf.roundedRect(x + scale(1), y + scale(1), width, height, scale(4), scale(4), 'F');
    pdf.setGState(new (pdf as any).GState({ opacity: 1 }));
  }
  
  // Основная карточка
  setColor(pdf, COLORS.surface);
  pdf.roundedRect(x, y, width, height, scale(4), scale(4), 'F');
  
  // Тонкая граница
  setColor(pdf, COLORS.border, 'draw');
  pdf.setLineWidth(scale(0.3));
  pdf.roundedRect(x, y, width, height, scale(4), scale(4), 'D');
};

const drawGradientHeader = (pdf: jsPDF, x: number, y: number, width: number, height: number, scale: (n: number) => number) => {
  // Основной градиент (имитируем через несколько прямоугольников)
  const steps = 20;
  const stepHeight = height / steps;
  
  for (let i = 0; i < steps; i++) {
    const ratio = i / steps;
    const r = Math.round(COLORS.primary.r + (COLORS.accent.r - COLORS.primary.r) * ratio);
    const g = Math.round(COLORS.primary.g + (COLORS.accent.g - COLORS.primary.g) * ratio);
    const b = Math.round(COLORS.primary.b + (COLORS.accent.b - COLORS.primary.b) * ratio);
    
    pdf.setFillColor(r, g, b);
    pdf.rect(x, y + (i * stepHeight), width, stepHeight, 'F');
  }
  
  // Закругленные углы поверх
  setColor(pdf, COLORS.primary);
  pdf.roundedRect(x, y, width, height, scale(4), scale(4), 'F');
  
  // Добавляем легкий блик
  setColor(pdf, { r: 255, g: 255, b: 255 });
  pdf.setGState(new (pdf as any).GState({ opacity: 0.2 }));
  pdf.roundedRect(x, y, width, height * 0.5, scale(4), scale(4), 'F');
  pdf.setGState(new (pdf as any).GState({ opacity: 1 }));
};

const drawIconText = (pdf: jsPDF, icon: string, text: string, x: number, y: number, scale: (n: number) => number, scaledFontSize: (n: number, min?: number, max?: number) => number) => {
  // Иконка (используем символы Unicode)
  setColor(pdf, COLORS.primary, 'text');
  pdf.setFontSize(scaledFontSize(12, 8, 20));
  pdf.setFont('helvetica', 'normal');
  pdf.text(icon, x, y);
  
  // Текст
  setColor(pdf, COLORS.dark, 'text');
  pdf.setFontSize(scaledFontSize(10, 8, 16));
  pdf.setFont('helvetica', 'normal');
  pdf.text(text, x + scale(6), y);
};

const drawModernBadge = (pdf: jsPDF, text: string, x: number, y: number, colorType: 'success' | 'warning' | 'danger' | 'primary', scale: (n: number) => number, scaledFontSize: (n: number, min?: number, max?: number) => number) => {
  const color = COLORS[colorType];
  
  // Измеряем текст
  pdf.setFontSize(scaledFontSize(9, 7, 14));
  pdf.setFont('helvetica', 'bold');
  const textWidth = pdf.getTextWidth(text);
  const badgeWidth = textWidth + scale(8);
  const badgeHeight = scale(5.5);
  
  // Фон бейджа с градиентом (упрощенная версия)
  setColor(pdf, color);
  pdf.roundedRect(x, y - badgeHeight + scale(1), badgeWidth, badgeHeight, scale(2.5), scale(2.5), 'F');
  
  // Блик на бейдже
  setColor(pdf, { r: 255, g: 255, b: 255 });
  pdf.setGState(new (pdf as any).GState({ opacity: 0.3 }));
  pdf.roundedRect(x, y - badgeHeight + scale(1), badgeWidth, badgeHeight * 0.5, scale(2.5), scale(2.5), 'F');
  pdf.setGState(new (pdf as any).GState({ opacity: 1 }));
  
  // Текст
  setColor(pdf, { r: 255, g: 255, b: 255 }, 'text');
  pdf.text(text, x + scale(4), y - scale(1.5));
  
  return badgeWidth;
};

const drawStatCard = (pdf: jsPDF, icon: string, label: string, value: string, x: number, y: number, width: number, scale: (n: number) => number, scaledFontSize: (n: number, min?: number, max?: number) => number) => {
  const cardHeight = scale(16);
  
  // Карточка
  drawModernCard(pdf, x, y, width, cardHeight, scale, true);
  
  // Иконка
  setColor(pdf, COLORS.primary, 'text');
  pdf.setFontSize(scaledFontSize(14, 10, 24));
  pdf.text(icon, x + scale(4), y + scale(8));
  
  // Значение (крупно)
  setColor(pdf, COLORS.dark, 'text');
  pdf.setFontSize(scaledFontSize(14, 10, 24));
  pdf.setFont('helvetica', 'bold');
  pdf.text(value, x + scale(12), y + scale(8));
  
  // Лейбл (мелко)
  setColor(pdf, COLORS.muted, 'text');
  pdf.setFontSize(scaledFontSize(8, 6, 14));
  pdf.setFont('helvetica', 'normal');
  pdf.text(label, x + scale(4), y + scale(13));
};

/**
 * Генерирует стильный и компактный PDF с деталями квартиры
 */
export const generateApartmentPDF = async (options: PDFGenerationOptions): Promise<void> => {
  const { apartment, projectCurrency, photos, translations, pdf_main } = options;

  try {
    const mainPdfBytes = pdf_main ? await loadPDFFile(pdf_main) : null;
    const mainPdfDoc = mainPdfBytes ? await PDFDocument.load(mainPdfBytes) : null;
    
    const [firstPage] = mainPdfDoc ? mainPdfDoc.getPages() : [];
    const { width, height } = firstPage ? firstPage.getSize() : { width: 210, height: 297 };

    const pdf = new jsPDF({
      orientation: firstPage ? (width > height ? 'l' : 'p') : 'p',
      unit: firstPage ? 'pt' : 'mm', 
      format: firstPage ? [width, height] : 'a4'
    });
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Масштабирование
    const unit = (firstPage ? 'pt' : 'mm') as 'pt' | 'mm';
    const unitToMm = unit === 'pt' ? (25.4 / 72) : 1;
    const baseShortSideMm = 210;
    const currentShortSideMm = Math.min(pageWidth, pageHeight) * unitToMm;
    const scaleFactor = currentShortSideMm / baseShortSideMm;
    const scale = (nMm: number) => (nMm * scaleFactor) / unitToMm;
    const scaledFontSize = (n: number, min = 6, max = 28) => Math.max(min, Math.min(max, n * scaleFactor));
    
    const margin = scale(8);
    const contentWidth = pageWidth - (margin * 2);
    
    let yPosition = margin;

    // === СТИЛЬНЫЙ ЗАГОЛОВОК ===
    const headerHeight = scale(35);
    drawGradientHeader(pdf, 0, 0, pageWidth, headerHeight, scale);
    
    // Номер квартиры (крупно, слева)
    setColor(pdf, { r: 255, g: 255, b: 255 }, 'text');
    pdf.setFontSize(scaledFontSize(28, 16, 48));
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${apartment.apartment_number}`, margin, scale(16));
    
    // Статус (справа)
    let statusText: string = apartment.status;
    let statusColor: 'success' | 'warning' | 'danger' = 'success';
    
    switch (apartment.status) {
      case 'available':
        statusText = translations.available;
        statusColor = 'success';
        break;
      case 'reserved':
        statusText = translations.reserved;
        statusColor = 'warning';
        break;
      case 'sold':
        statusText = translations.sold;
        statusColor = 'danger';
        break;
    }
    
    const badgeX = pageWidth - margin - scale(25);
    drawModernBadge(pdf, statusText, badgeX, scale(18), statusColor, scale, scaledFontSize);
    
    yPosition = headerHeight + scale(8);

    // === КОМПАКТНАЯ ИНФОРМАЦИЯ В 4 КОЛОНКИ ===
    const statCards = [
      { icon: '🏢', label: capitalizeFirstLetter(translations.floor), value: apartment.floor_number.toString() },
      { icon: '🏠', label: capitalizeFirstLetter(translations.rooms), value: apartment.rooms === 0 ? translations.studio : apartment.rooms.toString() },
      { icon: '📐', label: capitalizeFirstLetter(translations.area), value: `${apartment.area} m²` },
      ...(apartment.price ? [{ icon: '💰', label: translations.price, value: formatPriceWithCurrency(apartment.price, projectCurrency) }] : [])
    ];
    
    const cardWidth = (contentWidth - (scale(3) * (statCards.length - 1))) / statCards.length;
    
    statCards.forEach((card, index) => {
      const x = margin + index * (cardWidth + scale(3));
      drawStatCard(pdf, card.icon, card.label, card.value, x, yPosition, cardWidth, scale, scaledFontSize);
    });
    
    yPosition += scale(20);

    // === ФОТОГРАФИИ В КОМПАКТНОЙ СЕТКЕ ===
    if (photos.length > 0) {
      // Заголовок секции
      setColor(pdf, COLORS.dark, 'text');
      pdf.setFontSize(scaledFontSize(16, 12, 28));
      pdf.setFont('helvetica', 'bold');
      pdf.text(translations.photos, margin, yPosition);
      yPosition += scale(8);
      
      // Разделяем фото по типам
      const layoutPhotos = photos.filter(p => p.type === 'layout');
      const apartmentPhotos = photos.filter(p => p.type === 'apartment');
      
      // Планировки (приоритет, больший размер)
      if (layoutPhotos.length > 0) {
        yPosition = await addCompactPhotoSection(pdf, layoutPhotos, translations.layout, margin, yPosition, contentWidth, pageHeight, scale, scaledFontSize, 'large');
      }
      
      // Фото квартиры (сетка 2x2 или 3x2)
      if (apartmentPhotos.length > 0) {
        yPosition = await addCompactPhotoSection(pdf, apartmentPhotos, translations.apartmentPhoto, margin, yPosition, contentWidth, pageHeight, scale, scaledFontSize, 'grid');
      }
    }

    // === МИНИМАЛИСТИЧНЫЙ ФУТЕР ===
    const footerY = pageHeight - scale(8);
    setColor(pdf, COLORS.muted, 'text');
    pdf.setFontSize(scaledFontSize(7, 6, 12));
    pdf.setFont('helvetica', 'normal');
    
    const currentDate = new Date().toLocaleDateString();
    pdf.text(`${translations.generatedOn}: ${currentDate}`, margin, footerY);
    pdf.text('Gridix Live', pageWidth - margin - pdf.getTextWidth('Gridix Live'), footerY);

    // Объединение с основным PDF или сохранение
    if (pdf_main) {
      try {
        const generatedPdfBytes = pdf.output('arraybuffer');
        const mergedPdfDoc = await PDFDocument.create();
        const generatedPdfDoc = await PDFDocument.load(generatedPdfBytes);
        
        // Сначала страницы с деталями квартиры
        const generatedPages = await mergedPdfDoc.copyPages(generatedPdfDoc, generatedPdfDoc.getPageIndices());
        generatedPages.forEach(page => mergedPdfDoc.addPage(page));
        
        // Затем основной PDF
        const mainPages = await mergedPdfDoc.copyPages(mainPdfDoc!, mainPdfDoc!.getPageIndices());
        mainPages.forEach(page => mergedPdfDoc.addPage(page));
        
        const mergedPdfBytes = await mergedPdfDoc.save();
        const fileName = `apartment_${apartment.apartment_number}_details.pdf`;
        
        const blob = new Blob([new Uint8Array(mergedPdfBytes)], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
      } catch (mergeError) {
        console.error('Error merging PDFs:', mergeError);
        pdf.save(`apartment_${apartment.apartment_number}_details.pdf`);
      }
    } else {
      pdf.save(`apartment_${apartment.apartment_number}_details.pdf`);
    }

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};

// Функция для добавления компактной секции фотографий
const addCompactPhotoSection = async (
  pdf: jsPDF,
  photos: Array<{id: string, image_url: string, description?: string, type: 'layout' | 'apartment'}>,
  sectionTitle: string,
  margin: number,
  yPosition: number,
  contentWidth: number,
  pageHeight: number,
  scale: (n: number) => number,
  scaledFontSize: (n: number, min?: number, max?: number) => number,
  layout: 'large' | 'grid'
): Promise<number> => {
  
  // Подзаголовок
  setColor(pdf, COLORS.secondary, 'text');
  pdf.setFontSize(scaledFontSize(12, 9, 20));
  pdf.setFont('helvetica', 'bold');
  pdf.text(sectionTitle, margin, yPosition);
  yPosition += scale(6);
  
  if (layout === 'large') {
    // Большие изображения для планировок (по одному в ряд)
    for (let i = 0; i < Math.min(photos.length, 2); i++) {
      const photo = photos[i];
      
      if (yPosition > pageHeight - scale(80)) {
        pdf.addPage();
        yPosition = margin;
      }
      
      try {
        const base64Image = await loadImageAsBase64(photo.image_url);
        const tempImg = new Image();
        await new Promise((resolve, reject) => {
          tempImg.onload = resolve;
          tempImg.onerror = reject;
          tempImg.src = base64Image;
        });
        
        const maxImageHeight = scale(60);
        const dimensions = getImageDimensions(tempImg.width, tempImg.height, contentWidth - scale(4), maxImageHeight);
        
        const imageX = margin + (contentWidth - dimensions.width) / 2;
        
        // Карточка для изображения
        drawModernCard(pdf, margin, yPosition, contentWidth, dimensions.height + scale(6), scale, true);
        
        pdf.addImage(base64Image, 'JPEG', imageX, yPosition + scale(3), dimensions.width, dimensions.height);
        
        yPosition += dimensions.height + scale(10);
        
      } catch (error) {
        console.error(`Failed to load image ${photo.image_url}:`, error);
        yPosition += scale(8);
      }
    }
    
  } else {
    // Сетка для фотографий квартиры (2-3 в ряд)
    const photosPerRow = 3;
    const imageSize = (contentWidth - scale(2) * (photosPerRow - 1)) / photosPerRow;
    const rows = Math.ceil(Math.min(photos.length, 6) / photosPerRow);
    
    if (yPosition > pageHeight - scale(40) * rows) {
      pdf.addPage();
      yPosition = margin;
    }
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < photosPerRow; col++) {
        const photoIndex = row * photosPerRow + col;
        if (photoIndex >= photos.length) break;
        
        const photo = photos[photoIndex];
        const x = margin + col * (imageSize + scale(2));
        const y = yPosition + row * (scale(35));
        
        try {
          const base64Image = await loadImageAsBase64(photo.image_url);
          
          // Квадратная карточка
          drawModernCard(pdf, x, y, imageSize, scale(32), scale);
          pdf.addImage(base64Image, 'JPEG', x + scale(1), y + scale(1), imageSize - scale(2), scale(30));
          
        } catch (error) {
          // Карточка ошибки
          drawModernCard(pdf, x, y, imageSize, scale(32), scale);
          setColor(pdf, COLORS.muted, 'text');
          pdf.setFontSize(scaledFontSize(8, 6, 14));
          pdf.text('Изображение\nне загружено', x + scale(2), y + scale(16));
        }
      }
    }
    
    yPosition += rows * scale(35) + scale(5);
  }
  
  return yPosition;
};