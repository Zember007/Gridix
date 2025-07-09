
import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'ru' | 'en' | 'ka';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  ru: {
    // Common
    'common.loading': 'Загрузка...',
    'common.search': 'Поиск',
    'common.back': 'Назад',
    'common.save': 'Сохранить',
    'common.cancel': 'Отмена',
    'common.delete': 'Удалить',
    'common.edit': 'Редактировать',
    'common.close': 'Закрыть',
    'common.add': 'Добавить',
    'common.create': 'Создать',
    'common.update': 'Обновить',
    'common.contact': 'Связаться',
    'common.more': 'Подробнее',
    'common.reserve': 'Забронировать',
    'common.unavailable': 'Недоступно',
    'common.available': 'Доступно',
    'common.reserved': 'Забронировано',
    'common.sold': 'Продано',
    
    // Navigation
    'nav.admin': 'Админ панель',
    'nav.projects': 'Проекты',
    'nav.settings': 'Настройки',
    'nav.logout': 'Выйти',
    
    // Project
    'project.notFound': 'Проект не найден',
    'project.invalidId': 'Неверный идентификатор проекта',
    'project.loading': 'Загрузка проекта...',
    'project.floor': 'Этаж',
    'project.allFloors': 'Все этажи',
    'project.rooms': 'Комнаты',
    'project.allTypes': 'Все типы',
    'project.status': 'Статус',
    'project.allStatuses': 'Все статусы',
    'project.apartmentNumber': 'Номер квартиры',
    'project.price': 'Цена',
    'project.onlyAvailable': 'Только доступные',
    'project.floorPlan': 'План этажа',
    'project.table': 'Таблица',
    'project.summary': 'Сводка',
    'project.total': 'Всего',
    'project.averagePrice': 'Средняя цена',
    'project.contactManager': 'Связаться с менеджером',
    'project.legend': 'Легенда',
    'project.noBuildingPlan': 'План здания не загружен',
    'project.contactAdmin': 'Обратитесь к администратору для загрузки плана',
    'project.interactivePlan': 'Интерактивный план здания',
    'project.apartmentsList': 'Список квартир',
    'project.found': 'Найдено',
    'project.apartments': 'квартир',
    'project.notFoundApartments': 'Квартиры не найдены',
    'project.changeFilters': 'Измените фильтры для поиска',
    
    // Apartment
    'apartment.number': 'Номер',
    'apartment.floor': 'Этаж',
    'apartment.rooms': 'Комнаты',
    'apartment.area': 'Площадь',
    'apartment.price': 'Цена',
    'apartment.pricePerSqm': '₽/м²',
    'apartment.status': 'Статус',
    'apartment.studio': 'Студия',
    'apartment.room': 'комн.',
    'apartment.sqm': 'м²',
    
    // Admin
    'admin.dashboard': 'Панель управления',
    'admin.createProject': 'Создать проект',
    'admin.projects': 'Проекты',
    'admin.noProjects': 'Нет проектов',
    'admin.createFirst': 'Создайте свой первый проект',
    'admin.projectCreated': 'Создано',
    'admin.projectUpdated': 'Обновлено',
    
    // Landing
    'landing.title': 'Создавайте интерактивные',
    'landing.subtitle': 'планы недвижимости',
    'landing.description': 'Профессиональная платформа для создания интерактивных планов зданий и квартир с интеграцией Excel и встраиваемыми виджетами',
    'landing.getStarted': 'Начать',
    'landing.viewDemo': 'Посмотреть демо',
    'landing.features': 'Возможности платформы',
    'landing.planUpload': 'Загрузка планов',
    'landing.planUploadDesc': 'Загружайте изображения зданий и планы этажей в высоком разрешении',
    'landing.interactiveEditing': 'Интерактивное редактирование',
    'landing.interactiveEditingDesc': 'Создавайте интерактивные зоны квартир с помощью полигонов',
    'landing.excelIntegration': 'Интеграция с Excel',
    'landing.excelIntegrationDesc': 'Импортируйте данные квартир из Excel файлов с автоматической синхронизацией',
    'landing.embeddableWidget': 'Встраиваемый виджет',
    'landing.embeddableWidgetDesc': 'Легко интегрируйте интерактивные планы в любой сайт одной строкой кода',
    'landing.statusManagement': 'Управление статусами',
    'landing.statusManagementDesc': 'Отслеживайте статусы квартир: доступно, продано, забронировано',
    'landing.multiProject': 'Мульти-проекты',
    'landing.multiProjectDesc': 'Управляйте несколькими проектами недвижимости из единой панели',
    'landing.readyToStart': 'Готовы начать?',
    'landing.readyToStartDesc': 'Создайте свой первый интерактивный проект недвижимости уже сегодня',
    'landing.enterAdmin': 'Войти в админ панель',
    'landing.copyright': '© 2024 RealEstate SaaS. Профессиональные решения для недвижимости.',
  },
  en: {
    // Common
    'common.loading': 'Loading...',
    'common.search': 'Search',
    'common.back': 'Back',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.add': 'Add',
    'common.create': 'Create',
    'common.update': 'Update',
    'common.contact': 'Contact',
    'common.more': 'More details',
    'common.reserve': 'Reserve',
    'common.unavailable': 'Unavailable',
    'common.available': 'Available',
    'common.reserved': 'Reserved',
    'common.sold': 'Sold',
    
    // Navigation
    'nav.admin': 'Admin Panel',
    'nav.projects': 'Projects',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    
    // Project
    'project.notFound': 'Project not found',
    'project.invalidId': 'Invalid project identifier',
    'project.loading': 'Loading project...',
    'project.floor': 'Floor',
    'project.allFloors': 'All floors',
    'project.rooms': 'Rooms',
    'project.allTypes': 'All types',
    'project.status': 'Status',
    'project.allStatuses': 'All statuses',
    'project.apartmentNumber': 'Apartment number',
    'project.price': 'Price',
    'project.onlyAvailable': 'Only available',
    'project.floorPlan': 'Floor plan',
    'project.table': 'Table',
    'project.summary': 'Summary',
    'project.total': 'Total',
    'project.averagePrice': 'Average price',
    'project.contactManager': 'Contact manager',
    'project.legend': 'Legend',
    'project.noBuildingPlan': 'Building plan not loaded',
    'project.contactAdmin': 'Contact administrator to upload plan',
    'project.interactivePlan': 'Interactive building plan',
    'project.apartmentsList': 'Apartments list',
    'project.found': 'Found',
    'project.apartments': 'apartments',
    'project.notFoundApartments': 'No apartments found',
    'project.changeFilters': 'Change filters to search',
    
    // Apartment
    'apartment.number': 'Number',
    'apartment.floor': 'Floor',
    'apartment.rooms': 'Rooms',
    'apartment.area': 'Area',
    'apartment.price': 'Price',
    'apartment.pricePerSqm': '₽/m²',
    'apartment.status': 'Status',
    'apartment.studio': 'Studio',
    'apartment.room': 'rm.',
    'apartment.sqm': 'm²',
    
    // Admin
    'admin.dashboard': 'Dashboard',
    'admin.createProject': 'Create Project',
    'admin.projects': 'Projects',
    'admin.noProjects': 'No projects',
    'admin.createFirst': 'Create your first project',
    'admin.projectCreated': 'Created',
    'admin.projectUpdated': 'Updated',
    
    // Landing
    'landing.title': 'Create Interactive',
    'landing.subtitle': 'Real Estate Floor Plans',
    'landing.description': 'Professional platform for creating interactive building and apartment floor plans with Excel data integration and embeddable widgets',
    'landing.getStarted': 'Get Started',
    'landing.viewDemo': 'View Demo',
    'landing.features': 'Platform Features',
    'landing.planUpload': 'Plan Upload',
    'landing.planUploadDesc': 'Upload high-resolution building images and floor plans',
    'landing.interactiveEditing': 'Interactive Editing',
    'landing.interactiveEditingDesc': 'Outline floors with polygons and create interactive apartment zones',
    'landing.excelIntegration': 'Excel Integration',
    'landing.excelIntegrationDesc': 'Import apartment data from Excel files with automatic synchronization',
    'landing.embeddableWidget': 'Embeddable Widget',
    'landing.embeddableWidgetDesc': 'Easily integrate interactive plans into any website with one line of code',
    'landing.statusManagement': 'Status Management',
    'landing.statusManagementDesc': 'Track apartment statuses: available, sold, reserved',
    'landing.multiProject': 'Multi-Project',
    'landing.multiProjectDesc': 'Manage multiple real estate projects from a single dashboard',
    'landing.readyToStart': 'Ready to Start?',
    'landing.readyToStartDesc': 'Create your first interactive real estate project today',
    'landing.enterAdmin': 'Enter Admin Panel',
    'landing.copyright': '© 2024 RealEstate SaaS. Professional real estate solutions.',
  },
  ka: {
    // Common
    'common.loading': 'იტვირთება...',
    'common.search': 'ძიება',
    'common.back': 'უკან',
    'common.save': 'შენახვა',
    'common.cancel': 'გაუქმება',
    'common.delete': 'წაშლა',
    'common.edit': 'რედაქტირება',
    'common.close': 'დახურვა',
    'common.add': 'დამატება',
    'common.create': 'შექმნა',
    'common.update': 'განახლება',
    'common.contact': 'კონტაქტი',
    'common.more': 'დეტალურად',
    'common.reserve': 'დაჯავშნა',
    'common.unavailable': 'მიუწვდომელი',
    'common.available': 'ხელმისაწვდომი',
    'common.reserved': 'დაჯავშნული',
    'common.sold': 'გაყიდული',
    
    // Navigation
    'nav.admin': 'ადმინ პანელი',
    'nav.projects': 'პროექტები',
    'nav.settings': 'პარამეტრები',
    'nav.logout': 'გასვლა',
    
    // Project
    'project.notFound': 'პროექტი ვერ მოიძებნა',
    'project.invalidId': 'არასწორი პროექტის იდენტიფიკატორი',
    'project.loading': 'პროექტი იტვირთება...',
    'project.floor': 'სართული',
    'project.allFloors': 'ყველა სართული',
    'project.rooms': 'ოთახები',
    'project.allTypes': 'ყველა ტიპი',
    'project.status': 'სტატუსი',
    'project.allStatuses': 'ყველა სტატუსი',
    'project.apartmentNumber': 'ბინის ნომერი',
    'project.price': 'ფასი',
    'project.onlyAvailable': 'მხოლოდ ხელმისაწვდომი',
    'project.floorPlan': 'სართულის გეგმა',
    'project.table': 'ცხრილი',
    'project.summary': 'შეჯამება',
    'project.total': 'სულ',
    'project.averagePrice': 'საშუალო ფასი',
    'project.contactManager': 'კონტაქტი მენეჯერთან',
    'project.legend': 'ლეგენდა',
    'project.noBuildingPlan': 'შენობის გეგმა არ არის ატვირთული',
    'project.contactAdmin': 'დაუკავშირდით ადმინისტრატორს გეგმის ატვირთვისთვის',
    'project.interactivePlan': 'ინტერაქტიული შენობის გეგმა',
    'project.apartmentsList': 'ბინების სია',
    'project.found': 'ნაპოვნია',
    'project.apartments': 'ბინა',
    'project.notFoundApartments': 'ბინები ვერ მოიძებნა',
    'project.changeFilters': 'შეცვალეთ ფილტრები ძიებისთვის',
    
    // Apartment
    'apartment.number': 'ნომერი',
    'apartment.floor': 'სართული',
    'apartment.rooms': 'ოთახები',
    'apartment.area': 'ფართობი',
    'apartment.price': 'ფასი',
    'apartment.pricePerSqm': '₽/მ²',
    'apartment.status': 'სტატუსი',
    'apartment.studio': 'სტუდია',
    'apartment.room': 'ოთ.',
    'apartment.sqm': 'მ²',
    
    // Admin
    'admin.dashboard': 'მართვის პანელი',
    'admin.createProject': 'პროექტის შექმნა',
    'admin.projects': 'პროექტები',
    'admin.noProjects': 'პროექტები არ არის',
    'admin.createFirst': 'შექმენით თქვენი პირველი პროექტი',
    'admin.projectCreated': 'შექმნილია',
    'admin.projectUpdated': 'განახლებულია',
    
    // Landing
    'landing.title': 'შექმენით ინტერაქტიული',
    'landing.subtitle': 'უძრავი ქონების სართულის გეგმები',
    'landing.description': 'პროფესიონალური პლატფორმა ინტერაქტიული შენობის და ბინის სართულის გეგმების შესაქმნელად Excel მონაცემების ინტეგრაციითა და ჩასატვირთი ვიჯეტებით',
    'landing.getStarted': 'დაწყება',
    'landing.viewDemo': 'დემოს ნახვა',
    'landing.features': 'პლატფორმის ფუნქციები',
    'landing.planUpload': 'გეგმის ატვირთვა',
    'landing.planUploadDesc': 'ატვირთეთ მაღალი რეზოლუციის შენობის სურათები და სართულის გეგმები',
    'landing.interactiveEditing': 'ინტერაქტიული რედაქტირება',
    'landing.interactiveEditingDesc': 'გაავლეთ სართულები პოლიგონებით და შექმენით ინტერაქტიული ბინის ზონები',
    'landing.excelIntegration': 'Excel ინტეგრაცია',
    'landing.excelIntegrationDesc': 'იმპორტი ბინის მონაცემები Excel ფაილებიდან ავტომატური სინქრონიზაციით',
    'landing.embeddableWidget': 'ჩასატვირთი ვიჯეტი',
    'landing.embeddableWidgetDesc': 'ადვილად ინტეგრირება ინტერაქტიული გეგმები ნებისმიერ ვებსაიტში ერთი კოდის ხაზით',
    'landing.statusManagement': 'სტატუსის მართვა',
    'landing.statusManagementDesc': 'თვალყური ადევნეთ ბინების სტატუსებს: ხელმისაწვდომი, გაყიდული, დაჯავშნული',
    'landing.multiProject': 'მრავალ-პროექტი',
    'landing.multiProjectDesc': 'მართეთ მრავალი უძრავი ქონების პროექტი ერთი გაერთიანებული პანელიდან',
    'landing.readyToStart': 'მზად ხარ დასაწყებად?',
    'landing.readyToStartDesc': 'შექმენით თქვენი პირველი ინტერაქტიული უძრავი ქონების პროექტი დღეს',
    'landing.enterAdmin': 'ადმინ პანელში შესვლა',
    'landing.copyright': '© 2024 RealEstate SaaS. პროფესიონალური უძრავი ქონების გადაწყვეტილებები.',
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('ru');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && ['ru', 'en', 'ka'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
