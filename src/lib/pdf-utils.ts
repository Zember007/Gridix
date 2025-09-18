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
const drawCard = (pdf: jsPDF, x: number, y: number, width: number, height: number, scale: (n: number) => number) => {
  // Основная карточка
  pdf.setFillColor(255, 255, 255);
  drawRoundedRect(pdf, x, y, width, height, scale(3));

  // Граница
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(Math.max(0.25, scale(0.5)));
  pdf.roundedRect(x, y, width, height, scale(3), scale(3), 'D');
};

// Функция для рисования заголовка секции
const drawSectionHeader = (pdf: jsPDF, text: string, x: number, y: number, width: number, scale: (n: number) => number, scaledFontSize: (n: number, min?: number, max?: number) => number) => {
  // Фон заголовка
  pdf.setFillColor(37, 99, 235); // primary color
  drawRoundedRect(pdf, x, y, width, scale(8), scale(2));

  // Текст заголовка
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(scaledFontSize(12, 8, 24));
  pdf.setFont('helvetica', 'bold');
  pdf.text(text, x + scale(3), y + scale(5.5));

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
const drawStatusBadge = (pdf: jsPDF, text: string, x: number, y: number, status: string, scale: (n: number) => number, scaledFontSize: (n: number, min?: number, max?: number) => number) => {
  const color = getStatusColor(status);
  const [r, g, b] = color.match(/\w\w/g)!.map(hex => parseInt(hex, 16));

  // Измеряем текст для определения размера бейджа
  pdf.setFontSize(scaledFontSize(10, 7, 18));
  pdf.setFont('helvetica', 'bold');
  const textWidth = pdf.getTextWidth(text);
  const badgeWidth = textWidth + scale(6);
  const badgeHeight = scale(6);

  // Рисуем бейдж
  pdf.setFillColor(r, g, b);
  drawRoundedRect(pdf, x, y - scale(4), badgeWidth, badgeHeight, scale(3));

  // Текст бейджа
  pdf.setTextColor(255, 255, 255);
  pdf.text(text, x + scale(3), y);

  // Сброс цвета
  pdf.setTextColor(0, 0, 0);

  return badgeWidth;
};

// Функция для рисования информационного блока с иконкой
const drawInfoBlock = (pdf: jsPDF, label: string, value: string, x: number, y: number, scale: (n: number) => number, scaledFontSize: (n: number, min?: number, max?: number) => number) => {


  // Лейбл
  pdf.setFontSize(scaledFontSize(10, 7, 18));
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(71, 85, 105);
  pdf.text(label + ': ', x + scale(4), y);

  // Значение
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(15, 23, 42);
  const labelWidth = pdf.getTextWidth(label + ': ');
  pdf.text(value, x + scale(4) + labelWidth, y);
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

    const mainPdfBytes = pdf_main ? await loadPDFFile(pdf_main) : null;

    const mainPdfDoc = mainPdfBytes ? await PDFDocument.load(mainPdfBytes) : null;
    // Создаем PDF документ
    const [firstPage] = mainPdfDoc ? mainPdfDoc.getPages() : [];
    const { width, height } = firstPage ? firstPage.getSize() : { width: 210, height: 297 };

    const pdf = new jsPDF({
      orientation: firstPage ? (width > height ? 'l' : 'p') : 'p',
      unit: firstPage ? 'pt' : 'mm', 
      format: firstPage ? [width, height] : 'a4'
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    // Базируем масштабы на формате A4 по меньшей стороне, чтоб всё выглядело пропорционально
    const baseShortSide = 210; // мм для A4
    const currentShortSide = Math.min(pageWidth, pageHeight);
    const scaleFactor = currentShortSide / baseShortSide;
    const scale = (n: number) => n * scaleFactor;
    const scaledFontSize = (n: number, min = 6, max = 28) => Math.max(min, Math.min(max, n * scaleFactor));
    const margin = 5;
    const contentWidth = pageWidth - (margin * 2);

    let yPosition = margin;

    // === HEADER SECTION ===
    // Фон заголовка
    pdf.setFillColor(248, 250, 252); // light color
    pdf.rect(0, 0, pageWidth, scale(50), 'F');

    // Главный заголовок
    pdf.setFontSize(scaledFontSize(28, 14, 48));
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 41, 59); // dark color
    pdf.text(translations.apartmentDetails, margin, yPosition + scale(15));

    // Номер квартиры
    pdf.setFontSize(scaledFontSize(20, 12, 36));
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139); // secondary color
    pdf.text(`${translations.apartmentNumber} ${apartment.apartment_number}`, margin, yPosition + scale(28));

    // Линия-разделитель
    pdf.setDrawColor(37, 99, 235); // primary color
    pdf.setLineWidth(Math.max(0.5, scale(2)));
    pdf.line(margin, yPosition + scale(35), pageWidth - margin, yPosition + scale(35));

    yPosition = scale(60);

    // === ОСНОВНАЯ ИНФОРМАЦИЯ ===
    drawCard(pdf, margin, yPosition, contentWidth, scale(45), scale);
    drawSectionHeader(pdf, translations.apartmentDetails || 'Основная информация', margin, yPosition, contentWidth, scale, scaledFontSize);

    yPosition += scale(15);

    // Информационные блоки в две колонки
    const infoItems = [
      { label: capitalizeFirstLetter(translations.floor), value: apartment.floor_number.toString() },
      { label: capitalizeFirstLetter(translations.rooms), value: apartment.rooms === 0 ? translations.studio : apartment.rooms.toString() },
      { label: capitalizeFirstLetter(translations.area), value: `${apartment.area} m²` },
      ...(apartment.price ? [{ label: translations.price, value: formatPriceWithCurrency(apartment.price, projectCurrency) }] : [])
    ];

    const colWidth = (contentWidth - scale(10)) / 2;

    // Иконки для разных типов информации

    infoItems.forEach((item, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = margin + scale(5) + (col * (colWidth + scale(5)));
      const y = yPosition + (row * scale(8));

      drawInfoBlock(pdf, item.label, item.value, x, y, scale, scaledFontSize);
    });

    yPosition += Math.ceil(infoItems.length / 2) * scale(8) + scale(15);

    // Декоративный разделитель
    yPosition += scale(10);

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

    pdf.setFontSize(scaledFontSize(12, 9, 20));
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(71, 85, 105);
    pdf.text(translations.status + ':', margin + scale(5), yPosition);

    const statusLabelWidth = pdf.getTextWidth(translations.status + ': ');
    const badgeWidth = drawStatusBadge(pdf, statusText, margin + scale(5) + statusLabelWidth + scale(5), yPosition, apartment.status, scale, scaledFontSize);

    yPosition += scale(20);

    // === ФОТОГРАФИИ ===
    if (photos.length > 0) {
      // Проверяем, нужна ли новая страница
      if (yPosition > pageHeight - scale(100)) {
        pdf.addPage();
        yPosition = margin;
      }

      drawSectionHeader(pdf, translations.photos, margin, yPosition, contentWidth, scale, scaledFontSize);
      yPosition += scale(20);

      // Разделяем фото по типам
      const layoutPhotos = photos.filter(p => p.type === 'layout');
      const apartmentPhotos = photos.filter(p => p.type === 'apartment');

      // Сначала планировки
      if (layoutPhotos.length > 0) {
        pdf.setFontSize(scaledFontSize(14, 10, 22));
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(37, 99, 235);
        pdf.text(translations.layout, margin, yPosition);
        yPosition += scale(10);

        for (const photo of layoutPhotos) {
          yPosition = await addPhotoToPDF(pdf, photo, margin, yPosition, contentWidth, pageHeight, translations, scale, scaledFontSize);
        }

        yPosition += scale(10);
      }

      // Затем фотографии квартиры
      if (apartmentPhotos.length > 0) {
        pdf.setFontSize(scaledFontSize(14, 10, 22));
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(37, 99, 235);
        pdf.text(translations.apartmentPhoto, margin, yPosition);
        yPosition += scale(10);

        for (const photo of apartmentPhotos) {
          yPosition = await addPhotoToPDF(pdf, photo, margin, yPosition, contentWidth, pageHeight, translations, scale, scaledFontSize);
        }
      }
    }

    // === FOOTER ===
    const currentDate = new Date().toLocaleDateString();
    pdf.setFontSize(scaledFontSize(8, 7, 14));
    pdf.setTextColor(148, 163, 184);

    // Фон футера
    pdf.setFillColor(248, 250, 252);
    pdf.rect(0, pageHeight - scale(15), pageWidth, scale(15), 'F');

    // Текст футера
    pdf.text(
      `${translations.generatedOn}: ${currentDate}`,
      margin,
      pageHeight - scale(5)
    );

    // Логотип или название компании (если нужно)
    pdf.setTextColor(100, 116, 139);
    pdf.text(
      'Gridix Live',
      pageWidth - margin - pdf.getTextWidth('Gridix Live'),
      pageHeight - scale(5)
    );

    // Если есть основной PDF файл, объединяем его с сгенерированным
    if (pdf_main) {
      try {
        // Получаем данные сгенерированного PDF
        const generatedPdfBytes = pdf.output('arraybuffer');

        // Загружаем основной PDF



        // Создаем новый PDF-документ
        const mergedPdfDoc = await PDFDocument.create();

        // Загружаем документы
        const generatedPdfDoc = await PDFDocument.load(generatedPdfBytes);

        // Сначала добавляем страницы из сгенерированного PDF
        const generatedPages = await mergedPdfDoc.copyPages(
          generatedPdfDoc,
          generatedPdfDoc.getPageIndices()
        );
        generatedPages.forEach((page) => mergedPdfDoc.addPage(page));

        // Затем добавляем страницы из основного PDF
        const mainPages = await mergedPdfDoc.copyPages(
          mainPdfDoc,
          mainPdfDoc.getPageIndices()
        );
        mainPages.forEach((page) => mergedPdfDoc.addPage(page));

        // Сохраняем объединенный PDF
        const mergedPdfBytes = await mergedPdfDoc.save();
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
  },
  scale: (n: number) => number,
  scaledFontSize: (n: number, min?: number, max?: number) => number
): Promise<number> => {
  try {
    // Проверяем, нужна ли новая страница
    if (yPosition > pageHeight - scale(120)) {
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

    // Вычисляем размеры для PDF (максимум contentWidth-10, высота адаптивная)
    const dimensions = getImageDimensions(tempImg.width, tempImg.height, contentWidth - scale(10), scale(120));

    // Карточка для изображения
    const cardHeight = dimensions.height + scale(20);
    drawCard(pdf, margin, yPosition, contentWidth, cardHeight, scale);

    // Центрируем изображение в карточке
    const imageX = margin + (contentWidth - dimensions.width) / 2;
    const imageY = yPosition + scale(5);

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
      pdf.setFontSize(scaledFontSize(10, 8, 18));
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(100, 116, 139);
      const descY = imageY + dimensions.height + scale(8);

      // Центрируем подпись
      const descWidth = pdf.getTextWidth(photo.description);
      const descX = margin + (contentWidth - descWidth) / 2;
      pdf.text(photo.description, descX, descY);
    }

    return yPosition + cardHeight + scale(10);

  } catch (error) {
    console.error(`Failed to load image ${photo.image_url}:`, error);

    // Карточка ошибки
    drawCard(pdf, margin, yPosition, contentWidth, scale(30), scale);

    pdf.setFontSize(scaledFontSize(12, 9, 18));
    pdf.setTextColor(220, 38, 38); // danger color
    pdf.text(`[${translations.apartmentPhoto} не удалось загрузить]`, margin + scale(10), yPosition + scale(15));

    pdf.setTextColor(0, 0, 0); // reset color
    return yPosition + scale(40);
  }
};
