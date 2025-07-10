
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'ru' | 'en' | 'ka';

interface Translations {
  [key: string]: {
    [key in Language]: string;
  };
}

const translations: Translations = {
  // Navigation
  'nav.projects': {
    ru: 'Проекты',
    en: 'Projects',
    ka: 'პროექტები'
  },
  'nav.about': {
    ru: 'О нас',
    en: 'About',
    ka: 'ჩვენს შესახებ'
  },
  'nav.contact': {
    ru: 'Контакты',
    en: 'Contact',
    ka: 'კონტაქტი'
  },

  // Project
  'project.apartments': {
    ru: 'квартир',
    en: 'apartments',
    ka: 'ბინები'
  },
  'project.floors': {
    ru: 'этажей',
    en: 'floors',
    ka: 'სართულები'
  },
  'project.available': {
    ru: 'Доступно',
    en: 'Available',
    ka: 'ხელმისაწვდომია'
  },
  'project.reserved': {
    ru: 'Забронировано',
    en: 'Reserved',
    ka: 'დაჯავშნული'
  },
  'project.sold': {
    ru: 'Продано',
    en: 'Sold',
    ka: 'გაყიდული'
  },
  'project.price': {
    ru: 'Цена',
    en: 'Price',
    ka: 'ფასი'
  },
  'project.area': {
    ru: 'Площадь',
    en: 'Area',
    ka: 'ართული'
  },
  'project.rooms': {
    ru: 'Комнаты',
    en: 'Rooms',
    ka: 'ოთახები'
  },
  'project.floor': {
    ru: 'Этаж',
    en: 'Floor',
    ka: 'სართული'
  },
  'project.contactManager': {
    ru: 'Связаться с менеджером',
    en: 'Contact Manager',
    ka: 'დაკავშირება მენეჯერთან'
  },
  'project.backToBuilding': {
    ru: 'Назад к зданию',
    en: 'Back to Building',
    ka: 'შენობაზე დაბრუნება'
  },
  'project.noBuildingPlan': {
    ru: 'План здания не настроен',
    en: 'Building plan not configured',
    ka: 'შენობის გეგმა არ არის კონფიგურირებული'
  },
  'project.contactAdmin': {
    ru: 'Обратитесь к администратору',
    en: 'Contact administrator',
    ka: 'დაუკავშირდით ადმინისტრატორს'
  },
  'project.interactivePlan': {
    ru: 'Интерактивный план',
    en: 'Interactive Plan',
    ka: 'ინტერაქტიული გეგმა'
  },

  // Filters
  'filters.search': {
    ru: 'Поиск...',
    en: 'Search...',
    ka: 'ძებნა...'
  },
  'filters.city': {
    ru: 'Город',
    en: 'City',
    ka: 'ქალაქი'
  },
  'filters.allCities': {
    ru: 'Все города',
    en: 'All cities',
    ka: 'ყველა ქალაქი'
  },
  'filters.status': {
    ru: 'Статус',
    en: 'Status',
    ka: 'სტატუსი'
  },
  'filters.allStatuses': {
    ru: 'Все статусы',
    en: 'All statuses',
    ka: 'ყველა სტატუსი'
  },
  'filters.priceRange': {
    ru: 'Диапазон цен',
    en: 'Price range',
    ka: 'ფასის დიაპაზონი'
  },
  'filters.minPrice': {
    ru: 'Мин. цена',
    en: 'Min price',
    ka: 'მინ. ფასი'
  },
  'filters.maxPrice': {
    ru: 'Макс. цена',
    en: 'Max price',
    ka: 'მაქს. ფასი'
  },
  'filters.applyFilters': {
    ru: 'Применить фильтры',
    en: 'Apply filters',
    ka: 'ფილტრების გამოყენება'
  },
  'filters.resetFilters': {
    ru: 'Сбросить фильтры',
    en: 'Reset filters',
    ka: 'ფილტრების გადატვირთვა'
  },

  // Statistics
  'stats.totalProjects': {
    ru: 'Всего проектов',
    en: 'Total projects',
    ka: 'სულ პროექტები'
  },
  'stats.totalApartments': {
    ru: 'Всего квартир',
    en: 'Total apartments',
    ka: 'სულ ბინები'
  },
  'stats.availableApartments': {
    ru: 'Доступные квартиры',
    en: 'Available apartments',
    ka: 'ხელმისაწვდომი ბინები'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ru');

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
