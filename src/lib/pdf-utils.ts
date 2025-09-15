import jsPDF from 'jspdf';
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

export const generateApartmentPDF = async (options: PDFGenerationOptions): Promise<void> => {
  const { apartment, projectCurrency, photos, translations } = options;
  
  try {
    // Создаем PDF документ
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageHeight = 297; // A4 height in mm
    const margin = 20;
    
    let yPosition = margin;
    
    // Заголовок
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text(translations.apartmentDetails, margin, yPosition);
    yPosition += 15;
    
    // Номер квартиры
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${translations.apartmentNumber}: ${apartment.apartment_number}`, margin, yPosition);
    yPosition += 10;
    
    // Основная информация
    pdf.setFontSize(12);
    const infoLines = [
      `${capitalizeFirstLetter(translations.floor)}: ${apartment.floor_number}`,
      `${capitalizeFirstLetter(translations.rooms)}: ${apartment.rooms === 0 ? translations.studio : apartment.rooms}`,
      `${capitalizeFirstLetter(translations.area)}: ${apartment.area} m²`,
    ];
    
    if (apartment.price) {
      infoLines.push(`${translations.price}: ${formatPriceWithCurrency(apartment.price, projectCurrency)}`);
    }
    
    // Статус
    let statusText = apartment.status;
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
    infoLines.push(`${translations.status}: ${statusText}`);
    
    infoLines.forEach(line => {
      pdf.text(line, margin, yPosition);
      yPosition += 7;
    });
    
    yPosition += 10;
    
    // Фотографии
    if (photos.length > 0) {
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(translations.photos, margin, yPosition);
      yPosition += 10;
      
      // Загружаем и добавляем изображения
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        
        try {
          // Проверяем, нужна ли новая страница
          if (yPosition > pageHeight - 80) {
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
          
          // Вычисляем размеры для PDF (максимум 160mm в ширину, 100mm в высоту)
          const dimensions = getImageDimensions(tempImg.width, tempImg.height, 160, 100);
          
          // Добавляем подпись к фото
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          const photoLabel = photo.type === 'layout' 
            ? translations.layout 
            : translations.apartmentPhoto;
          pdf.text(`${photoLabel}${photo.description ? `: ${photo.description}` : ''}`, margin, yPosition);
          yPosition += 5;
          
          // Добавляем изображение
          pdf.addImage(
            base64Image,
            'JPEG',
            margin,
            yPosition,
            dimensions.width,
            dimensions.height
          );
          
          yPosition += dimensions.height + 10;
          
        } catch (error) {
          console.error(`Failed to load image ${photo.image_url}:`, error);
          // Добавляем текст об ошибке загрузки изображения
          pdf.setFontSize(10);
          pdf.setTextColor(150, 150, 150);
          pdf.text(`[${translations.apartmentPhoto} не удалось загрузить]`, margin, yPosition);
          pdf.setTextColor(0, 0, 0);
          yPosition += 10;
        }
      }
    }
    
    // Добавляем дату генерации в нижний колонтитул
    const currentDate = new Date().toLocaleDateString();
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      `${translations.generatedOn}: ${currentDate}`,
      margin,
      pageHeight - 10
    );
    
    // Сохраняем PDF
    const fileName = `apartment_${apartment.apartment_number}_details.pdf`;
    pdf.save(fileName);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};
