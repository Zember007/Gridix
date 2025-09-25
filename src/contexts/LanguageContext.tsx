
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
  [key: string]: Partial<Record<Language, string>>;
}

const translations: Translations = {
  // Common
  'common.cancel': { ru: 'Отмена', en: 'Cancel', ka: 'გაუქმება', ar: 'إلغاء' },
  'common.continue': { ru: 'Продолжить', en: 'Continue', ka: 'გაგრძელება', ar: 'متابعة' },
  'common.back': { ru: 'Назад', en: 'Back', ka: 'უკან', ar: 'رجوع' },
  'common.example': { ru: 'Пример', en: 'Example', ka: 'მაგალითი', ar: 'مثال' },

  // Navigation
  'nav.projects': {
    ru: 'Проекты',
    en: 'Projects',
    ka: 'პროექტები',
    ar: 'المشاريع'
  },
  'nav.about': {
    ru: 'О нас',
    en: 'About',
    ka: 'ჩვენს შესახებ',
    ar: 'حولنا'
  },
  'nav.contact': {
    ru: 'Контакты',
    en: 'Contact',
    ka: 'კონტაქტი',
    ar: 'اتصل بنا'
  },

  // Project
  'project.apartments': {
    ru: 'квартир',
    en: 'apartments',
    ka: 'ბინები',
    ar: 'شقق'
  },
  'project.floors': {
    ru: 'этажей',
    en: 'floors',
    ka: 'სართულები',
    ar: 'طوابق'
  },
  'project.available': {
    ru: 'Доступно',
    en: 'Available',
    ka: 'ხელმისაწვდომია',
    ar: 'متاح'
  },
  'project.reserved': {
    ru: 'Забронировано',
    en: 'Reserved',
    ka: 'დაჯავშნული',
    ar: 'محجوز'
  },
  'project.sold': {
    ru: 'Продано',
    en: 'Sold',
    ka: 'გაყიდული',
    ar: 'مباع'
  },
  'project.price': {
    ru: 'Цена',
    en: 'Price',
    ka: 'ფასი',
    ar: 'السعر'
  },
  'project.area': {
    ru: 'Площадь',
    en: 'Area',
    ka: 'ართული',
    ar: 'المساحة'
  },
  'project.rooms': {
    ru: 'Комнаты',
    en: 'Rooms',
    ka: 'ოთახები',
    ar: 'الغرف'
  },
  'project.floor': {
    ru: 'Этаж',
    en: 'Floor',
    ka: 'სართული',
    ar: 'الطابق'
  },
  'project.number': {
    ru: 'Номер',
    en: 'Number',
    ka: 'ნომერი',
    ar: 'الرقم'
  },
  'project.status': {
    ru: 'Статус',
    en: 'Status',
    ka: 'სტატუსი',
    ar: 'الحالة'
  },
  'project.contactManager': {
    ru: 'Связаться с менеджером',
    en: 'Contact Manager',
    ka: 'დაკავშირება მენეჯერთან',
    ar: 'الاتصال بالمدير'
  },
  'project.contactManagerNotConfigured': {
    ru: 'Контактная информация менеджера не настроена',
    en: 'Manager contact information not configured',
    ka: 'მენეჯერის საკონტაქტო ინფორმაცია არ არის კონფიგურირებული',
    ar: 'معلومات الاتصال بالمدير غير مكونة'
  },
  'project.backToBuilding': {
    ru: 'Назад к зданию',
    en: 'Back to Building',
    ka: 'შენობაზე დაბრუნება',
    ar: 'العودة إلى المبنى'
  },
  'project.noBuildingPlan': {
    ru: 'План здания не настроен',
    en: 'Building plan not configured',
    ka: 'შენობის გეგმა არ არის კონფიგურირებული',
    ar: 'مخطط المبنى غير مكون'
  },
  'project.contactAdmin': {
    ru: 'Обратитесь к администратору',
    en: 'Contact administrator',
    ka: 'დაუკავშირდით ადმინისტრატორს',
    ar: 'اتصل بالمسؤول'
  },
  'project.interactivePlan': {
    ru: 'Интерактивный план',
    en: 'Interactive Plan',
    ka: 'ინტერაქტიული გეგმა',
    ar: 'المخطط التفاعلي'
  },
  'project.total': {
    ru: 'Всего',
    en: 'Total',
    ka: 'სულ',
    ar: 'الإجمالي'
  },
  'project.legend': {
    ru: 'Легенда',
    en: 'Legend',
    ka: 'ლეგენდა',
    ar: 'وصف الرموز'
  },
  'project.loading': {
    ru: 'Загрузка...',
    en: 'Loading...',
    ka: 'იტვირთება...',
    ar: 'جاري التحميل...'
  },
  'project.parameters': {
    ru: 'Параметры',
    en: 'Parameters',
    ka: 'პარამეტრები',
    ar: 'المعاملات'
  },
  'project.resetFilters': {
    ru: 'Сбросить фильтры',
    en: 'Reset filters',
    ka: 'ფილტრების გაუქმება',
    ar: 'إعادة تعيين التصفيات'
  },
  'project.facade': {
    ru: 'Фасад',
    en: 'Facade',
    ka: 'ფასადი',
    ar: 'الواجهة'
  },
  'project.listView': {
    ru: 'Списком',
    en: 'List view',
    ka: 'სიის სახით',
    ar: 'عرض القائمة'
  },

  // Admin project creation/import
  'admin.project.create.title': { ru: 'Создать новый проект', en: 'Create new project', ka: 'ახალი პროექტის შექმნა', ar: 'إنشاء مشروع جديد' },
  'admin.project.create.description': { ru: 'Выберите способ создания проекта', en: 'Choose how to create the project', ka: 'აირჩიეთ პროექტის შექმნის მეთოდი', ar: 'اختر كيفية إنشاء المشروع' },
  'admin.project.create.manual.title': { ru: 'Ручная настройка', en: 'Manual setup', ka: 'ხელით დაყენება', ar: 'إعداد يدوي' },
  'admin.project.create.manual.description': { ru: 'Создать проект с нуля и настроить все самостоятельно', en: 'Create a project from scratch and configure everything yourself', ka: 'პროექტის შექმნა ნულიდან და ყველაფრის ხელით დაყენება', ar: 'أنشئ مشروعًا من الصفر وقم بتكوينه بنفسك' },
  'admin.project.create.manual.start': { ru: 'Начать ручное создание', en: 'Start manual creation', ka: 'ხელით შექმნის დაწყება', ar: 'بدء الإنشاء اليدوي' },
  'admin.project.create.import.title': { ru: 'Импорт из Excel', en: 'Import from Excel', ka: 'იმპორტი Excel-დან', ar: 'الاستيراد من Excel' },
  'admin.project.create.import.description': { ru: 'Загрузить Excel файл с данными квартир и автоматически создать проект', en: 'Upload an Excel file with apartment data to create a project automatically', ka: 'ატვირთეთ ბინების მონაცემებით Excel ფაილი პროექტის ავტომატურად შესაქმნელად', ar: 'قم بتحميل ملف Excel يحتوي على بيانات الشقق لإنشاء مشروع تلقائيًا' },
  'admin.project.create.import.uploadTab': { ru: 'Загрузить файл', en: 'Upload file', ka: 'ფაილის ატვირთვა', ar: 'رفع ملف' },
  'admin.project.create.import.urlTab': { ru: 'По ссылке', en: 'By link', ka: 'ბმულით', ar: 'عبر الرابط' },
  'admin.project.create.import.uploadButton': { ru: 'Загрузить Excel файл', en: 'Upload Excel file', ka: 'ატვირთეთ Excel ფაილი', ar: 'رفع ملف Excel' },
  'admin.project.create.import.processing': { ru: 'Обработка...', en: 'Processing...', ka: 'დამუშავება...', ar: 'جارٍ المعالجة...' },
  'admin.project.create.import.template': { ru: 'Скачать шаблон', en: 'Download template', ka: 'შაბლონის ჩამოტვირთვა', ar: 'تنزيل النموذج' },
  'admin.project.create.import.byLink': { ru: 'Импорт по ссылке', en: 'Import by link', ka: 'იმპორტი ბმულით', ar: 'الاستيراد عبر الرابط' },
  'admin.project.create.import.benefitsTitle': { ru: 'Преимущества импорта по ссылке:', en: 'Advantages of import by link:', ka: 'ბმულით იმპორტის უპირატესობები:', ar: 'مزایا الاستيراد عبر الرابط:' },
  'admin.project.create.import.benefit.sync': { ru: 'Автоматическая синхронизация при изменении данных', en: 'Automatic sync when data changes', ka: 'ავტომატური სინქრონიზაცია მონაცემების ცვლილებისას', ar: 'مزامنة تلقائية عند تغيير البيانات' },
  'admin.project.create.import.benefit.noReupload': { ru: 'Не нужно загружать файл повторно', en: 'No need to re-upload the file', ka: 'ფაილის თავიდან ატვირთვა არ არის საჭირო', ar: 'لا حاجة لإعادة رفع الملف' },
  'admin.project.create.import.benefit.fresh': { ru: 'Данные всегда актуальны', en: 'Data is always up-to-date', ka: 'მონაცემები ყოველთვის ახლდება', ar: 'البيانات دائمًا محدثة' },
  'admin.project.create.supportedFormats': { ru: 'Поддерживаемые форматы:', en: 'Supported formats:', ka: 'მხარდაჭერილი ფორმატები:', ar: 'التنسيقات المدعومة:' },
  'admin.project.create.requiredData': { ru: 'Необходимые данные:', en: 'Required data:', ka: 'საჭირო მონაცემები:', ar: 'البيانات المطلوبة:' },
  'admin.project.create.requiredData.fields': { ru: 'Номера квартир, этажи, комнаты, площадь, цена, статус', en: 'Apartment numbers, floors, rooms, area, price, status', ka: 'ბინის ნომრები, სართულები, ოთახები, ფართობი, ფასი, სტატუსი', ar: 'أرقام الشقق، الطوابق، الغرف، المساحة، السعر، الحالة' },
  'admin.project.create.googleSheets': { ru: 'Google Sheets:', en: 'Google Sheets:', ka: 'Google Sheets:', ar: 'Google Sheets:' },
  'admin.project.create.infoText': { ru: 'Любой формат ссылки, автоматическое преобразование и синхронизация', en: 'Any link format, automatic conversion and sync', ka: 'ნებისმიერი ბმის ფორმატი, ავტომატური კონვერტაცია და სინქი', ar: 'أي تنسيق للرابط، تحويل ومزامنة تلقائيان' },
  'admin.project.create.layout.title': { ru: 'Планировка этажей', en: 'Floor layout', ka: 'სართულის გეგმა', ar: 'مخطط الطوابق' },
  'admin.project.create.layout.question': { ru: 'Одинаковая ли планировка на всех этажах здания?', en: 'Is the layout the same on all floors?', ka: 'ყველა სართულზე ერთნაირი გეგმაა?', ar: 'هل المخطط نفسه في جميع الطوابق؟' },
  'admin.project.create.layout.same': { ru: 'Да, планировка одинаковая', en: 'Yes, the layout is the same', ka: 'დიახ, გეგმა ერთნაირია', ar: 'نعم، المخطط نفسه' },
  'admin.project.create.layout.same.help': { ru: 'Вы сможете один раз выделить квартиры на плане, и они автоматически применятся ко всем этажам', en: 'You can mark apartments once and apply to all floors automatically', ka: 'ერთხელ მონიშნავთ ბინებს და ავტომატურად გავრცელდება ყველა სართულზე', ar: 'يمكنك تحديد الشقق مرة واحدة وتطبيقها تلقائيًا على جميع الطوابق' },
  'admin.project.create.layout.different': { ru: 'Нет, планировка разная', en: 'No, the layout differs', ka: 'არა, გეგმა განსხვავდება', ar: 'لا، المخطط يختلف' },
  'admin.project.create.layout.different.help': { ru: 'Вам нужно будет отдельно настроить каждый этаж', en: 'You will need to configure each floor separately', ka: 'თითოეული სართულის ცალ-ცალკე დაყენება დაგჭირდებათ', ar: 'ستحتاج إلى ضبط كل طابق بشكل منفصل' },

  // Messaging and errors
  'messages.fileProcessed': { ru: 'Файл обработан успешно! Найдено {count} записей', en: 'File processed successfully! Found {count} records', ka: 'ფაილი წარმატებით დამუშავდა! ნაპოვნია {count} ჩანაწერი', ar: 'تمت معالجة الملف بنجاح! تم العثور على {count} سجل' },
  'messages.templateDownloaded': { ru: 'Шаблон загружен', en: 'Template downloaded', ka: 'შაბლონი ჩამოიტვირთა', ar: 'تم تنزيل القالب' },
  'errors.file.noData': { ru: 'Файл не содержит данных', en: 'File contains no data', ka: 'ფაილი ცარიელია', ar: 'الملف لا يحتوي على بيانات' },
  'errors.file.process': { ru: 'Ошибка при обработке файла', en: 'Error processing file', ka: 'ფაილის დამუშავების შეცდომა', ar: 'خطأ في معالجة الملف' },
  'errors.file.read': { ru: 'Ошибка при чтении файла', en: 'Error reading file', ka: 'ფაილის წაკითხვის შეცდომა', ar: 'خطأ في قراءة الملف' },
  'errors.file.upload': { ru: 'Ошибка при загрузке файла', en: 'Error uploading file', ka: 'ფაილის ატვირთვის შეცდომა', ar: 'خطأ في رفع الملف' },
  'state.creatingProject': { ru: 'Создание проекта...', en: 'Creating project...', ka: 'პროექტის შექმნა...', ar: 'جارٍ إنشاء المشروع...' },

  // Excel Column Mapper
  'excel.mapper.projectInfo.title': { ru: 'Информация о проекте', en: 'Project information', ka: 'პროექტის ინფორმაცია', ar: 'معلومات المشروع' },
  'excel.mapper.projectInfo.description': { ru: 'Основная информация о вашем проекте', en: 'Basic information about your project', ka: 'ძირითადი ინფორმაცია თქვენი პროექტის შესახებ', ar: 'معلومات أساسية عن مشروعك' },
  'excel.mapper.project.name': { ru: 'Название проекта*', en: 'Project name*', ka: 'პროექტის სახელი*', ar: 'اسم المشروع*' },
  'excel.mapper.project.description': { ru: 'Описание', en: 'Description', ka: 'აღწერა', ar: 'الوصف' },
  'excel.mapper.project.floors': { ru: 'Количество этажей', en: 'Number of floors', ka: 'სართულების რაოდენობა', ar: 'عدد الطوابق' },
  'excel.mapper.project.floors.hint': { ru: 'Будет автоматически скорректировано на основе данных из таблицы', en: 'Will be adjusted based on data from the table', ka: 'ცხრილის მონაცემებზე დაყრდნობით ავტომატურად დარეგულირდება', ar: 'سيتم التعديل تلقائيًا بناءً على بيانات الجدول' },
  'excel.mapper.columns.title': { ru: 'Соотнести столбцы Excel', en: 'Map Excel columns', ka: 'დაამთხვიე Excel-ის სვეტები', ar: 'ربط أعمدة Excel' },
  'excel.mapper.columns.description': { ru: 'Укажите, какие столбцы из вашего Excel файла соответствуют полям квартир', en: 'Specify which columns from your Excel file correspond to apartment fields', ka: 'მიუთითეთ, რომელი სვეტები შეესაბამება ბინების ველებს', ar: 'حدد الأعمدة من ملف Excel التي تتوافق مع حقول الشقق' },
  'excel.mapper.preview.title': { ru: 'Предварительный просмотр данных', en: 'Data preview', ka: 'მონაცემების წინასწარი დათვალიერება', ar: 'معاينة البيانات' },
  'excel.mapper.preview.description': { ru: 'Как будут импортированы ваши данные ({count} записей)', en: 'How your data will be imported ({count} records)', ka: 'როგორ იქნება თქვენი მონაცემები იმპორტირებული ({count} ჩანაწერი)', ar: 'كيفية استيراد بياناتك ({count} سجل)' },
  'excel.mapper.validation.title': { ru: 'Валидация данных', en: 'Data validation', ka: 'მონაცემების ვალიდაცია', ar: 'التحقق من البيانات' },
  'excel.mapper.validation.description': { ru: 'Настройте соответствие значений из Excel к стандартным форматам', en: 'Map Excel values to standard formats', ka: 'დაამთხვიეთ Excel-ის მნიშვნელობები სტანდარტულ ფორმატებს', ar: 'ربط قيم Excel بالتنسيقات القياسية' },
  'excel.mapper.validation.status.title': { ru: 'Настройка статусов квартир', en: 'Configure apartment statuses', ka: 'ბინების სტატუსების კონფიგურაცია', ar: 'تكوين حالات الشقق' },
  'excel.mapper.validation.rooms.title': { ru: 'Настройка количества комнат', en: 'Configure number of rooms', ka: 'ოთახებების რაოდენობის კონფიგურაცია', ar: 'تكوين عدد الغرف' },
  'excel.mapper.actions.createProject': { ru: 'Создать проект с данными', en: 'Create project with data', ka: 'პროექტის შექმნა მონაცემებით', ar: 'إنشاء مشروع بالبيانات' },
  'common.view': { ru: 'Посмотреть', en: 'View', ka: 'ნახვა', ar: 'عرض' },

  // Rooms labels
  'rooms.studio': { ru: 'Студия (0)', en: 'Studio (0)', ka: 'სტუდიო (0)', ar: 'استوديو (0)' },
  'rooms.one': { ru: '1 комната', en: '1 room', ka: '1 ოთახი', ar: 'غرفة واحدة' },
  'rooms.two': { ru: '2 комнаты', en: '2 rooms', ka: '2 ოთახი', ar: 'غرفتان' },
  'rooms.three': { ru: '3 комнаты', en: '3 rooms', ka: '3 ოთახი', ar: '3 غرف' },
  'rooms.four': { ru: '4 комнаты', en: '4 rooms', ka: '4 ოთახი', ar: '4 غرف' },
  'rooms.fivePlus': { ru: '5+ комнат', en: '5+ rooms', ka: '5+ ოთახი', ar: '5+ غرف' },

  // Excel URL Importer
  'excel.url.title': { ru: 'Импорт из Excel', en: 'Import from Excel', ka: 'იმპორტი Excel-იდან', ar: 'الاستيراد من Excel' },
  'excel.url.title.googleSheets': { ru: 'Импорт из Google Sheets', en: 'Import from Google Sheets', ka: 'იმპორტი Google Sheets-დან', ar: 'الاستيراد من Google Sheets' },
  'excel.url.title.link': { ru: 'Импорт по ссылке', en: 'Import by link', ka: 'იმპორტი ბმულით', ar: 'الاستيراد عبر الرابط' },
  'excel.url.desc.googleSheets': { ru: 'Импортируйте данные напрямую из Google Sheets документа', en: 'Import data directly from a Google Sheets document', ka: 'მონაცემების იმპორტი უშუალოდ Google Sheets-დან', ar: 'استيراد البيانات مباشرة من مستند Google Sheets' },
  'excel.url.desc.link': { ru: 'Импортируйте данные напрямую из Excel файла по ссылке', en: 'Import data from an Excel file by link', ka: 'მონაცემების იმპორტი Excel ფაილიდან ბმულით', ar: 'استيراد البيانات من ملف Excel عبر رابط' },
  'excel.url.input.gs': { ru: 'Ссылка на Google Sheets*', en: 'Google Sheets link*', ka: 'ბმული Google Sheets-ზე*', ar: 'رابط Google Sheets*' },
  'excel.url.input.excel': { ru: 'Ссылка на Excel файл*', en: 'Excel file link*', ka: 'Excel ფაილის ბმული*', ar: 'رابط ملف Excel*' },
  'excel.url.check': { ru: 'Проверить', en: 'Check', ka: 'შემოწმება', ar: 'فحص' },
  'excel.url.checking': { ru: 'Проверка...', en: 'Checking...', ka: 'შემოწმება...', ar: 'جارٍ الفحص...' },
  'excel.url.link.ok': { ru: '✓ Ссылка доступна', en: '✓ Link is accessible', ka: '✓ ბმული ხელმისაწვდომია', ar: '✓ الرابط متاح' },
  'excel.url.link.fail': { ru: '✗ Ссылка недоступна', en: '✗ Link is not accessible', ka: '✗ ბმული მიუწვდომელია', ar: '✗ الرابط غير متاح' },
  'excel.url.toast.enterLink': { ru: 'Введите ссылку на файл', en: 'Enter a link to the file', ka: 'შეიყვანეთ ფაილის ბმული', ar: 'أدخل رابط الملف' },
  'excel.url.toast.gsAccessible': { ru: 'Google Sheets доступен для импорта', en: 'Google Sheets is accessible for import', ka: 'Google Sheets ხელმისაწვდომია იმპორტისთვის', ar: 'Google Sheets متاح للاستيراد' },
  'excel.url.toast.linkAccessible': { ru: 'Ссылка доступна для импорта', en: 'Link is accessible for import', ka: 'ბმული ხელმისაწვდომია იმპორტისთვის', ar: 'الرابط متاح للاستيراد' },
  'excel.url.toast.fileInaccessible': { ru: 'Файл недоступен по указанной ссылке', en: 'File is not accessible via the provided link', ka: 'ფაილი მიუწვდომელია ბმულით', ar: 'الملف غير متاح عبر الرابط' },
  'excel.url.toast.checkError': { ru: 'Ошибка при проверке ссылки. Убедитесь, что файл доступен публично', en: 'Error checking the link. Ensure the file is publicly accessible', ka: 'ბმულის შემოწმების შეცდომა. დარწმუნდით, რომ ფაილი საჯაროდ ხელმისაწვდომია', ar: 'حدث خطأ أثناء فحص الرابط. تأكد من أن الملف متاح للعامة' },
  'excel.url.toast.invalidGs': { ru: 'Некорректная ссылка Google Sheets', en: 'Invalid Google Sheets link', ka: 'არასწორი Google Sheets ბმული', ar: 'رابط Google Sheets غير صالح' },
  'excel.url.toast.fetchFailed': { ru: 'Не удалось загрузить файл', en: 'Failed to load file', ka: 'ფაილის ჩატვირთვა ვერ მოხერხდა', ar: 'فشل تحميل الملف' },
  'excel.url.importing': { ru: 'Импорт...', en: 'Importing...', ka: 'იმპორტი...', ar: 'جارٍ الاستيراد...' },
  'excel.url.importData': { ru: 'Импортировать данные', en: 'Import data', ka: 'მონაცემების იმპორტი', ar: 'استيراد البيانات' },
  'excel.url.detectedGs': { ru: 'Google Sheets обнаружен', en: 'Google Sheets detected', ka: 'აღმოჩენილია Google Sheets', ar: 'تم اكتشاف Google Sheets' },
  'excel.url.autoConvert': { ru: 'Ссылка будет автоматически преобразована для импорта данных', en: 'The link will be automatically converted for data import', ka: 'ბმული ავტომატურად გარდაიქმნება მონაცემების იმპორტისთვის', ar: 'سيتم تحويل الرابط تلقائيًا لاستيراد البيانات' },
  'excel.url.howToSetup': { ru: 'Как настроить доступ:', en: 'How to set up access:', ka: 'როგორ დავაყენოთ წვდომა:', ar: 'كيفية إعداد الوصول:' },
  'excel.url.req.title': { ru: 'Требования к файлу:', en: 'File requirements:', ka: 'ფაილის მოთხოვნები:', ar: 'متطلبات الملف:' },
  'excel.url.req.p1': { ru: 'Файл должен быть доступен публично (без авторизации)', en: 'The file must be publicly accessible (no auth)', ka: 'ფაილი უნდა იყოს საჯაროდ ხელმისაწვდომი (აუთენტიკაციის გარეშე)', ar: 'يجب أن يكون الملف متاحًا للعامة (بدون مصادقة)' },
  'excel.url.req.p2': { ru: 'Поддерживаются: Excel (.xlsx, .xls) и Google Sheets', en: 'Supported: Excel (.xlsx, .xls) and Google Sheets', ka: 'მხარდაჭერილია: Excel (.xlsx, .xls) და Google Sheets', ar: 'مدعوم: Excel (.xlsx, .xls) وGoogle Sheets' },
  'excel.url.req.p3': { ru: 'Первая строка должна содержать заголовки столбцов', en: 'First row must contain column headers', ka: 'პირველი ხაზი უნდა შეიცავდეს სვეტების სათაურებს', ar: 'يجب أن تحتوي الصف الأول على عناوين الأعمدة' },
  'excel.url.req.p4': { ru: 'Для автосинхронизации файл не должен перемещаться', en: 'For auto-sync the file should not be moved', ka: 'ავტო-სინქისთვის ფაილი არ უნდა გადაიტანოთ', ar: 'للمزامنة التلقائية لا يجب نقل الملف' },
  'excel.url.importedCount': { ru: 'Импортировано {count} записей', en: 'Imported {count} records', ka: 'იმპორტირებულია {count} ჩანაწერი', ar: 'تم استيراد {count} سجل' },

  // Favorites
  'favorites.title': {
    ru: 'Избранное',
    en: 'Favorites',
    ka: 'რჩეულები',
    ar: 'المفضلة'
  },
  'favorites.empty.title': {
    ru: 'Нет избранных квартир',
    en: 'No favorites yet',
    ka: 'რჩეულები არ არის',
    ar: 'لا توجد مفضلة حتى الآن'
  },
  'favorites.empty.description': {
    ru: 'Добавьте квартиры в избранное, нажав на сердечко',
    en: 'Add apartments to favorites by tapping the heart',
    ka: 'მონიშნეთ ბინები გულით, რომ დაამატოთ რჩეულებში',
    ar: 'أضف الشقق إلى المفضلة بالنقر على القلب'
  },
  'project.layouts': {
    ru: 'Планировки',
    en: 'Layouts',
    ka: 'პლანირებები',
    ar: 'التخطيطات'
  },
  'project.layout': {
    ru: 'Планировка',
    en: 'Layout',
    ka: 'პლანირება',
    ar: 'التخطيط'
  },
  'project.type': {
    ru: 'Тип',
    en: 'Type',
    ka: 'ტიპი',
    ar: 'النوع'
  },
  'project.location': {
    ru: 'Расположение',
    en: 'Location',
    ka: 'მდებარეობა',
    ar: 'الموقع'
  },
  'project.finishing': {
    ru: 'Отделка',
    en: 'Finishing',
    ka: 'მოწყობა',
    ar: 'التشطيب'
  },
  'project.sampleLocation': {
    ru: 'Вид на море',
    en: 'Sea view',
    ka: 'ზღვის ხედი',
    ar: 'إطلالة على البحر'
  },
  'project.of': {
    ru: 'из',
    en: 'of',
    ka: '-დან',
    ar: 'من'
  },
  'project.onRequest': {
    ru: 'По запросу',
    en: 'On request',
    ka: 'მოთხოვნისთანა',
    ar: 'عند الطلب'
  },
  'project.additionalInfo': {
    ru: 'Дополнительная информация',
    en: 'Additional Information',
    ka: 'დამატებითი ინფორმაცია',
    ar: 'معلومات إضافية'
  },
  'project.from': {
    ru: 'от',
    en: 'from',
    ka: '-დან',
    ar: 'من'
  },
  'project.showMore': {
    ru: 'Показать еще {{count}} из {{total}} вариантов',
    en: 'Show {{count}} more of {{total}} options',
    ka: 'აჩვენე კიდევ {{count}} {{total}}-დან',
    ar: 'عرض {{count}} أكثر من {{total}} خيار'
  },
  'project.viewApartments': {
    ru: 'Смотреть {count} вариантов',
    en: 'View {count} options',
    ka: 'იხილე {count} ვარიანტი',
    ar: 'عرض {count} خيارات'
  },
  'project.contactMessage': {
    ru: 'Здравствуйте! Интересует проект {{projectName}}. Можете предоставить дополнительную информацию?',
    en: 'Hello! I am interested in the {{projectName}} project. Can you provide additional information?',
    ka: 'გამარჯობა! მაინტერესებს {{projectName}} პროექტი. შეგიძლიათ დამატებითი ინფორმაცია მოგვაწოდოთ?',
    ar: 'مرحبا! أنا مهتم بمشروع {{projectName}}. هل يمكنك تقديم معلومات إضافية؟'
  },
  'project.noContactInfo': {
    ru: 'Контактная информация менеджера не настроена',
    en: 'Manager contact information not configured',
    ka: 'მენეჯერის საკონტაქტო ინფორმაცია არ არის კონფიგურირებული',
    ar: 'معلومات الاتصال بالمدير غير مكونة'
  },
  'apartment.rooms': {
    ru: 'комнаты',
    en: 'rooms',
    ka: 'ოთახები',
    ar: 'غرف'
  },
  'project.selectFloor': {
    ru: 'Выберите этаж',
    en: 'Select floor',
    ka: 'აირჩიეთ სართული',
    ar: 'اختر الطابق'
  },
  'project.apartmentsList': {
    ru: 'Список квартир',
    en: 'Apartments list',
    ka: 'ბინების სია',
    ar: 'قائمة الشقق'
  },
  'project.noImage': {
    ru: 'Изображение не загружено',
    en: 'No image loaded',
    ka: 'სურათი არ არის ჩატვირთული',
    ar: 'لم يتم تحميل الصورة'
  },
  'project.priceRange': {
    ru: 'Диапазон цен',
    en: 'Price range',
    ka: 'ფასების დიაპაზონი',
    ar: 'نطاق الأسعار'
  },
  'project.areaRange': {
    ru: 'Диапазон площадей',
    en: 'Area range',
    ka: 'ფართობების დიაპაზონი',
    ar: 'نطاق المساحات'
  },
  'project.layoutPreview': {
    ru: 'Предпросмотр планировки',
    en: 'Layout preview',
    ka: 'განლაგების გადახედვა',
    ar: 'معاينة التخطيط'
  },
  'common.reserve': {
    ru: 'Забронировать',
    en: 'Reserve',
    ka: 'დაჯავშნა',
    ar: 'احجز'
  },

  // Filters
  'filters.search': {
    ru: 'Поиск...',
    en: 'Search...',
    ka: 'ძებნა...',
    ar: 'بحث...'
  },
  'filters.city': {
    ru: 'Город',
    en: 'City',
    ka: 'ქალაქი',
    ar: 'المدينة'
  },
  'filters.allCities': {
    ru: 'Все города',
    en: 'All cities',
    ka: 'ყველა ქალაქი',
    ar: 'جميع المدن'
  },
  'filters.status': {
    ru: 'Статус',
    en: 'Status',
    ka: 'სტატუსი',
    ar: 'الحالة'
  },
  'filters.allStatuses': {
    ru: 'Все статусы',
    en: 'All statuses',
    ka: 'ყველა სტატუსი',
    ar: 'جميع الحالات'
  },
  'filters.priceRange': {
    ru: 'Диапазон цен',
    en: 'Price range',
    ka: 'ფასის დიაპაზონი',
    ar: 'نطاق الأسعار'
  },
  'filters.minPrice': {
    ru: 'Мин. цена',
    en: 'Min price',
    ka: 'მინ. ფასი',
    ar: 'أقل سعر'
  },
  'filters.maxPrice': {
    ru: 'Макс. цена',
    en: 'Max price',
    ka: 'მაქს. ფასი',
    ar: 'أعلى سعر'
  },
  'filters.applyFilters': {
    ru: 'Применить фильтры',
    en: 'Apply filters',
    ka: 'ფილტრების გამოყენება',
    ar: 'تطبيق التصفيات'
  },
  'filters.resetFilters': {
    ru: 'Сбросить фильтры',
    en: 'Reset filters',
    ka: 'ფილტრების გადატვირთვა',
    ar: 'إعادة تعيين التصفيات'
  },

  // Statistics
  'stats.totalProjects': {
    ru: 'Всего проектов',
    en: 'Total projects',
    ka: 'სულ პროექტები',
    ar: 'إجمالي المشاريع'
  },
  'stats.totalApartments': {
    ru: 'Всего квартир',
    en: 'Total apartments',
    ka: 'სულ ბინები',
    ar: 'إجمالي الشقق'
  },
  'stats.availableApartments': {
    ru: 'Доступные квартиры',
    en: 'Available apartments',
    ka: 'ხელმისაწვდომი ბინები',
    ar: 'الشقق المتاحة'
  },

  // Common
  'common.available': {
    ru: 'Доступно',
    en: 'Available',
    ka: 'ხელმისაწვდომია',
    ar: 'متاح'
  },
  'common.reserved': {
    ru: 'Забронировано',
    en: 'Reserved',
    ka: 'დაჯავშნული',
    ar: 'محجوز'
  },
  'common.sold': {
    ru: 'Продано',
    en: 'Sold',
    ka: 'გაყიდული',
    ar: 'مباع'
  },
  'common.more': {
    ru: 'Подробнее',
    en: 'More details',
    ka: 'დეტალები',
    ar: 'المزيد من التفاصيل'
  },
  'common.priceOnRequest': {
    ru: 'По запросу',
    en: 'On request',
    ka: 'მოთხოვნისამებრ',
    ar: 'عند الطلب'
  },
  'common.search': {
    ru: 'Поиск',
    en: 'Search',
    ka: 'ძებნა',
    ar: 'بحث'
  },
  'common.unavailable': {
    ru: 'Недоступно',
    en: 'Unavailable',
    ka: 'მიუწვდომელია',
    ar: 'غير متاح'
  },
  'common.list': {
    ru: 'Список',
    en: 'List',
    ka: 'სია',
    ar: 'قائمة'
  },
  'common.grid': {
    ru: 'Плитка',
    en: 'Grid',
    ka: 'ბადე',
    ar: 'شبكة'
  },
  'common.copied': {
    ru: 'Ссылка скопирована в буфер обмена',
    en: 'Link copied to clipboard',
    ka: 'ბმული დაკოპირდა',
    ar: 'تم نسخ الرابط'
  },
  'common.error': {
    ru: 'Произошла ошибка',
    en: 'An error occurred',
    ka: 'შეცდომა მოხდა',
    ar: 'حدث خطأ'
  },

  // Navigation
  'nav.admin': {
    ru: 'Админ панель',
    en: 'Admin Panel',
    ka: 'ადმინ პანელი',
    ar: 'لوحة الإدارة'
  },

  // Landing page
  'landing.title': {
    ru: 'Создавайте интерактивные планы',
    en: 'Create Interactive Floor Plans',
    ka: 'შექმენით ინტერაქტიული გეგმები',
    ar: 'إنشاء مخططات أرضية تفاعلية'
  },
  'landing.subtitle': {
    ru: 'недвижимости легко',
    en: 'with ease',
    ka: 'მარტივად',
    ar: 'بسهولة'
  },
  'landing.description': {
    ru: 'Профессиональная платформа для создания и управления интерактивными планами недвижимости. Загружайте планы, настраивайте квартиры и встраивайте виджеты на ваш сайт.',
    en: 'Professional platform for creating and managing interactive real estate floor plans. Upload plans, configure apartments, and embed widgets on your website.',
    ka: 'პროფესიონალური პლატფორმა ინტერაქტიული უძრავი ქონების გეგმების შესაქმნელად და მართვისთვის. ატვირთეთ გეგმები, კონფიგურაცია გაუკეთეთ ბინებს და ჩადეთ ვიჯეტები თქვენს ვებსაიტზე.',
    ar: 'منصة احترافية لإنشاء وإدارة مخططات العقارات التفاعلية. ارفع المخططات، اضبط الشقق، وادمج الأدوات في موقعك.'
  },
  'landing.getStarted': {
    ru: 'Начать работу',
    en: 'Get Started',
    ka: 'დაწყება',
    ar: 'ابدأ الآن'
  },
  'landing.viewDemo': {
    ru: 'Посмотреть демо',
    en: 'View Demo',
    ka: 'დემოს ნახვა',
    ar: 'عرض التوضيحي'
  },
  'landing.features': {
    ru: 'Возможности платформы',
    en: 'Platform Features',
    ka: 'პლატფორმის შესაძლებლობები',
    ar: 'ميزات المنصة'
  },
  'landing.planUpload': {
    ru: 'Загрузка планов',
    en: 'Plan Upload',
    ka: 'გეგმების ატვირთვა',
    ar: 'رفع المخططات'
  },
  'landing.planUploadDesc': {
    ru: 'Загружайте изображения планов зданий и создавайте интерактивные карты квартир',
    en: 'Upload building plan images and create interactive apartment maps',
    ka: 'ატვირთეთ შენობის გეგმების სურათები და შექმენით ინტერაქტიული ბინების რუკები',
    ar: 'ارفع صور مخططات المباني وأنشئ خرائط شقق تفاعلية'
  },
  'landing.interactiveEditing': {
    ru: 'Интерактивное редактирование',
    en: 'Interactive Editing',
    ka: 'ინტერაქტიული რედაქტირება',
    ar: 'التحرير التفاعلي'
  },
  'landing.interactiveEditingDesc': {
    ru: 'Создавайте и редактируйте полигоны квартир прямо в браузере с помощью удобного редактора',
    en: 'Create and edit apartment polygons directly in the browser with a convenient editor',
    ka: 'შექმენით და დაარედაქტირეთ ბინების პოლიგონები პირდაპირ ბრაუზერში მოსახერხებელი რედაქტორით',
    ar: 'أنشئ وحرر مضلعات الشقق مباشرة في المتصفح بمحرر مريح'
  },
  'landing.excelIntegration': {
    ru: 'Интеграция с Excel',
    en: 'Excel Integration',
    ka: 'Excel ინტეგრაცია',
    ar: 'تكامل Excel'
  },
  'landing.excelIntegrationDesc': {
    ru: 'Импортируйте данные о квартирах из Excel файлов и синхронизируйте информацию',
    en: 'Import apartment data from Excel files and synchronize information',
    ka: 'იმპორტი გაუკეთეთ ბინების მონაცემებს Excel ფაილებიდან და სინქრონიზაცია გაუკეთეთ ინფორმაციას',
    ar: 'استورد بيانات الشقق من ملفات Excel وزامن المعلومات'
  },
  'landing.embeddableWidget': {
    ru: 'Встраиваемые виджеты',
    en: 'Embeddable Widgets',
    ka: 'ჩასადები ვიჯეტები',
    ar: 'ويجتات قابلة للدمج'
  },
  'landing.embeddableWidgetDesc': {
    ru: 'Встраивайте интерактивные планы на ваш сайт с помощью простого HTML кода',
    en: 'Embed interactive plans on your website with simple HTML code',
    ka: 'ჩადეთ ინტერაქტიული გეგმები თქვენს ვებსაიტზე მარტივი HTML კოდით',
    ar: 'ادمج المخططات التفاعلية في موقعك بكود HTML بسيط'
  },
  'landing.statusManagement': {
    ru: 'Управление статусами',
    en: 'Status Management',
    ka: 'სტატუსების მართვა',
    ar: 'إدارة الحالة'
  },
  'landing.statusManagementDesc': {
    ru: 'Отслеживайте статусы квартир: доступно, забронировано, продано',
    en: 'Track apartment statuses: available, reserved, sold',
    ka: 'თვალყურის დევნება ბინების სტატუსებზე: ხელმისაწვდომი, დაჯავშნული, გაყიდული',
    ar: 'تتبع حالات الشقق: متاح، محجوز، مباع'
  },
  'landing.multiProject': {
    ru: 'Мульти-проекты',
    en: 'Multi-Projects',
    ka: 'მრავალი პროექტი',
    ar: 'مشاريع متعددة'
  },
  'landing.multiProjectDesc': {
    ru: 'Управляйте несколькими проектами недвижимости в одной панели администратора',
    en: 'Manage multiple real estate projects in one admin panel',
    ka: 'მართეთ რამდენიმე უძრავი ქონების პროექტი ერთ ადმინ პანელში',
    ar: 'أدر عدة مشاريع عقارية في لوحة إدارة واحدة'
  },
  'landing.readyToStart': {
    ru: 'Готовы начать?',
    en: 'Ready to Start?',
    ka: 'მზად ხართ დასაწყებად?',
    ar: 'مستعد للبدء؟'
  },
  'landing.readyToStartDesc': {
    ru: 'Создайте свой первый интерактивный план недвижимости уже сегодня',
    en: 'Create your first interactive real estate plan today',
    ka: 'შექმენით თქვენი პირველი ინტერაქტიული უძრავი ქონების გეგმა დღესვე',
    ar: 'أنشئ مخططك العقاري التفاعلي الأول اليوم'
  },
  'landing.enterAdmin': {
    ru: 'Войти в админ панель',
    en: 'Enter Admin Panel',
    ka: 'ადმინ პანელში შესვლა',
    ar: 'دخول لوحة الإدارة'
  },

  // Landing (extended)
  'landing.badge': {
    ru: 'Инновационное решение для недвижимости',
    en: 'Innovative solution for real estate',
    ka: 'ინოვაციური გადაწყვეტა უძრავი ქონებისთვის',
    ar: 'حل مبتكر للعقارات'
  },
  'landing.stats.projects': {
    ru: 'Проектов',
    en: 'Projects',
    ka: 'პროექტი',
    ar: 'مشاريع'
  },
  'landing.stats.companies': {
    ru: 'Компаний',
    en: 'Companies',
    ka: 'კომპანია',
    ar: 'شركات'
  },
  'landing.stats.uptime': {
    ru: 'Время работы',
    en: 'Uptime',
    ka: 'ხელმისაწვდომობა',
    ar: 'وقت التشغيل'
  },
  'landing.stats.support': {
    ru: 'Поддержка',
    en: 'Support',
    ka: 'მხარდაჭერა',
    ar: 'الدعم'
  },
  'landing.toolsHeadline': {
    ru: 'Мощные инструменты для создания интерактивных планов недвижимости',
    en: 'Powerful tools to build interactive real estate floor plans',
    ka: 'ძლიერი ინსტრუმენტები ინტერაქტიული გეგმების შესაქმნელად',
    ar: 'أدوات قوية لبناء مخططات عقارية تفاعلية'
  },
  'landing.feature.quickSetup.title': {
    ru: 'Быстрая настройка',
    en: 'Quick setup',
    ka: 'სწრაფი მონტაჟი',
    ar: 'إعداد سريع'
  },
  'landing.feature.quickSetup.desc': {
    ru: 'Создайте проект за 5 минут',
    en: 'Create a project in 5 minutes',
    ka: 'შექმენით პროექტი 5 წუთში',
    ar: 'أنشئ مشروعاً في 5 دقائق'
  },
  'landing.feature.security.title': {
    ru: 'Безопасность',
    en: 'Security',
    ka: 'უსაფრთხოება',
    ar: 'الأمان'
  },
  'landing.feature.security.desc': {
    ru: 'Защищенное хранение данных',
    en: 'Secure data storage',
    ka: 'მონაცემთა დაცული შენახვა',
    ar: 'تخزين آمن للبيانات'
  },
  'landing.feature.multilang.title': {
    ru: 'Мультиязычность',
    en: 'Multilingual',
    ka: 'მრავალენოვანი',
    ar: 'متعدد اللغات'
  },
  'landing.feature.multilang.desc': {
    ru: 'Поддержка 3 языков',
    en: 'Supports 3 languages',
    ka: 'მხარდაჭერა 3 ენა',
    ar: 'يدعم 4 لغات'
  },
  'landing.feature.mobile.title': {
    ru: 'Мобильная версия',
    en: 'Mobile friendly',
    ka: 'მობილური ვერსია',
    ar: 'متوافق مع الهاتف'
  },
  'landing.feature.mobile.desc': {
    ru: 'Работает на всех устройствах',
    en: 'Works on all devices',
    ka: 'მუშაობს ყველა მოწყობილობაზე',
    ar: 'يعمل على جميع الأجهزة'
  },
  'landing.feature.simplicity.title': {
    ru: 'Простота',
    en: 'Simplicity',
    ka: 'სიმარტივე',
    ar: 'البساطة'
  },
  'landing.feature.simplicity.desc': {
    ru: 'Интуитивный интерфейс',
    en: 'Intuitive interface',
    ka: 'ინტუიციური ინტერფეისი',
    ar: 'واجهة بديهية'
  },
  'landing.feature.quality.title': {
    ru: 'Качество',
    en: 'Quality',
    ka: 'ხარისხი',
    ar: 'الجودة'
  },
  'landing.feature.quality.desc': {
    ru: 'Профессиональный результат',
    en: 'Professional results',
    ka: 'პროფესიონალური შედეგი',
    ar: 'نتائج مهنية'
  },
  'landing.testimonials.title': {
    ru: 'Отзывы наших клиентов',
    en: 'What our clients say',
    ka: 'რას ამბობენ ჩვენი კლიენტები',
    ar: 'ماذا يقول عملاؤنا'
  },
  'landing.testimonials.subtitle': {
    ru: 'Узнайте, что говорят о нас профессионалы рынка недвижимости',
    en: 'Hear from real estate professionals who use our product',
    ka: 'გაიგეთ რას ამბობენ უძრავი ქონების პროფესიონალები',
    ar: 'اسمع من محترفي العقارات الذين يستخدمون منتجنا'
  },
  'landing.testimonials.ratingSummary': {
    ru: '4.9/5 средняя оценка от 100+ клиентов',
    en: '4.9/5 average rating from 100+ clients',
    ka: '4.9/5 საშუალო შეფასება 100+ კლიენტისგან',
    ar: '4.9/5 متوسط التقييم من 100+ عميل'
  },
  'landing.trialBadge': {
    ru: 'Бесплатный пробный период • Без обязательств • Настройка за 5 минут',
    en: 'Free trial • No commitment • Setup in 5 minutes',
    ka: 'უფასო საცდელი • ვალდებულებების გარეშე • მონტაჟი 5 წუთში',
    ar: 'تجربة مجانية • بدون التزام • إعداد في 5 دقائق'
  },
  'footer.quickLinks': {
    ru: 'Быстрые ссылки',
    en: 'Quick links',
    ka: 'სწრაფი ბმულები',
    ar: 'روابط سريعة'
  },
  'footer.demo': {
    ru: 'Демо',
    en: 'Demo',
    ka: 'დემო',
    ar: 'عرض توضيحي'
  },
  'footer.docs': {
    ru: 'Документация',
    en: 'Documentation',
    ka: 'დოკუმენტაცია',
    ar: 'التوثيق'
  },
  'footer.support': {
    ru: 'Поддержка',
    en: 'Support',
    ka: 'მხარდაჭერა',
    ar: 'الدعم'
  },
  'footer.legal': {
    ru: 'Правовая информация',
    en: 'Legal',
    ka: 'იურიდიული ინფორმაცია',
    ar: 'قانوني'
  },
  'footer.privacy': {
    ru: 'Политика конфиденциальности',
    en: 'Privacy Policy',
    ka: 'კონფიდენციალურობის პოლიტიკა',
    ar: 'سياسة الخصوصية'
  },
  'footer.terms': {
    ru: 'Пользовательское соглашение',
    en: 'Terms of Service',
    ka: 'მომხმარებლის შეთანხმება',
    ar: 'شروط الخدمة'
  },
  'footer.cookie': {
    ru: 'Cookie Policy',
    en: 'Cookie Policy',
    ka: 'ქუქის პოლიტიკა',
    ar: 'سياسة ملفات تعريف الارتباط'
  },
  'footer.company': {
    ru: 'Компания',
    en: 'Company',
    ka: 'კომპანია',
    ar: 'الشركة'
  },
  'footer.address': {
    ru: 'Адрес',
    en: 'Address',
    ka: 'მისამართი',
    ar: 'العنوان'
  },
  'footer.email': {
    ru: 'Email',
    en: 'Email',
    ka: 'ელფოსტა',
    ar: 'البريد الإلكتروني'
  },
  'footer.craftedInGeorgia': {
    ru: 'Сделано с ❤️ в Грузии',
    en: 'Made with ❤️ in Georgia',
    ka: 'შექმნილია ❤️ საქართველოში',
    ar: 'صُنع بـ ❤️ في جورجيا'
  },

  // Legal pages
  'legal.backHome': {
    ru: 'На главную',
    en: 'Back to Home',
    ka: 'მთავარზე დაბრუნება',
    ar: 'العودة للرئيسية'
  },
  'legal.privacy.title': {
    ru: 'Политика конфиденциальности',
    en: 'Privacy Policy',
    ka: 'კონფიდენციალურობის პოლიტიკა',
    ar: 'سياسة الخصوصية'
  },
  'legal.terms.title': {
    ru: 'Пользовательское соглашение',
    en: 'Terms of Service',
    ka: 'მომხმარებლის შეთანხმება',
    ar: 'شروط الخدمة'
  },

  // Apartment details
  'apartment.details': {
    ru: 'Детали квартиры',
    en: 'Apartment details',
    ka: 'ბინის დეტალები',
    ar: 'تفاصيل الشقة'
  },
  'apartment.number': {
    ru: 'Квартира №',
    en: 'Apartment #',
    ka: 'ბინა №',
    ar: 'شقة رقم'
  },
  'apartment.floor': {
    ru: 'Этаж',
    en: 'Floor',
    ka: 'სართული',
    ar: 'الطابق'
  },
  'apartment.room': {
    ru: 'комн.',
    en: 'room',
    ka: 'ოთახი',
    ar: 'غرفة'
  },
  'apartment.studio': {
    ru: 'Студия',
    en: 'Studio',
    ka: 'სტუდია',
    ar: 'استوديو'
  },
  'apartment.area': {
    ru: 'Площадь',
    en: 'Area',
    ka: 'ფართობი',
    ar: 'المساحة'
  },
  'apartment.price': {
    ru: 'Цена',
    en: 'Price',
    ka: 'ფასი',
    ar: 'السعر'
  },
  'apartment.pricePerSqm': {
    ru: 'Цена за м²',
    en: 'Price per m²',
    ka: 'ფასი მ²-ზე',
    ar: 'السعر للمتر المربع'
  },
  'apartment.status': {
    ru: 'Статус',
    en: 'Status',
    ka: 'სტატუსი',
    ar: 'الحالة'
  },
  'apartment.sqm': {
    ru: 'м²',
    en: 'm²',
    ka: 'მ²',
    ar: 'م²'
  },
  'apartment.sold': {
    ru: 'Продано',
    en: 'Sold',
    ka: 'გაყიდული',
    ar: 'مباع'
  },
  'apartment.enter': {
    ru: 'Введите',
    en: 'Enter',
    ka: 'შეიყვანეთ',
    ar: 'أدخل'
  },
  'apartment.select': {
    ru: 'Выберите',
    en: 'Select',
    ka: 'აირჩიეთ',
    ar: 'اختر'
  },
  'apartment.notSelected': {
    ru: 'Не выбрано',
    en: 'Not selected',
    ka: 'არ არის არჩეული',
    ar: 'غير محدد'
  },
  'apartment.yes': {
    ru: 'Да',
    en: 'Yes',
    ka: 'დიახ',
    ar: 'نعم'
  },
  'apartment.no': {
    ru: 'Нет',
    en: 'No',
    ka: 'არა',
    ar: 'لا'
  },
  'apartment.additionalFields': {
    ru: 'Дополнительные поля',
    en: 'Additional Fields',
    ka: 'დამატებითი ველები',
    ar: 'حقول إضافية'
  },
  'apartment.reserved': {
    ru: 'Забронировано',
    en: 'Reserved',
    ka: 'დაჯავშნული',
    ar: 'محجوز'
  },
  'apartment.available': {
    ru: 'Доступно',
    en: 'Available',
    ka: 'ხელმისაწვდომია',
    ar: 'متاح'
  },
  'apartment.additionalInfo': {
    ru: 'Дополнительная информация',
    en: 'Additional Information',
    ka: 'დამატებითი ინფორმაცია',
    ar: 'معلومات إضافية'
  },

  // Installment Calculator
  'installment.calculator': {
    ru: 'Калькулятор рассрочки',
    en: 'Installment Calculator',
    ka: 'განვადების კალკულატორი',
    ar: 'حاسبة التقسيط'
  },
  'installment.downPayment': {
    ru: 'Первоначальный взнос',
    en: 'Down Payment',
    ka: 'პირველადი გადახდა',
    ar: 'الدفعة الأولى'
  },
  'installment.period': {
    ru: 'На',
    en: 'On',
    ka: 'და',
    ar: 'على'
  },
  'installment.low': {
    ru: 'Рассрочка 0%',
    en: 'Installment 0%',
    ka: 'განვადება 0%',
    ar: 'تقسيط 0%'
  },
  'installment.months': {
    ru: 'месяцев',
    en: 'months',
    ka: 'თვე',
    ar: 'شهور'
  },
  'installment.perMonth': {
    ru: 'месяц',
    en: 'month',
    ka: 'თვე',
    ar: 'شهر'
  },
  'installment.downPaymentFrom': {
    ru: 'Первый взнос от',
    en: 'Down payment from',
    ka: 'პირველი შენატანი დან',
    ar: 'دفعة أولى من'
  },
  'installment.month': {
    ru: 'месяц',
    en: 'month',
    ka: 'თვე',
    ar: 'شهر'
  },
  'installment.minimum': {
    ru: 'Минимум',
    en: 'Minimum',
    ka: 'მინიმუმი',
    ar: 'الحد الأدنى'
  },
  'installment.maximum': {
    ru: 'Максимум',
    en: 'Maximum',
    ka: 'მაქსიმუმი',
    ar: 'الحد الأقصى'
  },
  'installment.remainingAmount': {
    ru: 'К доплате',
    en: 'Remaining Amount',
    ka: 'დასარჩენი თანხა',
    ar: 'المبلغ المتبقي'
  },
  'installment.monthlyPayment': {
    ru: 'Ежемесячный платеж',
    en: 'Monthly Payment',
    ka: 'ყოველთვიური გადახდა',
    ar: 'الدفعة الشهرية'
  },

  // PDF Generation
  'pdf.apartmentDetails': {
    ru: 'Детали квартиры',
    en: 'Apartment Details',
    ka: 'ბინის დეტალები',
    ar: 'تفاصيل الشقة'
  },
  'pdf.apartmentNumber': {
    ru: 'Номер квартиры',
    en: 'Apartment Number',
    ka: 'ბინის ნომერი',
    ar: 'رقم الشقة'
  },
  'pdf.photos': {
    ru: 'Фотографии',
    en: 'Photos',
    ka: 'ფოტოები',
    ar: 'الصور'
  },
  'pdf.layout': {
    ru: 'Планировка',
    en: 'Layout',
    ka: 'განლაგება',
    ar: 'التخطيط'
  },
  'pdf.apartmentPhoto': {
    ru: 'Фото квартиры',
    en: 'Apartment Photo',
    ka: 'ბინის ფოტო',
    ar: 'صورة الشقة'
  },
  'pdf.generatedOn': {
    ru: 'Создано',
    en: 'Generated on',
    ka: 'შექმნილია',
    ar: 'تم إنشاؤه في'
  },
  'installment.apply': {
    ru: 'Оформить рассрочку',
    en: 'Apply for Installment',
    ka: 'განვადების გაფორმება',
    ar: 'تطبيق التقسيط'
  },
  'installment.info.noInterest': {
    ru: 'Рассрочка без процентов',
    en: 'Interest-free installment',
    ka: 'უპროცენტო განვადება',
    ar: 'تقسيط بدون فوائد'
  },
  'installment.info.earlyPayment': {
    ru: 'Возможность досрочного погашения',
    en: 'Early payment option available',
    ka: 'ადრეული გადახდის შესაძლებლობა',
    ar: 'خيار الدفع المبكر متاح'
  },
  'installment.info.contactManager': {
    ru: 'Для оформления обратитесь к менеджеру',
    en: 'Contact manager to apply',
    ka: 'გაფორმებისთვის დაუკავშირდით მენეჯერს',
    ar: 'اتصل بالمدير للتقديم'
  },

  // Project Editor - Installment Settings
  'projectEditor.installmentSettings': {
    ru: 'Настройки рассрочки',
    en: 'Installment Settings',
    ka: 'განვადების პარამეტრები',
    ar: 'إعدادات التقسيط'
  },
  'projectEditor.enableInstallment': {
    ru: 'Включить рассрочку',
    en: 'Enable Installment',
    ka: 'განვადების ჩართვა',
    ar: 'تفعيل التقسيط'
  },
  'projectEditor.minDownPaymentPercent': {
    ru: 'Минимальный первый взнос (%)',
    en: 'Minimum Down Payment (%)',
    ka: 'მინიმალური პირველადი გადახდა (%)',
    ar: 'الحد الأدنى للدفعة الأولى (%)'
  },
  'projectEditor.minDownPaymentDesc': {
    ru: 'Минимальный процент от стоимости квартиры для первого взноса',
    en: 'Minimum percentage of apartment price for down payment',
    ka: 'ბინის ღირებულების მინიმალური პროცენტი პირველადი გადახდისთვის',
    ar: 'الحد الأدنى من النسبة المئوية لسعر الشقة للدفعة الأولى'
  },
  'projectEditor.maxInstallmentMonths': {
    ru: 'Максимальный срок рассрочки (месяцы)',
    en: 'Maximum Installment Period (months)',
    ka: 'განვადების მაქსიმალური ვადა (თვე)',
    ar: 'الحد الأقصى لفترة التقسيط (شهور)'
  },
  'projectEditor.maxInstallmentMonthsDesc': {
    ru: 'Максимальное количество месяцев для рассрочки',
    en: 'Maximum number of months for installment payments',
    ka: 'განვადების გადახდების მაქსიმალური თვეების რაოდენობა',
    ar: 'الحد الأقصى لعدد الشهور لدفعات التقسيط'
  },
  'apartment.apartment': {
    ru: 'квартира',
    en: 'apartment',
    ka: 'ბინა',
    ar: 'شقة'
  },
  'apartment.apartments': {
    ru: 'квартир',
    en: 'apartments',
    ka: 'ბინები',
    ar: 'شقق'
  },

  // Project listings
  'project.notFoundApartments': {
    ru: 'По вашим критериям квартиры не найдены',
    en: 'No apartments found matching your criteria',
    ka: 'თქვენი კრიტერიუმების მიხედვით ბინები ვერ მოიძებნა',
    ar: 'لم يتم العثور على شقق تطابق معاييرك'
  },
  'project.changeFilters': {
    ru: 'Попробуйте изменить фильтры поиска',
    en: 'Try changing your search filters',
    ka: 'სცადეთ ძებნის ფილტრების შეცვლა',
    ar: 'حاول تغيير فلاتر البحث'
  },
  'project.found': {
    ru: 'Найдено',
    en: 'Found',
    ka: 'ნაპოვნია',
    ar: 'تم العثور على'
  },
  'project.floorPlan': {
    ru: 'План этажа',
    en: 'Floor Plan',
    ka: 'სართულის გეგმა',
    ar: 'مخطط الطابق'
  },
  'project.table': {
    ru: 'Таблица',
    en: 'Table',
    ka: 'ცხრილი',
    ar: 'جدول'
  },
  'project.onlyAvailable': {
    ru: 'Только доступные',
    en: 'Only available',
    ka: 'მხოლოდ ხელმისაწვდომი',
    ar: 'المتاح فقط'
  },
  'project.apartmentNumber': {
    ru: 'Номер квартиры',
    en: 'Apartment number',
    ka: 'ბინის ნომერი',
    ar: 'رقم الشقة'
  },
  'project.notFound': {
    ru: 'Проект не найден',
    en: 'Project not found',
    ka: 'პროექტი ვერ მოიძებნა',
    ar: 'المشروع غير موجود'
  },
  'project.invalidId': {
    ru: 'Неверный идентификатор проекта',
    en: 'Invalid project identifier',
    ka: 'არასწორი პროექტის იდენტიფიკატორი',
    ar: 'معرف المشروع غير صحيح'
  },
  'project.summary': {
    ru: 'Сводка',
    en: 'Summary',
    ka: 'შეჯამება',
    ar: 'ملخص'
  },
  'project.allFloors': {
    ru: 'Все этажи',
    en: 'All floors',
    ka: 'ყველა სართული',
    ar: 'جميع الطوابق'
  },
  'project.allTypes': {
    ru: 'Все типы',
    en: 'All types',
    ka: 'ყველა ტიპი',
    ar: 'جميع الأنواع'
  },

  // Projects Gallery
  'gallery.title': {
    ru: 'Наши проекты',
    en: 'Our Projects',
    ka: 'ჩვენი პროექტები',
    ar: 'مشاريعنا'
  },
  'gallery.subtitle': {
    ru: 'Выберите подходящий жилой комплекс',
    en: 'Choose the right residential complex',
    ka: 'აირჩიეთ შესაფერისი საცხოვრებელი კომპლექსი',
    ar: 'اختر المجمع السكني المناسب'
  },
  'gallery.search': {
    ru: 'Поиск',
    en: 'Search',
    ka: 'ძებნა',
    ar: 'بحث'
  },
  'gallery.searchPlaceholder': {
    ru: 'Название или адрес...',
    en: 'Name or address...',
    ka: 'სახელი ან მისამართი...',
    ar: 'الاسم أو العنوان...'
  },
  'gallery.city': {
    ru: 'Город',
    en: 'City',
    ka: 'ქალაქი',
    ar: 'المدينة'
  },
  'gallery.allCities': {
    ru: 'Все города',
    en: 'All cities',
    ka: 'ყველა ქალაქი',
    ar: 'جميع المدن'
  },
  'gallery.status': {
    ru: 'Статус',
    en: 'Status',
    ka: 'სტატუსი',
    ar: 'الحالة'
  },
  'gallery.allStatuses': {
    ru: 'Все статусы',
    en: 'All statuses',
    ka: 'ყველა სტატუსი',
    ar: 'جميع الحالات'
  },
  'gallery.onSale': {
    ru: 'В продаже',
    en: 'On sale',
    ka: 'გაყიდვაში',
    ar: 'للبيع'
  },
  'gallery.soldOut': {
    ru: 'Распроданы',
    en: 'Sold out',
    ka: 'გაყიდული',
    ar: 'نفدت'
  },
  'gallery.cost': {
    ru: 'Стоимость',
    en: 'Cost',
    ka: 'ღირებულება',
    ar: 'التكلفة'
  },
  'gallery.anyCost': {
    ru: 'Любая стоимость',
    en: 'Any cost',
    ka: 'ნებისმიერი ღირებულება',
    ar: 'أي تكلفة'
  },
  'gallery.upTo5M': {
    ru: 'до 5 млн',
    en: 'up to 5M',
    ka: '5მ-მდე',
    ar: 'حتى 5 مليون'
  },
  'gallery.from5To10M': {
    ru: '5-10 млн',
    en: '5-10M',
    ka: '5-10მ',
    ar: '5-10 مليون'
  },
  'gallery.from10M': {
    ru: 'от 10 млн',
    en: 'from 10M',
    ka: '10მ-დან',
    ar: 'من 10 مليون'
  },
  'gallery.priceRange': {
    ru: 'Цена',
    en: 'Price',
    ka: 'ფასი',
    ar: 'السعر'
  },
  'gallery.resetFilters': {
    ru: 'Сбросить фильтры',
    en: 'Reset filters',
    ka: 'ფილტრების გადატვირთვა',
    ar: 'إعادة تعيين التصفيات'
  },
  'gallery.hideFilters': {
    ru: 'Скрыть фильтры',
    en: 'Hide filters',
    ka: 'ფილტრების დამალვა',
    ar: 'إخفاء التصفيات'
  },
  'gallery.foundCount': {
    ru: 'Найдено',
    en: 'Found',
    ka: 'ნაპოვნია',
    ar: 'تم العثور على'
  },
  'gallery.viewAllApartments': {
    ru: 'Смотреть все апартаменты',
    en: 'View all apartments',
    ka: 'ყველა ბინის ნახვა',
    ar: 'عرض جميع الشقق'
  },
  'gallery.installment0': {
    ru: 'Рассрочка 0%',
    en: 'Installment 0%',
    ka: 'განვადება 0%',
    ar: 'تقسيط 0%'
  },
  'gallery.downPayment': {
    ru: 'первый взнос от 5%',
    en: 'down payment from 5%',
    ka: 'პირველი გადახდა 5%-დან',
    ar: 'الدفعة الأولى من 5%'
  },
  'gallery.salesStart': {
    ru: 'Старт продаж',
    en: 'Sales start',
    ka: 'გაყიდვების დაწყება',
    ar: 'بداية المبيعات'
  },
  'gallery.floors': {
    ru: 'этажей',
    en: 'floors',
    ka: 'სართული',
    ar: 'طوابق'
  },
  'gallery.apartments': {
    ru: 'квартир',
    en: 'apartments',
    ka: 'ბინა',
    ar: 'شقق'
  },
  'gallery.from': {
    ru: 'от',
    en: 'from',
    ka: '-დან',
    ar: 'من'
  },
  'gallery.available': {
    ru: 'доступно',
    en: 'available',
    ka: 'ხელმისაწვდომია',
    ar: 'متاح'
  },
  'gallery.open': {
    ru: 'Открыть',
    en: 'Open',
    ka: 'გახსნა',
    ar: 'فتح'
  },
  'gallery.noProjects': {
    ru: 'Проекты не найдены',
    en: 'No projects found',
    ka: 'პროექტები ვერ მოიძებნა',
    ar: 'لم يتم العثور على مشاريع'
  },
  'gallery.changeSearchCriteria': {
    ru: 'Попробуйте изменить критерии поиска',
    en: 'Try changing search criteria',
    ka: 'სცადეთ ძებნის კრიტერიუმების შეცვლა',
    ar: 'حاول تغيير معايير البحث'
  },

  // Admin Dashboard
  'admin.back': {
    ru: 'Назад',
    en: 'Back',
    ka: 'უკან',
    ar: 'رجوع'
  },
  'admin.dashboard': {
    ru: 'Панель управления',
    en: 'Admin Dashboard',
    ka: 'ადმინისტრაციული პანელი',
    ar: 'لوحة الإدارة'
  },
  'admin.dashboardDescription': {
    ru: 'Управление проектами и настройками',
    en: 'Manage projects and settings',
    ka: 'პროექტების და პარამეტრების მართვა',
    ar: 'إدارة المشاريع والإعدادات'
  },
  'admin.projects': {
    ru: 'Проекты',
    en: 'Projects',
    ka: 'პროექტები',
    ar: 'المشاريع'
  },
  'admin.widgets': {
    ru: 'Виджеты',
    en: 'Widgets',
    ka: 'ვიჯეტები',
    ar: 'الودجات'
  },
  'admin.analytics': {
    ru: 'Аналитика',
    en: 'Analytics',
    ka: 'ანალიტიკა',
    ar: 'التحليلات'
  },
  'admin.settings': {
    ru: 'Настройки',
    en: 'Settings',
    ka: 'პარამეტრები',
    ar: 'الإعدادات'
  },
  'admin.analyticsDescription': {
    ru: 'Статистика по проектам и квартирам',
    en: 'Statistics on projects and apartments',
    ka: 'სტატისტიკა პროექტებისა და ბინების შესახებ',
    ar: 'إحصائيات المشاريع والشقق'
  },
  'admin.analyticsComingSoon': {
    ru: 'Функция аналитики будет добавлена позже',
    en: 'Analytics feature will be added later',
    ka: 'ანალიტიკის ფუნქცია მოგვიანებით დაემატება',
    ar: 'ستتم إضافة ميزة التحليلات لاحقاً'
  },

  // Project List
  'projectList.noProjects': {
    ru: 'Нет проектов',
    en: 'No projects',
    ka: 'პროექტები არ არის',
    ar: 'لا توجد مشاريع'
  },
  'projectList.createFirstDescription': {
    ru: 'Создайте свой первый проект недвижимости с интерактивными планами этажей и квартир',
    en: 'Create your first real estate project with interactive floor and apartment plans',
    ka: 'შექმენით თქვენი პირველი უძრავი ქონების პროექტი ინტერაქტიული სართულისა და ბინების გეგმებით',
    ar: 'أنشئ مشروعك العقاري الأول مع مخططات الطوابق والشقق التفاعلية'
  },
  'projectList.createFirst': {
    ru: 'Создать первый проект',
    en: 'Create first project',
    ka: 'პირველი პროექტის შექმნა',
    ar: 'إنشاء المشروع الأول'
  },
  'projectList.createNew': {
    ru: 'Создать проект',
    en: 'Create project',
    ka: 'პროექტის შექმნა',
    ar: 'إنشاء مشروع'
  },
  'projectList.projects': {
    ru: 'Проекты',
    en: 'Projects',
    ka: 'პროექტები',
    ar: 'المشاريع'
  },
  'projectList.manageDescription': {
    ru: 'Управление проектами недвижимости',
    en: 'Manage real estate projects',
    ka: 'უძრავი ქონების პროექტების მართვა',
    ar: 'إدارة مشاريع العقارات'
  },

  // Embed Projects Page
  'embed.title': {
    ru: 'Проекты недвижимости',
    en: 'Real Estate Projects',
    ka: 'უძრავი ქონების პროექტები',
    ar: 'مشاريع العقارات'
  },
  'embed.subtitle': {
    ru: 'Выберите проект для просмотра доступных квартир',
    en: 'Select a project to view available apartments',
    ka: '아이რჩიეთ პროექტი ხელმისაწვდომი ბინების სანახავად',
    ar: 'اختر مشروعاً لعرض الشقق المتاحة'
  },
  'embed.noProjects': {
    ru: 'Проекты не найдены',
    en: 'No projects found',
    ka: 'პროექტები ვერ მოიძებნა',
    ar: 'لم يتم العثور على مشاريع'
  },
  'embed.floors': {
    ru: 'Этажей',
    en: 'Floors',
    ka: 'სართულები',
    ar: 'طوابق'
  },
  'embed.viewApartments': {
    ru: 'Посмотреть квартиры',
    en: 'View apartments',
    ka: 'ბინების ნახვა',
    ar: 'عرض الشقق'
  },

  // Project Creation Modal
  'modal.createProject': {
    ru: 'Создать новый проект',
    en: 'Create new project',
    ka: 'ახალი პროექტის შექმნა',
    ar: 'إنشاء مشروع جديد'
  },
  'modal.chooseMethod': {
    ru: 'Выберите способ создания проекта',
    en: 'Choose project creation method',
    ka: 'აირჩიეთ პროექტის შექმნის მეთოდი',
    ar: 'اختر طريقة إنشاء المشروع'
  },
  'modal.manualSetup': {
    ru: 'Ручная настройка',
    en: 'Manual setup',
    ka: 'ხელით კონფიგურაცია',
    ar: 'إعداد يدوي'
  },
  'modal.manualSetupDesc': {
    ru: 'Создать проект с нуля и настроить все самостоятельно',
    en: 'Create project from scratch and configure everything manually',
    ka: 'შექმენით პროექტი ნულიდან და ყველაფერი ხელით კონფიგურაცია',
    ar: 'أنشئ مشروعاً من الصفر واضبط كل شيء يدوياً'
  },
  'modal.startManual': {
    ru: 'Начать ручное создание',
    en: 'Start manual creation',
    ka: 'ხელით შექმნის დაწყება',
    ar: 'بدء الإنشاء اليدوي'
  },
  'modal.importExcel': {
    ru: 'Импорт из Excel',
    en: 'Import from Excel',
    ka: 'Excel-იდან იმპორტი',
    ar: 'استيراد من Excel'
  },
  'modal.importExcelDesc': {
    ru: 'Загрузить Excel файл с данными квартир и автоматически создать проект',
    en: 'Upload Excel file with apartment data and automatically create project',
    ka: 'ატვირთეთ Excel ფაილი ბინების მონაცემებით და ავტომატურად შექმენით პროექტი',
    ar: 'قم بتحميل ملف Excel ببيانات الشقق وإنشاء المشروع تلقائياً'
  },

  // Project Editor
  'projectEditor.newProject': {
    ru: 'Новый проект',
    en: 'New project',
    ka: 'ახალი პროექტი',
    ar: 'مشروع جديد'
  },
  'projectEditor.editProject': {
    ru: 'Редактирование проекта',
    en: 'Edit project',
    ka: 'პროექტის რედაქტირება',
    ar: 'تعديل المشروع'
  },
  'projectEditor.createNewProject': {
    ru: 'Создание нового проекта',
    en: 'Creating new project',
    ka: 'ახალი პროექტის შექმნა',
    ar: 'إنشاء مشروع جديد'
  },
  'projectEditor.projectNameRequired': {
    ru: 'Название проекта обязательно',
    en: 'Project name is required',
    ka: 'პროექტის სახელი საჭიროა',
    ar: 'اسم المشروع مطلوب'
  },
  'projectEditor.authRequired': {
    ru: 'Необходима авторизация для работы с проектом',
    en: 'Authentication required to work with project',
    ka: 'პროექტთან მუშაობისთვის ავტორიზაცია საჭიროა',
    ar: 'المصادقة مطلوبة للعمل مع المشروع'
  },
  'projectEditor.authRequiredCreate': {
    ru: 'Необходима авторизация для создания проекта',
    en: 'Authentication required to create project',
    ka: 'პროექტის შექმნისთვის ავტორიზაცია საჭიროა',
    ar: 'المصادقة مطلوبة لإنشاء مشروع'
  },
  'projectEditor.authRequiredEdit': {
    ru: 'Необходима авторизация для редактирования проекта',
    en: 'Authentication required to edit project',
    ka: 'პროექტის რედაქტირებისთვის ავტორიზაცია საჭიროა',
    ar: 'المصادقة مطلوبة لتعديل المشروع'
  },
  'projectEditor.projectCreated': {
    ru: 'Проект создан',
    en: 'Project created',
    ka: 'პროექტი შეიქმნა',
    ar: 'تم إنشاء المشروع'
  },
  'projectEditor.projectSaved': {
    ru: 'Проект сохранен',
    en: 'Project saved',
    ka: 'პროექტი შენახულია',
    ar: 'تم حفظ المشروع'
  },
  'projectEditor.errorLoading': {
    ru: 'Ошибка загрузки проекта',
    en: 'Error loading project',
    ka: 'პროექტის ჩატვირთვის შეცდომა',
    ar: 'خطأ في تحميل المشروع'
  },
  'projectEditor.errorSaving': {
    ru: 'Ошибка сохранения проекта',
    en: 'Error saving project',
    ka: 'პროექტის შენახვის შეცდომა',
    ar: 'خطأ في حفظ المشروع'
  },
  'projectEditor.accessDenied': {
    ru: 'Доступ запрещен',
    en: 'Access denied',
    ka: 'წვდომა უარყოფილია',
    ar: 'تم رفض الوصول'
  },
  'projectEditor.noEditRights': {
    ru: 'У вас нет прав на редактирование этого проекта',
    en: 'You do not have permission to edit this project',
    ka: 'ამ პროექტის რედაქტირების უფლება არ გაქვთ',
    ar: 'ليست لديك صلاحية لتعديل هذا المشروع'
  },
  'projectEditor.back': {
    ru: 'Назад',
    en: 'Back',
    ka: 'უკან',
    ar: 'رجوع'
  },
  'projectEditor.save': {
    ru: 'Сохранить',
    en: 'Save',
    ka: 'შენახვა',
    ar: 'حفظ'
  },
  'projectEditor.saving': {
    ru: 'Сохранение...',
    en: 'Saving...',
    ka: 'შენახვა...',
    ar: 'جار الحفظ...'
  },
  'projectEditor.basicInfo': {
    ru: 'Основная информация',
    en: 'Basic information',
    ka: 'ძირითადი ინფორმაცია',
    ar: 'معلومات أساسية'
  },
  'projectEditor.projectName': {
    ru: 'Название проекта',
    en: 'Project name',
    ka: 'პროექტის სახელი',
    ar: 'اسم المشروع'
  },
  'projectEditor.description': {
    ru: 'Описание',
    en: 'Description',
    ka: 'აღწერა',
    ar: 'الوصف'
  },
  'projectEditor.address': {
    ru: 'Адрес',
    en: 'Address',
    ka: 'მისამართი',
    ar: 'العنوان'
  },
  'projectEditor.floors': {
    ru: 'Количество этажей',
    en: 'Number of floors',
    ka: 'სართულების რაოდენობა',
    ar: 'عدد الطوابق'
  },
  'projectEditor.hasParking': {
    ru: 'Паркинг',
    en: 'Parking',
    ka: 'პარკინგი',
    ar: 'مواقف سيارات'
  },
  'projectEditor.hasCommercial': {
    ru: 'Коммерческие помещения',
    en: 'Commercial spaces',
    ka: 'კომერციული ფართები',
    ar: 'مساحات تجارية'
  },
  'projectEditor.buildingImage': {
    ru: 'Изображение здания',
    en: 'Building image',
    ka: 'შენობის სურათი',
    ar: 'صورة المبنى'
  },
  'projectEditor.floorPlan': {
    ru: 'План этажа',
    en: 'Floor plan',
    ka: 'სართულის გეგმა',
    ar: 'مخطط الطابق'
  },
  'projectEditor.floor': {
    ru: 'Этаж',
    en: 'Floor',
    ka: 'სართული',
    ar: 'الطابق'
  },
  'projectEditor.floorPlanDesc': {
    ru: 'Планировка {floor} этажа',
    en: 'Floor {floor} layout',
    ka: 'სართული {floor} განლაგება',
    ar: 'تخطيط الطابق {floor}'
  },
  'projectEditor.plan': {
    ru: 'План',
    en: 'Plan',
    ka: 'გეგმა',
    ar: 'المخطط'
  },

  // Project Editor - PDF presentation
  'projectEditor.pdfPresentation': {
    ru: 'PDF презентация',
    en: 'PDF presentation',
    ka: 'PDF პრეზენტაცია',
    ar: 'عرض PDF'
  },
  'projectEditor.pdfUploaded': {
    ru: 'PDF загружен',
    en: 'PDF uploaded',
    ka: 'PDF აიტვირთა',
    ar: 'تم رفع ملف PDF'
  },
  'projectEditor.view': {
    ru: 'Просмотр',
    en: 'View',
    ka: 'ნახვა',
    ar: 'عرض'
  },
  'projectEditor.pdfPresentationDesc': {
    ru: 'Загрузите PDF-презентацию проекта',
    en: 'Upload project PDF presentation',
    ka: 'ატვირთეთ პროექტის PDF პრეზენტაცია',
    ar: 'قم بتحميل عرض المشروع بصيغة PDF'
  },
  'projectEditor.uploading': {
    ru: 'Загрузка...',
    en: 'Uploading...',
    ka: 'იტვირთება...',
    ar: 'جار الرفع...'
  },
  'projectEditor.uploadPdf': {
    ru: 'Загрузить PDF',
    en: 'Upload PDF',
    ka: 'PDF ატვირთვა',
    ar: 'رفع PDF'
  },
  'projectEditor.saveProjectFirstNote': {
    ru: 'Сначала сохраните проект',
    en: 'Save the project first',
    ka: 'ჯერ შეინახეთ პროექტი',
    ar: 'احفظ المشروع أولاً'
  },
  'projectEditor.saveProjectFirst': {
    ru: 'Сначала сохраните проект',
    en: 'Please save the project first',
    ka: 'ჯერ შეინახეთ პროექტი',
    ar: 'يرجى حفظ المشروع أولاً'
  },
  'projectEditor.onlyPdfAllowed': {
    ru: 'Разрешены только PDF файлы',
    en: 'Only PDF files are allowed',
    ka: 'მხოლოდ PDF ფაილებია დაშვებული',
    ar: 'يُسمح بملفات PDF فقط'
  },
  'projectEditor.fileTooLarge': {
    ru: 'Файл слишком большой (макс. 10 МБ)',
    en: 'File is too large (max 10MB)',
    ka: 'ფაილი ძალიან დიდია (მაქს. 10MB)',
    ar: 'الملف كبير جداً (الحد الأقصى 10 ميجابايت)'
  },
  'projectEditor.save&continue': {
    ru: 'Сохранить и продолжить',
    en: 'Save and continue',
    ka: 'შეინახოთ და გაგაგრძელოთ',
    ar: 'احفظ و استمر'
  },
  'projectEditor.pdfUploadSuccess': {
    ru: 'PDF успешно загружен',
    en: 'PDF uploaded successfully',
    ka: 'PDF წარმატებით აიტვირთა',
    ar: 'تم رفع PDF بنجاح'
  },
  'projectEditor.pdfUploadError': {
    ru: 'Ошибка загрузки PDF',
    en: 'Error uploading PDF',
    ka: 'PDF ატვირთვის შეცდომა',
    ar: 'خطأ في رفع PDF'
  },
  'projectEditor.pdfRemoveSuccess': {
    ru: 'PDF удалён',
    en: 'PDF removed',
    ka: 'PDF წაიშალა',
    ar: 'تم حذف PDF'
  },
  'projectEditor.pdfRemoveError': {
    ru: 'Ошибка удаления PDF',
    en: 'Error removing PDF',
    ka: 'PDF წაშლის შეცდომა',
    ar: 'خطأ في حذف PDF'
  },

  // Project List
  'projectList.deleteConfirm': {
    ru: 'Вы уверены, что хотите удалить проект "{name}"?',
    en: 'Are you sure you want to delete project "{name}"?',
    ka: 'დარწმუნებული ხართ, რომ გსურთ პროექტის "{name}" წაშლა?',
    ar: 'هل أنت متأكد أنك تريد حذف المشروع "{name}"؟'
  },
  'projectList.projectDeleted': {
    ru: 'Проект удален',
    en: 'Project deleted',
    ka: 'პროექტი წაშლილია',
    ar: 'تم حذف المشروع'
  },
  'projectList.errorDeleting': {
    ru: 'Ошибка удаления проекта',
    en: 'Error deleting project',
    ka: 'პროექტის წაშლის შეცდომა',
    ar: 'خطأ في حذف المشروع'
  },
  'projectList.errorLoading': {
    ru: 'Ошибка загрузки проектов',
    en: 'Error loading projects',
    ka: 'პროექტების ჩატვირთვის შეცდომა',
    ar: 'خطأ في تحميل المشاريع'
  },
  'projectList.timeoutError': {
    ru: 'Загрузка проектов заняла слишком много времени',
    en: 'Loading projects took too long',
    ka: 'პროექტების ჩატვირთვას ძალიან დიდი დრო დასჭირდა',
    ar: 'استغرق تحميل المشاريع وقتاً طويلاً'
  },
  'projectList.authRequired': {
    ru: 'Необходима авторизация',
    en: 'Authentication required',
    ka: 'ავტორიზაცია საჭიროა',
    ar: 'المصادقة مطلوبة'
  },
  'projectList.viewProject': {
    ru: 'Посмотреть проект',
    en: 'View project',
    ka: 'პროექტის ნახვა',
    ar: 'عرض المشروع'
  },
  'projectList.editProject': {
    ru: 'Редактировать проект',
    en: 'Edit project',
    ka: 'პროექტის რედაქტირება',
    ar: 'تعديل المشروع'
  },
  'projectList.deleteProject': {
    ru: 'Удалить проект',
    en: 'Delete project',
    ka: 'პროექტის წაშლა',
    ar: 'حذف المشروع'
  },
  'projectList.copyWidgetCode': {
    ru: 'Копировать код виджета',
    en: 'Copy widget code',
    ka: 'ვიჯეტის კოდის კოპირება',
    ar: 'نسخ كود الودجت'
  },
  'projectList.widgetCodeCopied': {
    ru: 'Код виджета скопирован',
    en: 'Widget code copied',
    ka: 'ვიჯეტის კოდი კოპირებულია',
    ar: 'تم نسخ كود الودجت'
  },
  'projectList.created': {
    ru: 'Создан',
    en: 'Created',
    ka: 'შეიქმნა',
    ar: 'تم الإنشاء'
  },
  'projectList.updated': {
    ru: 'Обновлен',
    en: 'Updated',
    ka: 'განახლებულია',
    ar: 'تم التحديث'
  },
  'projectList.floors': {
    ru: 'Этажей',
    en: 'Floors',
    ka: 'სართულები',
    ar: 'طوابق'
  },
  'projectList.apartments': {
    ru: 'Квартир',
    en: 'Apartments',
    ka: 'ბინები',
    ar: 'شقق'
  },

  // Admin Widgets
  'adminWidgets.embedCode': {
    ru: 'Код для вставки',
    en: 'Embed code',
    ka: 'ჩასასმელი კოდი',
    ar: 'كود التضمين'
  },
  'adminWidgets.embedCodeDesc': {
    ru: 'Скопируйте этот код и вставьте на ваш сайт',
    en: 'Copy this code and paste it on your website',
    ka: 'დააკოპირეთ ეს კოდი და ჩასვით თქვენს საიტზე',
    ar: 'انسخ هذا الكود والصقه في موقعك'
  },
  'adminWidgets.width': {
    ru: 'Ширина',
    en: 'Width',
    ka: 'სიგანე',
    ar: 'العرض'
  },
  'adminWidgets.height': {
    ru: 'Высота',
    en: 'Height',
    ka: 'სიმაღლე',
    ar: 'الارتفاع'
  },
  'adminWidgets.selectProject': {
    ru: 'Выберите проект',
    en: 'Select project',
    ka: 'აირჩიეთ პროექტი',
    ar: 'اختر مشروعاً'
  },
  'adminWidgets.allProjects': {
    ru: 'Все проекты (галерея)',
    en: 'All projects (gallery)',
    ka: 'ყველა პროექტი (გალერეა)',
    ar: 'كل المشاريع (معرض)'
  },
  'adminWidgets.copyCode': {
    ru: 'Копировать код',
    en: 'Copy code',
    ka: 'კოდის კოპირება',
    ar: 'نسخ الكود'
  },
  'adminWidgets.codeCopied': {
    ru: 'Код скопирован в буфер обмена',
    en: 'Code copied to clipboard',
    ka: 'კოდი კოპირებულია ბუფერში',
    ar: 'تم نسخ الكود إلى الحافظة'
  },
  'adminWidgets.preview': {
    ru: 'Предварительный просмотр',
    en: 'Preview',
    ka: 'წინასწარი ნახვა',
    ar: 'معاينة'
  },
  'adminWidgets.loading': {
    ru: 'Загрузка...',
    en: 'Loading...',
    ka: 'ჩატვირთვა...',
    ar: 'جار التحميل...'
  },
  'adminWidgets.links': {
    ru: 'Прямые ссылки',
    en: 'Direct links',
    ka: 'პირდაპირი ბმულები',
    ar: 'روابط مباشرة'
  },
  'adminWidgets.linksDesc': {
    ru: 'Используйте эти ссылки для прямого доступа к виджетам',
    en: 'Use these links to access the widgets directly',
    ka: 'ვიჯეტების პირდაპირი წვდომისთვის გამოიყენეთ ეს ბმულები',
    ar: 'استخدم هذه الروابط للوصول إلى الودجات مباشرة'
  },
  'adminWidgets.selectedProject': {
    ru: 'Выбранный проект',
    en: 'Selected project',
    ka: 'აირჩილა პროექტი',
    ar: 'المشروع المحدد'
  },
  'adminWidgets.allProjectsDesc': {
    ru: 'Галерея всех проектов',
    en: 'Gallery of all projects',
    ka: 'ყველა პროექტის გალერეა',
    ar: 'معرض كل المشاريع'
  },

  // Interactive Map
  'map.loading': {
    ru: 'Загрузка карты...',
    en: 'Loading map...',
    ka: 'რუკის ჩატვირთვა...',
    ar: 'جارٍ تحميل الخريطة...'
  },
  'map.noProjects': {
    ru: 'Нет проектов для отображения',
    en: 'No projects to display',
    ka: 'საჩვენებელი პროექტები არ არის',
    ar: 'لا توجد مشاريع لعرضها'
  },
  'map.viewProject': {
    ru: 'Посмотреть проект',
    en: 'View project',
    ka: 'პროექტის ნახვა',
    ar: 'عرض المشروع'
  },
  'map.projectInfo': {
    ru: 'Информация о проекте',
    en: 'Project information',
    ka: 'პროექტის ინფორმაცია',
    ar: 'معلومات المشروع'
  },

  // Embed Pages
  'embed.userNotFound': {
    ru: 'Пользователь не найден',
    en: 'User not found',
    ka: 'მომხმარებელი ვერ მოიძებნა',
    ar: 'المستخدم غير موجود'
  },
  'embed.userNotFoundDesc': {
    ru: 'Указанный пользователь не существует или не имеет публичных проектов.',
    en: 'The specified user does not exist or has no public projects.',
    ka: 'მითითებული მომხმარებელი არ არსებობს ან არ აქვს საჯარო პროექტები.',
    ar: 'المستخدم المحدد غير موجود أو ليس لديه مشاريع عامة.'
  },
  'embed.projects': {
    ru: 'Проекты ({count})',
    en: 'Projects ({count})',
    ka: 'პროექტები ({count})',
    ar: 'المشاريع ({count})'
  },
  'embed.onMap': {
    ru: 'На карте',
    en: 'On map',
    ka: 'რუკაზე',
    ar: 'على الخريطة'
  },
  'embed.listView': {
    ru: 'Список',
    en: 'List view',
    ka: 'სიის ხედი',
    ar: 'عرض القائمة'
  },
  'embed.resetFilters': {
    ru: 'Сбросить фильтры',
    en: 'Reset filters',
    ka: 'ფილტრების გაუქმება',
    ar: 'إعادة تعيين التصفيات'
  },

  // Admin Widgets (additional)
  'adminWidgets.title': {
    ru: 'Виджеты',
    en: 'Widgets',
    ka: 'ვიჯეტები',
    ar: 'الودجات'
  },
  'adminWidgets.description': {
    ru: 'Создание и настройка встраиваемых виджетов для ваших проектов',
    en: 'Create and configure embeddable widgets for your projects',
    ka: 'თქვენი პროექტებისთვის ჩასასმელი ვიჯეტების შექმნა და კონფიგურაცია',
    ar: 'إنشاء وتكوين الودجات القابلة للتضمين لمشاريعك'
  },
  'adminWidgets.settings': {
    ru: 'Настройки виджета',
    en: 'Widget settings',
    ka: 'ვიჯეტის პარამეტრები',
    ar: 'إعدادات الودجت'
  },
  'adminWidgets.settingsDesc': {
    ru: 'Выберите проект и настройте параметры виджета',
    en: 'Select project and configure widget parameters',
    ka: 'აირჩიეთ პროექტი და დააკონფიგურირეთ ვიჯეტის პარამეტრები',
    ar: 'اختر مشروعاً واضبط إعدادات الودجت'
  },
  // Project Editor (additional)
  'projectEditor.photos': {
    ru: 'Фото',
    en: 'Photos',
    ka: 'ფოტოები',
    ar: 'الصور'
  },
  'projectEditor.latitude': {
    ru: 'Широта (latitude)',
    en: 'Latitude',
    ka: 'განედი',
    ar: 'خط العرض'
  },
  'projectEditor.longitude': {
    ru: 'Долгота (longitude)',
    en: 'Longitude',
    ka: 'გრძედი',
    ar: 'خط الطول'
  },
  'projectEditor.latitudePlaceholder': {
    ru: 'Например: 41.6967',
    en: 'Example: 41.6967',
    ka: 'მაგალითი: 41.6967',
    ar: 'مثال: 41.6967'
  },
  'projectEditor.longitudePlaceholder': {
    ru: 'Например: 44.7896',
    en: 'Example: 44.7896',
    ka: 'მაგალითი: 44.7896',
    ar: 'مثال: 44.7896'
  },
  'projectEditor.latitudeExample': {
    ru: 'Пример: 41.6967 (Тбилиси)',
    en: 'Example: 41.6967 (Tbilisi)',
    ka: 'მაგალითი: 41.6967 (თბილისი)',
    ar: 'مثال: 41.6967 (تبليسي)'
  },
  'projectEditor.longitudeExample': {
    ru: 'Пример: 44.7896 (Тбилиси)',
    en: 'Example: 44.7896 (Tbilisi)',
    ka: 'მაგალითი: 44.7896 (თბილისი)',
    ar: 'مثال: 44.7896 (تبليسي)'
  },
  'projectEditor.floorPlans': {
    ru: 'Планы этажей',
    en: 'Floor plans',
    ka: 'სართულების გეგმები',
    ar: 'مخططات الطوابق'
  },
  'projectEditor.floorPlansDesc': {
    ru: 'Управление планировками этажей. Нажмите на этаж для редактирования.',
    en: 'Manage floor layouts. Click on a floor to edit.',
    ka: 'სართულების განლაგების მართვა. რედაქტირებისთვის დააჭირეთ სართულს.',
    ar: 'إدارة مخططات الطوابق. انقر على طابق للتحرير.'
  },
  'projectEditor.currency': {
    ru: 'Валюта',
    en: 'Currency',
    ka: 'ვალუტა',
    ar: 'العملة'
  },
  'projectEditor.currencyDesc': {
    ru: 'Выберите валюту для отображения цен в проекте',
    en: 'Select currency for displaying prices in the project',
    ka: 'აირჩიეთ ვალუტა პროექტში ფასების საჩვენებლად',
    ar: 'اختر العملة لعرض الأسعار في المشروع'
  },
  'projectEditor.fields': {
    ru: 'Поля',
    en: 'Fields',
    ka: 'ველები',
    ar: 'الحقول'
  },

  // Currencies
  'currency.rub': {
    ru: 'Российский рубль (₽)',
    en: 'Russian Ruble (₽)',
    ka: 'რუსული რუბლი (₽)',
    ar: 'الروبل الروسي (₽)'
  },
  'currency.usd': {
    ru: 'Доллар США ($)',
    en: 'US Dollar ($)',
    ka: 'აშშ დოლარი ($)',
    ar: 'الدولار الأمريكي ($)'
  },
  'currency.eur': {
    ru: 'Евро (€)',
    en: 'Euro (€)',
    ka: 'ევრო (€)',
    ar: 'اليورو (€)'
  },
  'currency.gel': {
    ru: 'Грузинский лари (₾)',
    en: 'Georgian Lari (₾)',
    ka: 'ქართული ლარი (₾)',
    ar: 'اللاري الجورجي (₾)'
  },

  // Widget Languages
  'adminWidgets.defaultLanguage': {
    ru: 'Язык по умолчанию',
    en: 'Default language',
    ka: 'ნაგულისხმევი ენა',
    ar: 'اللغة الافتراضية'
  },
  'adminWidgets.defaultLanguageDesc': {
    ru: 'Выберите язык по умолчанию для виджета',
    en: 'Select default language for the widget',
    ka: 'აირჩიეთ ნაგულისხმევი ენა ვიჯეტისთვის',
    ar: 'اختر اللغة الافتراضية للودجت'
  },
  'adminWidgets.widgetScript': {
    ru: 'Скрипт виджета',
    en: 'Widget script',
    ka: 'ვიჯეტის სკრიპტი',
    ar: 'نص الودجت'
  },
  'adminWidgets.widgetScriptDesc': {
    ru: 'Основной JavaScript файл для виджета',
    en: 'Main JavaScript file for the widget',
    ka: 'ვიჯეტის ძირითადი JavaScript ფაილი',
    ar: 'ملف الجافا سكريبت الرئيسي للودجت'
  },
  'adminWidgets.previewUrl': {
    ru: 'URL для предварительного просмотра',
    en: 'Preview URL',
    ka: 'წინასწარი ნახვის URL',
    ar: 'رابط المعاينة'
  },
  'adminWidgets.previewUrlDesc': {
    ru: 'Ссылка для тестирования виджета',
    en: 'Link to test the widget',
    ka: 'ლინკი ვიჯეტის ტესტირებისთვის',
    ar: 'رابط لاختبار الودجت'
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
  'language.ar': {
    ru: 'Арабский',
    en: 'Arabic',
    ka: 'არაბული',
    ar: 'العربية'
  },

  // Admin Settings
  'adminSettings.title': {
    ru: 'Настройки',
    en: 'Settings',
    ka: 'პარამეტრები',
    ar: 'الإعدادات'
  },
  'adminSettings.description': {
    ru: 'Управление настройками компании и контактной информацией',
    en: 'Manage company settings and contact information',
    ka: 'კომპანიის პარამეტრების და საკონტაქტო ინფორმაციის მართვა',
    ar: 'إدارة إعدادات الشركة ومعلومات الاتصال'
  },
  'adminSettings.save': {
    ru: 'Сохранить',
    en: 'Save',
    ka: 'შენახვა',
    ar: 'حفظ'
  },
  'adminSettings.saving': {
    ru: 'Сохранение...',
    en: 'Saving...',
    ka: 'შენახვა...',
    ar: 'جاري الحفظ...'
  },
  'adminSettings.settingsSaved': {
    ru: 'Настройки сохранены',
    en: 'Settings saved',
    ka: 'პარამეტრები შენახულია',
    ar: 'تم حفظ الإعدادات'
  },
  'adminSettings.errorLoading': {
    ru: 'Ошибка загрузки настроек',
    en: 'Error loading settings',
    ka: 'პარამეტრების ჩატვირთვის შეცდომა',
    ar: 'خطأ في تحميل الإعدادات'
  },
  'adminSettings.errorSaving': {
    ru: 'Ошибка сохранения настроек',
    en: 'Error saving settings',
    ka: 'პარამეტრების შენახვის შეცდომა',
    ar: 'خطأ في حفظ الإعدادات'
  },
  'adminSettings.authRequired': {
    ru: 'Необходима авторизация для работы с настройками',
    en: 'Authentication required to work with settings',
    ka: 'პარამეტრებთან მუშაობისთვის ავტორიზაცია საჭიროა',
    ar: 'يلزم تسجيل الدخول للعمل مع الإعدادات'
  },
  'adminSettings.company': {
    ru: 'Компания',
    en: 'Company',
    ka: 'კომპანია',
    ar: 'الشركة'
  },
  'adminSettings.contacts': {
    ru: 'Аккаунты менеджеров',
    en: 'Manager accounts',
    ka: 'მენეჯერების ანგარიშები',
    ar: 'حسابات المدراء'
  },
  'adminSettings.companyInfo': {
    ru: 'Информация о компании',
    en: 'Company information',
    ka: 'კომპანიის ინფორმაცია',
    ar: 'معلومات الشركة'
  },
  'adminSettings.companyInfoDesc': {
    ru: 'Основная информация о вашей компании',
    en: 'Basic information about your company',
    ka: 'თქვენი კომპანიის ძირითადი ინფორმაცია',
    ar: 'معلومات أساسية عن شركتك'
  },
  'adminSettings.companyName': {
    ru: 'Название компании',
    en: 'Company name',
    ka: 'კომპანიის სახელი',
    ar: 'اسم الشركة'
  },
  'adminSettings.companyNamePlaceholder': {
    ru: 'ООО «Название компании»',
    en: 'LLC "Company Name"',
    ka: 'LLC "კომპანიის სახელი"',
    ar: 'شركة ذات مسؤولية محدودة "اسم الشركة"'
  },
  'adminSettings.companyDescription': {
    ru: 'Описание компании',
    en: 'Company description',
    ka: 'კომპანიის აღწერა',
    ar: 'وصف الشركة'
  },
  'adminSettings.companyDescriptionPlaceholder': {
    ru: 'Краткое описание деятельности компании...',
    en: 'Brief description of company activities...',
    ka: 'კომპანიის საქმიანობის მოკლე აღწერა...',
    ar: 'وصف مختصر لأنشطة الشركة...'
  },
  'adminSettings.companyAddress': {
    ru: 'Адрес компании',
    en: 'Company address',
    ka: 'კომპანიის მისამართი',
    ar: 'عنوان الشركة'
  },
  'adminSettings.companyAddressPlaceholder': {
    ru: 'г. Город, ул. Улица, д. 1',
    en: 'City, Street, 1',
    ka: 'ქალაქი, ქუჩა, 1',
    ar: 'المدينة، الشارع، 1'
  },
  // Manager Accounts
  'managerAccounts.title': {
    ru: 'Управление менеджерами',
    en: 'Manager Management',
    ka: 'მენეჯერების მართვა',
    ar: 'إدارة المدراء'
  },
  'managerAccounts.description': {
    ru: 'Добавляйте менеджеров для работы с вашими проектами',
    en: 'Add managers to work with your projects',
    ka: 'დაამატეთ მენეჯერები თქვენს პროექტებთან სამუშაოდ',
    ar: 'أضف المدراء للعمل على مشاريعك'
  },
  'managerAccounts.addManager': {
    ru: 'Добавить менеджера',
    en: 'Add Manager',
    ka: 'მენეჯერის დამატება',
    ar: 'إضافة مدير'
  },
  'managerAccounts.inviteManager': {
    ru: 'Пригласить менеджера',
    en: 'Invite Manager',
    ka: 'მენეჯერის მოწვევა',
    ar: 'دعوة مدير'
  },
  'managerAccounts.inviteManagerDesc': {
    ru: 'Отправьте приглашение новому менеджеру для работы с вашими проектами',
    en: 'Send an invitation to a new manager to work with your projects',
    ka: 'გაუგზავნეთ მოწვევა ახალ მენეჯერს თქვენს პროექტებთან სამუშაოდ',
    ar: 'أرسل دعوة لمدير جديد للعمل على مشاريعك'
  },
  'managerAccounts.email': {
    ru: 'Email',
    en: 'Email',
    ka: 'ელფოსტა',
    ar: 'البريد الإلكتروني'
  },
  'managerAccounts.emailPlaceholder': {
    ru: 'manager@example.com',
    en: 'manager@example.com',
    ka: 'manager@example.com',
    ar: 'manager@example.com'
  },
  'managerAccounts.fullName': {
    ru: 'Полное имя',
    en: 'Full Name',
    ka: 'სრული სახელი',
    ar: 'الاسم الكامل'
  },
  'managerAccounts.fullNamePlaceholder': {
    ru: 'Иван Иванов',
    en: 'John Doe',
    ka: 'ივანე ივანოვი',
    ar: 'محمد أحمد'
  },
  'managerAccounts.phone': {
    ru: 'Телефон',
    en: 'Phone',
    ka: 'ტელეფონი',
    ar: 'الهاتف'
  },
  'managerAccounts.phonePlaceholder': {
    ru: '+7 (999) 123-45-67',
    en: '+1 (555) 123-4567',
    ka: '+995 599 123 456',
    ar: '+966 5 1234 5678'
  },
  'managerAccounts.invite': {
    ru: 'Пригласить',
    en: 'Invite',
    ka: 'მოწვევა',
    ar: 'دعوة'
  },
  'managerAccounts.inviting': {
    ru: 'Приглашаем...',
    en: 'Inviting...',
    ka: 'მოწვევა...',
    ar: 'جارٍ الدعوة...'
  },
  'managerAccounts.activeManagers': {
    ru: 'Активные менеджеры',
    en: 'Active Managers',
    ka: 'აქტიური მენეჯერები',
    ar: 'المدراء النشطون'
  },
  'managerAccounts.activeManagersDesc': {
    ru: 'Менеджеры с доступом к вашим проектам',
    en: 'Managers with access to your projects',
    ka: 'მენეჯერები თქვენს პროექტებზე წვდომით',
    ar: 'مدراء لديهم صلاحية الوصول إلى مشاريعك'
  },
  'managerAccounts.pendingInvitations': {
    ru: 'Ожидающие приглашения',
    en: 'Pending Invitations',
    ka: 'მოლოდინის მოწვევები',
    ar: 'دعوات قيد الانتظار'
  },
  'managerAccounts.pendingInvitationsDesc': {
    ru: 'Приглашения, которые еще не были приняты',
    en: 'Invitations that have not been accepted yet',
    ka: 'მოწვევები, რომლებიც ჯერ არ არის მიღებული',
    ar: 'دعوات لم تُقبل بعد'
  },
  'managerAccounts.statusActive': {
    ru: 'Активный',
    en: 'Active',
    ka: 'აქტიური',
    ar: 'نشط'
  },
  'managerAccounts.statusPending': {
    ru: 'Ожидает',
    en: 'Pending',
    ka: 'მოლოდინში',
    ar: 'قيد الانتظار'
  },
  'managerAccounts.statusSuspended': {
    ru: 'Заблокирован',
    en: 'Suspended',
    ka: 'შეჩერებული',
    ar: 'موقوف'
  },
  'managerAccounts.statusExpired': {
    ru: 'Истекло',
    en: 'Expired',
    ka: 'ვადაგასული',
    ar: 'منتهي'
  },
  'managerAccounts.suspend': {
    ru: 'Заблокировать',
    en: 'Suspend',
    ka: 'შეჩერება',
    ar: 'إيقاف'
  },
  'managerAccounts.activate': {
    ru: 'Активировать',
    en: 'Activate',
    ka: 'გააქტიურება',
    ar: 'تفعيل'
  },
  'managerAccounts.remove': {
    ru: 'Удалить',
    en: 'Remove',
    ka: 'წაშლა',
    ar: 'إزالة'
  },
  'managerAccounts.cancel': {
    ru: 'Отменить',
    en: 'Cancel',
    ka: 'გაუქმება',
    ar: 'إلغاء'
  },
  'managerAccounts.confirmRemove': {
    ru: 'Подтвердите удаление',
    en: 'Confirm Removal',
    ka: 'წაშლის დადასტურება',
    ar: 'تأكيد الإزالة'
  },
  'managerAccounts.confirmRemoveDesc': {
    ru: 'Вы уверены, что хотите удалить менеджера {{name}}? This action cannot be undone.',
    en: 'Are you sure you want to remove manager {{name}}? This action cannot be undone.',
    ka: 'დარწმუნებული ხართ, რომ გსურთ მენეჯერის {{name}} წაშლა? ეს ქმედება ვერ გაუქმდება.',
    ar: 'هل أنت متأكد أنك تريد إزالة المدير {{name}}؟ لا يمكن التراجع عن هذا الإجراء.'
  },
  'managerAccounts.confirmCancel': {
    ru: 'Отменить приглашение',
    en: 'Cancel Invitation',
    ka: 'მოწვევის გაუქმება',
    ar: 'إلغاء الدعوة'
  },
  'managerAccounts.confirmCancelDesc': {
    ru: 'Вы уверены, что хотите отменить приглашение для {{name}}?',
    en: 'Are you sure you want to cancel the invitation for {{name}}?',
    ka: 'დარწმუნებული ხართ, რომ გსურთ {{name}}-ის მოწვევის გაუქმება?',
    ar: 'هل أنت متأكد أنك تريد إلغاء الدعوة لـ {{name}}؟'
  },
  'managerAccounts.expiresAt': {
    ru: 'Истекает',
    en: 'Expires',
    ka: 'ვადა ისრულება',
    ar: 'تنتهي في'
  },
  'managerAccounts.noManagers': {
    ru: 'Нет менеджеров',
    en: 'No Managers',
    ka: 'მენეჯერები არ არის',
    ar: 'لا يوجد مديرون'
  },
  'managerAccounts.noManagersDesc': {
    ru: 'У вас пока нет менеджеров. Добавьте первого менеджера для работы с проектами.',
    en: 'You don\'t have any managers yet. Add your first manager to work with projects.',
    ka: 'თქვენ ჯერ არ გაქვთ მენეჯერები. დაამატეთ პირველი მენეჯერი პროექტებთან სამუშაოდ.',
    ar: 'ليس لديك أي مدير بعد. أضف أول مدير للعمل على المشاريع.'
  },
  'managerAccounts.addFirstManager': {
    ru: 'Добавить первого менеджера',
    en: 'Add First Manager',
    ka: 'პირველი მენეჯერის დამატება',
    ar: 'إضافة أول مدير'
  },
  'managerAccounts.copyLink': {
    ru: 'Копировать ссылку',
    en: 'Copy Link',
    ka: 'ბმულის კოპირება',
    ar: 'نسخ الرابط'
  },
  'managerAccounts.openLink': {
    ru: 'Открыть',
    en: 'Open',
    ka: 'გახსნა',
    ar: 'فتح'
  },
  'managerAccounts.linkCopied': {
    ru: 'Ссылка скопирована в буфер обмена',
    en: 'Link copied to clipboard',
    ka: 'ბმული დაკოპირდა',
    ar: 'تم نسخ الرابط إلى الحافظة'
  },
  'managerAccounts.failedToCopy': {
    ru: 'Не удалось скопировать ссылку',
    en: 'Failed to copy link',
    ka: 'ბმულის კოპირება ვერ მოხერხდა',
    ar: 'فشل نسخ الرابط'
  },
  'managerAccounts.emailFailedCopyManually': {
    ru: 'Не удалось отправить email. Скопируйте ссылку вручную.',
    en: 'Failed to send email. Copy the link manually.',
    ka: 'ელ.ფოსტის გაგზავნა ვერ მოხერხდა. დააკოპირეთ ბმული ხელით.',
    ar: 'فشل إرسال البريد الإلكتروني. انسخ الرابط يدوياً.'
  },
  'managerAccounts.fillRequiredFields': {
    ru: 'Заполните все обязательные поля',
    en: 'Fill in all required fields',
    ka: 'შეავსეთ ყველა სავალდებულო ველი',
    ar: 'يرجى تعبئة جميع الحقول المطلوبة'
  },
  'managerAccounts.managerAdded': {
    ru: 'Менеджер успешно добавлен',
    en: 'Manager successfully added',
    ka: 'მენეჯერი წარმატებით დაემატა',
    ar: 'تمت إضافة المدير بنجاح'
  },
  'managerAccounts.invitationSent': {
    ru: 'Приглашение отправлено',
    en: 'Invitation sent',
    ka: 'მოწვევა გაიგზავნა',
    ar: 'تم إرسال الدعوة'
  },
  'managerAccounts.managerSuspended': {
    ru: 'Менеджер заблокирован',
    en: 'Manager suspended',
    ka: 'მენეჯერი შეჩერდა',
    ar: 'تم إيقاف المدير'
  },
  'managerAccounts.managerActivated': {
    ru: 'Менеджер активирован',
    en: 'Manager activated',
    ka: 'მენეჯერი გააქტიურდა',
    ar: 'تم تفعيل المدير'
  },
  'managerAccounts.managerRemoved': {
    ru: 'Менеджер удален',
    en: 'Manager removed',
    ka: 'მენეჯერი წაიშალა',
    ar: 'تمت إزالة المدير'
  },
  'managerAccounts.invitationCancelled': {
    ru: 'Приглашение отменено',
    en: 'Invitation cancelled',
    ka: 'მოწვევა გაუქმდა',
    ar: 'تم إلغاء الدعوة'
  },
  'managerAccounts.errorLoading': {
    ru: 'Ошибка загрузки данных менеджеров',
    en: 'Error loading manager data',
    ka: 'შეცდომა მენეჯერების მონაცემების ჩატვირთვაში',
    ar: 'خطأ في تحميل بيانات المدراء'
  },
  'managerAccounts.errorInviting': {
    ru: 'Ошибка при приглашении менеджера',
    en: 'Error inviting manager',
    ka: 'შეცდომა მენეჯერის მოწვევაში',
    ar: 'خطأ في دعوة المدير'
  },
  'managerAccounts.errorSuspending': {
    ru: 'Ошибка при блокировке менеджера',
    en: 'Error suspending manager',
    ka: 'შეცდომა მენეჯერის შეჩერებაში',
    ar: 'خطأ في إيقاف المدير'
  },
  'managerAccounts.errorActivating': {
    ru: 'Ошибка при активации менеджера',
    en: 'Error activating manager',
    ka: 'შეცდომა მენეჯერის გააქტიურებაში',
    ar: 'خطأ في تفعيل المدير'
  },
  'managerAccounts.errorRemoving': {
    ru: 'Ошибка при удалении менеджера',
    en: 'Error removing manager',
    ka: 'შეცდომა მენეჯერის წაშლაში',
    ar: 'خطأ في إزالة المدير'
  },
  'managerAccounts.errorCancelling': {
    ru: 'Ошибка при отмене приглашения',
    en: 'Error cancelling invitation',
    ka: 'შეცდომა მოწვევის გაუქმებაში',
    ar: 'خطأ في إلغاء الدعوة'
  },
  'managerAccounts.invitationCreated': {
    ru: 'Приглашение создано',
    en: 'Invitation created',
    ka: 'მოწვევა შეიქმნა',
    ar: 'تم إنشاء الدعوة'
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
    ka: 'პროექტის ბინები',
    ar: 'شقق المشروع'
  },
  'apartmentsManager.name': {
    ru: 'Название',
    en: 'Name',
    ka: 'სახელი',
    ar: 'الاسم'
  },
  'apartmentsManager.description': {
    ru: 'Управление квартирами и их характеристиками',
    en: 'Manage apartments and their characteristics',
    ka: 'ბინების და მათი მახასიათებლების მართვა',
    ar: 'إدارة الشقق وخصائصها'
  },
  'apartmentsManager.searchPlaceholder': {
    ru: 'Поиск по номеру квартиры или статусу',
    en: 'Search by apartment number or status',
    ka: 'ბინის ნომერის ან სტატუსის მიხედვით ძებნა',
    ar: 'ابحث برقم الشقة أو الحالة'
  },
  'apartmentsManager.addApartment': {
    ru: 'Добавить квартиру',
    en: 'Add Apartment',
    ka: 'ბინის დამატება',
    ar: 'إضافة شقة'
  },
  'apartmentsManager.newApartment': {
    ru: 'Новая квартира',
    en: 'New Apartment',
    ka: 'ახალი ბინა',
    ar: 'شقة جديدة'
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
  },

  // Filters
  'project.moreFilters': {
    ru: 'Больше фильтров',
    en: 'More Filters',
    ka: 'მეტი ფილტრი'
  },
  'project.currency': {
    ru: 'Валюта',
    en: 'Currency',
    ka: 'ვალუტა'
  },
  'common.hide': {
    ru: 'Скрыть',
    en: 'Hide',
    ka: 'დამალვა'
  },

  // Accept Invitation Page
  'invitation.teamInvitation': {
    ru: 'Приглашение в команду',
    en: 'Team Invitation',
    ka: 'გუნდში მოწვევა'
  },
  'invitation.completeRegistration': {
    ru: 'Завершите регистрацию для получения доступа',
    en: 'Complete registration to get access',
    ka: 'დაასრულეთ რეგისტრაცია წვდომის მისაღებად'
  },
  'invitation.manager': {
    ru: 'Менеджер:',
    en: 'Manager:',
    ka: 'მენეჯერი:'
  },
  'invitation.email': {
    ru: 'Email:',
    en: 'Email:',
    ka: 'ელ-ფოსტა:'
  },
  'invitation.company': {
    ru: 'Компания:',
    en: 'Company:',
    ka: 'კომპანია:'
  },
  'invitation.invitedBy': {
    ru: 'Пригласил:',
    en: 'Invited by:',
    ka: 'მოიწვია:'
  },
  'invitation.createAccount': {
    ru: 'Создать аккаунт',
    en: 'Create Account',
    ka: 'ანგარიშის შექმნა'
  },
  'invitation.haveAccount': {
    ru: 'У меня есть аккаунт',
    en: 'I have an account',
    ka: 'მაქვს ანგარიში'
  },
  'invitation.enterPassword': {
    ru: 'Введите пароль',
    en: 'Enter password',
    ka: 'შეიყვანეთ პაროლი'
  },
  'invitation.yourPassword': {
    ru: 'Ваш пароль',
    en: 'Your password',
    ka: 'თქვენი პაროლი'
  },
  'invitation.createPassword': {
    ru: 'Создайте пароль',
    en: 'Create password',
    ka: 'შექმენით პაროლი'
  },
  'invitation.minimum8Characters': {
    ru: 'Минимум 8 символов',
    en: 'Minimum 8 characters',
    ka: 'მინიმუმ 8 სიმბოლო'
  },
  'invitation.confirmPassword': {
    ru: 'Подтвердите пароль',
    en: 'Confirm password',
    ka: 'დაადასტურეთ პაროლი'
  },
  'invitation.repeatPassword': {
    ru: 'Повторите пароль',
    en: 'Repeat password',
    ka: 'გაიმეორეთ პაროლი'
  },
  'invitation.passwordRequirements': {
    ru: 'Требования к паролю:',
    en: 'Password requirements:',
    ka: 'პაროლის მოთხოვნები:'
  },
  'invitation.passwordMinLength': {
    ru: 'Минимум 8 символов',
    en: 'Minimum 8 characters',
    ka: 'მინიმუმ 8 სიმბოლო'
  },
  'invitation.passwordCase': {
    ru: 'Строчные и заглавные буквы',
    en: 'Lowercase and uppercase letters',
    ka: 'პატარა და დიდი ასოები'
  },
  'invitation.passwordDigit': {
    ru: 'Минимум одна цифра',
    en: 'At least one digit',
    ka: 'მინიმუმ ერთი ციფრი'
  },
  'invitation.acceptInvitation': {
    ru: 'Принять приглашение',
    en: 'Accept Invitation',
    ka: 'მოწვევის მიღება'
  },
  'invitation.signingInAndAccepting': {
    ru: 'Вход и принятие приглашения...',
    en: 'Signing in and accepting invitation...',
    ka: 'შესვლა და მოწვევის მიღება...'
  },
  'invitation.creatingAccount': {
    ru: 'Создание аккаунта...',
    en: 'Creating account...',
    ka: 'ანგარიშის შექმნა...'
  },
  'invitation.validUntil': {
    ru: 'Приглашение действительно до:',
    en: 'Invitation valid until:',
    ka: 'მოწვევა ძალაშია:'
  },
  'invitation.error': {
    ru: 'Ошибка',
    en: 'Error',
    ka: 'შეცდომა'
  },
  'invitation.returnHome': {
    ru: 'Вернуться на главную',
    en: 'Return to Home',
    ka: 'მთავარ გვერდზე დაბრუნება'
  },
  'invitation.tokenNotFound': {
    ru: 'Токен приглашения не найден',
    en: 'Invitation token not found',
    ka: 'მოწვევის ტოკენი ვერ მოიძებნა'
  },
  'invitation.notFound': {
    ru: 'Приглашение не найдено или недоступно',
    en: 'Invitation not found or unavailable',
    ka: 'მოწვევა ვერ მოიძებნა ან მიუწვდომელია'
  },
  'invitation.loadingError': {
    ru: 'Ошибка загрузки приглашения: {message}',
    en: 'Error loading invitation: {message}',
    ka: 'მოწვევის ჩატვირთვის შეცდომა: {message}'
  },
  'invitation.alreadyUsed': {
    ru: 'Приглашение уже было использовано или отменено',
    en: 'Invitation has already been used or cancelled',
    ka: 'მოწვევა უკვე გამოყენებულია ან გაუქმებულია'
  },
  'invitation.expired': {
    ru: 'Срок действия приглашения истек',
    en: 'Invitation has expired',
    ka: 'მოწვევის ვადა ამოიწურა'
  },
  'invitation.unknown': {
    ru: 'Неизвестно',
    en: 'Unknown',
    ka: 'უცნობი'
  },
  'invitation.dataNotFound': {
    ru: 'Данные приглашения не найдены',
    en: 'Invitation data not found',
    ka: 'მოწვევის მონაცემები ვერ მოიძებნა'
  },
  'invitation.alreadyAuthorized': {
    ru: 'Вы уже авторизованы. Принимаем приглашение...',
    en: 'You are already authorized. Accepting invitation...',
    ka: 'თქვენ უკვე ავტორიზებული ხართ. მოწვევის მიღება...'
  },
  'invitation.enterLoginPassword': {
    ru: 'Введите пароль для входа',
    en: 'Enter password to sign in',
    ka: 'შეიყვანეთ პაროლი შესასვლელად'
  },
  'invitation.incorrectPassword': {
    ru: 'Неверный пароль или email',
    en: 'Incorrect password or email',
    ka: 'არასწორი პაროლი ან ელ-ფოსტა'
  },
  'invitation.signInError': {
    ru: 'Ошибка входа в аккаунт',
    en: 'Error signing into account',
    ka: 'ანგარიშში შესვლის შეცდომა'
  },
  'invitation.fillAllFields': {
    ru: 'Заполните все поля для создания аккаунта',
    en: 'Fill all fields to create account',
    ka: 'შეავსეთ ყველა ველი ანგარიშის შესაქმნელად'
  },
  'invitation.passwordMinLength8': {
    ru: 'Пароль должен содержать минимум 8 символов',
    en: 'Password must contain at least 8 characters',
    ka: 'პაროლი უნდა შეიცავდეს მინიმუმ 8 სიმბოლოს'
  },
  'invitation.passwordLowercase': {
    ru: 'Пароль должен содержать строчные буквы',
    en: 'Password must contain lowercase letters',
    ka: 'პაროლი უნდა შეიცავდეს პატარა ასოებს'
  },
  'invitation.passwordUppercase': {
    ru: 'Пароль должен содержать заглавные буквы',
    en: 'Password must contain uppercase letters',
    ka: 'პაროლი უნდა შეიცავდეს დიდ ასოებს'
  },
  'invitation.passwordDigits': {
    ru: 'Пароль должен содержать цифры',
    en: 'Password must contain digits',
    ka: 'პაროლი უნდა შეიცავდეს ციფრებს'
  },
  'invitation.passwordMismatch': {
    ru: 'Пароли не совпадают',
    en: 'Passwords do not match',
    ka: 'პაროლები არ ემთხვევა'
  },
  'invitation.accountCreationError': {
    ru: 'Ошибка создания аккаунта',
    en: 'Error creating account',
    ka: 'ანგარიშის შექმნის შეცდომა'
  },
  'invitation.acceptedSuccess': {
    ru: 'Приглашение принято! Добро пожаловать в команду!',
    en: 'Invitation accepted! Welcome to the team!',
    ka: 'მოწვევა მიღებულია! კეთილი იყოს თქვენი მობრძანება გუნდში!'
  },
  'invitation.acceptError': {
    ru: 'Ошибка при принятии приглашения',
    en: 'Error accepting invitation',
    ka: 'მოწვევის მიღების შეცდომა'
  },
  'invitation.checkingExistingUser': {
    ru: 'Проверяем существующий аккаунт...',
    en: 'Checking existing account...',
    ka: 'არსებული ანგარიშის შემოწმება...'
  },
  // Admin Sidebar (extra)
  'adminSidebar.title': { ru: 'Админ Панель', en: 'Admin Panel', ka: 'ადმინ პანელი', ar: 'لوحة الإدارة' },
  'projectEditorSidebar.title': { ru: 'Редактор Проекта', en: 'Project Editor', ka: 'პროექტის რედაქტორი', ar: 'محرر المشروع' },
  'admin.leads': { ru: 'Лиды', en: 'Leads', ka: 'ლიდები', ar: 'العملاء المحتملون' },
  'projectEditor.general': { ru: 'Основное', en: 'General', ka: 'ძირითადი', ar: 'عام' },
  'projectEditor.apartmentsTab': { ru: 'Квартиры', en: 'Apartments', ka: 'ბინები', ar: 'الشقق' },
  'projectEditor.floorplan': { ru: 'Планировки', en: 'Floor plans', ka: 'გეგმები', ar: 'المخططات' },
  'projectEditor.photosTab': { ru: 'Фото', en: 'Photos', ka: 'ფოტოები', ar: 'الصور' },
  'projectEditor.fieldsTab': { ru: 'Поля', en: 'Fields', ka: 'ველები', ar: 'الحقول' },
  'projectEditor.integrations': { ru: 'Интеграции', en: 'Integrations', ka: 'ინტეგრაციები', ar: 'التكاملات' },

  // Leads Manager
  'leads.title': { ru: 'Лиды', en: 'Leads', ka: 'ლიდები', ar: 'العملاء المحتملون' },
  'leads.description': { ru: 'Все заявки от клиентов с информацией о статусе отправки в CRM', en: 'All client requests with CRM delivery status', ka: 'ყველა კლიენტის განაცხადი CRM-ში გაგზავნის სტატუსით', ar: 'جميع طلبات العملاء مع حالة الإرسال إلى CRM' },
  'leads.loading': { ru: 'Загрузка лидов...', en: 'Loading leads...', ka: 'ლიდების ჩატვირთვა...', ar: 'جار تحميل العملاء المحتملين...' },
  'leads.error': { ru: 'Ошибка', en: 'Error', ka: 'შეცდომა', ar: 'خطأ' },
  'leads.stats.total': { ru: 'Всего лидов', en: 'Total leads', ka: 'ლიდები სულ', ar: 'إجمالي العملاء المحتملين' },
  'leads.stats.pending': { ru: 'Ожидают', en: 'Pending', ka: 'მოლოდინში', ar: 'في الانتظار' },
  'leads.stats.sent': { ru: 'В CRM', en: 'Sent to CRM', ka: 'გაგზავნილი CRM-ში', ar: 'مرسل إلى CRM' },
  'leads.stats.savedOnly': { ru: 'Только в БД', en: 'Saved only', ka: 'მხოლოდ ბაზაში', ar: 'محفوظ فقط' },
  'leads.stats.failed': { ru: 'С ошибками', en: 'Failed', ka: 'შეცდომით', ar: 'فشل' },
  'leads.stats.cancelled': { ru: 'Отменены', en: 'Cancelled', ka: 'გაუქმებული', ar: 'ملغي' },
  'leads.filters.title': { ru: 'Фильтры', en: 'Filters', ka: 'ფილტრები', ar: 'المرشحات' },
  'leads.filters.status': { ru: 'Статус', en: 'Status', ka: 'სტატუსი', ar: 'الحالة' },
  'leads.filters.dateFrom': { ru: 'Дата от', en: 'Date from', ka: 'თარიღი -დან', ar: 'التاريخ من' },
  'leads.filters.dateTo': { ru: 'Дата до', en: 'Date to', ka: 'თარიღი -მდე', ar: 'التاريخ إلى' },
  'leads.status.all': { ru: 'Все', en: 'All', ka: 'ყველა', ar: 'الكل' },
  'leads.status.pending': { ru: 'Ожидает', en: 'Pending', ka: 'მოლოდინში', ar: 'في الانتظار' },
  'leads.status.sent_to_crm': { ru: 'Отправлен', en: 'Sent to CRM', ka: 'გაგზავნილი CRM-ში', ar: 'مرسل إلى CRM' },
  'leads.status.saved_only': { ru: 'Только в БД', en: 'Saved only', ka: 'მხოლოდ ბაზაში', ar: 'محفوظ فقط' },
  'leads.status.failed': { ru: 'Ошибка', en: 'Failed', ka: 'შეცდომა', ar: 'فشل' },
  'leads.status.cancelled': { ru: 'Отменен', en: 'Cancelled', ka: 'გაუქმებული', ar: 'ملغي' },
  'leads.table.date': { ru: 'Дата', en: 'Date', ka: 'თარიღი', ar: 'التاريخ' },
  'leads.table.client': { ru: 'Клиент', en: 'Client', ka: 'კლიენტი', ar: 'العميل' },
  'leads.table.contacts': { ru: 'Контакты', en: 'Contacts', ka: 'კონტაქტები', ar: 'جهات الاتصال' },
  'leads.table.project': { ru: 'Проект', en: 'Project', ka: 'პროექტი', ar: 'المشروع' },
  'leads.table.apartment': { ru: 'Квартира', en: 'Apartment', ka: 'ბინა', ar: 'الشقة' },
  'leads.table.status': { ru: 'Статус', en: 'Status', ka: 'სტატუსი', ar: 'الحالة' },
  'leads.table.crm': { ru: 'CRM', en: 'CRM', ka: 'CRM', ar: 'CRM' },
  'leads.table.actions': { ru: 'Действия', en: 'Actions', ka: 'ქმედებები', ar: 'الإجراءات' },
  'leads.crm.notSent': { ru: 'Не отправлен', en: 'Not sent', ka: 'გაუგზავნელი', ar: 'لم يتم الإرسال' },
  'leads.actions.copy': { ru: 'Копировать', en: 'Copy', ka: 'კოპირება', ar: 'نسخ' },
  'leads.actions.cancel': { ru: 'Отменить', en: 'Cancel', ka: 'გაუქმება', ar: 'إلغاء' },
  'leads.actions.editNotes': { ru: 'Редактировать заметки', en: 'Edit notes', ka: 'შენიშვნების რედაქტირება', ar: 'تحرير الملاحظات' },
  'leads.actions.openInCrm': { ru: 'Открыть в CRM', en: 'Open in CRM', ka: 'გახსნა CRM-ში', ar: 'فتح في CRM' },
  'leads.empty': { ru: 'Лиды не найдены', en: 'No leads found', ka: 'ლიდები ვერ მოიძებნა', ar: 'لم يتم العثور على عملاء محتملين' },
  'leads.notes.title': { ru: 'Заметки к лиду', en: 'Lead notes', ka: 'ლიდის შენიშვნები', ar: 'ملاحظات العميل المحتمل' },
  'leads.notes.client': { ru: 'Клиент', en: 'Client', ka: 'კლიენტი', ar: 'العميل' },
  'leads.notes.placeholder': { ru: 'Введите заметки...', en: 'Enter notes...', ka: 'შეიყვანეთ შენიშვნები...', ar: 'أدخل الملاحظات...' },
  'leads.save': { ru: 'Сохранить', en: 'Save', ka: 'შენახვა', ar: 'حفظ' },
  'leads.cancel': { ru: 'Отмена', en: 'Cancel', ka: 'გაუქმება', ar: 'إلغاء' },
  'leads.toast.copied.title': { ru: 'Скопировано', en: 'Copied', ka: 'დაკოპირდა', ar: 'تم النسخ' },
  'leads.toast.copied.desc': { ru: 'Информация о лиде скопирована в буфер обмена', en: 'Lead info copied to clipboard', ka: 'ლიდის ინფორმაცია დაკოპირდა', ar: 'تم نسخ معلومات العميل المحتمل إلى الحافظة' },
  'leads.toast.copyError.title': { ru: 'Ошибка', en: 'Error', ka: 'შეცდომა', ar: 'خطأ' },
  'leads.toast.copyError.desc': { ru: 'Не удалось скопировать информацию', en: 'Failed to copy info', ka: 'ინფორმაციის კოპირება ვერ მოხერხდა', ar: 'فشل في نسخ المعلومات' },
  'leads.toast.cancelled.title': { ru: 'Успешно', en: 'Success', ka: 'წარმატებულია', ar: 'نجاح' },
  'leads.toast.cancelled.desc': { ru: 'Лид отменен', en: 'Lead cancelled', ka: 'ლიდი გაუქმდა', ar: 'تم إلغاء العميل المحتمل' },
  'leads.toast.cancelError.title': { ru: 'Ошибка', en: 'Error', ka: 'შეცდომა', ar: 'خطأ' },
  'leads.toast.cancelError.desc': { ru: 'Не удалось отменить лид', en: 'Failed to cancel lead', ka: 'ლიდის გაუქმება ვერ მოხერხდა', ar: 'فشل في إلغاء العميل المحتمل' },
  'leads.toast.notesSaved.title': { ru: 'Успешно', en: 'Success', ka: 'წარმატებულია', ar: 'نجاح' },
  'leads.toast.notesSaved.desc': { ru: 'Заметки обновлены', en: 'Notes updated', ka: 'შენიშვნები განახლებულია', ar: 'تم تحديث الملاحظات' },
  'leads.toast.notesError.title': { ru: 'Ошибка', en: 'Error', ka: 'შეცდომა', ar: 'خطأ' },
  'leads.toast.notesError.desc': { ru: 'Не удалось обновить заметки', en: 'Failed to update notes', ka: 'შენიშვნების განახლება ვერ მოხერხდა', ar: 'فشل في تحديث الملاحظات' },

  // Countries
  'country.turkey': {
    ru: 'Турция',
    en: 'Turkey',
    ka: 'თურქეთი',
    ar: 'تركيا'
  },
  'country.uae': {
    ru: 'ОАЭ',
    en: 'UAE',
    ka: 'არაბეთის გაერთიანებული საამიროები',
    ar: 'الإمارات العربية المتحدة'
  },
  'country.mexico': {
    ru: 'Мексика',
    en: 'Mexico',
    ka: 'მექსიკა',
    ar: 'المكسيك'
  },
  'country.dominicanRepublic': {
    ru: 'ДР',
    en: 'DR',
    ka: 'დრ',
    ar: 'جمهورية الدومينيكان'
  },
  'country.indonesia': {
    ru: 'Индонезия',
    en: 'Indonesia',
    ka: 'ინდონეზია',
    ar: 'إندونيسيا'
  },
  'country.spain': {
    ru: 'Испания',
    en: 'Spain',
    ka: 'ესპანეთი',
    ar: 'إسبانيا'
  },
  'country.georgia': {
    ru: 'Грузия',
    en: 'Georgia',
    ka: 'საქართველო',
    ar: 'جورجيا'
  },
  'country.cyprus': {
    ru: 'Кипр',
    en: 'Cyprus',
    ka: 'კვიპროსი',
    ar: 'قبرص'
  },
  'country.montenegro': {
    ru: 'Черногория',
    en: 'Montenegro',
    ka: 'მონტენეგრო',
    ar: 'الجبل الأسود'
  },
  'country.thailand': {
    ru: 'Таиланд',
    en: 'Thailand',
    ka: 'ტაილანდი',
    ar: 'تايلاند'
  },
  'country.costaRica': {
    ru: 'Коста-Рика',
    en: 'Costa Rica',
    ka: 'კოსტა-რიკა',
    ar: 'كوستاريكا'
  },
  'country.panama': {
    ru: 'Панама',
    en: 'Panama',
    ka: 'პანამა',
    ar: 'بنما'
  },
  'country.greece': {
    ru: 'Греция',
    en: 'Greece',
    ka: 'საბერძნეთი',
    ar: 'اليونان'
  },

  // Landing page translations
  'landing.workWithoutBorders': {
    ru: 'работайте без границ',
    en: 'work without borders',
    ka: 'იმუშავეთ საზღვრების გარეშე',
    ar: 'اعمل بدون حدود'
  },
  'landing.sellFromAnywhere': {
    ru: 'ПРОДАВАЙТЕ ИЗ ЛЮБОЙ ТОЧКИ МИРА',
    en: 'SELL FROM ANYWHERE IN THE WORLD',
    ka: 'გაყიდეთ მსოფლიოს ნებისმიერი წერტილიდან',
    ar: 'بع من أي مكان في العالم'
  },
  'landing.widgetsTitle': {
    ru: 'Готовые виджеты для любого сайта',
    en: 'Ready-made widgets for any website',
    ka: 'მზა ვიჯეტები ნებისმიერი საიტისთვის',
    ar: 'ودجات جاهزة لأي موقع ويب'
  },
  'landing.widgetsDesc': {
    ru: 'Встраиваемые интерактивные планы одной строкой кода. Работает на любой CMS (WordPress, Tilda, 1C-Битрикс).',
    en: 'Embeddable interactive plans with one line of code. Works on any CMS (WordPress, Tilda, 1C-Bitrix).',
    ka: 'ჩასაშენებელი ინტერაქტიული გეგმები ერთი ხაზის კოდით. მუშაობს ნებისმიერ CMS-ზე (WordPress, Tilda, 1C-Битрикс).',
    ar: 'خطط تفاعلية قابلة للتضمين بسطر واحد من الكود. يعمل على أي نظام إدارة محتوى (WordPress, Tilda, 1C-Bitrix).'
  },
  'landing.videoNotSupported': {
    ru: 'Ваш браузер не поддерживает видео.',
    en: 'Your browser does not support video.',
    ka: 'თქვენი ბრაუზერი არ მხარს უჭერს ვიდეოს.',
    ar: 'متصفحك لا يدعم الفيديو.'
  },
  'landing.dataImportTitle': {
    ru: 'Импорт данных',
    en: 'Data Import',
    ka: 'მონაცემების იმპორტი',
    ar: 'استيراد البيانات'
  },
  'landing.dataImportDesc': {
    ru: 'Загрузите статусы и цены квартир из Excel, CSV или Google Sheets. Все данные автоматически подтянутся в систему.',
    en: 'Upload apartment statuses and prices from Excel, CSV or Google Sheets. All data will automatically sync to the system.',
    ka: 'ატვირთეთ ბინების სტატუსები და ფასები Excel-დან, CSV-დან ან Google Sheets-დან. ყველა მონაცემი ავტომატურად ჩაიტვირთება სისტემაში.',
    ar: 'قم بتحميل حالات وأسعار الشقق من Excel أو CSV أو Google Sheets. ستتم مزامنة جميع البيانات تلقائياً مع النظام.'
  },
  'landing.crmIntegrationTitle': {
    ru: 'Интеграция с популярными CRM',
    en: 'Integration with popular CRM systems',
    ka: 'ინტეგრაცია პოპულარულ CRM-ებთან',
    ar: 'التكامل مع أنظمة CRM الشائعة'
  },
  'landing.crmIntegrationDesc': {
    ru: 'Автоматическая передача лидов и данных о квартирах в AmoCRM, Bitrix24, HubSpot и другие CRM. Никаких потерянных заявок — все клиенты сразу в вашей воронке.',
    en: 'Automatic transfer of leads and apartment data to AmoCRM, Bitrix24, HubSpot and other CRM systems. No lost applications — all clients are immediately in your funnel.',
    ka: 'ლიდების და ბინების მონაცემების ავტომატური გადაცემა AmoCRM-ში, Bitrix24-ში, HubSpot-ში და სხვა CRM-ებში. არანაირი დაკარგული განაცხადი — ყველა კლიენტი მაშინვე თქვენს ძაბრშია.',
    ar: 'نقل تلقائي للعملاء المحتملين وبيانات الشقق إلى AmoCRM و Bitrix24 و HubSpot وأنظمة CRM أخرى. لا توجد طلبات مفقودة — جميع العملاء في قمعك على الفور.'
  },
  'landing.interactivePlansTitle': {
    ru: 'Интерактивные планы для застройщиков и риелторов',
    en: 'Interactive plans for developers and realtors',
    ka: 'ინტერაქტიული გეგმები დეველოპერებისა და რიელტორებისთვის',
    ar: 'خطط تفاعلية للمطورين والوسطاء العقاريين'
  },
  'landing.interactivePlansDesc': {
    ru: 'Gridix помогает создавать наглядные и удобные планы недвижимости: отмечайте статус квартир, подключайте интеграции с CRM и делитесь планами одной строкой кода. Всё просто, быстро и без лишних затрат.',
    en: 'Gridix helps create clear and convenient real estate plans: mark apartment statuses, connect CRM integrations and share plans with one line of code. Everything is simple, fast and without unnecessary costs.',
    ka: 'Gridix ეხმარება შექმნას ნათელი და მოსახერხებელი უძრავი ქონების გეგმები: მონიშნეთ ბინების სტატუსები, შეაერთეთ CRM ინტეგრაციები და გაუზიარეთ გეგმები ერთი ხაზის კოდით. ყველაფერი მარტივი, სწრაფი და ზედმეტი ხარჯების გარეშე.',
    ar: 'يساعد Gridix في إنشاء خطط عقارية واضحة ومريحة: ضع علامة على حالات الشقق، واربط تكاملات CRM وشارك الخطط بسطر واحد من الكود. كل شيء بسيط وسريع وبدون تكاليف غير ضرورية.'
  },

  // Additional landing page sections
  'landing.whatWeGiveClients': {
    ru: 'что мы даём клиентам',
    en: 'what we give clients',
    ka: 'რას ვაძლევთ კლიენტებს',
    ar: 'ما نقدمه للعملاء'
  },
  'landing.ourAdvantages': {
    ru: 'НАШИ ПРЕИМУЩЕСТВА',
    en: 'OUR ADVANTAGES',
    ka: 'ჩვენი უპირატესობები',
    ar: 'مزايانا'
  },
  'landing.howItLooks': {
    ru: 'как это выглядит',
    en: 'how it looks',
    ka: 'როგორ გამოიყურება',
    ar: 'كيف يبدو'
  },
  'landing.interactiveDemo': {
    ru: 'ИНТЕРАКТИВНОЕ ДЕМО',
    en: 'INTERACTIVE DEMO',
    ka: 'ინტერაქტიული დემო',
    ar: 'عرض تفاعلي'
  },
  'landing.freeTrial': {
    ru: 'Бесплатный пробный период',
    en: 'Free trial period',
    ka: 'უფასო საცდელი პერიოდი',
    ar: 'فترة تجريبية مجانية'
  },
  'landing.noObligations': {
    ru: 'Без обязательств',
    en: 'No obligations',
    ka: 'ზედმეტი ვალდებულებების გარეშე',
    ar: 'بدون التزامات'
  },
  'landing.setupIn5Minutes': {
    ru: 'Настройка за 5 минут',
    en: 'Setup in 5 minutes',
    ka: 'ჩამოყალიბება 5 წუთში',
    ar: 'إعداد في 5 دقائق'
  },
  'landing.companyDescription': {
    ru: 'Инновационная платформа для создания интерактивных планов недвижимости. Упрощаем процесс продаж и повышаем конверсию.',
    en: 'Innovative platform for creating interactive real estate plans. We simplify the sales process and increase conversion.',
    ka: 'ინოვაციური პლატფორმა ინტერაქტიული უძრავი ქონების გეგმების შესაქმნელად. ვამარტივებთ გაყიდვების პროცესს და ვზრდით კონვერსიას.',
    ar: 'منصة مبتكرة لإنشاء خطط عقارية تفاعلية. نحن نبسط عملية البيع ونزيد التحويل.'
  },
  'landing.company': {
    ru: 'Компания',
    en: 'Company',
    ka: 'კომპანია',
    ar: 'الشركة'
  },
  'landing.address': {
    ru: 'Адрес',
    en: 'Address',
    ka: 'მისამართი',
    ar: 'العنوان'
  },
  'landing.email': {
    ru: 'Email',
    en: 'Email',
    ka: 'ელფოსტა',
    ar: 'البريد الإلكتروني'
  },
  'landing.quickLinks': {
    ru: 'Быстрые ссылки',
    en: 'Quick links',
    ka: 'სწრაფი ბმულები',
    ar: 'روابط سريعة'
  },
  'landing.adminPanel': {
    ru: 'Админ панель',
    en: 'Admin panel',
    ka: 'ადმინ პანელი',
    ar: 'لوحة الإدارة'
  },
  'landing.support': {
    ru: 'Поддержка',
    en: 'Support',
    ka: 'მხარდაჭერა',
    ar: 'الدعم'
  },
  'landing.legalInfo': {
    ru: 'Правовая информация',
    en: 'Legal information',
    ka: 'იურიდიული ინფორმაცია',
    ar: 'المعلومات القانونية'
  },
  'landing.privacyPolicy': {
    ru: 'Политика конфиденциальности',
    en: 'Privacy policy',
    ka: 'კონფიდენციალურობის პოლიტიკა',
    ar: 'سياسة الخصوصية'
  },
  'landing.termsOfService': {
    ru: 'Пользовательское соглашение',
    en: 'Terms of service',
    ka: 'მომხმარებლის შეთანხმება',
    ar: 'شروط الخدمة'
  },
  'landing.copyright': {
    ru: '© 2024 Gridix. Все права защищены.',
    en: '© 2024 Gridix. All rights reserved.',
    ka: '© 2024 Gridix. ყველა უფლება დაცულია.',
    ar: '© 2024 Gridix. جميع الحقوق محفوظة.'
  },

  // Custom Domains
  'domains.title': {
    ru: 'Кастомные домены',
    en: 'Custom Domains',
    ka: 'მორგებული დომენები',
    ar: 'النطاقات المخصصة'
  },
  'domains.description': {
    ru: 'Подключите собственный домен к проекту "{projectName}" для брендинга',
    en: 'Connect your own domain to project "{projectName}" for branding',
    ka: 'დააკავშირეთ თქვენი საკუთარი დომენი პროექტთან "{projectName}" ბრენდინგისთვის',
    ar: 'ربط النطاق الخاص بك بالمشروع "{projectName}" للعلامة التجارية'
  },
  'domains.instructions.title': {
    ru: 'Инструкция по подключению домена:',
    en: 'Domain connection instructions:',
    ka: 'დომენის დაკავშირების ინსტრუქციები:',
    ar: 'تعليمات ربط النطاق:'
  },
  'domains.instructions.step1': {
    ru: 'Добавьте ваш домен в список ниже',
    en: 'Add your domain to the list below',
    ka: 'დაამატეთ თქვენი დომენი ქვემოთ მოცემულ სიაში',
    ar: 'أضف نطاقك إلى القائمة أدناه'
  },
  'domains.instructions.step2': {
    ru: 'В панели управления вашего регистратора домена создайте DNS записи:',
    en: 'In your domain registrar control panel, create DNS records:',
    ka: 'თქვენი დომენის რეგისტრატორის კონტროლის პანელში შექმენით DNS ჩანაწერები:',
    ar: 'في لوحة تحكم مسجل النطاق الخاص بك، قم بإنشاء سзаписи DNS:'
  },
  'domains.instructions.rootDomain': {
    ru: 'Для основного домена (без www):',
    en: 'For root domain (without www):',
    ka: 'მთავარი დომენისთვის (www-ის გარეშე):',
    ar: 'للنطاق الأساسي (بدون www):'
  },
  'domains.instructions.subdomain': {
    ru: 'Для поддомена www:',
    en: 'For www subdomain:',
    ka: 'www ქვედომენისთვის:',
    ar: 'للنطاق الفرعي www:'
  },
  'domains.instructions.step3': {
    ru: 'Дождитесь распространения DNS (до 24 часов)',
    en: 'Wait for DNS propagation (up to 24 hours)',
    ka: 'დაელოდეთ DNS გავრცელებას (24 საათამდე)',
    ar: 'انتظر انتشار DNS (حتى 24 ساعة)'
  },
  'domains.instructions.dnsRecords': {
    ru: 'Точные DNS записи для вашего домена:',
    en: 'Exact DNS records for your domain:',
    ka: 'ზუსტი DNS ჩანაწერები თქვენი დომენისთვის:',
    ar: 'سجلات DNS الدقيقة لنطاقك:'
  },
  'domains.addNew': {
    ru: 'Добавить новый домен',
    en: 'Add new domain',
    ka: 'ახალი დომენის დამატება',
    ar: 'إضافة نطاق جديد'
  },
  'domains.addButton': {
    ru: 'Добавить',
    en: 'Add',
    ka: 'დამატება',
    ar: 'إضافة'
  },
  'domains.adding': {
    ru: 'Добавление...',
    en: 'Adding...',
    ka: 'მატება...',
    ar: 'جاري الإضافة...'
  },
  'projectEditor.domains': {
    ru: 'Домены',
    en: 'Domains',
    ka: 'დომენები',
    ar: 'النطاقات'
  },
  'domains.placeholder': {
    ru: 'example.com или www.example.com',
    en: 'example.com or www.example.com',
    ka: 'example.com ან www.example.com',
    ar: 'example.com أو www.example.com'
  },
  'domains.inputHelp': {
    ru: 'Введите домен без протокола (http/https). Например: example.com или www.example.com',
    en: 'Enter domain without protocol (http/https). For example: example.com or www.example.com',
    ka: 'შეიყვანეთ დომენი პროტოკოლის გარეშე (http/https). მაგალითად: example.com ან www.example.com',
    ar: 'أدخل النطاق بدون البروتوكول (http/https). على سبيل المثال: example.com أو www.example.com'
  },
  'domains.connectedDomains': {
    ru: 'Подключенные домены',
    en: 'Connected domains',
    ka: 'დაკავშირებული დომენები',
    ar: 'النطاقات المتصلة'
  },
  'domains.noDomains': {
    ru: 'Домены не добавлены',
    en: 'No domains added',
    ka: 'დომენები არ არის დამატებული',
    ar: 'لم يتم إضافة نطاقات'
  },
  'domains.addFirst': {
    ru: 'Добавьте первый домен для вашего проекта',
    en: 'Add the first domain for your project',
    ka: 'დაამატეთ პირველი დომენი თქვენი პროექტისთვის',
    ar: 'أضف النطاق الأول لمشروعك'
  },
  'domains.primary': {
    ru: 'Основной',
    en: 'Primary',
    ka: 'მთავარი',
    ar: 'أساسي'
  },
  'domains.active': {
    ru: 'Активен',
    en: 'Active',
    ka: 'აქტიური',
    ar: 'نشط'
  },
  'domains.addedOn': {
    ru: 'Добавлен',
    en: 'Added on',
    ka: 'დამატებულია',
    ar: 'أضيف في'
  },
  'domains.setPrimary': {
    ru: 'Основной',
    en: 'Primary',
    ka: 'მთავარი',
    ar: 'أساسي'
  },
  'domains.deleteConfirm': {
    ru: 'Удалить домен?',
    en: 'Delete domain?',
    ka: 'წაშალოთ დომენი?',
    ar: 'حذف النطاق؟'
  },
  'domains.deleteDescription': {
    ru: 'Вы уверены, что хотите удалить домен "{domain}"? Это действие нельзя отменить.',
    en: 'Are you sure you want to delete domain "{domain}"? This action cannot be undone.',
    ka: 'დარწმუნებული ხართ, რომ გსურთ წაშალოთ დომენი "{domain}"? ეს ქმედება არ შეიძლება გაუქმდეს.',
    ar: 'هل أنت متأكد من أنك تريد حذف النطاق "{domain}"؟ لا يمكن التراجع عن هذا الإجراء.'
  },
  'domains.cancel': {
    ru: 'Отмена',
    en: 'Cancel',
    ka: 'გაუქმება',
    ar: 'إلغاء'
  },
  'domains.delete': {
    ru: 'Удалить',
    en: 'Delete',
    ka: 'წაშლა',
    ar: 'حذف'
  },
  'domains.warning': {
    ru: 'После добавления домена обязательно настройте DNS записи у вашего регистратора домена. Домен будет работать только после правильной настройки DNS.',
    en: 'After adding a domain, be sure to configure DNS records with your domain registrar. The domain will only work after proper DNS configuration.',
    ka: 'დომენის დამატების შემდეგ აუცილებლად გამართეთ DNS ჩანაწერები თქვენი დომენის რეგისტრატორთან. დომენი მუშაობს მხოლოდ DNS-ის სწორი კონფიგურაციის შემდეგ.',
    ar: 'بعد إضافة نطاق، تأكد من تكوين سجلات DNS مع مسجل النطاق الخاص بك. سيعمل النطاق فقط بعد التكوين الصحيح لـ DNS.'
  },
  'domains.dnsType': {
    ru: 'Тип',
    en: 'Type',
    ka: 'ტიპი',
    ar: 'النوع'
  },
  'domains.dnsName': {
    ru: 'Имя',
    en: 'Name',
    ka: 'სახელი',
    ar: 'الاسم'
  },
  'domains.dnsValue': {
    ru: 'Значение',
    en: 'Value',
    ka: 'მნიშვნელობა',
    ar: 'القيمة'
  },
  'domains.copyValue': {
    ru: 'Скопировать значение',
    en: 'Copy value',
    ka: 'მნიშვნელობის კოპირება',
    ar: 'نسخ القيمة'
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

  // Initialize language from URL path or default
  const [language, setLanguageState] = useState<Language>(() => {
    return getLanguageFromPath(location.pathname);
  });

  // Update language when URL changes
  useEffect(() => {
    const urlLanguage = getLanguageFromPath(location.pathname);
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
    const base = translations[key] || {};
    const translation = (base[language] ?? base.en ?? base.ru ?? key);

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
    const base = translations[key] || {};
    const translation = (base[language] ?? base.en ?? base.ru ?? key);

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
