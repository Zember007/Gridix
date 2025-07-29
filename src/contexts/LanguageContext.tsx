
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Language,
  getLanguageFromUrlParam,
  addLanguageToPath,
  removeLanguageFromPath,
  getLanguageParam,
  DEFAULT_LANGUAGE
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
  const { lang } = useParams<{ lang: string }>();

  // Initialize language from URL parameter or default
  const [language, setLanguageState] = useState<Language>(() => {
    return getLanguageFromUrlParam(lang);
  });

  // Update language when URL parameter changes
  useEffect(() => {
    const urlLanguage = getLanguageFromUrlParam(lang);
    if (urlLanguage !== language) {
      setLanguageState(urlLanguage);
    }
  }, [lang, language]);

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
