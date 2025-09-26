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
    facilities: string;
    apartmentForSale: string;
  };
}

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
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Цвета для дизайна
const COLORS = {
  primary: '#2563eb',
  secondary: '#64748b',
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
  light: '#f8fafc',
  dark: '#1e293b',
  border: '#e2e8f0',
  brown: '#8B4513',
  lightGreen: '#90EE90'
};

// Функция для рисования прямоугольника с закругленными углами
const drawRoundedRect = (pdf: jsPDF, x: number, y: number, width: number, height: number, radius: number = 2) => {
  pdf.roundedRect(x, y, width, height, radius, radius, 'F');
};

// Функция для рисования карточки
const drawCard = (pdf: jsPDF, x: number, y: number, width: number, height: number, scale: (n: number) => number) => {
  pdf.setFillColor(255, 255, 255);
  drawRoundedRect(pdf, x, y, width, height, scale(3));
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(Math.max(0.25, scale(0.5)));
  pdf.roundedRect(x, y, width, height, scale(3), scale(3), 'D');
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

// Функция для рисования чекбокса с галочкой
const drawCheckbox = (pdf: jsPDF, x: number, y: number, scale: (n: number) => number) => {
  const size = scale(4);
  
  // Рисуем коричневый круг
  pdf.setFillColor(139, 69, 19); // brown
  pdf.setDrawColor(139, 69, 19);
  pdf.circle(x + size/2, y - size/2 + scale(0.5), size/2, 'FD');
  
  // Рисуем белую галочку
  pdf.setDrawColor(255, 255, 255); // white
  pdf.setLineWidth(scale(0.6));
  const centerX = x + size/2;
  const centerY = y - size/2 + scale(0.5);
  pdf.line(centerX - scale(1), centerY, centerX - scale(0.3), centerY + scale(0.7));
  pdf.line(centerX - scale(0.3), centerY + scale(0.7), centerX + scale(1), centerY - scale(0.7));
};

// Функция для рисования информационного блока недвижимости с бежевым фоном
const drawRealEstateInfo = (pdf: jsPDF, apartment: Apartment, projectCurrency: string | null, translations: PDFGenerationOptions['translations'], x: number, y: number, width: number, scale: (n: number) => number, scaledFontSize: (n: number, min?: number, max?: number) => number) => {
  let currentY = y;

  // Коричневый фон для заголовка
  pdf.setFillColor(139, 69, 19); // brown
  drawRoundedRect(pdf, x, currentY, width, scale(12), scale(2));

  // Белый текст компании сверху
  pdf.setFontSize(scaledFontSize(10, 8, 16));
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(255, 255, 255);
  pdf.text('Giggling Property', x + scale(4), currentY + scale(4));

  // Заголовок "Apartment for Sale"
  pdf.setFontSize(scaledFontSize(24, 16, 36));
  pdf.setFont('helvetica', 'bold');
  pdf.text(translations.apartmentForSale || 'Apartment for Sale', x + scale(4), currentY + scale(9));

  currentY += scale(18);

  // Бежевый фон для секции с информацией (более насыщенный для лучшей читаемости)
  const infoSectionHeight = scale(60); // примерная высота секции с информацией
  pdf.setFillColor(240, 230, 210); // более насыщенный бежевый фон для лучшей читаемости
  drawRoundedRect(pdf, x, currentY, width, infoSectionHeight, scale(3));

  currentY += scale(5);

  // Секция FACILITIES
  pdf.setFontSize(scaledFontSize(14, 10, 20));
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(80, 60, 40); // темно-коричневый для лучшей читаемости
  pdf.text(translations.facilities || 'FACILITIES', x + scale(4), currentY);

  currentY += scale(8);

  // Список удобств с чекбоксами
  const facilities = [
    `${apartment.rooms === 0 ? translations.studio : apartment.rooms} ${apartment.rooms === 0 ? '' : apartment.rooms === 1 ? 'Bedroom' : 'Bedrooms'}`,
    '2 Bathroom', // можно добавить в данные квартиры если есть
    'Living Room',
    'Kitchen',
    'Laundry Room'
  ];

  facilities.forEach((facility, index) => {
    drawCheckbox(pdf, x + scale(4), currentY + scale(6), scale);
    
    pdf.setFontSize(scaledFontSize(11, 9, 16));
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 50, 40); // темно-коричневый текст
    pdf.text(facility, x + scale(11), currentY + scale(5));
    
    currentY += scale(8);
  });

  currentY += scale(10);

  // Цена в коричневом блоке
  pdf.setFillColor(139, 69, 19); // brown
  drawRoundedRect(pdf, x, currentY, width, scale(15), scale(2));

  if (apartment.price) {
    const priceText = formatPriceWithCurrency(apartment.price, projectCurrency);
    pdf.setFontSize(scaledFontSize(28, 20, 42));
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(priceText, x + scale(4), currentY + scale(8));

    pdf.setFontSize(scaledFontSize(12, 10, 18));
    pdf.setFont('helvetica', 'normal');
  }

  currentY += scale(20);

  // Контактная информация
  pdf.setFontSize(scaledFontSize(11, 9, 16));
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text('123-456-7890 (Richard Sanchez)', x, currentY);

  return currentY + scale(10);
};

/**
 * Генерирует PDF с деталями квартиры в стиле недвижимости
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
    
    const unit = (firstPage ? 'pt' : 'mm') as 'pt' | 'mm';
    const unitToMm = unit === 'pt' ? (25.4 / 72) : 1;
    const baseShortSideMm = 210;
    const currentShortSideMm = Math.min(pageWidth, pageHeight) * unitToMm;
    const scaleFactor = currentShortSideMm / baseShortSideMm;
    const scale = (nMm: number) => (nMm * scaleFactor) / unitToMm;
    const scaledFontSize = (n: number, min = 6, max = 28) => Math.max(min, Math.min(max, n * scaleFactor));
    
    const pctMargin = Math.min(pageWidth, pageHeight) * 0.05;
    const margin = Math.max(scale(12), pctMargin);
    const contentWidth = pageWidth - (margin * 2);

    let yPosition = margin;

    // === ВСЕ ФОТОГРАФИИ СВЕРХУ С НЕБОЛЬШИМИ ОТСТУПАМИ ===
    const layoutPhotos = photos.filter(p => p.type === 'layout');
    const apartmentPhotos = photos.filter(p => p.type === 'apartment');
    const allTopPhotos = [...layoutPhotos, ...apartmentPhotos];

    if (allTopPhotos.length > 0) {
      const gap = scale(5);
      const targetHeight = scale(60);
      let currentX = margin;
      let currentY = margin;
      let rowMaxHeight = targetHeight;

      for (const photo of allTopPhotos) {
        try {
          const base64Image = await loadImageAsBase64(photo.image_url);
          const tempImg = new Image();
          await new Promise((resolve, reject) => {
            tempImg.onload = resolve;
            tempImg.onerror = reject;
            tempImg.src = base64Image;
          });

          const ratio = tempImg.width / tempImg.height;
          const imgWidth = targetHeight * ratio;

          // Перенос на следующую строку при нехватке места
          if (currentX + imgWidth > pageWidth - margin) {
            currentX = margin;
            currentY += rowMaxHeight + gap;
            rowMaxHeight = targetHeight;
            // Если не хватает места на странице, переносим на новую
            if (currentY + targetHeight > pageHeight - scale(100)) {
              pdf.addPage();
              currentY = margin;
            }
          }

          // Рамка
          pdf.setFillColor(255, 255, 255);
          pdf.setDrawColor(220, 220, 220);
          pdf.setLineWidth(1);
          pdf.roundedRect(currentX - scale(1), currentY - scale(1), imgWidth + scale(2), targetHeight + scale(2), scale(1), scale(1), 'FD');

          // Добавляем изображение
          pdf.addImage(base64Image, 'JPEG', currentX, currentY, imgWidth, targetHeight);

          currentX += imgWidth + gap;
          rowMaxHeight = Math.max(rowMaxHeight, targetHeight);
        } catch (error) {
          console.error(`Failed to load photo ${photo.id}:`, error);
          // Пропускаем проблемное фото, добавляя пустое место для сохранения ритма
          const placeholderWidth = targetHeight * 1.3;
          if (currentX + placeholderWidth > pageWidth - margin) {
            currentX = margin;
            currentY += rowMaxHeight + gap;
            rowMaxHeight = targetHeight;
          }
          pdf.setFillColor(245, 245, 245);
          pdf.setDrawColor(230, 230, 230);
          pdf.roundedRect(currentX, currentY, placeholderWidth, targetHeight, scale(1), scale(1), 'FD');
          currentX += placeholderWidth + gap;
        }
      }

      // Устанавливаем позицию после фотосекции
      yPosition = currentY + rowMaxHeight + scale(15);
    }

    // === ОСНОВНАЯ СЕКЦИЯ: ИНФОРМАЦИЯ ВО ВСЮ ШИРИНУ ===
    const leftWidth = contentWidth;
    const leftX = margin;
    const sectionStartY = yPosition;

    const infoEndY = drawRealEstateInfo(
      pdf,
      apartment,
      projectCurrency,
      translations,
      leftX,
      sectionStartY,
      leftWidth,
      scale,
      scaledFontSize
    );

    // Устанавливаем yPosition для следующего контента
    yPosition = infoEndY + scale(15);

    // === FOOTER ===
    const currentDate = new Date().toLocaleDateString();
    pdf.setFontSize(scaledFontSize(8, 7, 14));
    pdf.setTextColor(148, 163, 184);

    pdf.setFillColor(248, 250, 252);
    pdf.rect(0, pageHeight - scale(15), pageWidth, scale(15), 'F');

    pdf.text(
      `${currentDate}`,
      margin,
      pageHeight - scale(5)
    );

    pdf.setTextColor(100, 116, 139);
    pdf.text(
      'Gridix Live',
      pageWidth - margin - pdf.getTextWidth('Gridix Live'),
      pageHeight - scale(5)
    );

    // === СОХРАНЕНИЕ PDF ===
    if (pdf_main) {
      try {
        const generatedPdfBytes = pdf.output('arraybuffer');
        const mergedPdfDoc = await PDFDocument.create();
        const generatedPdfDoc = await PDFDocument.load(generatedPdfBytes);

        const generatedPages = await mergedPdfDoc.copyPages(
          generatedPdfDoc,
          generatedPdfDoc.getPageIndices()
        );
        generatedPages.forEach((page) => mergedPdfDoc.addPage(page));

        const mainPages = await mergedPdfDoc.copyPages(
          mainPdfDoc,
          mainPdfDoc.getPageIndices()
        );
        mainPages.forEach((page) => mergedPdfDoc.addPage(page));

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
        const fileName = `apartment_${apartment.apartment_number}_details.pdf`;
        pdf.save(fileName);
      }
    } else {
      const fileName = `apartment_${apartment.apartment_number}_details.pdf`;
      pdf.save(fileName);
    }

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};

// Вспомогательная функция для добавления фото в PDF (оставлена без изменений)
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
    if (yPosition > pageHeight - scale(120)) {
      pdf.addPage();
      yPosition = margin;
    }

    const base64Image = await loadImageAsBase64(photo.image_url);

    const tempImg = new Image();
    await new Promise((resolve, reject) => {
      tempImg.onload = resolve;
      tempImg.onerror = reject;
      tempImg.src = base64Image;
    });

    const dimensions = getImageDimensions(tempImg.width, tempImg.height, contentWidth - scale(10), scale(120));

    const cardHeight = dimensions.height + scale(20);
    drawCard(pdf, margin, yPosition, contentWidth, cardHeight, scale);

    const imageX = margin + (contentWidth - dimensions.width) / 2;
    const imageY = yPosition + scale(5);

    pdf.addImage(
      base64Image,
      'JPEG',
      imageX,
      imageY,
      dimensions.width,
      dimensions.height
    );

    if (photo.description) {
      pdf.setFontSize(scaledFontSize(10, 8, 18));
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(100, 116, 139);
      const descY = imageY + dimensions.height + scale(8);

      const descWidth = pdf.getTextWidth(photo.description);
      const descX = margin + (contentWidth - descWidth) / 2;
      pdf.text(photo.description, descX, descY);
    }

    return yPosition + cardHeight + scale(10);

  } catch (error) {
    console.error(`Failed to load image ${photo.image_url}:`, error);

    drawCard(pdf, margin, yPosition, contentWidth, scale(30), scale);

    pdf.setFontSize(scaledFontSize(12, 9, 18));
    pdf.setTextColor(220, 38, 38);
    pdf.text(`[${translations.apartmentPhoto} не удалось загрузить]`, margin + scale(10), yPosition + scale(15));

    pdf.setTextColor(0, 0, 0);
    return yPosition + scale(40);
  }
};