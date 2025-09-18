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
  pdf_main?: string | ArrayBuffer | Uint8Array; // URL или данные основного PDF файла (проектная презентация)
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

// Функция для загрузки PDF файла
const loadPDFFile = async (pdfSource: string | ArrayBuffer | Uint8Array): Promise<ArrayBuffer> => {
  if (typeof pdfSource === 'string') {
    // Если это URL, загружаем файл
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
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataURL);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${url}`));
    };
    
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

function capitalizeFirstLetter(str: string) {
  if (!str) return str; // защита от пустой строки
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Цвета для дизайна
const COLORS = {
  primary: '#2563eb',      // Синий
  secondary: '#64748b',    // Серый
  success: '#16a34a',      // Зеленый
  warning: '#d97706',      // Оранжевый
  danger: '#dc2626',       // Красный
  light: '#f8fafc',        // Светло-серый
  dark: '#1e293b',         // Темно-серый
  border: '#e2e8f0'        // Граница
};

// Функция для рисования прямоугольника с закругленными углами
const drawRoundedRect = (pdf: jsPDF, x: number, y: number, width: number, height: number, radius: number = 2) => {
  pdf.roundedRect(x, y, width, height, radius, radius, 'F');
};

// Функция для рисования карточки
const drawCard = (pdf: jsPDF, x: number, y: number, width: number, height: number) => {

  
  // Основная карточка
  pdf.setFillColor(255, 255, 255);
  drawRoundedRect(pdf, x, y, width, height, 3);
  
  // Граница
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(x, y, width, height, 3, 3, 'D');
};

// Функция для рисования заголовка секции
const drawSectionHeader = (pdf: jsPDF, text: string, x: number, y: number, width: number) => {
  // Фон заголовка
  pdf.setFillColor(37, 99, 235); // primary color
  drawRoundedRect(pdf, x, y, width, 8, 2);
  
  // Текст заголовка
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text(text, x + 3, y + 5.5);
  
  // Сброс цвета текста
  pdf.setTextColor(0, 0, 0);
};

// Функция для получения цвета статуса
const getStatusColor = (status: string) => {
  switch (status) {
    case 'available':
      return COLORS.success;
    case 'reserved':
      return COLORS.warning;
    case 'sold':
      return COLORS.danger;
    default:
      return COLORS.secondary;
  }
};

// Функция для рисования статуса-бейджа
const drawStatusBadge = (pdf: jsPDF, text: string, x: number, y: number, status: string) => {
  const color = getStatusColor(status);
  const [r, g, b] = color.match(/\w\w/g)!.map(hex => parseInt(hex, 16));
  
  // Измеряем текст для определения размера бейджа
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  const textWidth = pdf.getTextWidth(text);
  const badgeWidth = textWidth + 6;
  const badgeHeight = 6;
  
  // Рисуем бейдж
  pdf.setFillColor(r, g, b);
  drawRoundedRect(pdf, x, y - 4, badgeWidth, badgeHeight, 3);
  
  // Текст бейджа
  pdf.setTextColor(255, 255, 255);
  pdf.text(text, x + 3, y);
  
  // Сброс цвета
  pdf.setTextColor(0, 0, 0);
  
  return badgeWidth;
};

// Функция для рисования информационного блока с иконкой
const drawInfoBlock = (pdf: jsPDF, label: string, value: string, x: number, y: number) => {

  
  // Лейбл
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(71, 85, 105);
  pdf.text(label + ': ', x + 4, y);
  
  // Значение
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(15, 23, 42);
  const labelWidth = pdf.getTextWidth(label + ': ');
  pdf.text(value, x + 4 + labelWidth, y);
};



/**
 * Генерирует PDF с деталями квартиры и опционально объединяет его с основным PDF файлом
 * 
 * @param options - Опции для генерации PDF
 * @param options.apartment - Данные квартиры
 * @param options.projectCurrency - Валюта проекта
 * @param options.photos - Массив фотографий
 * @param options.pdf_main - Основной PDF файл (URL, ArrayBuffer или Uint8Array) - опционально
 * @param options.translations - Переводы для интерфейса
 * 
 * @example
 * // Генерация PDF без основного файла
 * await generateApartmentPDF({
 *   apartment,
 *   projectCurrency: 'USD',
 *   photos: [],
 *   translations: {...}
 * });
 * 
 * @example
 * // Генерация PDF с объединением с основным файлом
 * await generateApartmentPDF({
 *   apartment,
 *   projectCurrency: 'USD', 
 *   photos: [],
 *   pdf_main: 'https://example.com/main.pdf', // или ArrayBuffer/Uint8Array
 *   translations: {...}
 * });
 */
export const generateApartmentPDF = async (options: PDFGenerationOptions): Promise<void> => {
  const { apartment, projectCurrency, photos, translations, pdf_main } = options;
  
  try {
    // Создаем PDF документ
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 5;
    const contentWidth = pageWidth - (margin * 2);
    
    let yPosition = margin;
    
    // === HEADER SECTION ===
    // Фон заголовка
    pdf.setFillColor(248, 250, 252); // light color
    pdf.rect(0, 0, pageWidth, 50, 'F');
    
    // Главный заголовок
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 41, 59); // dark color
    pdf.text(translations.apartmentDetails, margin, yPosition + 15);
    
    // Номер квартиры
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139); // secondary color
    pdf.text(`${translations.apartmentNumber} ${apartment.apartment_number}`, margin, yPosition + 28);
    
    // Линия-разделитель
    pdf.setDrawColor(37, 99, 235); // primary color
    pdf.setLineWidth(2);
    pdf.line(margin, yPosition + 35, pageWidth - margin, yPosition + 35);
    
    yPosition = 60;
    
    // === ОСНОВНАЯ ИНФОРМАЦИЯ ===
    drawCard(pdf, margin, yPosition, contentWidth, 45);
    drawSectionHeader(pdf, translations.apartmentDetails || 'Основная информация', margin, yPosition, contentWidth);
    
    yPosition += 15;
    
    // Информационные блоки в две колонки
    const infoItems = [
      { label: capitalizeFirstLetter(translations.floor), value: apartment.floor_number.toString() },
      { label: capitalizeFirstLetter(translations.rooms), value: apartment.rooms === 0 ? translations.studio : apartment.rooms.toString() },
      { label: capitalizeFirstLetter(translations.area), value: `${apartment.area} m²` },
      ...(apartment.price ? [{ label: translations.price, value: formatPriceWithCurrency(apartment.price, projectCurrency) }] : [])
    ];
    
    const colWidth = (contentWidth - 10) / 2;
    
    // Иконки для разных типов информации
    
    infoItems.forEach((item, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = margin + 5 + (col * (colWidth + 5));
      const y = yPosition + (row * 8);
      
      drawInfoBlock(pdf, item.label, item.value, x, y);
    });
    
    yPosition += Math.ceil(infoItems.length / 2) * 8 + 15;
    
    // Декоративный разделитель
    yPosition += 10;
    
    // === СТАТУС ===
    let statusText: string = apartment.status;
    switch (apartment.status) {
      case 'available':
        statusText = translations.available;
        break;
      case 'reserved':
        statusText = translations.reserved;
        break;
      case 'sold':
        statusText = translations.sold;
        break;
    }
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(71, 85, 105);
    pdf.text(translations.status + ':', margin + 5, yPosition);
    
    const statusLabelWidth = pdf.getTextWidth(translations.status + ': ');
    const badgeWidth = drawStatusBadge(pdf, statusText, margin + 5 + statusLabelWidth + 5, yPosition, apartment.status);
    
    yPosition += 20;
    
    // === ФОТОГРАФИИ ===
    if (photos.length > 0) {
      // Проверяем, нужна ли новая страница
      if (yPosition > pageHeight - 100) {
        pdf.addPage();
        yPosition = margin;
      }
      
      drawSectionHeader(pdf, translations.photos, margin, yPosition, contentWidth);
      yPosition += 20;
      
      // Разделяем фото по типам
      const layoutPhotos = photos.filter(p => p.type === 'layout');
      const apartmentPhotos = photos.filter(p => p.type === 'apartment');
      
      // Сначала планировки
      if (layoutPhotos.length > 0) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(37, 99, 235);
        pdf.text(translations.layout, margin, yPosition);
        yPosition += 10;
        
        for (const photo of layoutPhotos) {
          yPosition = await addPhotoToPDF(pdf, photo, margin, yPosition, contentWidth, pageHeight, translations);
        }
        
        yPosition += 10;
      }
      
      // Затем фотографии квартиры
      if (apartmentPhotos.length > 0) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(37, 99, 235);
        pdf.text(translations.apartmentPhoto, margin, yPosition);
        yPosition += 10;
        
        for (const photo of apartmentPhotos) {
          yPosition = await addPhotoToPDF(pdf, photo, margin, yPosition, contentWidth, pageHeight, translations);
        }
      }
    }
    
    // === FOOTER ===
    const currentDate = new Date().toLocaleDateString();
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    
    // Фон футера
    pdf.setFillColor(248, 250, 252);
    pdf.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    
    // Текст футера
    pdf.text(
      `${translations.generatedOn}: ${currentDate}`,
      margin,
      pageHeight - 5
    );
    
    // Логотип или название компании (если нужно)
    pdf.setTextColor(100, 116, 139);
    pdf.text(
      'Gridix Live',
      pageWidth - margin - pdf.getTextWidth('Gridix Live'),
      pageHeight - 5
    );
    
    // Если есть основной PDF файл, объединяем его с сгенерированным
    if (pdf_main) {
      try {
        // Получаем данные сгенерированного PDF
        const generatedPdfBytes = pdf.output('arraybuffer');
        
        // Загружаем основной PDF
        const mainPdfBytes = await loadPDFFile(pdf_main);
        
        // Создаем новый PDF документ с помощью pdf-lib
        const mainPdfDoc = await PDFDocument.load(mainPdfBytes);
        const generatedPdfDoc = await PDFDocument.load(generatedPdfBytes);
        
        // Копируем страницы из сгенерированного PDF в основной
        const copiedPages = await mainPdfDoc.copyPages(generatedPdfDoc, generatedPdfDoc.getPageIndices());
        copiedPages.forEach((page) => {
          mainPdfDoc.addPage(page);
        });
        
        // Сохраняем объединенный PDF
        const mergedPdfBytes = await mainPdfDoc.save();
        const fileName = `apartment_${apartment.apartment_number}_details.pdf`;
        
        // Создаем blob и скачиваем файл
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
        // В случае ошибки объединения, сохраняем только сгенерированный PDF
        const fileName = `apartment_${apartment.apartment_number}_details.pdf`;
        pdf.save(fileName);
      }
    } else {
      // Если основного PDF нет, сохраняем только сгенерированный
      const fileName = `apartment_${apartment.apartment_number}_details.pdf`;
      pdf.save(fileName);
    }
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};

// Вспомогательная функция для добавления фото в PDF
const addPhotoToPDF = async (
  pdf: jsPDF, 
  photo: {
    id: string;
    image_url: string;
    description?: string;
    type: 'layout' | 'apartment';
  }, 
  margin: number, 
  yPosition: number, 
  contentWidth: number, 
  pageHeight: number, 
  translations: {
    apartmentPhoto: string;
    [key: string]: string;
  }
): Promise<number> => {
  try {
    // Проверяем, нужна ли новая страница
    if (yPosition > pageHeight - 120) {
      pdf.addPage();
      yPosition = margin;
    }
    
    // Загружаем изображение
    const base64Image = await loadImageAsBase64(photo.image_url);
    
    // Создаем временное изображение для получения размеров
    const tempImg = new Image();
    await new Promise((resolve, reject) => {
      tempImg.onload = resolve;
      tempImg.onerror = reject;
      tempImg.src = base64Image;
    });
    
    // Вычисляем размеры для PDF (максимум 170mm в ширину, 120mm в высоту)
    const dimensions = getImageDimensions(tempImg.width, tempImg.height, contentWidth - 10, 120);
    
    // Карточка для изображения
    const cardHeight = dimensions.height + 20;
    drawCard(pdf, margin, yPosition, contentWidth, cardHeight);
    
    // Центрируем изображение в карточке
    const imageX = margin + (contentWidth - dimensions.width) / 2;
    const imageY = yPosition + 5;
    
    // Добавляем изображение
    pdf.addImage(
      base64Image,
      'JPEG',
      imageX,
      imageY,
      dimensions.width,
      dimensions.height
    );
    
    // Подпись к фото внизу карточки
    if (photo.description) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(100, 116, 139);
      const descY = imageY + dimensions.height + 8;
      
      // Центрируем подпись
      const descWidth = pdf.getTextWidth(photo.description);
      const descX = margin + (contentWidth - descWidth) / 2;
      pdf.text(photo.description, descX, descY);
    }
    
    return yPosition + cardHeight + 10;
    
  } catch (error) {
    console.error(`Failed to load image ${photo.image_url}:`, error);
    
    // Карточка ошибки
    drawCard(pdf, margin, yPosition, contentWidth, 30);
    
    pdf.setFontSize(12);
    pdf.setTextColor(220, 38, 38); // danger color
    pdf.text(`[${translations.apartmentPhoto} не удалось загрузить]`, margin + 10, yPosition + 15);
    
    pdf.setTextColor(0, 0, 0); // reset color
    return yPosition + 40;
  }
};
