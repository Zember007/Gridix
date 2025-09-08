
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
  'project.number': {
    ru: 'Номер',
    en: 'Number',
    ka: 'ნომერი'
  },
  'project.status': {
    ru: 'Статус',
    en: 'Status',
    ka: 'სტატუსი'
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
  'project.additionalInfo': {
    ru: 'Дополнительная информация',
    en: 'Additional Information',
    ka: 'დამატებითი ინფორმაცია'
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
    ru: 'Смотреть {count} вариантов',
    en: 'View {count} options',
    ka: 'იხილე {count} ვარიანტი'
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
  'common.list': {
    ru: 'Список',
    en: 'List',
    ka: 'სია'
  },
  'common.grid': {
    ru: 'Плитка',
    en: 'Grid',
    ka: 'ბადე'
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
  'apartment.enter': {
    ru: 'Введите',
    en: 'Enter',
    ka: 'შეიყვანეთ'
  },
  'apartment.select': {
    ru: 'Выберите',
    en: 'Select',
    ka: 'აირჩიეთ'
  },
  'apartment.notSelected': {
    ru: 'Не выбрано',
    en: 'Not selected',
    ka: 'არ არის არჩეული'
  },
  'apartment.yes': {
    ru: 'Да',
    en: 'Yes',
    ka: 'დიახ'
  },
  'apartment.no': {
    ru: 'Нет',
    en: 'No',
    ka: 'არა'
  },
  'apartment.additionalFields': {
    ru: 'Дополнительные поля',
    en: 'Additional Fields',
    ka: 'დამატებითი ველები'
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
  'apartment.apartment': {
    ru: 'квартира',
    en: 'apartment',
    ka: 'ბინა'
  },
  'apartment.apartments': {
    ru: 'квартир',
    en: 'apartments',
    ka: 'ბინები'
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
  'projectEditor.hasParking': {
    ru: 'Паркинг',
    en: 'Parking',
    ka: 'პარკინგი'
  },
  'projectEditor.hasCommercial': {
    ru: 'Коммерческие помещения',
    en: 'Commercial spaces',
    ka: 'კომერციული ფართები'
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
    ru: 'Например: 41.6967',
    en: 'Example: 41.6967',
    ka: 'მაგალითი: 41.6967'
  },
  'projectEditor.longitudePlaceholder': {
    ru: 'Например: 44.7896',
    en: 'Example: 44.7896',
    ka: 'მაგალითი: 44.7896'
  },
  'projectEditor.latitudeExample': {
    ru: 'Пример: 41.6967 (Тбилиси)',
    en: 'Example: 41.6967 (Tbilisi)',
    ka: 'მაგალითი: 41.6967 (თბილისი)'
  },
  'projectEditor.longitudeExample': {
    ru: 'Пример: 44.7896 (Тбилиси)',
    en: 'Example: 44.7896 (Tbilisi)',
    ka: 'მაგალითი: 44.7896 (თბილისი)'
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
  'projectEditor.fields': {
    ru: 'Поля',
    en: 'Fields',
    ka: 'ველები'
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
    ru: 'Аккаунты менеджеров',
    en: 'Manager accounts',
    ka: 'მენეჯერების ანგარიშები'
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
  // Manager Accounts
  'managerAccounts.title': {
    ru: 'Управление менеджерами',
    en: 'Manager Management',
    ka: 'მენეჯერების მართვა'
  },
  'managerAccounts.description': {
    ru: 'Добавляйте менеджеров для работы с вашими проектами',
    en: 'Add managers to work with your projects',
    ka: 'დაამატეთ მენეჯერები თქვენს პროექტებთან სამუშაოდ'
  },
  'managerAccounts.addManager': {
    ru: 'Добавить менеджера',
    en: 'Add Manager',
    ka: 'მენეჯერის დამატება'
  },
  'managerAccounts.inviteManager': {
    ru: 'Пригласить менеджера',
    en: 'Invite Manager',
    ka: 'მენეჯერის მოწვევა'
  },
  'managerAccounts.inviteManagerDesc': {
    ru: 'Отправьте приглашение новому менеджеру для работы с вашими проектами',
    en: 'Send an invitation to a new manager to work with your projects',
    ka: 'გაუგზავნეთ მოწვევა ახალ მენეჯერს თქვენს პროექტებთან სამუშაოდ'
  },
  'managerAccounts.email': {
    ru: 'Email',
    en: 'Email',
    ka: 'ელფოსტა'
  },
  'managerAccounts.emailPlaceholder': {
    ru: 'manager@example.com',
    en: 'manager@example.com',
    ka: 'manager@example.com'
  },
  'managerAccounts.fullName': {
    ru: 'Полное имя',
    en: 'Full Name',
    ka: 'სრული სახელი'
  },
  'managerAccounts.fullNamePlaceholder': {
    ru: 'Иван Иванов',
    en: 'John Doe',
    ka: 'ივანე ივანოვი'
  },
  'managerAccounts.phone': {
    ru: 'Телефон',
    en: 'Phone',
    ka: 'ტელეფონი'
  },
  'managerAccounts.phonePlaceholder': {
    ru: '+7 (999) 123-45-67',
    en: '+1 (555) 123-4567',
    ka: '+995 599 123 456'
  },
  'managerAccounts.invite': {
    ru: 'Пригласить',
    en: 'Invite',
    ka: 'მოწვევა'
  },
  'managerAccounts.inviting': {
    ru: 'Приглашаем...',
    en: 'Inviting...',
    ka: 'მოწვევა...'
  },
  'managerAccounts.activeManagers': {
    ru: 'Активные менеджеры',
    en: 'Active Managers',
    ka: 'აქტიური მენეჯერები'
  },
  'managerAccounts.activeManagersDesc': {
    ru: 'Менеджеры с доступом к вашим проектам',
    en: 'Managers with access to your projects',
    ka: 'მენეჯერები თქვენს პროექტებზე წვდომით'
  },
  'managerAccounts.pendingInvitations': {
    ru: 'Ожидающие приглашения',
    en: 'Pending Invitations',
    ka: 'მოლოდინის მოწვევები'
  },
  'managerAccounts.pendingInvitationsDesc': {
    ru: 'Приглашения, которые еще не были приняты',
    en: 'Invitations that have not been accepted yet',
    ka: 'მოწვევები, რომლებიც ჯერ არ არის მიღებული'
  },
  'managerAccounts.statusActive': {
    ru: 'Активный',
    en: 'Active',
    ka: 'აქტიური'
  },
  'managerAccounts.statusPending': {
    ru: 'Ожидает',
    en: 'Pending',
    ka: 'მოლოდინში'
  },
  'managerAccounts.statusSuspended': {
    ru: 'Заблокирован',
    en: 'Suspended',
    ka: 'შეჩერებული'
  },
  'managerAccounts.statusExpired': {
    ru: 'Истекло',
    en: 'Expired',
    ka: 'ვადაგასული'
  },
  'managerAccounts.suspend': {
    ru: 'Заблокировать',
    en: 'Suspend',
    ka: 'შეჩერება'
  },
  'managerAccounts.activate': {
    ru: 'Активировать',
    en: 'Activate',
    ka: 'გააქტიურება'
  },
  'managerAccounts.remove': {
    ru: 'Удалить',
    en: 'Remove',
    ka: 'წაშლა'
  },
  'managerAccounts.cancel': {
    ru: 'Отменить',
    en: 'Cancel',
    ka: 'გაუქმება'
  },
  'managerAccounts.confirmRemove': {
    ru: 'Подтвердите удаление',
    en: 'Confirm Removal',
    ka: 'წაშლის დადასტურება'
  },
  'managerAccounts.confirmRemoveDesc': {
    ru: 'Вы уверены, что хотите удалить менеджера {{name}}? This action cannot be undone.',
    en: 'Are you sure you want to remove manager {{name}}? This action cannot be undone.',
    ka: 'დარწმუნებული ხართ, რომ გსურთ მენეჯერის {{name}} წაშლა? ეს ქმედება ვერ გაუქმდება.'
  },
  'managerAccounts.confirmCancel': {
    ru: 'Отменить приглашение',
    en: 'Cancel Invitation',
    ka: 'მოწვევის გაუქმება'
  },
  'managerAccounts.confirmCancelDesc': {
    ru: 'Вы уверены, что хотите отменить приглашение для {{name}}?',
    en: 'Are you sure you want to cancel the invitation for {{name}}?',
    ka: 'დარწმუნებული ხართ, რომ გსურთ {{name}}-ის მოწვევის გაუქმება?'
  },
  'managerAccounts.expiresAt': {
    ru: 'Истекает',
    en: 'Expires',
    ka: 'ვადა ისრულება'
  },
  'managerAccounts.noManagers': {
    ru: 'Нет менеджеров',
    en: 'No Managers',
    ka: 'მენეჯერები არ არის'
  },
  'managerAccounts.noManagersDesc': {
    ru: 'У вас пока нет менеджеров. Добавьте первого менеджера для работы с проектами.',
    en: 'You don\'t have any managers yet. Add your first manager to work with projects.',
    ka: 'თქვენ ჯერ არ გაქვთ მენეჯერები. დაამატეთ პირველი მენეჯერი პროექტებთან სამუშაოდ.'
  },
  'managerAccounts.addFirstManager': {
    ru: 'Добавить первого менеджера',
    en: 'Add First Manager',
    ka: 'პირველი მენეჯერის დამატება'
  },
  'managerAccounts.copyLink': {
    ru: 'Копировать ссылку',
    en: 'Copy Link',
    ka: 'ბმულის კოპირება'
  },
  'managerAccounts.openLink': {
    ru: 'Открыть',
    en: 'Open',
    ka: 'გახსნა'
  },
  'managerAccounts.linkCopied': {
    ru: 'Ссылка скопирована в буфер обмена',
    en: 'Link copied to clipboard',
    ka: 'ბმული დაკოპირდა'
  },
  'managerAccounts.failedToCopy': {
    ru: 'Не удалось скопировать ссылку',
    en: 'Failed to copy link',
    ka: 'ბმულის კოპირება ვერ მოხერხდა'
  },
  'managerAccounts.emailFailedCopyManually': {
    ru: 'Не удалось отправить email. Скопируйте ссылку вручную.',
    en: 'Failed to send email. Copy the link manually.',
    ka: 'ელ.ფოსტის გაგზავნა ვერ მოხერხდა. დააკოპირეთ ბმული ხელით.'
  },
  'managerAccounts.fillRequiredFields': {
    ru: 'Заполните все обязательные поля',
    en: 'Fill in all required fields',
    ka: 'შეავსეთ ყველა სავალდებულო ველი'
  },
  'managerAccounts.managerAdded': {
    ru: 'Менеджер успешно добавлен',
    en: 'Manager successfully added',
    ka: 'მენეჯერი წარმატებით დაემატა'
  },
  'managerAccounts.invitationSent': {
    ru: 'Приглашение отправлено',
    en: 'Invitation sent',
    ka: 'მოწვევა გაიგზავნა'
  },
  'managerAccounts.managerSuspended': {
    ru: 'Менеджер заблокирован',
    en: 'Manager suspended',
    ka: 'მენეჯერი შეჩერდა'
  },
  'managerAccounts.managerActivated': {
    ru: 'Менеджер активирован',
    en: 'Manager activated',
    ka: 'მენეჯერი გააქტიურდა'
  },
  'managerAccounts.managerRemoved': {
    ru: 'Менеджер удален',
    en: 'Manager removed',
    ka: 'მენეჯერი წაიშალა'
  },
  'managerAccounts.invitationCancelled': {
    ru: 'Приглашение отменено',
    en: 'Invitation cancelled',
    ka: 'მოწვევა გაუქმდა'
  },
  'managerAccounts.errorLoading': {
    ru: 'Ошибка загрузки данных менеджеров',
    en: 'Error loading manager data',
    ka: 'შეცდომა მენეჯერების მონაცემების ჩატვირთვაში'
  },
  'managerAccounts.errorInviting': {
    ru: 'Ошибка при приглашении менеджера',
    en: 'Error inviting manager',
    ka: 'შეცდომა მენეჯერის მოწვევაში'
  },
  'managerAccounts.errorSuspending': {
    ru: 'Ошибка при блокировке менеджера',
    en: 'Error suspending manager',
    ka: 'შეცდომა მენეჯერის შეჩერებაში'
  },
  'managerAccounts.errorActivating': {
    ru: 'Ошибка при активации менеджера',
    en: 'Error activating manager',
    ka: 'შეცდომა მენეჯერის გააქტიურებაში'
  },
  'managerAccounts.errorRemoving': {
    ru: 'Ошибка при удалении менеджера',
    en: 'Error removing manager',
    ka: 'შეცდომა მენეჯერის წაშლაში'
  },
  'managerAccounts.errorCancelling': {
    ru: 'Ошибка при отмене приглашения',
    en: 'Error cancelling invitation',
    ka: 'შეცდომა მოწვევის გაუქმებაში'
  },
  'managerAccounts.invitationCreated': {
    ru: 'Приглашение создано',
    en: 'Invitation created',
    ka: 'მოწვევა შეიქმნა'
  },

  // Auth
  'auth.signOut': {
    ru: 'Выйти',
    en: 'Sign Out',
    ka: 'გასვლა'
  },
  'auth.signIn': {
    ru: 'Войти',
    en: 'Sign In',
    ka: 'შესვლა'
  },
  'auth.signUp': {
    ru: 'Регистрация',
    en: 'Sign Up',
    ka: 'რეგისტრაცია'
  },

  // Building Image Editor
  'buildingImage.title': {
    ru: 'Изображение здания',
    en: 'Building Image',
    ka: 'შენობის სურათი'
  },
  'buildingImage.description': {
    ru: 'Загрузите изображение фасада здания для настройки этажей',
    en: 'Upload building facade image for floor configuration',
    ka: 'ატვირთეთ შენობის ფასადის სურათი სართულების კონფიგურაციისთვის'
  },
  'buildingImage.upload': {
    ru: 'Загрузить изображение',
    en: 'Upload Image',
    ka: 'სურათის ატვირთვა'
  },
  'buildingImage.uploading': {
    ru: 'Загружается...',
    en: 'Uploading...',
    ka: 'იტვირთება...'
  },
  'buildingImage.uploadSuccess': {
    ru: 'Изображение здания загружено',
    en: 'Building image uploaded',
    ka: 'შენობის სურათი ატვირთულია'
  },
  'buildingImage.uploadError': {
    ru: 'Ошибка загрузки изображения',
    en: 'Error uploading image',
    ka: 'სურათის ატვირთვის შეცდომა'
  },
  'buildingImage.authRequired': {
    ru: 'Необходимо войти в систему для загрузки изображений',
    en: 'Authentication required to upload images',
    ka: 'სურათების ატვირთვისთვის ავტორიზაცია საჭიროა'
  },
  'buildingImage.floors.title': {
    ru: 'Настройка этажей',
    en: 'Floor Configuration',
    ka: 'სართულების კონფიგურაცია'
  },
  'buildingImage.floors.description': {
    ru: 'Выберите этаж и отметьте его область на изображении здания',
    en: 'Select a floor and mark its area on the building image',
    ka: 'აირჩიეთ სართული და მონიშნეთ მისი ზონა შენობის სურათზე'
  },
  'buildingImage.floors.floor': {
    ru: 'Этаж:',
    en: 'Floor:',
    ka: 'სართული:'
  },
  'buildingImage.floors.edit': {
    ru: 'Редактировать',
    en: 'Edit',
    ka: 'რედაქტირება'
  },
  'buildingImage.floors.configured': {
    ru: 'Настроенные этажи:',
    en: 'Configured floors:',
    ka: 'კონფიგურირებული სართულები:'
  },
  'buildingImage.floors.floorNumber': {
    ru: '{floor} этаж',
    en: 'Floor {floor}',
    ka: 'სართული {floor}'
  },
  'buildingImage.floors.addNew': {
    ru: 'Добавить этаж',
    en: 'Add Floor',
    ka: 'სართულის დამატება'
  },
  'buildingImage.floors.creatingNew': {
    ru: 'Создание {floor} этажа',
    en: 'Creating floor {floor}',
    ka: 'სართული {floor}-ის შექმნა'
  },
  'buildingImage.floors.canvas': {
    ru: 'Холст для рисования',
    en: 'Drawing Canvas',
    ka: 'ნახატის ტილო'
  },
  'buildingImage.polygon.saveSuccess': {
    ru: 'Полигон для {floor} этажа сохранен',
    en: 'Polygon for floor {floor} saved',
    ka: 'სართული {floor}-ის პოლიგონი შენახულია'
  },
  'buildingImage.polygon.saveError': {
    ru: 'Ошибка сохранения полигона',
    en: 'Error saving polygon',
    ka: 'პოლიგონის შენახვის შეცდომა'
  },
  'buildingImage.polygon.create': {
    ru: 'Создать',
    en: 'Create',
    ka: 'შექმნა'
  },
  'buildingImage.polygon.save': {
    ru: 'Сохранить',
    en: 'Save',
    ka: 'შენახვა'
  },
  'buildingImage.polygon.cancel': {
    ru: 'Отмена',
    en: 'Cancel',
    ka: 'გაუქმება'
  },
  'buildingImage.polygon.createSuccess': {
    ru: 'Полигон для {floor} этажа создан',
    en: 'Polygon for floor {floor} created',
    ka: 'სართული {floor}-ის პოლიგონი შექმნილია'
  },
  'buildingImage.polygon.createError': {
    ru: 'Ошибка создания полигона',
    en: 'Error creating polygon',
    ka: 'პოლიგონის შექმნის შეცდომა'
  },
  'buildingImage.polygon.deleteSuccess': {
    ru: 'Полигон этажа удален',
    en: 'Floor polygon deleted',
    ka: 'სართულის პოლიგონი წაშლილია'
  },
  'buildingImage.polygon.deleteError': {
    ru: 'Ошибка удаления полигона',
    en: 'Error deleting polygon',
    ka: 'პოლიგონის წაშლის შეცდომა'
  },

  // Floor Plan Editor
  'floorPlan.title': {
    ru: 'План этажа',
    en: 'Floor Plan',
    ka: 'სართულის გეგმა'
  },
  'floorPlan.duplicateToAllFloors': {
    ru: 'Дублировать на все этажи',
    en: 'Duplicate to all floors',
    ka: 'ყველა სართულზე დუბლირება'
  },
  'floorPlan.settings': {
    ru: 'Настройки',
    en: 'Settings',
    ka: 'პარამეტრები'
  },
  'floorPlan.upload.title': {
    ru: 'Загрузка плана этажа',
    en: 'Floor Plan Upload',
    ka: 'სართულის გეგმის ატვირთვა'
  },
  'floorPlan.upload.floorPlan': {
    ru: 'План этажа {floor}',
    en: 'Floor {floor} plan',
    ka: 'სართული {floor} გეგმა'
  },
  'floorPlan.upload.loading': {
    ru: 'Загрузка...',
    en: 'Loading...',
    ka: 'იტვირთება...'
  },
  'floorPlan.upload.success': {
    ru: 'План этажа загружен',
    en: 'Floor plan uploaded',
    ka: 'სართულის გეგმა ატვირთულია'
  },
  'floorPlan.upload.error': {
    ru: 'Ошибка загрузки плана этажа',
    en: 'Error uploading floor plan',
    ka: 'სართულის გეგმის ატვირთვის შეცდომა'
  },
  'floorPlan.upload.authRequired': {
    ru: 'Необходимо войти в систему для загрузки планов этажей',
    en: 'Authentication required to upload floor plans',
    ka: 'სართულების გეგმების ატვირთვისთვის ავტორიზაცია საჭიროა'
  },
  'floorPlan.upload.imageUploaded': {
    ru: 'Изображение загружено',
    en: 'Image uploaded',
    ka: 'სურათი ატვირთულია'
  },
  'floorPlan.upload.clickToChange': {
    ru: 'Нажмите, чтобы сменить изображение',
    en: 'Click to change image',
    ka: 'დააჭირეთ სურათის შესაცვლელად'
  },
  'floorPlan.upload.changeImage': {
    ru: 'Сменить изображение',
    en: 'Change Image',
    ka: 'სურათის შეცვლა'
  },
  'floorPlan.upload.dragDrop': {
    ru: 'Перетащите изображение сюда',
    en: 'Drag and drop image here',
    ka: 'გადაიტანეთ სურათი აქ'
  },
  'floorPlan.upload.orClickToSelect': {
    ru: 'или нажмите для выбора файла',
    en: 'or click to select file',
    ka: 'ან დააჭირეთ ფაილის არჩევისთვის'
  },
  'floorPlan.upload.selectImage': {
    ru: 'Выбрать изображение',
    en: 'Select Image',
    ka: 'სურათის არჩევა'
  },
  'floorPlan.upload.invalidFileType': {
    ru: 'Пожалуйста, выберите файл изображения',
    en: 'Please select an image file',
    ka: 'გთხოვთ აირჩიოთ სურათის ფაილი'
  },
  'floorPlan.upload.dropToReplace': {
    ru: 'Отпустите для замены изображения',
    en: 'Drop to replace image',
    ka: 'გადააგდეთ სურათის შესაცვლელად'
  },
  'floorPlan.apartments.title': {
    ru: 'Управление квартирами',
    en: 'Apartment Management',
    ka: 'ბინების მართვა'
  },
  'floorPlan.apartments.add': {
    ru: 'Добавить квартиру',
    en: 'Add Apartment',
    ka: 'ბინის დამატება'
  },
  'floorPlan.apartments.list': {
    ru: 'Квартиры на этаже:',
    en: 'Apartments on floor:',
    ka: 'ბინები სართულზე:'
  },
  'floorPlan.apartments.available': {
    ru: 'Свободна',
    en: 'Available',
    ka: 'ხელმისაწვდომია'
  },
  'floorPlan.apartments.sold': {
    ru: 'Продана',
    en: 'Sold',
    ka: 'გაყიდული'
  },
  'floorPlan.apartments.reserved': {
    ru: 'Бронь',
    en: 'Reserved',
    ka: 'დაჯავშნული'
  },
  'floorPlan.apartments.roomsShort': {
    ru: 'комн.',
    en: 'rooms',
    ka: 'ოთახი'
  },
  'floorPlan.apartments.saveSuccess': {
    ru: 'Квартира сохранена',
    en: 'Apartment saved',
    ka: 'ბინა შენახულია'
  },
  'floorPlan.apartments.saveError': {
    ru: 'Ошибка сохранения квартиры',
    en: 'Error saving apartment',
    ka: 'ბინის შენახვის შეცდომა'
  },
  'floorPlan.apartments.deleteSuccess': {
    ru: 'Квартира удалена',
    en: 'Apartment deleted',
    ka: 'ბინა წაშლილია'
  },
  'floorPlan.apartments.deleteError': {
    ru: 'Ошибка удаления квартиры',
    en: 'Error deleting apartment',
    ka: 'ბინის წაშლის შეცდომა'
  },
  'floorPlan.apartments.fillAllFields': {
    ru: 'Заполните все поля и создайте полигон (минимум 3 точки)',
    en: 'Fill all fields and create polygon (minimum 3 points)',
    ka: 'შეავსეთ ყველა ველი და შექმენით პოლიგონი (მინიმუმ 3 წერტილი)'
  },
  'floorPlan.apartments.newApartment': {
    ru: 'Новая квартира',
    en: 'New Apartment',
    ka: 'ახალი ბინა'
  },
  'floorPlan.apartments.editApartment': {
    ru: 'Редактирование полигона - Квартира №{number}',
    en: 'Edit Polygon - Apartment #{number}',
    ka: 'პოლიგონის რედაქტირება - ბინა №{number}'
  },
  'floorPlan.apartments.parameters': {
    ru: 'Параметры квартиры',
    en: 'Apartment Parameters',
    ka: 'ბინის პარამეტრები'
  },
  'floorPlan.apartments.number': {
    ru: 'Номер квартиры',
    en: 'Apartment Number',
    ka: 'ბინის ნომერი'
  },
  'floorPlan.apartments.numberPlaceholder': {
    ru: 'Например: 101',
    en: 'Example: 101',
    ka: 'მაგალითი: 101'
  },
  'floorPlan.apartments.rooms': {
    ru: 'Комнат',
    en: 'Rooms',
    ka: 'ოთახები'
  },
  'floorPlan.apartments.area': {
    ru: 'Площадь (м²)',
    en: 'Area (m²)',
    ka: 'ფართობი (მ²)'
  },
  'floorPlan.apartments.price': {
    ru: 'Цена',
    en: 'Price',
    ka: 'ფასი'
  },
  'floorPlan.apartments.status': {
    ru: 'Статус',
    en: 'Status',
    ka: 'სტატუსი'
  },
  'floorPlan.apartments.photos': {
    ru: 'Фотографии',
    en: 'Photos',
    ka: 'ფოტოები'
  },
  'floorPlan.apartments.uploadMultiplePhotos': {
    ru: 'Выберите несколько изображений для загрузки',
    en: 'Select multiple images to upload',
    ka: 'ატვირთვისთვის რამდენიმე სურათი აირჩიეთ'
  },
  'floorPlan.apartments.noPhotos': {
    ru: 'Нет фотографий',
    en: 'No photos',
    ka: 'ფოტოები არ არის'
  },
  'floorPlan.apartments.noPhotosDesc': {
    ru: 'Загрузите фотографии квартиры',
    en: 'Upload apartment photos',
    ka: 'ბინის ფოტოები ატვირთეთ'
  },
  'floorPlan.apartments.photoUploadSuccess': {
    ru: 'Фотографии успешно загружены',
    en: 'Photos uploaded successfully',
    ka: 'ფოტოები წარმატებით ატვირთულია'
  },
  'floorPlan.apartments.photoUploadError': {
    ru: 'Ошибка загрузки фотографий',
    en: 'Error uploading photos',
    ka: 'ფოტოების ატვირთვის შეცდომა'
  },
  'floorPlan.apartments.photoDeleteSuccess': {
    ru: 'Фотография удалена',
    en: 'Photo deleted',
    ka: 'ფოტო წაშლილია'
  },
  'floorPlan.apartments.photoDeleteError': {
    ru: 'Ошибка удаления фотографии',
    en: 'Error deleting photo',
    ka: 'ფოტოს წაშლის შეცდომა'
  },
  'floorPlan.settings.title': {
    ru: 'Настройки полигонов этажа {floor}',
    en: 'Floor {floor} Polygon Settings',
    ka: 'სართული {floor} პოლიგონების პარამეტრები'
  },
  'floorPlan.settings.backToEditor': {
    ru: 'Назад к редактору',
    en: 'Back to Editor',
    ka: 'რედაქტორზე დაბრუნება'
  },
  'floorPlan.duplicate.success': {
    ru: 'План и полигоны продублированы на все этажи',
    en: 'Plan and polygons duplicated to all floors',
    ka: 'გეგმა და პოლიგონები დუბლირებულია ყველა სართულზე'
  },
  'floorPlan.duplicate.error': {
    ru: 'Ошибка дублирования на все этажи',
    en: 'Error duplicating to all floors',
    ka: 'ყველა სართულზე დუბლირების შეცდომა'
  },
  'floorPlan.duplicate.noData': {
    ru: 'Нет данных для дублирования',
    en: 'No data to duplicate',
    ka: 'დუბლირებისთვის მონაცემები არ არის'
  },
  'floorPlan.loading.error': {
    ru: 'Ошибка загрузки плана этажа',
    en: 'Error loading floor plan',
    ka: 'სართულის გეგმის ჩატვირთვის შეცდომა'
  },
  'floorPlan.apartments.loading.error': {
    ru: 'Ошибка загрузки квартир',
    en: 'Error loading apartments',
    ka: 'ბინების ჩატვირთვის შეცდომა'
  },
  'floorPlan.image.loadError': {
    ru: 'Не удалось загрузить изображение плана',
    en: 'Failed to load plan image',
    ka: 'გეგმის სურათის ჩატვირთვა ვერ მოხერხდა'
  },

  // Project Apartments Manager
  'apartmentsManager.title': {
    ru: 'Квартиры проекта',
    en: 'Project Apartments',
    ka: 'პროექტის ბინები'
  },
  'apartmentsManager.description': {
    ru: 'Управление квартирами и их характеристиками',
    en: 'Manage apartments and their characteristics',
    ka: 'ბინების და მათი მახასიათებლების მართვა'
  },
  'apartmentsManager.searchPlaceholder': {
    ru: 'Поиск по номеру квартиры или статусу',
    en: 'Search by apartment number or status',
    ka: 'ბინის ნომერის ან სტატუსის მიხედვით ძებნა'
  },
  'apartmentsManager.addApartment': {
    ru: 'Добавить квартиру',
    en: 'Add Apartment',
    ka: 'ბინის დამატება'
  },
  'apartmentsManager.newApartment': {
    ru: 'Новая квартира',
    en: 'New Apartment',
    ka: 'ახალი ბინა'
  },
  'apartmentsManager.apartmentNumber': {
    ru: 'Номер квартиры*',
    en: 'Apartment Number*',
    ka: 'ბინის ნომერი*'
  },
  'apartmentsManager.floorNumber': {
    ru: 'Этаж*',
    en: 'Floor*',
    ka: 'სართული*'
  },
  'apartmentsManager.rooms': {
    ru: 'Комнат*',
    en: 'Rooms*',
    ka: 'ოთახები*'
  },
  'apartmentsManager.area': {
    ru: 'Площадь (м²)*',
    en: 'Area (m²)*',
    ka: 'ფართობი (მ²)*'
  },
  'apartmentsManager.price': {
    ru: 'Цена',
    en: 'Price',
    ka: 'ფასი'
  },
  'apartmentsManager.status': {
    ru: 'Статус',
    en: 'Status',
    ka: 'სტატუსი'
  },
  'apartmentsManager.save': {
    ru: 'Сохранить',
    en: 'Save',
    ka: 'შენახვა'
  },
  'apartmentsManager.cancel': {
    ru: 'Отмена',
    en: 'Cancel',
    ka: 'გაუქმება'
  },
  'apartmentsManager.apartment': {
    ru: 'Квартира {number}',
    en: 'Apartment {number}',
    ka: 'ბინა {number}'
  },
  'apartmentsManager.floor': {
    ru: 'Этаж {floor}',
    en: 'Floor {floor}',
    ka: 'სართული {floor}'
  },
  'apartmentsManager.roomsShort': {
    ru: '{rooms} комн.',
    en: '{rooms} rooms',
    ka: '{rooms} ოთახი'
  },
  'apartmentsManager.areaValue': {
    ru: '{area} м²',
    en: '{area} m²',
    ka: '{area} მ²'
  },
  'apartmentsManager.priceValue': {
    ru: '{price}',
    en: '{price}',
    ka: '{price}'
  },
  'apartmentsManager.sold': {
    ru: 'Продана',
    en: 'Sold',
    ka: 'გაყიდული'
  },
  'apartmentsManager.reserved': {
    ru: 'Забронирована',
    en: 'Reserved',
    ka: 'დაჯავშნული'
  },
  'apartmentsManager.available': {
    ru: 'Свободна',
    en: 'Available',
    ka: 'ხელმისაწვდომია'
  },
  'apartmentsManager.typeApartment': {
    ru: 'Квартиры',
    en: 'Apartments',
    ka: 'ბინები'
  },
  'apartmentsManager.typeCommercial': {
    ru: 'Коммерческие помещения',
    en: 'Commercial spaces',
    ka: 'კომერციული ფართები'
  },
  'apartmentsManager.typeParking': {
    ru: 'Паркинг',
    en: 'Parking',
    ka: 'პარკინგი'
  },
  'apartmentsManager.apartmentType': {
    ru: 'Тип помещения',
    en: 'Space type',
    ka: 'ფართის ტიპი'
  },
  'apartmentsManager.loading': {
    ru: 'Загрузка квартир...',
    en: 'Loading apartments...',
    ka: 'ბინების ჩატვირთვა...'
  },
  'apartmentsManager.saveSuccess': {
    ru: 'Квартира добавлена',
    en: 'Apartment added',
    ka: 'ბინა დამატებულია'
  },
  'apartmentsManager.updateSuccess': {
    ru: 'Квартира обновлена',
    en: 'Apartment updated',
    ka: 'ბინა განახლებულია'
  },
  'apartmentsManager.deleteSuccess': {
    ru: 'Квартира удалена',
    en: 'Apartment deleted',
    ka: 'ბინა წაშლილია'
  },
  'apartmentsManager.loadingError': {
    ru: 'Ошибка загрузки квартир',
    en: 'Error loading apartments',
    ka: 'ბინების ჩატვირთვის შეცდომა'
  },
  'apartmentsManager.saveError': {
    ru: 'Ошибка сохранения квартиры',
    en: 'Error saving apartment',
    ka: 'ბინის შენახვის შეცდომა'
  },
  'apartmentsManager.deleteError': {
    ru: 'Ошибка удаления квартиры',
    en: 'Error deleting apartment',
    ka: 'ბინის წაშლის შეცდომა'
  },
  'apartmentsManager.numberRequired': {
    ru: 'Номер квартиры обязателен',
    en: 'Apartment number is required',
    ka: 'ბინის ნომერი საჭიროა'
  },
  'apartmentsManager.floorRequired': {
    ru: 'Номер этажа обязателен',
    en: 'Floor number is required',
    ka: 'სართულის ნომერი საჭიროა'
  },
  'apartmentsManager.deleteConfirm': {
    ru: 'Вы уверены, что хотите удалить эту квартиру?',
    en: 'Are you sure you want to delete this apartment?',
    ka: 'დარწმუნებული ხართ, რომ გსურთ ამ ბინის წაშლა?'
  },
  'apartmentsManager.noApartments': {
    ru: 'Квартиры не добавлены',
    en: 'No apartments added',
    ka: 'ბინები არ არის დამატებული'
  },
  'apartmentsManager.noApartmentsDesc': {
    ru: 'Нажмите "Добавить квартиру" чтобы начать',
    en: 'Click "Add Apartment" to start',
    ka: 'დააჭირეთ "ბინის დამატება" დასაწყებად'
  },

  // Custom Fields Manager
  'customFields.title': {
    ru: 'Кастомные поля',
    en: 'Custom Fields',
    ka: 'მორგებული ველები'
  },
  'customFields.description': {
    ru: 'Создайте дополнительные поля для квартир в вашем проекте',
    en: 'Create additional fields for apartments in your project',
    ka: 'შექმენით დამატებითი ველები თქვენი პროექტის ბინებისთვის'
  },
  'customFields.addField': {
    ru: 'Добавить кастомное поле',
    en: 'Add Custom Field',
    ka: 'მორგებული ველის დამატება'
  },
  'customFields.fieldName': {
    ru: 'Название поля*',
    en: 'Field Name*',
    ka: 'ველის სახელი*'
  },
  'customFields.fieldNamePlaceholder': {
    ru: 'Например: Балкон',
    en: 'Example: Balcony',
    ka: 'მაგალითი: აივანი'
  },
  'customFields.fieldType': {
    ru: 'Тип поля',
    en: 'Field Type',
    ka: 'ველის ტიპი'
  },
  'customFields.fieldTypeText': {
    ru: 'Текст',
    en: 'Text',
    ka: 'ტექსტი'
  },
  'customFields.fieldTypeNumber': {
    ru: 'Число',
    en: 'Number',
    ka: 'რიცხვი'
  },
  'customFields.fieldTypeSelect': {
    ru: 'Выбор из списка',
    en: 'Select from list',
    ka: 'სიიდან არჩევა'
  },
  'customFields.fieldTypeBoolean': {
    ru: 'Да/Нет',
    en: 'Yes/No',
    ka: 'დიახ/არა'
  },
  'customFields.options': {
    ru: 'Варианты выбора (по одному на строку)',
    en: 'Options (one per line)',
    ka: 'ვარიანტები (ერთი ხაზზე)'
  },
  'customFields.optionsPlaceholder': {
    ru: 'Опция 1\nОпция 2\nОпция 3',
    en: 'Option 1\nOption 2\nOption 3',
    ka: 'ვარიანტი 1\nვარიანტი 2\nვარიანტი 3'
  },
  'customFields.required': {
    ru: 'Обязательное поле',
    en: 'Required field',
    ka: 'სავალდებულო ველი'
  },
  'customFields.save': {
    ru: 'Сохранить',
    en: 'Save',
    ka: 'შენახვა'
  },
  'customFields.cancel': {
    ru: 'Отмена',
    en: 'Cancel',
    ka: 'გაუქმება'
  },
  'customFields.loading': {
    ru: 'Загрузка полей...',
    en: 'Loading fields...',
    ka: 'მორგებული ჩატვირთვა...'
  },
  'customFields.saveSuccess': {
    ru: 'Поле добавлено',
    en: 'Field added',
    ka: 'ველი დამატებულია'
  },
  'customFields.updateSuccess': {
    ru: 'Поле обновлено',
    en: 'Field updated',
    ka: 'ველი განახლებულია'
  },
  'customFields.deleteSuccess': {
    ru: 'Поле удалено',
    en: 'Field deleted',
    ka: 'ველი წაშლილია'
  },
  'customFields.loadingError': {
    ru: 'Ошибка загрузки кастомных полей',
    en: 'Error loading custom fields',
    ka: 'მორგებული ველების ჩატვირთვის შეცდომა'
  },
  'customFields.saveError': {
    ru: 'Ошибка сохранения поля',
    en: 'Error saving field',
    ka: 'ველის შენახვის შეცდომა'
  },
  'customFields.deleteError': {
    ru: 'Ошибка удаления поля',
    en: 'Error deleting field',
    ka: 'ველის წაშლის შეცდომა'
  },
  'customFields.enterFieldName': {
    ru: 'Введите название поля',
    en: 'Enter field name',
    ka: 'შეიყვანეთ ველის სახელი'
  },
  'customFields.requiredBadge': {
    ru: 'Обязательно',
    en: 'Required',
    ka: 'სავალდებულო'
  },
  'customFields.fieldsOrder': {
    ru: 'Порядок полей',
    en: 'Fields Order',
    ka: 'ველების წყობა'
  },
  'customFields.fieldsOrderDescription': {
    ru: 'Перетаскивайте поля, чтобы изменить их порядок. Используйте переключатели для управления видимостью.',
    en: 'Drag fields to change their order. Use toggles to control visibility.',
    ka: 'გადაათრიეთ ველები მათი წყობის შესაცვლელად. ხილვადობის საკონტროლოდ გამოიყენეთ ღილაკები.'
  },
  'customFields.noFields': {
    ru: 'Поля не настроены',
    en: 'No fields configured',
    ka: 'ველები არ არის კონფიგურირებული'
  },
  'customFields.orderUpdated': {
    ru: 'Порядок полей обновлен',
    en: 'Fields order updated',
    ka: 'ველების წყობა განახლებულია'
  },
  'customFields.orderUpdateError': {
    ru: 'Ошибка обновления порядка полей',
    en: 'Error updating fields order',
    ka: 'ველების წყობის განახლების შეცდომა'
  },
  'customFields.visibilityUpdated': {
    ru: 'Видимость поля обновлена',
    en: 'Field visibility updated',
    ka: 'ველის ხილვადობა განახლებულია'
  },
  'customFields.visibilityUpdateError': {
    ru: 'Ошибка обновления видимости поля',
    en: 'Error updating field visibility',
    ka: 'ველის ხილვადობის განახლების შეცდომა'
  },
  'customFields.hide': {
    ru: 'Скрыть',
    en: 'Hide',
    ka: 'დამალვა'
  },
  'customFields.show': {
    ru: 'Показать',
    en: 'Show',
    ka: 'ჩვენება'
  },
  'customFields.back': {
    ru: 'Назад',
    en: 'Back',
    ka: 'უკან'
  },
  'customFields.allFieldsOrder': {
    ru: 'Управление полями',
    en: 'Fields Management',
    ka: 'ველების მართვა'
  },
  'customFields.allFieldsOrderDescription': {
    ru: 'Управляйте порядком и видимостью всех полей проекта. Перетаскивайте поля для изменения порядка.',
    en: 'Manage order and visibility of all project fields. Drag fields to change order.',
    ka: 'მართეთ ყველა პროექტის ველის წყობა და ხილვადობა. გადაათრიეთ ველები წყობის შესაცვლელად.'
  },
  'customFields.custom': {
    ru: 'Кастомное',
    en: 'Custom',
    ka: 'მორგებული'
  },
  'customFields.builtin': {
    ru: 'Стандартное',
    en: 'Built-in',
    ka: 'სტანდარტული'
  },
  'customFields.cannotDeleteBuiltIn': {
    ru: 'Нельзя удалить стандартное поле',
    en: 'Cannot delete built-in field',
    ka: 'სტანდარტული ველის წაშლა შეუძლებელია'
  },
  'customFields.cannotEditBuiltIn': {
    ru: 'Нельзя редактировать стандартное поле',
    en: 'Cannot edit built-in field',
    ka: 'სტანდარტული ველის რედაქტირება შეუძლებელია'
  },
  'customFields.translations': {
    ru: 'Переводы',
    en: 'Translations',
    ka: 'თარგმანები'
  },
  'customFields.saving': {
    ru: 'Сохранение...',
    en: 'Saving...',
    ka: 'შენახვა...'
  },

  // Apartment Photos Manager
  'photosManager.individualPhotos': {
    ru: 'Индивидуальные фотографии',
    en: 'Individual Photos',
    ka: 'ინდივიდუალური ფოტოები'
  },
  'photosManager.layoutPhotos': {
    ru: 'Фотографии планировок',
    en: 'Layout Photos',
    ka: 'განლაგების ფოტოები'
  },
  'photosManager.title': {
    ru: 'Управление фотографиями квартир',
    en: 'Apartment Photos Management',
    ka: 'ბინების ფოტოების მართვა'
  },
  'photosManager.description': {
    ru: 'Загружайте индивидуальные фотографии для конкретных квартир',
    en: 'Upload individual photos for specific apartments',
    ka: 'ატვირთეთ ინდივიდუალური ფოტოები კონკრეტული ბინებისთვის'
  },
  'photosManager.selectApartment': {
    ru: 'Выберите квартиру',
    en: 'Select Apartment',
    ka: 'აირჩიეთ ბინა'
  },
  'photosManager.selectApartmentPlaceholder': {
    ru: 'Выберите квартиру для редактирования',
    en: 'Select apartment to edit',
    ka: 'აირჩიეთ ბინა რედაქტირებისთვის'
  },
  'photosManager.apartmentOption': {
    ru: 'Квартира {number} ({floor} этаж)',
    en: 'Apartment {number} (Floor {floor})',
    ka: 'ბინა {number} (სართული {floor})'
  },
  'photosManager.uploadPhotos': {
    ru: 'Загрузить фотографии',
    en: 'Upload Photos',
    ka: 'ფოტოების ატვირთვა'
  },
  'photosManager.uploadMultiple': {
    ru: 'Можно выбрать несколько файлов одновременно',
    en: 'You can select multiple files at once',
    ka: 'შეგიძლიათ რამდენიმე ფაილი ერთდროულად აირჩიოთ'
  },
  'photosManager.duplicateToSimilar': {
    ru: 'Дублировать на похожие квартиры',
    en: 'Duplicate to similar apartments',
    ka: 'მსგავს ბინებზე დუბლირება'
  },
  'photosManager.noPhotos': {
    ru: 'Фотографии не загружены',
    en: 'No photos uploaded',
    ka: 'ფოტოები არ არის ატვირთული'
  },
  'photosManager.noPhotosDesc': {
    ru: 'Загрузите фотографии для выбранной квартиры',
    en: 'Upload photos for the selected apartment',
    ka: 'ატვირთეთ ფოტოები არჩეული ბინისთვის'
  },
  'photosManager.uploadSuccess': {
    ru: 'Фотографии загружены',
    en: 'Photos uploaded',
    ka: 'ფოტოები ატვირთულია'
  },
  'photosManager.uploadError': {
    ru: 'Ошибка загрузки фотографий',
    en: 'Error uploading photos',
    ka: 'ფოტოების ატვირთვის შეცდომა'
  },
  'photosManager.deleteSuccess': {
    ru: 'Фото удалено',
    en: 'Photo deleted',
    ka: 'ფოტო წაშლილია'
  },
  'photosManager.deleteError': {
    ru: 'Ошибка удаления фото',
    en: 'Error deleting photo',
    ka: 'ფოტოს წაშლის შეცდომა'
  },
  'photosManager.duplicateSuccess': {
    ru: 'Фотографии продублированы для {count} похожих квартир',
    en: 'Photos duplicated for {count} similar apartments',
    ka: 'ფოტოები დუბლირებულია {count} მსგავსი ბინისთვის'
  },
  'photosManager.duplicateError': {
    ru: 'Ошибка дублирования фотографий',
    en: 'Error duplicating photos',
    ka: 'ფოტოების დუბლირების შეცდომა'
  },
  'photosManager.authRequired': {
    ru: 'Необходимо войти в систему для загрузки фотографий',
    en: 'Authentication required to upload photos',
    ka: 'ფოტოების ატვირთვისთვის ავტორიზაცია საჭიროა'
  },

  // Floor Management
  'floorManagement.title': {
    ru: 'Управление этажами',
    en: 'Floor Management',
    ka: 'სართულების მართვა'
  },
  'floorManagement.description': {
    ru: 'Добавляйте или удаляйте этажи в проекте',
    en: 'Add or remove floors in the project',
    ka: 'დაამატეთ ან წაშალეთ სართულები პროექტში'
  },
  'floorManagement.manageFloors': {
    ru: 'Управление этажами',
    en: 'Manage Floors',
    ka: 'სართულების მართვა'
  },
  'floorManagement.addFloor': {
    ru: 'Добавить этаж',
    en: 'Add Floor',
    ka: 'სართულის დამატება'
  },
  'floorManagement.floorNumber': {
    ru: 'Номер этажа',
    en: 'Floor number',
    ka: 'სართულის ნომერი'
  },
  'floorManagement.add': {
    ru: 'Добавить',
    en: 'Add',
    ka: 'დამატება'
  },
  'floorManagement.existingFloors': {
    ru: 'Существующие этажи',
    en: 'Existing floors',
    ka: 'არსებული სართულები'
  },
  'floorManagement.floor': {
    ru: 'Этаж',
    en: 'Floor',
    ka: 'სართული'
  },
  'floorManagement.apartment': {
    ru: 'квартира',
    en: 'apartment',
    ka: 'ბინა'
  },
  'floorManagement.apartments': {
    ru: 'квартир',
    en: 'apartments',
    ka: 'ბინები'
  },
  'floorManagement.noFloors': {
    ru: 'Этажи не созданы',
    en: 'No floors created',
    ka: 'სართულები არ არის შექმნილი'
  },
  'floorManagement.deleteFloorConfirm': {
    ru: 'Вы уверены, что хотите удалить {floor} этаж?',
    en: 'Are you sure you want to delete floor {floor}?',
    ka: 'დარწმუნებული ხართ, რომ გსურთ {floor} სართულის წაშლა?'
  },
  'floorManagement.deleteFloorWithApartmentsConfirm': {
    ru: 'Вы уверены, что хотите удалить {floor} этаж? На нем находится {count} квартир, которые также будут удалены.',
    en: 'Are you sure you want to delete floor {floor}? It contains {count} apartments that will also be deleted.',
    ka: 'დარწმუნებული ხართ, რომ გსურთ {floor} სართულის წაშლა? მასზე არის {count} ბინა, რომლებიც ასევე წაიშლება.'
  },
  'floorManagement.deleteFloorSuccess': {
    ru: 'Этаж {floor} успешно удален',
    en: 'Floor {floor} successfully deleted',
    ka: 'სართული {floor} წარმატებით წაიშალა'
  },
  'floorManagement.deleteFloorError': {
    ru: 'Ошибка при удалении этажа',
    en: 'Error deleting floor',
    ka: 'სართულის წაშლის შეცდომა'
  },
  'floorManagement.addFloorSuccess': {
    ru: 'Этаж {floor} успешно добавлен',
    en: 'Floor {floor} successfully added',
    ka: 'სართული {floor} წარმატებით დაემატა'
  },
  'floorManagement.addFloorError': {
    ru: 'Ошибка при добавлении этажа',
    en: 'Error adding floor',
    ka: 'სართულის დამატების შეცდომა'
  },
  'floorManagement.invalidFloorNumber': {
    ru: 'Неверный номер этажа',
    en: 'Invalid floor number',
    ka: 'არასწორი სართულის ნომერი'
  },
  'floorManagement.floorAlreadyExists': {
    ru: 'Этаж {floor} уже существует',
    en: 'Floor {floor} already exists',
    ka: 'სართული {floor} უკვე არსებობს'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
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
        return text.replace(new RegExp(`{${param}}`, 'g'), String(params[param]));
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
        return text.replace(new RegExp(`{${param}}`, 'g'), String(params[param]));
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
