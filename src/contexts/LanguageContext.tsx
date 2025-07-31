
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Language,
  getLanguageFromUrlParam,
  getLanguageFromPath,
  addLanguageToPath,
  removeLanguageFromPath,
  getLanguageParam,
  DEFAULT_LANGUAGE,
  LANGUAGE_CONFIG
} from '@/lib/language-utils';

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
  'project.contactManagerNotConfigured': {
    ru: 'Контактная информация менеджера не настроена',
    en: 'Manager contact information not configured',
    ka: 'მენეჯერის საკონტაქტო ინფორმაცია არ არის კონფიგურირებული'
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
  'project.total': {
    ru: 'Всего',
    en: 'Total',
    ka: 'სულ'
  },
  'project.legend': {
    ru: 'Легенда',
    en: 'Legend',
    ka: 'ლეგენდა'
  },
  'project.loading': {
    ru: 'Загрузка...',
    en: 'Loading...',
    ka: 'იტვირთება...'
  },
  'project.parameters': {
    ru: 'Параметры',
    en: 'Parameters',
    ka: 'პარამეტრები'
  },
  'project.resetFilters': {
    ru: 'Сбросить фильтры',
    en: 'Reset filters',
    ka: 'ფილტრების გაუქმება'
  },
  'project.facade': {
    ru: 'Фасад',
    en: 'Facade',
    ka: 'ფასადი'
  },
  'project.listView': {
    ru: 'Списком',
    en: 'List view',
    ka: 'სიის სახით'
  },
  'project.layouts': {
    ru: 'Планировки',
    en: 'Layouts',
    ka: 'პლანირებები'
  },
  'project.layout': {
    ru: 'Планировка',
    en: 'Layout',
    ka: 'პლანირება'
  },
  'project.type': {
    ru: 'Тип',
    en: 'Type',
    ka: 'ტიპი'
  },
  'project.location': {
    ru: 'Расположение',
    en: 'Location',
    ka: 'მდებარეობა'
  },
  'project.finishing': {
    ru: 'Отделка',
    en: 'Finishing',
    ka: 'მოწყობა'
  },
  'project.sampleLocation': {
    ru: 'Вид на море',
    en: 'Sea view',
    ka: 'ზღვის ხედი'
  },
  'project.of': {
    ru: 'из',
    en: 'of',
    ka: '-დან'
  },
  'project.onRequest': {
    ru: 'По запросу',
    en: 'On request',
    ka: 'მოთხოვნისთანა'
  },
  'project.installmentFrom': {
    ru: 'В рассрочку от 700$',
    en: 'Installment from $700',
    ka: 'განვადებით $700-დან'
  },
  'project.showMore': {
    ru: 'Показать еще {{count}} из {{total}} вариантов',
    en: 'Show {{count}} more of {{total}} options',
    ka: 'აჩვენე კიდევ {{count}} {{total}}-დან'
  },
  'project.viewApartments': {
    ru: 'Смотреть {{count}} вариантов',
    en: 'View {{count}} options',
    ka: 'იხილე {{count}} ვარიანტი'
  },
  'project.contactMessage': {
    ru: 'Здравствуйте! Интересует проект {{projectName}}. Можете предоставить дополнительную информацию?',
    en: 'Hello! I am interested in the {{projectName}} project. Can you provide additional information?',
    ka: 'გამარჯობა! მაინტერესებს {{projectName}} პროექტი. შეგიძლიათ დამატებითი ინფორმაცია მოგვაწოდოთ?'
  },
  'project.noContactInfo': {
    ru: 'Контактная информация менеджера не настроена',
    en: 'Manager contact information not configured',
    ka: 'მენეჯერის საკონტაქტო ინფორმაცია არ არის კონფიგურირებული'
  },
  'apartment.rooms': {
    ru: 'комнаты',
    en: 'rooms',
    ka: 'ოთახები'
  },
  'project.selectFloor': {
    ru: 'Выберите этаж',
    en: 'Select floor',
    ka: 'აირჩიეთ სართული'
  },
  'project.apartmentsList': {
    ru: 'Список квартир',
    en: 'Apartments list',
    ka: 'ბინების სია'
  },
  'project.noImage': {
    ru: 'Изображение не загружено',
    en: 'No image loaded',
    ka: 'სურათი არ არის ჩატვირთული'
  },
  'project.priceRange': {
    ru: 'Диапазон цен',
    en: 'Price range',
    ka: 'ფასების დიაპაზონი'
  },
  'project.areaRange': {
    ru: 'Диапазон площадей',
    en: 'Area range',
    ka: 'ფართობების დიაპაზონი'
  },
  'project.layoutPreview': {
    ru: 'Предпросмотр планировки',
    en: 'Layout preview',
    ka: 'განლაგების გადახედვა'
  },
  'common.reserve': {
    ru: 'Забронировать',
    en: 'Reserve',
    ka: 'დაჯავშნა'
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
  },

  // Common
  'common.available': {
    ru: 'Доступно',
    en: 'Available',
    ka: 'ხელმისაწვდომია'
  },
  'common.reserved': {
    ru: 'Забронировано',
    en: 'Reserved',
    ka: 'დაჯავშნული'
  },
  'common.sold': {
    ru: 'Продано',
    en: 'Sold',
    ka: 'გაყიდული'
  },
  'common.more': {
    ru: 'Подробнее',
    en: 'More details',
    ka: 'დეტალები'
  },
  'common.priceOnRequest': {
    ru: 'По запросу',
    en: 'On request',
    ka: 'მოთხოვნისამებრ'
  },
  'common.search': {
    ru: 'Поиск',
    en: 'Search',
    ka: 'ძებნა'
  },
  'common.unavailable': {
    ru: 'Недоступно',
    en: 'Unavailable',
    ka: 'მიუწვდომელია'
  },

  // Navigation
  'nav.admin': {
    ru: 'Админ панель',
    en: 'Admin Panel',
    ka: 'ადმინ პანელი'
  },

  // Landing page
  'landing.title': {
    ru: 'Создавайте интерактивные планы',
    en: 'Create Interactive Floor Plans',
    ka: 'შექმენით ინტერაქტიული გეგმები'
  },
  'landing.subtitle': {
    ru: 'недвижимости легко',
    en: 'with ease',
    ka: 'მარტივად'
  },
  'landing.description': {
    ru: 'Профессиональная платформа для создания и управления интерактивными планами недвижимости. Загружайте планы, настраивайте квартиры и встраивайте виджеты на ваш сайт.',
    en: 'Professional platform for creating and managing interactive real estate floor plans. Upload plans, configure apartments, and embed widgets on your website.',
    ka: 'პროფესიონალური პლატფორმა ინტერაქტიული უძრავი ქონების გეგმების შესაქმნელად და მართვისთვის. ატვირთეთ გეგმები, კონფიგურაცია გაუკეთეთ ბინებს და ჩადეთ ვიჯეტები თქვენს ვებსაიტზე.'
  },
  'landing.getStarted': {
    ru: 'Начать работу',
    en: 'Get Started',
    ka: 'დაწყება'
  },
  'landing.viewDemo': {
    ru: 'Посмотреть демо',
    en: 'View Demo',
    ka: 'დემოს ნახვა'
  },
  'landing.features': {
    ru: 'Возможности платформы',
    en: 'Platform Features',
    ka: 'პლატფორმის შესაძლებლობები'
  },
  'landing.planUpload': {
    ru: 'Загрузка планов',
    en: 'Plan Upload',
    ka: 'გეგმების ატვირთვა'
  },
  'landing.planUploadDesc': {
    ru: 'Загружайте изображения планов зданий и создавайте интерактивные карты квартир',
    en: 'Upload building plan images and create interactive apartment maps',
    ka: 'ატვირთეთ შენობის გეგმების სურათები და შექმენით ინტერაქტიული ბინების რუკები'
  },
  'landing.interactiveEditing': {
    ru: 'Интерактивное редактирование',
    en: 'Interactive Editing',
    ka: 'ინტერაქტიული რედაქტირება'
  },
  'landing.interactiveEditingDesc': {
    ru: 'Создавайте и редактируйте полигоны квартир прямо в браузере с помощью удобного редактора',
    en: 'Create and edit apartment polygons directly in the browser with a convenient editor',
    ka: 'შექმენით და დაარედაქტირეთ ბინების პოლიგონები პირდაპირ ბრაუზერში მოსახერხებელი რედაქტორით'
  },
  'landing.excelIntegration': {
    ru: 'Интеграция с Excel',
    en: 'Excel Integration',
    ka: 'Excel ინტეგრაცია'
  },
  'landing.excelIntegrationDesc': {
    ru: 'Импортируйте данные о квартирах из Excel файлов и синхронизируйте информацию',
    en: 'Import apartment data from Excel files and synchronize information',
    ka: 'იმპორტი გაუკეთეთ ბინების მონაცემებს Excel ფაილებიდან და სინქრონიზაცია გაუკეთეთ ინფორმაციას'
  },
  'landing.embeddableWidget': {
    ru: 'Встраиваемые виджеты',
    en: 'Embeddable Widgets',
    ka: 'ჩასადები ვიჯეტები'
  },
  'landing.embeddableWidgetDesc': {
    ru: 'Встраивайте интерактивные планы на ваш сайт с помощью простого HTML кода',
    en: 'Embed interactive plans on your website with simple HTML code',
    ka: 'ჩადეთ ინტერაქტიული გეგმები თქვენს ვებსაიტზე მარტივი HTML კოდით'
  },
  'landing.statusManagement': {
    ru: 'Управление статусами',
    en: 'Status Management',
    ka: 'სტატუსების მართვა'
  },
  'landing.statusManagementDesc': {
    ru: 'Отслеживайте статусы квартир: доступно, забронировано, продано',
    en: 'Track apartment statuses: available, reserved, sold',
    ka: 'თვალყურის დევნება ბინების სტატუსებზე: ხელმისაწვდომი, დაჯავშნული, გაყიდული'
  },
  'landing.multiProject': {
    ru: 'Мульти-проекты',
    en: 'Multi-Projects',
    ka: 'მრავალი პროექტი'
  },
  'landing.multiProjectDesc': {
    ru: 'Управляйте несколькими проектами недвижимости в одной панели администратора',
    en: 'Manage multiple real estate projects in one admin panel',
    ka: 'მართეთ რამდენიმე უძრავი ქონების პროექტი ერთ ადმინ პანელში'
  },
  'landing.readyToStart': {
    ru: 'Готовы начать?',
    en: 'Ready to Start?',
    ka: 'მზად ხართ დასაწყებად?'
  },
  'landing.readyToStartDesc': {
    ru: 'Создайте свой первый интерактивный план недвижимости уже сегодня',
    en: 'Create your first interactive real estate plan today',
    ka: 'შექმენით თქვენი პირველი ინტერაქტიული უძრავი ქონების გეგმა დღესვე'
  },
  'landing.enterAdmin': {
    ru: 'Войти в админ панель',
    en: 'Enter Admin Panel',
    ka: 'ადმინ პანელში შესვლა'
  },
  'landing.copyright': {
    ru: '© 2024 RealEstate SaaS. Все права защищены.',
    en: '© 2024 RealEstate SaaS. All rights reserved.',
    ka: '© 2024 RealEstate SaaS. ყველა უფლება დაცულია.'
  },

  // Apartment details
  'apartment.number': {
    ru: 'Квартира №',
    en: 'Apartment #',
    ka: 'ბინა №'
  },            
  'apartment.floor': {
    ru: 'Этаж',
    en: 'Floor',
    ka: 'სართული'
  },
  'apartment.room': {
    ru: 'комн.',
    en: 'room',
    ka: 'ოთახი'
  },
  'apartment.studio': {
    ru: 'Студия',
    en: 'Studio',
    ka: 'სტუდია'
  },
  'apartment.area': {
    ru: 'Площадь',
    en: 'Area',
    ka: 'ფართობი'
  },
  'apartment.price': {
    ru: 'Цена',
    en: 'Price',
    ka: 'ფასი'
  },
  'apartment.pricePerSqm': {
    ru: 'Цена за м²',
    en: 'Price per m²',
    ka: 'ფასი მ²-ზე'
  },
  'apartment.status': {
    ru: 'Статус',
    en: 'Status',
    ka: 'სტატუსი'
  },
  'apartment.sqm': {
    ru: 'м²',
    en: 'm²',
    ka: 'მ²'
  },
  'apartment.sold': {
    ru: 'Продано',
    en: 'Sold',
    ka: 'გაყიდული'
  },
  'apartment.reserved': {
    ru: 'Забронировано',
    en: 'Reserved',
    ka: 'დაჯავშნული'
  },
  'apartment.available': {
    ru: 'Доступно',
    en: 'Available',
    ka: 'ხელმისაწვდომია'
  },
  'apartment.additionalInfo': {
    ru: 'Дополнительная информация',
    en: 'Additional Information',
    ka: 'დამატებითი ინფორმაცია'
  },

  // Project listings
  'project.notFoundApartments': {
    ru: 'По вашим критериям квартиры не найдены',
    en: 'No apartments found matching your criteria',
    ka: 'თქვენი კრიტერიუმების მიხედვით ბინები ვერ მოიძებნა'
  },
  'project.changeFilters': {
    ru: 'Попробуйте изменить фильтры поиска',
    en: 'Try changing your search filters',
    ka: 'სცადეთ ძებნის ფილტრების შეცვლა'
  },
  'project.found': {
    ru: 'Найдено',
    en: 'Found',
    ka: 'ნაპოვნია'
  },
  'project.floorPlan': {
    ru: 'План этажа',
    en: 'Floor Plan',
    ka: 'სართულის გეგმა'
  },
  'project.table': {
    ru: 'Таблица',
    en: 'Table',
    ka: 'ცხრილი'
  },
  'project.onlyAvailable': {
    ru: 'Только доступные',
    en: 'Only available',
    ka: 'მხოლოდ ხელმისაწვდომი'
  },
  'project.apartmentNumber': {
    ru: 'Номер квартиры',
    en: 'Apartment number',
    ka: 'ბინის ნომერი'
  },
  'project.notFound': {
    ru: 'Проект не найден',
    en: 'Project not found',
    ka: 'პროექტი ვერ მოიძებნა'
  },
  'project.invalidId': {
    ru: 'Неверный идентификатор проекта',
    en: 'Invalid project identifier',
    ka: 'არასწორი პროექტის იდენტიფიკატორი'
  },
  'project.summary': {
    ru: 'Сводка',
    en: 'Summary',
    ka: 'შეჯამება'
  },
  'project.allFloors': {
    ru: 'Все этажи',
    en: 'All floors',
    ka: 'ყველა სართული'
  },
  'project.allTypes': {
    ru: 'Все типы',
    en: 'All types',
    ka: 'ყველა ტიპი'
  },

  // Projects Gallery
  'gallery.title': {
    ru: 'Наши проекты',
    en: 'Our Projects',
    ka: 'ჩვენი პროექტები'
  },
  'gallery.subtitle': {
    ru: 'Выберите подходящий жилой комплекс',
    en: 'Choose the right residential complex',
    ka: 'აირჩიეთ შესაფერისი საცხოვრებელი კომპლექსი'
  },
  'gallery.search': {
    ru: 'Поиск',
    en: 'Search',
    ka: 'ძებნა'
  },
  'gallery.searchPlaceholder': {
    ru: 'Название или адрес...',
    en: 'Name or address...',
    ka: 'სახელი ან მისამართი...'
  },
  'gallery.city': {
    ru: 'Город',
    en: 'City',
    ka: 'ქალაქი'
  },
  'gallery.allCities': {
    ru: 'Все города',
    en: 'All cities',
    ka: 'ყველა ქალაქი'
  },
  'gallery.status': {
    ru: 'Статус',
    en: 'Status',
    ka: 'სტატუსი'
  },
  'gallery.allStatuses': {
    ru: 'Все статусы',
    en: 'All statuses',
    ka: 'ყველა სტატუსი'
  },
  'gallery.onSale': {
    ru: 'В продаже',
    en: 'On sale',
    ka: 'გაყიდვაში'
  },
  'gallery.soldOut': {
    ru: 'Распроданы',
    en: 'Sold out',
    ka: 'გაყიდული'
  },
  'gallery.cost': {
    ru: 'Стоимость',
    en: 'Cost',
    ka: 'ღირებულება'
  },
  'gallery.anyCost': {
    ru: 'Любая стоимость',
    en: 'Any cost',
    ka: 'ნებისმიერი ღირებულება'
  },
  'gallery.upTo5M': {
    ru: 'до 5 млн',
    en: 'up to 5M',
    ka: '5მ-მდე'
  },
  'gallery.from5To10M': {
    ru: '5-10 млн',
    en: '5-10M',
    ka: '5-10მ'
  },
  'gallery.from10M': {
    ru: 'от 10 млн',
    en: 'from 10M',
    ka: '10მ-დან'
  },
  'gallery.priceRange': {
    ru: 'Цена',
    en: 'Price',
    ka: 'ფასი'
  },
  'gallery.resetFilters': {
    ru: 'Сбросить фильтры',
    en: 'Reset filters',
    ka: 'ფილტრების გადატვირთვა'
  },
  'gallery.hideFilters': {
    ru: 'Скрыть фильтры',
    en: 'Hide filters',
    ka: 'ფილტრების დამალვა'
  },
  'gallery.foundCount': {
    ru: 'Найдено',
    en: 'Found',
    ka: 'ნაპოვნია'
  },
  'gallery.viewAllApartments': {
    ru: 'Смотреть все апартаменты',
    en: 'View all apartments',
    ka: 'ყველა ბინის ნახვა'
  },
  'gallery.installment0': {
    ru: 'Рассрочка 0%',
    en: 'Installment 0%',
    ka: 'განვადება 0%'
  },
  'gallery.downPayment': {
    ru: 'первый взнос от 5%',
    en: 'down payment from 5%',
    ka: 'პირველი გადახდა 5%-დან'
  },
  'gallery.salesStart': {
    ru: 'Старт продаж',
    en: 'Sales start',
    ka: 'გაყიდვების დაწყება'
  },
  'gallery.floors': {
    ru: 'этажей',
    en: 'floors',
    ka: 'სართული'
  },
  'gallery.apartments': {
    ru: 'квартир',
    en: 'apartments',
    ka: 'ბინა'
  },
  'gallery.from': {
    ru: 'от',
    en: 'from',
    ka: '-დან'
  },
  'gallery.available': {
    ru: 'доступно',
    en: 'available',
    ka: 'ხელმისაწვდომია'
  },
  'gallery.open': {
    ru: 'Открыть',
    en: 'Open',
    ka: 'გახსნა'
  },
  'gallery.noProjects': {
    ru: 'Проекты не найдены',
    en: 'No projects found',
    ka: 'პროექტები ვერ მოიძებნა'
  },
  'gallery.changeSearchCriteria': {
    ru: 'Попробуйте изменить критерии поиска',
    en: 'Try changing search criteria',
    ka: 'სცადეთ ძებნის კრიტერიუმების შეცვლა'
  },

  // Admin Dashboard
  'admin.back': {
    ru: 'Назад',
    en: 'Back',
    ka: 'უკან'
  },
  'admin.dashboard': {
    ru: 'Панель управления',
    en: 'Admin Dashboard',
    ka: 'ადმინისტრაციული პანელი'
  },
  'admin.dashboardDescription': {
    ru: 'Управление проектами и настройками',
    en: 'Manage projects and settings',
    ka: 'პროექტების და პარამეტრების მართვა'
  },
  'admin.projects': {
    ru: 'Проекты',
    en: 'Projects',
    ka: 'პროექტები'
  },
  'admin.widgets': {
    ru: 'Виджеты',
    en: 'Widgets',
    ka: 'ვიჯეტები'
  },
  'admin.analytics': {
    ru: 'Аналитика',
    en: 'Analytics',
    ka: 'ანალიტიკა'
  },
  'admin.settings': {
    ru: 'Настройки',
    en: 'Settings',
    ka: 'პარამეტრები'
  },
  'admin.analyticsDescription': {
    ru: 'Статистика по проектам и квартирам',
    en: 'Statistics on projects and apartments',
    ka: 'სტატისტიკა პროექტებისა და ბინების შესახებ'
  },
  'admin.analyticsComingSoon': {
    ru: 'Функция аналитики будет добавлена позже',
    en: 'Analytics feature will be added later',
    ka: 'ანალიტიკის ფუნქცია მოგვიანებით დაემატება'
  },

  // Project List
  'projectList.noProjects': {
    ru: 'Нет проектов',
    en: 'No projects',
    ka: 'პროექტები არ არის'
  },
  'projectList.createFirstDescription': {
    ru: 'Создайте свой первый проект недвижимости с интерактивными планами этажей и квартир',
    en: 'Create your first real estate project with interactive floor and apartment plans',
    ka: 'შექმენით თქვენი პირველი უძრავი ქონების პროექტი ინტერაქტიული სართულისა და ბინების გეგმებით'
  },
  'projectList.createFirst': {
    ru: 'Создать первый проект',
    en: 'Create first project',
    ka: 'პირველი პროექტის შექმნა'
  },
  'projectList.createNew': {
    ru: 'Создать проект',
    en: 'Create project',
    ka: 'პროექტის შექმნა'
  },
  'projectList.projects': {
    ru: 'Проекты',
    en: 'Projects',
    ka: 'პროექტები'
  },
  'projectList.manageDescription': {
    ru: 'Управление проектами недвижимости',
    en: 'Manage real estate projects',
    ka: 'უძრავი ქონების პროექტების მართვა'
  },

  // Embed Projects Page
  'embed.title': {
    ru: 'Проекты недвижимости',
    en: 'Real Estate Projects',
    ka: 'უძრავი ქონების პროექტები'
  },
  'embed.subtitle': {
    ru: 'Выберите проект для просмотра доступных квартир',
    en: 'Select a project to view available apartments',
    ka: 'აირჩიეთ პროექტი ხელმისაწვდომი ბინების სანახავად'
  },
  'embed.noProjects': {
    ru: 'Проекты не найдены',
    en: 'No projects found',
    ka: 'პროექტები ვერ მოიძებნა'
  },
  'embed.floors': {
    ru: 'Этажей',
    en: 'Floors',
    ka: 'სართულები'
  },
  'embed.viewApartments': {
    ru: 'Посмотреть квартиры',
    en: 'View apartments',
    ka: 'ბინების ნახვა'
  },

  // Project Creation Modal
  'modal.createProject': {
    ru: 'Создать новый проект',
    en: 'Create new project',
    ka: 'ახალი პროექტის შექმნა'
  },
  'modal.chooseMethod': {
    ru: 'Выберите способ создания проекта',
    en: 'Choose project creation method',
    ka: 'აირჩიეთ პროექტის შექმნის მეთოდი'
  },
  'modal.manualSetup': {
    ru: 'Ручная настройка',
    en: 'Manual setup',
    ka: 'ხელით კონფიგურაცია'
  },
  'modal.manualSetupDesc': {
    ru: 'Создать проект с нуля и настроить все самостоятельно',
    en: 'Create project from scratch and configure everything manually',
    ka: 'შექმენით პროექტი ნულიდან და ყველაფერი ხელით კონფიგურაცია'
  },
  'modal.startManual': {
    ru: 'Начать ручное создание',
    en: 'Start manual creation',
    ka: 'ხელით შექმნის დაწყება'
  },
  'modal.importExcel': {
    ru: 'Импорт из Excel',
    en: 'Import from Excel',
    ka: 'Excel-იდან იმპორტი'
  },
  'modal.importExcelDesc': {
    ru: 'Загрузить Excel файл с данными квартир и автоматически создать проект',
    en: 'Upload Excel file with apartment data and automatically create project',
    ka: 'ატვირთეთ Excel ფაილი ბინების მონაცემებით და ავტომატურად შექმენით პროექტი'
  },

  // Project Editor
  'projectEditor.newProject': {
    ru: 'Новый проект',
    en: 'New project',
    ka: 'ახალი პროექტი'
  },
  'projectEditor.editProject': {
    ru: 'Редактирование проекта',
    en: 'Edit project',
    ka: 'პროექტის რედაქტირება'
  },
  'projectEditor.createNewProject': {
    ru: 'Создание нового проекта',
    en: 'Creating new project',
    ka: 'ახალი პროექტის შექმნა'
  },
  'projectEditor.projectNameRequired': {
    ru: 'Название проекта обязательно',
    en: 'Project name is required',
    ka: 'პროექტის სახელი საჭიროა'
  },
  'projectEditor.authRequired': {
    ru: 'Необходима авторизация для работы с проектом',
    en: 'Authentication required to work with project',
    ka: 'პროექტთან მუშაობისთვის ავტორიზაცია საჭიროა'
  },
  'projectEditor.authRequiredCreate': {
    ru: 'Необходима авторизация для создания проекта',
    en: 'Authentication required to create project',
    ka: 'პროექტის შექმნისთვის ავტორიზაცია საჭიროა'
  },
  'projectEditor.authRequiredEdit': {
    ru: 'Необходима авторизация для редактирования проекта',
    en: 'Authentication required to edit project',
    ka: 'პროექტის რედაქტირებისთვის ავტორიზაცია საჭიროა'
  },
  'projectEditor.projectCreated': {
    ru: 'Проект создан',
    en: 'Project created',
    ka: 'პროექტი შეიქმნა'
  },
  'projectEditor.projectSaved': {
    ru: 'Проект сохранен',
    en: 'Project saved',
    ka: 'პროექტი შენახულია'
  },
  'projectEditor.errorLoading': {
    ru: 'Ошибка загрузки проекта',
    en: 'Error loading project',
    ka: 'პროექტის ჩატვირთვის შეცდომა'
  },
  'projectEditor.errorSaving': {
    ru: 'Ошибка сохранения проекта',
    en: 'Error saving project',
    ka: 'პროექტის შენახვის შეცდომა'
  },
  'projectEditor.accessDenied': {
    ru: 'Доступ запрещен',
    en: 'Access denied',
    ka: 'წვდომა უარყოფილია'
  },
  'projectEditor.noEditRights': {
    ru: 'У вас нет прав на редактирование этого проекта',
    en: 'You do not have permission to edit this project',
    ka: 'ამ პროექტის რედაქტირების უფლება არ გაქვთ'
  },
  'projectEditor.back': {
    ru: 'Назад',
    en: 'Back',
    ka: 'უკან'
  },
  'projectEditor.save': {
    ru: 'Сохранить',
    en: 'Save',
    ka: 'შენახვა'
  },
  'projectEditor.saving': {
    ru: 'Сохранение...',
    en: 'Saving...',
    ka: 'შენახვა...'
  },
  'projectEditor.basicInfo': {
    ru: 'Основная информация',
    en: 'Basic information',
    ka: 'ძირითადი ინფორმაცია'
  },
  'projectEditor.projectName': {
    ru: 'Название проекта',
    en: 'Project name',
    ka: 'პროექტის სახელი'
  },
  'projectEditor.description': {
    ru: 'Описание',
    en: 'Description',
    ka: 'აღწერა'
  },
  'projectEditor.address': {
    ru: 'Адрес',
    en: 'Address',
    ka: 'მისამართი'
  },
  'projectEditor.floors': {
    ru: 'Количество этажей',
    en: 'Number of floors',
    ka: 'სართულების რაოდენობა'
  },
  'projectEditor.buildingImage': {
    ru: 'Изображение здания',
    en: 'Building image',
    ka: 'შენობის სურათი'
  },
  'projectEditor.floorPlan': {
    ru: 'План этажа',
    en: 'Floor plan',
    ka: 'სართულის გეგმა'
  },
  'projectEditor.floor': {
    ru: 'Этаж',
    en: 'Floor',
    ka: 'სართული'
  },
  'projectEditor.floorPlanDesc': {
    ru: 'Планировка {floor} этажа',
    en: 'Floor {floor} layout',
    ka: 'სართული {floor} განლაგება'
  },
  'projectEditor.plan': {
    ru: 'План',
    en: 'Plan',
    ka: 'გეგმა'
  },

  // Project List
  'projectList.deleteConfirm': {
    ru: 'Вы уверены, что хотите удалить проект "{name}"?',
    en: 'Are you sure you want to delete project "{name}"?',
    ka: 'დარწმუნებული ხართ, რომ გსურთ პროექტის "{name}" წაშლა?'
  },
  'projectList.projectDeleted': {
    ru: 'Проект удален',
    en: 'Project deleted',
    ka: 'პროექტი წაშლილია'
  },
  'projectList.errorDeleting': {
    ru: 'Ошибка удаления проекта',
    en: 'Error deleting project',
    ka: 'პროექტის წაშლის შეცდომა'
  },
  'projectList.errorLoading': {
    ru: 'Ошибка загрузки проектов',
    en: 'Error loading projects',
    ka: 'პროექტების ჩატვირთვის შეცდომა'
  },
  'projectList.timeoutError': {
    ru: 'Загрузка проектов заняла слишком много времени',
    en: 'Loading projects took too long',
    ka: 'პროექტების ჩატვირთვას ძალიან დიდი დრო დასჭირდა'
  },
  'projectList.authRequired': {
    ru: 'Необходима авторизация',
    en: 'Authentication required',
    ka: 'ავტორიზაცია საჭიროა'
  },
  'projectList.viewProject': {
    ru: 'Посмотреть проект',
    en: 'View project',
    ka: 'პროექტის ნახვა'
  },
  'projectList.editProject': {
    ru: 'Редактировать проект',
    en: 'Edit project',
    ka: 'პროექტის რედაქტირება'
  },
  'projectList.deleteProject': {
    ru: 'Удалить проект',
    en: 'Delete project',
    ka: 'პროექტის წაშლა'
  },
  'projectList.copyWidgetCode': {
    ru: 'Копировать код виджета',
    en: 'Copy widget code',
    ka: 'ვიჯეტის კოდის კოპირება'
  },
  'projectList.widgetCodeCopied': {
    ru: 'Код виджета скопирован',
    en: 'Widget code copied',
    ka: 'ვიჯეტის კოდი კოპირებულია'
  },
  'projectList.created': {
    ru: 'Создан',
    en: 'Created',
    ka: 'შეიქმნა'
  },
  'projectList.updated': {
    ru: 'Обновлен',
    en: 'Updated',
    ka: 'განახლებულია'
  },
  'projectList.floors': {
    ru: 'Этажей',
    en: 'Floors',
    ka: 'სართულები'
  },
  'projectList.apartments': {
    ru: 'Квартир',
    en: 'Apartments',
    ka: 'ბინები'
  },

  // Admin Widgets
  'adminWidgets.embedCode': {
    ru: 'Код для вставки',
    en: 'Embed code',
    ka: 'ჩასასმელი კოდი'
  },
  'adminWidgets.embedCodeDesc': {
    ru: 'Скопируйте этот код и вставьте на ваш сайт',
    en: 'Copy this code and paste it on your website',
    ka: 'დააკოპირეთ ეს კოდი და ჩასვით თქვენს საიტზე'
  },
  'adminWidgets.width': {
    ru: 'Ширина',
    en: 'Width',
    ka: 'სიგანე'
  },
  'adminWidgets.height': {
    ru: 'Высота',
    en: 'Height',
    ka: 'სიმაღლე'
  },
  'adminWidgets.selectProject': {
    ru: 'Выберите проект',
    en: 'Select project',
    ka: 'აირჩიეთ პროექტი'
  },
  'adminWidgets.allProjects': {
    ru: 'Все проекты (галерея)',
    en: 'All projects (gallery)',
    ka: 'ყველა პროექტი (გალერეა)'
  },
  'adminWidgets.copyCode': {
    ru: 'Копировать код',
    en: 'Copy code',
    ka: 'კოდის კოპირება'
  },
  'adminWidgets.codeCopied': {
    ru: 'Код скопирован в буфер обмена',
    en: 'Code copied to clipboard',
    ka: 'კოდი კოპირებულია ბუფერში'
  },
  'adminWidgets.preview': {
    ru: 'Предварительный просмотр',
    en: 'Preview',
    ka: 'წინასწარი ნახვა'
  },
  'adminWidgets.loading': {
    ru: 'Загрузка...',
    en: 'Loading...',
    ka: 'ჩატვირთვა...'
  },
  'adminWidgets.links': {
    ru: 'Прямые ссылки',
    en: 'Direct links',
    ka: 'პირდაპირი ბმულები'
  },
  'adminWidgets.linksDesc': {
    ru: 'Используйте эти ссылки для прямого доступа к виджетам',
    en: 'Use these links to access the widgets directly',
    ka: 'ვიჯეტების პირდაპირი წვდომისთვის გამოიყენეთ ეს ბმულები'
  },
  'adminWidgets.selectedProject': {
    ru: 'Выбранный проект',
    en: 'Selected project',
    ka: 'აირჩილა პროექტი'
  },
  'adminWidgets.allProjectsDesc': {
    ru: 'Галерея всех проектов',
    en: 'Gallery of all projects',
    ka: 'ყველა პროექტის გალერეა'
  },

  // Interactive Map
  'map.loading': {
    ru: 'Загрузка карты...',
    en: 'Loading map...',
    ka: 'რუკის ჩატვირთვა...'
  },
  'map.noProjects': {
    ru: 'Нет проектов для отображения',
    en: 'No projects to display',
    ka: 'საჩვენებელი პროექტები არ არის'
  },
  'map.viewProject': {
    ru: 'Посмотреть проект',
    en: 'View project',
    ka: 'პროექტის ნახვა'
  },
  'map.projectInfo': {
    ru: 'Информация о проекте',
    en: 'Project information',
    ka: 'პროექტის ინფორმაცია'
  },

  // Embed Pages
  'embed.userNotFound': {
    ru: 'Пользователь не найден',
    en: 'User not found',
    ka: 'მომხმარებელი ვერ მოიძებნა'
  },
  'embed.userNotFoundDesc': {
    ru: 'Указанный пользователь не существует или не имеет публичных проектов.',
    en: 'The specified user does not exist or has no public projects.',
    ka: 'მითითებული მომხმარებელი არ არსებობს ან არ აქვს საჯარო პროექტები.'
  },
  'embed.projects': {
    ru: 'Проекты ({count})',
    en: 'Projects ({count})',
    ka: 'პროექტები ({count})'
  },
  'embed.onMap': {
    ru: 'На карте',
    en: 'On map',
    ka: 'რუკაზე'
  },
  'embed.listView': {
    ru: 'Список',
    en: 'List view',
    ka: 'სიის ხედი'
  },
  'embed.resetFilters': {
    ru: 'Сбросить фильтры',
    en: 'Reset filters',
    ka: 'ფილტრების გაუქმება'
  },

  // Admin Widgets (additional)
  'adminWidgets.title': {
    ru: 'Виджеты',
    en: 'Widgets',
    ka: 'ვიჯეტები'
  },
  'adminWidgets.description': {
    ru: 'Создание и настройка встраиваемых виджетов для ваших проектов',
    en: 'Create and configure embeddable widgets for your projects',
    ka: 'თქვენი პროექტებისთვის ჩასასმელი ვიჯეტების შექმნა და კონფიგურაცია'
  },
  'adminWidgets.settings': {
    ru: 'Настройки виджета',
    en: 'Widget settings',
    ka: 'ვიჯეტის პარამეტრები'
  },
  'adminWidgets.settingsDesc': {
    ru: 'Выберите проект и настройте параметры виджета',
    en: 'Select project and configure widget parameters',
    ka: 'აირჩიეთ პროექტი და დააკონფიგურირეთ ვიჯეტის პარამეტრები'
  },
  // Project Editor (additional)
  'projectEditor.photos': {
    ru: 'Фото',
    en: 'Photos',
    ka: 'ფოტოები'
  },
  'projectEditor.latitude': {
    ru: 'Широта (latitude)',
    en: 'Latitude',
    ka: 'განედი'
  },
  'projectEditor.longitude': {
    ru: 'Долгота (longitude)',
    en: 'Longitude',
    ka: 'გრძედი'
  },
  'projectEditor.latitudePlaceholder': {
    ru: 'Например: 55.7558',
    en: 'Example: 55.7558',
    ka: 'მაგალითი: 55.7558'
  },
  'projectEditor.longitudePlaceholder': {
    ru: 'Например: 37.6176',
    en: 'Example: 37.6176',
    ka: 'მაგალითი: 37.6176'
  },
  'projectEditor.latitudeExample': {
    ru: 'Пример: 55.7558 (Москва)',
    en: 'Example: 55.7558 (Moscow)',
    ka: 'მაგალითი: 55.7558 (მოსკოვი)'
  },
  'projectEditor.longitudeExample': {
    ru: 'Пример: 37.6176 (Москва)',
    en: 'Example: 37.6176 (Moscow)',
    ka: 'მაგალითი: 37.6176 (მოსკოვი)'
  },
  'projectEditor.floorPlans': {
    ru: 'Планы этажей',
    en: 'Floor plans',
    ka: 'სართულების გეგმები'
  },
  'projectEditor.floorPlansDesc': {
    ru: 'Управление планировками этажей. Нажмите на этаж для редактирования.',
    en: 'Manage floor layouts. Click on a floor to edit.',
    ka: 'სართულების განლაგების მართვა. რედაქტირებისთვის დააჭირეთ სართულს.'
  },
  'projectEditor.currency': {
    ru: 'Валюта',
    en: 'Currency',
    ka: 'ვალუტა'
  },
  'projectEditor.currencyDesc': {
    ru: 'Выберите валюту для отображения цен в проекте',
    en: 'Select currency for displaying prices in the project',
    ka: 'აირჩიეთ ვალუტა პროექტში ფასების საჩვენებლად'
  },

  // Currencies
  'currency.rub': {
    ru: 'Российский рубль (₽)',
    en: 'Russian Ruble (₽)',
    ka: 'რუსული რუბლი (₽)'
  },
  'currency.usd': {
    ru: 'Доллар США ($)',
    en: 'US Dollar ($)',
    ka: 'აშშ დოლარი ($)'
  },
  'currency.eur': {
    ru: 'Евро (€)',
    en: 'Euro (€)',
    ka: 'ევრო (€)'
  },
  'currency.gel': {
    ru: 'Грузинский лари (₾)',
    en: 'Georgian Lari (₾)',
    ka: 'ქართული ლარი (₾)'
  },

  // Widget Languages
  'adminWidgets.defaultLanguage': {
    ru: 'Язык по умолчанию',
    en: 'Default language',
    ka: 'ნაგულისხმევი ენა'
  },
  'adminWidgets.defaultLanguageDesc': {
    ru: 'Выберите язык по умолчанию для виджета',
    en: 'Select default language for the widget',
    ka: 'აირჩიეთ ნაგულისხმევი ენა ვიჯეტისთვის'
  },

  // Languages
  'language.ru': {
    ru: 'Русский',
    en: 'Russian',
    ka: 'რუსული'
  },
  'language.en': {
    ru: 'English',
    en: 'English',
    ka: 'ინგლისური'
  },
  'language.ka': {
    ru: 'ქართული',
    en: 'Georgian',
    ka: 'ქართული'
  },

  // Admin Settings
  'adminSettings.title': {
    ru: 'Настройки',
    en: 'Settings',
    ka: 'პარამეტრები'
  },
  'adminSettings.description': {
    ru: 'Управление настройками компании и контактной информацией',
    en: 'Manage company settings and contact information',
    ka: 'კომპანიის პარამეტრების და საკონტაქტო ინფორმაციის მართვა'
  },
  'adminSettings.save': {
    ru: 'Сохранить',
    en: 'Save',
    ka: 'შენახვა'
  },
  'adminSettings.saving': {
    ru: 'Сохранение...',
    en: 'Saving...',
    ka: 'შენახვა...'
  },
  'adminSettings.settingsSaved': {
    ru: 'Настройки сохранены',
    en: 'Settings saved',
    ka: 'პარამეტრები შენახულია'
  },
  'adminSettings.errorLoading': {
    ru: 'Ошибка загрузки настроек',
    en: 'Error loading settings',
    ka: 'პარამეტრების ჩატვირთვის შეცდომა'
  },
  'adminSettings.errorSaving': {
    ru: 'Ошибка сохранения настроек',
    en: 'Error saving settings',
    ka: 'პარამეტრების შენახვის შეცდომა'
  },
  'adminSettings.authRequired': {
    ru: 'Необходима авторизация для работы с настройками',
    en: 'Authentication required to work with settings',
    ka: 'პარამეტრებთან მუშაობისთვის ავტორიზაცია საჭიროა'
  },
  'adminSettings.company': {
    ru: 'Компания',
    en: 'Company',
    ka: 'კომპანია'
  },
  'adminSettings.contacts': {
    ru: 'Контакты менеджера',
    en: 'Manager contacts',
    ka: 'მენეჯერის კონტაქტები'
  },
  'adminSettings.companyInfo': {
    ru: 'Информация о компании',
    en: 'Company information',
    ka: 'კომპანიის ინფორმაცია'
  },
  'adminSettings.companyInfoDesc': {
    ru: 'Основная информация о вашей компании',
    en: 'Basic information about your company',
    ka: 'თქვენი კომპანიის ძირითადი ინფორმაცია'
  },
  'adminSettings.companyName': {
    ru: 'Название компании',
    en: 'Company name',
    ka: 'კომპანიის სახელი'
  },
  'adminSettings.companyNamePlaceholder': {
    ru: 'ООО «Название компании»',
    en: 'LLC "Company Name"',
    ka: 'LLC "კომპანიის სახელი"'
  },
  'adminSettings.companyDescription': {
    ru: 'Описание компании',
    en: 'Company description',
    ka: 'კომპანიის აღწერა'
  },
  'adminSettings.companyDescriptionPlaceholder': {
    ru: 'Краткое описание деятельности компании...',
    en: 'Brief description of company activities...',
    ka: 'კომპანიის საქმიანობის მოკლე აღწერა...'
  },
  'adminSettings.companyAddress': {
    ru: 'Адрес компании',
    en: 'Company address',
    ka: 'კომპანიის მისამართი'
  },
  'adminSettings.companyAddressPlaceholder': {
    ru: 'г. Город, ул. Улица, д. 1',
    en: 'City, Street, 1',
    ka: 'ქალაქი, ქუჩა, 1'
  },
  'adminSettings.managerContacts': {
    ru: 'Контактная информация менеджера',
    en: 'Manager contact information',
    ka: 'მენეჯერის საკონტაქტო ინფორმაცია'
  },
  'adminSettings.managerContactsDesc': {
    ru: 'Эта информация будет отображаться клиентам для связи',
    en: 'This information will be displayed to clients for contact',
    ka: 'ეს ინფორმაცია მომხმარებლებს კონტაქტისთვის გამოჩნდება'
  },
  'adminSettings.managerName': {
    ru: 'Имя менеджера',
    en: 'Manager name',
    ka: 'მენეჯერის სახელი'
  },
  'adminSettings.managerNamePlaceholder': {
    ru: 'Иван Иванов',
    en: 'John Doe',
    ka: 'ივანე ივანოვი'
  },
  'adminSettings.managerPhone': {
    ru: 'Телефон менеджера',
    en: 'Manager phone',
    ka: 'მენეჯერის ტელეფონი'
  },
  'adminSettings.managerPhonePlaceholder': {
    ru: '+7 (999) 123-45-67',
    en: '+1 (555) 123-4567',
    ka: '+995 599 123 456'
  },
  'adminSettings.managerEmail': {
    ru: 'Email менеджера',
    en: 'Manager email',
    ka: 'მენეჯერის ელფოსტა'
  },
  'adminSettings.managerEmailPlaceholder': {
    ru: 'manager@company.com',
    en: 'manager@company.com',
    ka: 'manager@company.com'
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
  const location = useLocation();
  const navigate = useNavigate();

  // Get language from URL path directly
  const getCurrentLanguageFromURL = () => {
    return getLanguageFromPath(location.pathname);
  };

  // Initialize language from URL path or default
  const [language, setLanguageState] = useState<Language>(() => {
    return getCurrentLanguageFromURL();
  });

  // Update language when URL changes
  useEffect(() => {
    const urlLanguage = getCurrentLanguageFromURL();
    if (urlLanguage !== language) {
      setLanguageState(urlLanguage);
    }
  }, [location.pathname, language]);

  const setLanguage = (newLanguage: Language) => {
    if (newLanguage === language) return;

    // Get current path without language prefix
    const cleanPath = removeLanguageFromPath(location.pathname);

    // Create new path with new language prefix
    const newPath = addLanguageToPath(cleanPath, newLanguage);

    // Navigate to new URL
    navigate(newPath, { replace: true });
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const translation = translations[key]?.[language] || key;
    
    if (params) {
      return Object.keys(params).reduce((text, param) => {
        return text.replace(new RegExp(`{{${param}}}`, 'g'), String(params[param]));
      }, translation);
    }
    
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Embed Language Provider for standalone widgets (without URL routing)
export const EmbedLanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // Initialize language from URL query parameter, localStorage or default
  const [language, setLanguageState] = useState<Language>(() => {
    // First, check for lang query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    if (langParam && (langParam as Language) in LANGUAGE_CONFIG) {
      return langParam as Language;
    }
    
    // Then check localStorage
    const savedLanguage = localStorage.getItem('embed-language');
    if (savedLanguage && (savedLanguage as Language) in LANGUAGE_CONFIG) {
      return savedLanguage as Language;
    }
    
    return DEFAULT_LANGUAGE;
  });

  const setLanguage = (newLanguage: Language) => {
    if (newLanguage === language) return;
    
    setLanguageState(newLanguage);
    localStorage.setItem('embed-language', newLanguage);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const translation = translations[key]?.[language] || key;
    
    if (params) {
      return Object.keys(params).reduce((text, param) => {
        return text.replace(new RegExp(`{{${param}}}`, 'g'), String(params[param]));
      }, translation);
    }
    
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
