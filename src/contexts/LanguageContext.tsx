
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ru' | 'en' | 'ka';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  ru: {
    // Общие
    'common.back': 'Назад',
    'common.save': 'Сохранить',
    'common.cancel': 'Отмена',
    'common.delete': 'Удалить',
    'common.edit': 'Редактировать',
    'common.loading': 'Загрузка...',
    'common.error': 'Ошибка',
    'common.success': 'Успешно',
    
    // Админка
    'admin.dashboard': 'Панель управления',
    
    // Проект
    'project.interactivePlan': 'Интерактивный план',
    'project.noBuildingPlan': 'План здания не загружен',
    'project.contactAdmin': 'Обратитесь к администратору для загрузки плана',
    'project.backToBuilding': 'Назад к зданию',
    'project.floor': 'этаж',
    'project.contactManager': 'Связаться с менеджером',
    
    // Квартира
    'apartment.number': 'Квартира',
    'apartment.room': 'комн.',
    'apartment.rooms': 'Комнаты',
    'apartment.studio': 'Студия',
    'apartment.sqm': 'м²',
    'apartment.floor': 'Этаж',
    'apartment.floorSuffix': 'этаж',
    'apartment.area': 'Площадь',
    'apartment.price': 'Цена',
    'apartment.status': 'Статус',
    'apartment.statusAvailable': 'Доступно',
    'apartment.statusReserved': 'Забронировано',
    'apartment.statusSold': 'Продано',
    
    // Фильтры
    'filters.title': 'Фильтры',
    'filters.clear': 'Очистить',
    'filters.allStatuses': 'Все статусы',
    'filters.allRooms': 'Все комнаты',
    'filters.allFloors': 'Все этажи',
    'filters.priceFrom': 'Цена от',
    'filters.priceTo': 'Цена до',
    'filters.areaFrom': 'Площадь от',
    'filters.areaTo': 'Площадь до',
    
    // Таблица
    'table.apartment': 'Квартира',
    'table.floor': 'Этаж',
    'table.rooms': 'Комнаты',
    'table.area': 'Площадь',
    'table.price': 'Цена',
    'table.pricePerSqm': '₽/м²',
    'table.status': 'Статус',
    'table.noResults': 'Квартир не найдено',
    'table.selectView': 'Выберите вид отображения'
  },
  en: {
    // Common
    'common.back': 'Back',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    
    // Admin
    'admin.dashboard': 'Admin Dashboard',
    
    // Project
    'project.interactivePlan': 'Interactive Plan',
    'project.noBuildingPlan': 'Building plan not uploaded',
    'project.contactAdmin': 'Contact administrator to upload plan',
    'project.backToBuilding': 'Back to building',
    'project.floor': 'floor',
    'project.contactManager': 'Contact Manager',
    
    // Apartment
    'apartment.number': 'Apartment',
    'apartment.room': 'room',
    'apartment.rooms': 'Rooms',
    'apartment.studio': 'Studio',
    'apartment.sqm': 'sqm',
    'apartment.floor': 'Floor',
    'apartment.floorSuffix': 'floor',
    'apartment.area': 'Area',
    'apartment.price': 'Price',
    'apartment.status': 'Status',
    'apartment.statusAvailable': 'Available',
    'apartment.statusReserved': 'Reserved',
    'apartment.statusSold': 'Sold',
    
    // Filters
    'filters.title': 'Filters',
    'filters.clear': 'Clear',
    'filters.allStatuses': 'All statuses',
    'filters.allRooms': 'All rooms',
    'filters.allFloors': 'All floors',
    'filters.priceFrom': 'Price from',
    'filters.priceTo': 'Price to',
    'filters.areaFrom': 'Area from',
    'filters.areaTo': 'Area to',
    
    // Table
    'table.apartment': 'Apartment',
    'table.floor': 'Floor',
    'table.rooms': 'Rooms',
    'table.area': 'Area',
    'table.price': 'Price',
    'table.pricePerSqm': '$/sqm',
    'table.status': 'Status',
    'table.noResults': 'No apartments found',
    'table.selectView': 'Select display view'
  },
  ka: {
    // Common
    'common.back': 'უკან',
    'common.save': 'შენახვა',
    'common.cancel': 'გაუქმება',
    'common.delete': 'წაშლა',
    'common.edit': 'რედაქტირება',
    'common.loading': 'იტვირთება...',
    'common.error': 'შეცდომა',
    'common.success': 'წარმატება',
    
    // Admin
    'admin.dashboard': 'ადმინისტრაციული პანელი',
    
    // Project
    'project.interactivePlan': 'ინტერაქტიული გეგმა',
    'project.noBuildingPlan': 'შენობის გეგმა არ არის ატვირთული',
    'project.contactAdmin': 'დაუკავშირდით ადმინისტრატორს გეგმის ასატვირთად',
    'project.backToBuilding': 'უკან შენობაზე',
    'project.floor': 'სართული',
    'project.contactManager': 'მენეჯერთან კონტაქტი',
    
    // Apartment
    'apartment.number': 'ბინა',
    'apartment.room': 'ოთახი',
    'apartment.rooms': 'ოთახები',
    'apartment.studio': 'სტუდია',
    'apartment.sqm': 'კვ.მ',
    'apartment.floor': 'სართული',
    'apartment.floorSuffix': 'სართული',
    'apartment.area': 'ფართობი',
    'apartment.price': 'ფასი',
    'apartment.status': 'სტატუსი',
    'apartment.statusAvailable': 'ხელმისაწვდომი',
    'apartment.statusReserved': 'დაჯავშნული',
    'apartment.statusSold': 'გაყიდული',
    
    // Filters
    'filters.title': 'ფილტრები',
    'filters.clear': 'გასუფთავება',
    'filters.allStatuses': 'ყველა სტატუსი',
    'filters.allRooms': 'ყველა ოთახი',
    'filters.allFloors': 'ყველა სართული',
    'filters.priceFrom': 'ფასი დან',
    'filters.priceTo': 'ფასი მდე',
    'filters.areaFrom': 'ფართობი დან',
    'filters.areaTo': 'ფართობი მდე',
    
    // Table
    'table.apartment': 'ბინა',
    'table.floor': 'სართული',
    'table.rooms': 'ოთახები',
    'table.area': 'ფართობი',
    'table.price': 'ფასი',
    'table.pricePerSqm': 'ლ/კვ.მ',
    'table.status': 'სტატუსი',
    'table.noResults': 'ბინები ვერ მოიძებნა',
    'table.selectView': 'აირჩიეთ ჩვენების ტიპი'
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'ru';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
