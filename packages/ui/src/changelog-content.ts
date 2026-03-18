import {
  AlertCircle,
  Bell,
  Box,
  Building2,
  Calendar,
  Calculator,
  CheckSquare,
  Code2,
  Download,
  Edit,
  FileText,
  Filter,
  FolderHeart,
  GitMerge,
  Globe,
  Handshake,
  Home,
  LayoutDashboard,
  Lock,
  Mail,
  Map,
  PieChart,
  RefreshCw,
  Scale,
  Search,
  ShieldAlert,
  Smartphone,
  Target,
  TrendingUp,
  User,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

export type Tab = string;

export type UpdateCategory =
  | "crm"
  | "finance"
  | "system"
  | "marketing"
  | "mobile"
  | "admin";

export const CATEGORY_LABELS: Record<UpdateCategory, string> = {
  crm: "CRM",
  finance: "Финансы",
  system: "Система",
  marketing: "Маркетинг",
  mobile: "Мобильное приложение",
  admin: "Администрирование",
};

export interface UpdateDemo {
  instruction: string;
  actionLabel: string;
  targetTab: Tab;
  targetPayload?: unknown;
  requiredRole?: "developer" | "agency" | "agent" | "admin";
}

export interface UpdateFeature {
  title: string;
  description: string;
  icon: unknown;
  category: UpdateCategory;
  demo?: UpdateDemo;
  relatedTab?: Tab;
  availableFor?: ("developer" | "agency" | "agent" | "admin")[];
}

export interface UpdateItem {
  id: string;
  version: string;
  date: string;
  title: string;
  description: string;
  roles: ("developer" | "agency" | "agent" | "admin")[];
  features: UpdateFeature[];
}

export const Tabs = {
  DEALS: "deals",
  PROJECTS: "projects",
  DASHBOARD: "dashboard",
  PARTNER_CLIENTS: "partner_clients",
  TASKS: "tasks",
  CLIENTS: "clients",
  CATALOG: "catalog",
  OBJECTS: "objects",
  NOTIFICATIONS: "notifications",
  COLLECTIONS: "collections",
  LEADS: "leads",
  SETTINGS: "settings",
  INTEGRATIONS: "integrations",
  TEAM: "team",
  CONTACTS: "contacts",
};

export const UPDATES_CONTENT: UpdateItem[] = [
  {
    id: "u_v2_9_7",
    version: "2.9.7",
    date: "04 Марта 2026",
    title: "Deep Analytics & Finance",
    description:
      "Углубленная аналитика для Застройщиков и прозрачный трекинг комиссий для Агентов.",
    roles: ["developer", "agency", "agent"],
    features: [
      {
        title: "Commission Tracker",
        description:
          "В карточке сделки (Agency/Agent) теперь отображается четкий статус вашей комиссии (Ожидается/Выплачено). Убраны лишние детали платежей клиента.",
        icon: Wallet,
        category: "finance",
        relatedTab: Tabs.DEALS,
        availableFor: ["agency", "agent"],
        demo: {
          instruction: "Откройте любую сделку, чтобы увидеть статус комиссии.",
          actionLabel: "Открыть Сделки",
          targetTab: Tabs.DEALS,
          requiredRole: "agent",
        },
      },
      {
        title: "Unit Mix Analysis",
        description:
          "Застройщики теперь видят структуру продаж (Unit Mix) в карточке проекта: какие типы квартир продаются лучше всего.",
        icon: PieChart,
        category: "crm",
        relatedTab: Tabs.PROJECTS,
        availableFor: ["developer"],
      },
      {
        title: "Leaderboard Trends",
        description:
          "В дашборде агентства добавлен индикатор тренда выручки агентов. Видно, кто растет, а кто сдает позиции.",
        icon: TrendingUp,
        category: "crm",
        relatedTab: Tabs.DASHBOARD,
        availableFor: ["agency"],
      },
    ],
  },
  {
    id: "u_v2_9_6",
    version: "2.9.6",
    date: "03 Марта 2026",
    title: "Intelligence & Connectivity",
    description:
      "Связка данных между партнерами и застройщиками. Умный календарь для агента.",
    roles: ["developer", "agency", "agent"],
    features: [
      {
        title: "Developer Partner Insights",
        description:
          "Теперь в карточке партнера (агентства) застройщик видит список всех приведенных им лидов. Прозрачность на 100%.",
        icon: Handshake,
        category: "crm",
        relatedTab: Tabs.PARTNER_CLIENTS,
        availableFor: ["developer"],
      },
      {
        title: "Smart Task Calendar",
        description:
          "Календарь задач получил визуальное обновление. Задачи теперь цветные (Звонок = Зеленый, Встреча = Оранжевый), добавлено быстрое создание.",
        icon: Calendar,
        category: "crm",
        relatedTab: Tabs.TASKS,
        availableFor: ["agency", "agent"],
        demo: {
          instruction: "Откройте календарь задач.",
          actionLabel: "Календарь",
          targetTab: Tabs.TASKS,
          requiredRole: "agent",
        },
      },
      {
        title: "Agent Gamification",
        description:
          "На дашборд агента добавлен виджет уровня (Bronze -> Platinum) с прогрессом заработка.",
        icon: Target,
        category: "system",
        relatedTab: Tabs.DASHBOARD,
        availableFor: ["agent"],
      },
    ],
  },
  {
    id: "u_v2_9_0",
    version: "2.9.0",
    date: "25 Февраля 2026",
    title: "Mobile UX Revolution",
    description: 'Полная переработка мобильной версии для работы "в полях".',
    roles: ["developer", "agency", "agent", "admin"],
    features: [
      {
        title: "Bottom Navigation",
        description:
          "На мобильных устройствах добавлена нижняя панель навигации для быстрого доступа к главным разделам.",
        icon: Smartphone,
        category: "mobile",
        relatedTab: Tabs.DASHBOARD,
        availableFor: ["agency", "agent"],
      },
      {
        title: "Swipe Actions",
        description:
          "В списках клиентов и сделок добавлены свайпы: влево — удалить, вправо — позвонить.",
        icon: Handshake,
        category: "crm",
        relatedTab: Tabs.CLIENTS,
        availableFor: ["agent"],
      },
    ],
  },
  {
    id: "u_v2_8_5",
    version: "2.8.5",
    date: "18 Февраля 2026",
    title: "Global Command Center",
    description: "Внедрение глобального поиска и командной строки.",
    roles: ["developer", "agency", "agent", "admin"],
    features: [
      {
        title: "Command Palette (Cmd+K)",
        description:
          "Нажмите Cmd+K (или Ctrl+K) в любом месте, чтобы открыть глобальный поиск по клиентам, объектам и навигации.",
        icon: Search,
        category: "system",
        availableFor: ["developer", "agency", "agent", "admin"],
      },
      {
        title: "Quick Actions",
        description:
          "Быстрое создание сущностей (Клиент, Сделка, Объект) через командную строку без перехода в разделы.",
        icon: Zap,
        category: "system",
        availableFor: ["agency", "agent"],
      },
    ],
  },
  {
    id: "u_v2_8_0",
    version: "2.8.0",
    date: "10 Февраля 2026",
    title: "Interactive Maps",
    description: "Визуализация данных на картах для всех модулей.",
    roles: ["agency", "agent", "developer"],
    features: [
      {
        title: "Catalog Map View",
        description:
          "Просмотр объектов на карте с кластеризацией цен. Удобный поиск по районам.",
        icon: Map,
        category: "marketing",
        relatedTab: Tabs.CATALOG,
        availableFor: ["agency", "agent"],
      },
      {
        title: "My Objects Map",
        description: "Ваша база вторички теперь тоже доступна в режиме карты.",
        icon: Home,
        category: "crm",
        relatedTab: Tabs.OBJECTS,
        availableFor: ["agency", "agent"],
      },
    ],
  },
  {
    id: "u_v2_7_5",
    version: "2.7.5",
    date: "05 Февраля 2026",
    title: "Notification Center",
    description: "Полностью переработанный центр уведомлений.",
    roles: ["developer", "agency", "agent", "admin"],
    features: [
      {
        title: "Real-time Push",
        description:
          "Мгновенные уведомления внутри приложения без перезагрузки страницы (WebSockets mock).",
        icon: Bell,
        category: "system",
        relatedTab: Tabs.NOTIFICATIONS,
        availableFor: ["developer", "agency", "agent"],
      },
      {
        title: "Notification Filters",
        description: 'Фильтрация уведомлений: "Только непрочитанные" и "Все".',
        icon: Filter,
        category: "system",
        availableFor: ["developer", "agency", "agent"],
      },
    ],
  },
  {
    id: "u_v2_7_0",
    version: "2.7.0",
    date: "01 Февраля 2026",
    title: "Collections 2.0",
    description: "Глобальное обновление модуля подборок.",
    roles: ["agent", "agency"],
    features: [
      {
        title: "Mixed Collections",
        description:
          "Теперь в одну подборку можно добавлять и Новостройки (от застройщиков), и Вторичку (свои объекты).",
        icon: FolderHeart,
        category: "marketing",
        relatedTab: Tabs.COLLECTIONS,
        availableFor: ["agent", "agency"],
      },
      {
        title: "Public Page Redesign",
        description:
          "Публичная страница подборки для клиента получила дизайн премиального лендинга.",
        icon: Globe,
        category: "marketing",
        availableFor: ["agent", "agency"],
      },
    ],
  },
  {
    id: "u_v2_6_5",
    version: "2.6.5",
    date: "28 Января 2026",
    title: "Data Export Engine",
    description: "Инструменты для выгрузки данных и отчетности.",
    roles: ["developer", "agency"],
    features: [
      {
        title: "CSV Exports",
        description:
          "Экспорт таблиц Лидов, Клиентов и Сделок в CSV формат для Excel.",
        icon: Download,
        category: "system",
        relatedTab: Tabs.LEADS,
        availableFor: ["developer", "agency"],
      },
      {
        title: "XML Feeds",
        description:
          "Генерация XML-фидов (Яндекс, Циан, Авито) для выгрузки объектов на классифайды.",
        icon: Code2,
        category: "marketing",
        relatedTab: Tabs.OBJECTS,
        availableFor: ["agency"],
      },
    ],
  },
  {
    id: "u_v2_6_0",
    version: "2.6.0",
    date: "20 Января 2026",
    title: "Role-Based Access Polish",
    description: "Улучшение безопасности и разграничения прав доступа.",
    roles: ["developer", "agency", "agent", "admin"],
    features: [
      {
        title: "Granular Permissions",
        description:
          "Теперь настройки компании и биллинга скрыты от обычных агентов. Доступно только Admin и Head of Sales.",
        icon: ShieldAlert,
        category: "admin",
        relatedTab: Tabs.SETTINGS,
        availableFor: ["agency", "developer"],
      },
      {
        title: "Profile Settings",
        description:
          "Каждый пользователь теперь может загрузить свой аватар и изменить язык интерфейса.",
        icon: User,
        category: "system",
        relatedTab: Tabs.SETTINGS,
        availableFor: ["agent", "agency", "developer"],
      },
    ],
  },
  {
    id: "u_v2_5_5",
    version: "2.5.5",
    date: "15 Января 2026",
    title: "CRM Kanban Booster",
    description: "Визуальные улучшения Канбан-доски.",
    roles: ["developer", "agency"],
    features: [
      {
        title: "Stagnation Indicators",
        description:
          "Карточки сделок, которые долго не меняли статус, подсвечиваются красной полосой (Застой).",
        icon: AlertCircle,
        category: "crm",
        relatedTab: Tabs.LEADS,
        availableFor: ["developer", "agency"],
      },
      {
        title: "Quick Task Actions",
        description:
          "Визуализация следующей задачи прямо на карточке в Канбане. Красный цвет - просрочено.",
        icon: CheckSquare,
        category: "crm",
        relatedTab: Tabs.LEADS,
        availableFor: ["developer", "agency"],
      },
    ],
  },
  {
    id: "u_v2_5_0",
    version: "2.5.0",
    date: "10 Января 2026",
    title: "Integrations Framework",
    description: "Подключение внешних CRM систем.",
    roles: ["developer"],
    features: [
      {
        title: "AmoCRM & Bitrix24",
        description:
          "Нативная интеграция. Лиды из Gridix могут автоматически дублироваться в вашу корпоративную CRM.",
        icon: GitMerge,
        category: "system",
        relatedTab: Tabs.INTEGRATIONS,
        availableFor: ["developer"],
      },
      {
        title: "Webhook Support",
        description: "Отправка данных о новых лидах на любой внешний URL.",
        icon: Globe,
        category: "system",
        relatedTab: Tabs.INTEGRATIONS,
        availableFor: ["developer"],
      },
    ],
  },
  {
    id: "u_v2_4_0",
    version: "2.4.0",
    date: "05 Января 2026",
    title: "Developer Inventory",
    description: "Полноценное управление шахматкой для застройщика.",
    roles: ["developer"],
    features: [
      {
        title: "Bulk Unit Edit",
        description:
          "Массовое изменение цен и статусов квартир. Выделите этаж или стояк и примените изменения.",
        icon: Edit,
        category: "crm",
        relatedTab: Tabs.PROJECTS,
        availableFor: ["developer"],
      },
      {
        title: "Price Simulation",
        description:
          'Калькулятор "Что если": посмотрите, как изменится общая выручка при поднятии цен на 5%.',
        icon: Calculator,
        category: "finance",
        relatedTab: Tabs.PROJECTS,
        availableFor: ["developer"],
      },
    ],
  },
  {
    id: "u_v2_3_0",
    version: "2.3.0",
    date: "25 Декабря 2025",
    title: "Agency Team Management",
    description: "Инструменты для руководителей агентств.",
    roles: ["agency"],
    features: [
      {
        title: "Agent Distribution",
        description:
          "Настройка правил автоматического распределения лидов между агентами (Round Robin, %).",
        icon: Users,
        category: "admin",
        relatedTab: Tabs.TEAM,
        availableFor: ["agency"],
      },
      {
        title: "Team Invites",
        description:
          "Приглашение сотрудников по Email с выбором роли (Агент / РОП).",
        icon: Mail,
        category: "admin",
        relatedTab: Tabs.TEAM,
        availableFor: ["agency"],
      },
    ],
  },
  {
    id: "u_v2_2_0",
    version: "2.2.0",
    date: "20 Декабря 2025",
    title: "Command Center Launch",
    description:
      'Запуск концепции "Командного центра" для всех ролей. Дашборды перестали быть статичными.',
    roles: ["developer", "agency", "agent", "admin"],
    features: [
      {
        title: "Interactive Widgets",
        description:
          "Виджеты на дашборде теперь интерактивны. Можно менять период, фильтровать данные и проваливаться в отчеты.",
        icon: LayoutDashboard,
        category: "system",
        relatedTab: Tabs.DASHBOARD,
        availableFor: ["developer", "agency", "agent", "admin"],
      },
    ],
  },
  {
    id: "u_v2_1_5",
    version: "2.1.5",
    date: "15 Декабря 2025",
    title: "Presentation Engine",
    description: "Генератор PDF презентаций.",
    roles: ["agent", "agency"],
    features: [
      {
        title: "Smart PDF",
        description:
          'Генерация PDF-презентации объекта "на лету" с контактами агента.',
        icon: FileText,
        category: "marketing",
        relatedTab: Tabs.OBJECTS,
        availableFor: ["agent", "agency"],
      },
    ],
  },
  {
    id: "u_v2_1_0",
    version: "2.1.0",
    date: "10 Декабря 2025",
    title: "Comparison Tools",
    description: "Инструменты помощи в выборе.",
    roles: ["agent"],
    features: [
      {
        title: "Object Comparison",
        description:
          "Сравнение до 4-х объектов на одном экране (Цена, Площадь, ROI).",
        icon: Scale,
        category: "marketing",
        availableFor: ["agent"],
      },
    ],
  },
  {
    id: "u_v2_0_5",
    version: "2.0.5",
    date: "05 Декабря 2025",
    title: "Data Hygiene",
    description: "Инструменты для чистоты данных.",
    roles: ["developer", "agency", "agent", "admin"],
    features: [
      {
        title: "Duplicate Finder",
        description: "Поиск и объединение дублей клиентов по номеру телефона.",
        icon: RefreshCw,
        category: "crm",
        relatedTab: Tabs.CONTACTS,
        availableFor: ["developer", "agency", "agent", "admin"],
      },
    ],
  },
  {
    id: "u_v2_0_0",
    version: "2.0.0",
    date: "01 Декабря 2025",
    title: "Platform Core V2",
    description:
      "Полный перезапуск платформы на новой архитектуре. Разделение на 3 независимых приложения (Developer, Agency, Agent).",
    roles: ["developer", "agency", "agent", "admin"],
    features: [
      {
        title: "Modular Architecture",
        description:
          "Переход на модульную архитектуру. Быстрая загрузка и изоляция данных.",
        icon: Box,
        category: "system",
        availableFor: ["developer", "agency", "agent", "admin"],
      },
      {
        title: "Lead Lock Protocol",
        description: "Запуск системы фиксации клиентов с защитой комиссии.",
        icon: Lock,
        category: "crm",
        relatedTab: Tabs.CATALOG,
        availableFor: ["agency", "agent"],
      },
    ],
  },
  {
    id: "u_v1_9_0",
    version: "1.9.0",
    date: "15 Ноября 2025",
    title: "CRM Foundation",
    description: "Базовые функции CRM системы.",
    roles: ["developer", "agency"],
    features: [
      {
        title: "Kanban Board",
        description: "Первая версия Канбан-доски для ведения сделок.",
        icon: LayoutDashboard,
        category: "crm",
        relatedTab: Tabs.LEADS,
        availableFor: ["developer", "agency"],
      },
    ],
  },
  {
    id: "u_v1_5_0",
    version: "1.5.0",
    date: "01 Октября 2025",
    title: "Beta Launch",
    description: "Публичный запуск бета-версии Gridix.",
    roles: ["developer", "agency", "agent", "admin"],
    features: [
      {
        title: "Catalog Beta",
        description: "Базовый каталог новостроек с поиском.",
        icon: Building2,
        category: "marketing",
        relatedTab: Tabs.CATALOG,
        availableFor: ["developer", "agency", "agent", "admin"],
      },
    ],
  },
];
