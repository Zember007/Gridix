# Оптимизации производительности

## Обзор

Этот документ описывает оптимизации, внедренные в проект для улучшения производительности и сокращения количества запросов к базе данных.

## 1. Кеширование данных проектов

### `useProjectCache(projectId)`

Основной хук для работы с данными проекта с кешированием:

```typescript
import { useProjectCache } from '@/hooks/useProjectCache';

const { project, loading, error, getCurrency, refresh, clearCache } = useProjectCache(projectId);
```

**Особенности:**
- Кеширование на 5 минут
- Предотвращение дублирования запросов
- Система подписок для синхронизации между компонентами
- Автоматическая очистка при размонтировании

### `useProjectCurrency(projectId)`

Легковесная версия для получения только валюты проекта:

```typescript
import { useProjectCurrency } from '@/hooks/useProjectCache';

const { currency, loading, error } = useProjectCurrency(projectId);
```

## 2. Оптимизированная загрузка проектов с ценами

### `useProjectsWithPrices(userId)`

Хук для эффективной загрузки проектов с минимальными ценами И проверки существования пользователя:

```typescript
import { useProjectsWithPrices } from '@/hooks/useProjectsWithPrices';

const { projects, loading, error, userExists, refresh } = useProjectsWithPrices(userId);
```

**Преимущества:**
- Объединенная проверка пользователя + загрузка проектов одним хуком
- Один оптимизированный запрос вместо N+1 запросов
- Использование SQL функции `get_projects_with_min_prices`
- Fallback метод для совместимости
- Кеширование результатов пользователей и проектов
- **Исключает дублирование запросов** user_profiles

### `useUserExists(userId)` - УСТАРЕЛ ⚠️

```typescript
// ❌ УСТАРЕЛО - НЕ ИСПОЛЬЗУЙТЕ
import { useUserExists } from '@/hooks/useProjectsWithPrices';
const { exists, loading } = useUserExists(userId);

// ✅ ИСПОЛЬЗУЙТЕ ВМЕСТО ЭТОГО
import { useProjectsWithPrices } from '@/hooks/useProjectsWithPrices';
const { userExists, projects, loading } = useProjectsWithPrices(userId);
```

**Почему устарел:**
- Вызывал дублирование запросов при совместном использовании с useProjectsWithPrices
- Функциональность интегрирована в useProjectsWithPrices для оптимизации

## 3. SQL оптимизации

### Функция `get_projects_with_min_prices`

Создана оптимизированная SQL функция для получения проектов с минимальными ценами:

```sql
CREATE OR REPLACE FUNCTION get_projects_with_min_prices(user_id_param uuid)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  address text,
  building_image_url text,
  latitude double precision,
  longitude double precision,
  currency text,
  min_price numeric
)
```

**Преимущества:**
- LEFT JOIN для эффективного получения минимальных цен
- Одиночный запрос вместо множественных
- Группировка на уровне базы данных

## 4. Предзагрузка данных

### `preloadProject(projectId)`

Функция для предварительной загрузки данных проекта в кеш:

```typescript
import { preloadProject } from '@/hooks/useProjectCache';

// Предзагружаем данные проекта
await preloadProject(projectId);
```

**Использование:**
- В компонентах-списках для предзагрузки данных при наведении
- При переходах между страницами
- Для улучшения пользовательского опыта

## 5. Архитектура кеширования

### Глобальные кеши

```typescript
// Кеш проектов
const projectCache = new Map<string, { data: Project; timestamp: number }>();

// Кеш существования пользователей
const userExistsCache = new Map<string, { exists: boolean; timestamp: number }>();

// Состояния загрузки для предотвращения дублирования
const loadingProjects = new Set<string>();

// Система подписок
const projectSubscribers = new Map<string, Set<(project: Project | null) => void>>();
```

### Время жизни кеша

- **Проекты**: 5 минут
- **Существование пользователей**: 10 минут

## 6. Обновленные компоненты

### ApartmentList

Теперь использует `useProjectCurrency` для эффективного получения валюты:

```tsx
<ApartmentList
  apartments={apartments}
  onApartmentSelect={handleApartmentSelect}
  projectId={projectId} // Автоматически кеширует данные о валюте
/>
```

### EmbedProjectsPage

Использует оптимизированные хуки для загрузки данных:

```tsx
const { exists: userExists, loading: userLoading } = useUserExists(userId);
const { projects, loading: projectsLoading, error } = useProjectsWithPrices(userId);
```

## 7. Метрики производительности

### До оптимизации:
- N+1 запросов для загрузки проектов с ценами
- Повторные запросы валюты для каждого компонента
- Дублирование запросов при одновременном использовании

### После оптимизации:
- 1 запрос для всех проектов с минимальными ценами
- Кеширование данных проектов и валют
- Предотвращение дублирования запросов
- Система подписок для синхронизации

## 8. Рекомендации по использованию

1. **Используйте `useProjectCache`** для полных данных проекта
2. **Используйте `useProjectCurrency`** для получения только валюты
3. **Предзагружайте данные** с помощью `preloadProject`
4. **Очищайте кеш** при обновлении данных проекта
5. **Мониторьте** состояния загрузки для UX

## 9. Миграции

Для активации оптимизаций выполните миграцию:

```bash
supabase migration up
```

Это создаст SQL функцию `get_projects_with_min_prices` для оптимизированной загрузки данных.

## 10. Предотвращение дублирования запросов

### Основные причины дублирования:

1. **Множественные хуки для одних данных:**
   ```typescript
   // ❌ ПЛОХО - дублирование запросов
   const { exists } = useUserExists(userId);
   const { projects } = useProjectsWithPrices(userId); // тоже проверяет пользователя
   
   // ✅ ХОРОШО - один запрос
   const { userExists, projects } = useProjectsWithPrices(userId);
   ```

2. **Прямые запросы в компонентах:**
   ```typescript
   // ❌ ПЛОХО - прямые запросы без кеширования
   useEffect(() => {
     supabase.from('projects').select('*').eq('user_id', userId);
   }, [userId]);
   
   // ✅ ХОРОШО - использование кеширующих хуков
   const { projects } = useProjectsWithPrices(userId);
   ```

3. **Игнорирование кеша:**
   ```typescript
   // ❌ ПЛОХО - каждый компонент делает свой запрос
   const Component1 = () => {
     const { project } = useProject(projectId); // запрос 1
   };
   const Component2 = () => {
     const { project } = useProject(projectId); // запрос 2 (дубль)
   };
   
   // ✅ ХОРОШО - второй компонент использует кеш первого
   const Component1 = () => {
     const { project } = useProjectCache(projectId); // запрос 1
   };
   const Component2 = () => {
     const { project } = useProjectCache(projectId); // из кеша
   };
   ```

### Решения:

1. **Используйте объединенные хуки:**
   - `useProjectsWithPrices` вместо `useUserExists` + отдельных запросов
   
2. **Избегайте прямых запросов:**
   - Всегда используйте хуки с кешированием
   
3. **Предзагружайте данные:**
   - Используйте `preloadProject` для критических данных

## 11. Совместимость

Все хуки включают fallback методы для обеспечения совместимости в случае недоступности оптимизированных функций.