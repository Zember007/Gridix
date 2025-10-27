import { PDFDocument } from 'pdf-lib';
import { Apartment } from '@/types/apartment';


/**
 * Сжимает PDF путём пересоздания документа
 * Простое копирование страниц через pdf-lib уже даёт некоторую оптимизацию
 * @param arrayBuffer - PDF файл как ArrayBuffer
 * @returns Сжатый PDF как ArrayBuffer
 */

interface PDFGenerationOptions {
  apartment: Apartment;
  projectCurrency: string | null;
  pdfUrl: string;
  pdf_main?: string | ArrayBuffer | Uint8Array | undefined;
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

// Функция для загрузки PDF из API
const loadPDFFromAPI = async (pdfUrl: string): Promise<ArrayBuffer> => {
  const response = await fetch(`https://${import.meta.env.VITE_SERVER_DOMAIN}/api/pdf?url=${pdfUrl}`);
  if (!response.ok) {
    throw new Error(`Failed to load PDF from API: ${pdfUrl}. Status: ${response.status}`);
  }
  // клонируем поток, чтобы можно было читать дважды
  const clone = response.clone();
  const blob = await clone.blob();
  console.log('PDF MIME:', blob.type, 'Size:', blob.size);

  // читаем основное тело
  return await response.arrayBuffer();
};

const isMainPdf = true;

export const generateApartmentPDF = async (options: PDFGenerationOptions): Promise<void> => {
  const { apartment, pdfUrl, pdf_main } = options;

  try {
    // Загружаем PDF из API
    const apiPdfBytes = await loadPDFFromAPI(pdfUrl);
    const apiPdfDoc = await PDFDocument.load(apiPdfBytes, { ignoreEncryption: true });

    // Если есть основной PDF, объединяем их
    if (pdf_main && isMainPdf) {
      
      const mainPdfBytes = await loadPDFFile(pdf_main);
      const mainPdfDoc = await PDFDocument.load(mainPdfBytes, { ignoreEncryption: true });

      // Создаем новый документ для объединения
      const mergedPdfDoc = await PDFDocument.create();

      // Добавляем страницы из API PDF
      const apiPages = await mergedPdfDoc.copyPages(
        apiPdfDoc,
        apiPdfDoc.getPageIndices()
      );
      apiPages.forEach((page) => mergedPdfDoc.addPage(page));

      // Добавляем страницы из основного PDF
      const mainPages = await mergedPdfDoc.copyPages(
        mainPdfDoc,
        mainPdfDoc.getPageIndices()
      );
      mainPages.forEach((page) => mergedPdfDoc.addPage(page));

      // Сохраняем объединенный PDF
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
    } else {
      // Если нет основного PDF, просто скачиваем PDF из API
      const fileName = `apartment_${apartment.apartment_number}_details.pdf`;
      const blob = new Blob([new Uint8Array(apiPdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};
