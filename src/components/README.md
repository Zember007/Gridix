# Архитектура компонентов

Данная структура организует компоненты по логическим группам для лучшей читаемости и поддержки кода.

## Структура каталогов

### `/admin`
Компоненты административной панели:
- `AdminDashboard` - Главная панель администратора
- `AdminSettings` - Настройки системы
- `AdminWidgets` - Виджеты для админки
- `AllFieldsManager` - Управление всеми полями
- `AmoCRMSettings` - Настройки интеграции с AmoCRM
- `ManagerAccountsManager` - Управление аккаунтами менеджеров

### `/apartment`
Компоненты для работы с квартирами:
- `ApartmentCustomFields` - Кастомные поля квартир
- `ApartmentDetailsModal` - Модальное окно деталей квартиры
- `ApartmentDetailsPanel` - Панель деталей квартиры
- `ApartmentDetailsWithFields` - Детали квартиры с полями
- `ApartmentFloorPlan` - План этажа с квартирами
- `ApartmentList` - Список квартир
- `ApartmentPhotosManager` - Управление фото квартир
- `ApartmentPhotosViewer` - Просмотр фото квартир
- `ApartmentReservationForm` - Форма бронирования квартиры
- `ApartmentSyncDialog` - Диалог синхронизации квартир
- `ApartmentTooltip` - Тултип для квартиры

### `/auth`
Компоненты аутентификации:
- `AuthForm` - Форма входа/регистрации
- `ProtectedRoute` - Защищенный маршрут
- `ResetPasswordForm` - Форма сброса пароля

### `/data-import`
Компоненты импорта данных:
- `DataImport` - Общий импорт данных
- `ExcelColumnMapper` - Маппинг колонок Excel
- `ExcelUrlImporter` - Импорт из Excel по URL
- `GoogleSheetsImportDemo` - Демо импорта из Google Sheets
- `OptimizedRequestsDemo` - Демо оптимизированных запросов

### `/fields`
Компоненты управления полями:
- `CustomFieldsManager` - Управление кастомными полями
- `FieldsOrderManager` - Управление порядком полей

### `/projects`
Компоненты проектов:
- `ProjectApartmentsManager` - Управление квартирами проекта
- `ProjectCreationModal` - Модальное окно создания проекта
- `ProjectEditor` - Редактор проекта
- `ProjectList` - Список проектов
- `ProjectsGallery` - Галерея проектов
- `ProjectViewer` - Просмотр проекта

### `/project-selector`
Модульный селектор проектов (рефакторинг `ProjectApartmentSelector`):
- `ProjectApartmentSelector` - Главный компонент
- `ViewModeButtons` - Кнопки переключения режимов
- `FloorSelector` - Селектор этажей

#### `/filters`
- `CompactFilters` - Компактные фильтры для десктопа
- `ExpandedFilters` - Расширенные фильтры (слайдеры)
- `MobileFilters` - Фильтры для мобильных устройств

#### `/views`
- `ListView` - Режим списка (таблица/сетка)

#### `/layouts`
- `LayoutGallery` - Галерея планировок

#### `/hooks`
- `useProjectFilters` - Хук для логики фильтрации

### `/visualization`
Компоненты визуализации:
- `BuildingFacadeView` - Вид фасада здания
- `BuildingImageEditor` - Редактор изображения здания
- `BuildingPolygonSettings` - Настройки полигонов здания
- `FloorPlanEditor` - Редактор плана этажа
- `FloorPlanView` - Просмотр плана этажа
- `InteractiveProjectsMap` - Интерактивная карта проектов
- `LayoutPhotosManager` - Управление фото планировок
- `PolygonCustomizationSettings` - Настройки кастомизации полигонов

#### `/polygon-editor`
- `GeometryShapes` - Геометрические фигуры
- `PolygonCanvas` - Канвас для полигонов
- `PolygonEditor` - Редактор полигонов
- `PolygonToolbar` - Панель инструментов полигонов

### `/ui`
UI компоненты (shadcn/ui)

## Использование

### Импорт компонентов

```typescript
// Импорт из конкретной категории
import { AdminDashboard } from '@/components/admin';
import { ApartmentFloorPlan } from '@/components/apartment';
import { ProjectApartmentSelector } from '@/components/project-selector';

// Импорт из общего индекса
import { AdminDashboard, ApartmentFloorPlan } from '@/components';
```

### Принципы организации

1. **Логическое группирование** - компоненты сгруппированы по функциональности
2. **Модульность** - каждая группа имеет свой индексный файл
3. **Повторное использование** - компоненты легко найти и переиспользовать
4. **Масштабируемость** - легко добавлять новые компоненты в существующие группы

### Рефакторинг ProjectApartmentSelector

Большой монолитный компонент `ProjectApartmentSelector` был разделен на:
- Хуки для логики (`useProjectFilters`)
- Компоненты фильтров (`CompactFilters`, `ExpandedFilters`, `MobileFilters`)
- Компоненты представлений (`ListView`)
- Вспомогательные компоненты (`ViewModeButtons`, `FloorSelector`)
- Компоненты макетов (`LayoutGallery`)

Это делает код более читаемым, тестируемым и поддерживаемым.
