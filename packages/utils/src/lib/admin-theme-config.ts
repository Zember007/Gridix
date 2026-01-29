/**
 * Конфигурация цветовой схемы админ панели
 * Этот файл содержит все цвета, используемые в админ панели
 * Изменение цветов в этом файле применится ко всей админ панели
 */

export interface AdminThemeConfig {
  // Основные цвета
  primary: string;
  primaryHover: string;
  primaryActive: string;
  
  // Фоновые цвета
  background: string;
  backgroundSecondary: string;
  backgroundHover: string;
  
  // Цвета текста
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;
  
  // Цвета границ
  border: string;
  borderLight: string;
  
  // Состояния
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Специальные цвета для админ панели
  sidebarBackground: string;
  sidebarBorder: string;
  sidebarActiveBackground: string;
  sidebarActiveBorder: string;
  sidebarActiveText: string;
  sidebarText: string;
  sidebarTextHover: string;
  
  // Карточки и контейнеры
  cardBackground: string;
  cardBorder: string;
  cardShadow: string;
}

/**
 * Черная цветовая схема для админ панели
 */
export const blackAdminTheme: AdminThemeConfig = {
  // Основные цвета - черные оттенки
  primary: '#000000',
  primaryHover: '#1a1a1a',
  primaryActive: '#333333',
  
  // Фоновые цвета
  background: '#ffffff',
  backgroundSecondary: '#f8f9fa',
  backgroundHover: '#f1f3f4',
  
  // Цвета текста
  textPrimary: '#000000',
  textSecondary: '#374151',
  textMuted: '#6b7280',
  textOnPrimary: '#ffffff',
  
  // Цвета границ
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  
  // Состояния
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Специальные цвета для админ панели
  sidebarBackground: '#000000',
  sidebarBorder: '#1f2937',
  sidebarActiveBackground: '#1f2937',
  sidebarActiveBorder: '#374151',
  sidebarActiveText: '#ffffff',
  sidebarText: '#d1d5db',
  sidebarTextHover: '#ffffff',
  
  // Карточки и контейнеры
  cardBackground: '#ffffff',
  cardBorder: '#e5e7eb',
  cardShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
};

/**
 * Синяя цветовая схема (оригинальная) для сравнения
 */
export const blueAdminTheme: AdminThemeConfig = {
  // Основные цвета - синие оттенки
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  primaryActive: '#1e40af',
  
  // Фоновые цвета
  background: '#ffffff',
  backgroundSecondary: '#f8f9fa',
  backgroundHover: '#f1f3f4',
  
  // Цвета текста
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6b7280',
  textOnPrimary: '#ffffff',
  
  // Цвета границ
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  
  // Состояния
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Специальные цвета для админ панели
  sidebarBackground: '#ffffff',
  sidebarBorder: '#e5e7eb',
  sidebarActiveBackground: '#eff6ff',
  sidebarActiveBorder: '#bfdbfe',
  sidebarActiveText: '#1d4ed8',
  sidebarText: '#374151',
  sidebarTextHover: '#111827',
  
  // Карточки и контейнеры
  cardBackground: '#ffffff',
  cardBorder: '#e5e7eb',
  cardShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
};

/**
 * Текущая активная тема админ панели
 * Измените эту переменную для смены цветовой схемы
 */
export const ADMIN_THEME: AdminThemeConfig = blackAdminTheme;

/**
 * Утилита для получения CSS переменных из темы
 */
export const getAdminThemeVariables = (theme: AdminThemeConfig = ADMIN_THEME) => ({
  '--admin-primary': theme.primary,
  '--admin-primary-hover': theme.primaryHover,
  '--admin-primary-active': theme.primaryActive,
  '--admin-background': theme.background,
  '--admin-background-secondary': theme.backgroundSecondary,
  '--admin-background-hover': theme.backgroundHover,
  '--admin-text-primary': theme.textPrimary,
  '--admin-text-secondary': theme.textSecondary,
  '--admin-text-muted': theme.textMuted,
  '--admin-text-on-primary': theme.textOnPrimary,
  '--admin-border': theme.border,
  '--admin-border-light': theme.borderLight,
  '--admin-success': theme.success,
  '--admin-warning': theme.warning,
  '--admin-error': theme.error,
  '--admin-info': theme.info,
  '--admin-sidebar-background': theme.sidebarBackground,
  '--admin-sidebar-border': theme.sidebarBorder,
  '--admin-sidebar-active-background': theme.sidebarActiveBackground,
  '--admin-sidebar-active-border': theme.sidebarActiveBorder,
  '--admin-sidebar-active-text': theme.sidebarActiveText,
  '--admin-sidebar-text': theme.sidebarText,
  '--admin-sidebar-text-hover': theme.sidebarTextHover,
  '--admin-card-background': theme.cardBackground,
  '--admin-card-border': theme.cardBorder,
  '--admin-card-shadow': theme.cardShadow,
});

/**
 * Утилита для создания CSS классов с темой
 */
export const adminThemeClasses = {
  // Основные классы
  primary: 'bg-[var(--admin-primary)] text-[var(--admin-text-on-primary)]',
  primaryHover: 'hover:bg-[var(--admin-primary-hover)]',
  primaryActive: 'active:bg-[var(--admin-primary-active)]',
  
  // Фоновые классы
  background: 'bg-[var(--admin-background)]',
  backgroundSecondary: 'bg-[var(--admin-background-secondary)]',
  backgroundHover: 'hover:bg-[var(--admin-background-hover)]',
  
  // Текстовые классы
  textPrimary: 'text-[var(--admin-text-primary)]',
  textSecondary: 'text-[var(--admin-text-secondary)]',
  textMuted: 'text-[var(--admin-text-muted)]',
  textOnPrimary: 'text-[var(--admin-text-on-primary)]',
  
  // Границы
  border: 'border-[var(--admin-border)]',
  borderLight: 'border-[var(--admin-border-light)]',
  
  // Сайдбар
  sidebarBackground: 'bg-[var(--admin-sidebar-background)]',
  sidebarBorder: 'border-[var(--admin-sidebar-border)]',
  sidebarActiveBackground: 'bg-[var(--admin-sidebar-active-background)]',
  sidebarActiveBorder: 'border-[var(--admin-sidebar-active-border)]',
  sidebarActiveText: 'text-[var(--admin-sidebar-active-text)]',
  sidebarText: 'text-[var(--admin-sidebar-text)]',
  sidebarTextHover: 'hover:text-[var(--admin-sidebar-text-hover)]',
  
  // Карточки
  cardBackground: 'bg-[var(--admin-card-background)]',
  cardBorder: 'border-[var(--admin-card-border)]',
};
