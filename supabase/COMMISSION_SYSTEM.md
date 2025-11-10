# Система начисления комиссий партнерам

## 1. Как посмотреть функцию `get_partner_commission_percentage` в Supabase Studio

### Способ 1: Через SQL Editor
1. Откройте Supabase Studio
2. Перейдите в раздел **SQL Editor**
3. Выполните запрос:
```sql
SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'get_partner_commission_percentage';
```

### Способ 2: Через Database → Functions
1. Откройте Supabase Studio
2. Перейдите в раздел **Database** → **Functions**
3. Найдите функцию `get_partner_commission_percentage`
4. Нажмите на неё, чтобы увидеть определение

### Способ 3: Прямой SQL запрос
```sql
\df+ get_partner_commission_percentage
```

## 2. Как работает система комиссий

### Логика расчета процента

Функция `get_partner_commission_percentage(link_type, partner_id)`:
1. **Считает общее количество проектов** всех клиентов партнера
2. **Ищет подходящий tier** в таблице `commission_tiers` на основе:
   - Количества проектов (min_projects ≤ количество ≤ max_projects)
   - Типа связи ('referral' или 'managed')
3. **Возвращает процент комиссии** из найденного tier

### Таблица `commission_tiers`

Структура таблицы:
- `min_projects` - минимальное количество проектов (включительно)
- `max_projects` - максимальное количество проектов (NULL = неограничено)
- `commission_percentage` - процент комиссии
- `link_type` - тип связи: 'referral', 'managed', или NULL (для всех типов)
- `is_active` - активен ли tier

### Дефолтные значения

**Для типа 'referral':**
- 0-4 проекта: 20%
- 5-9 проектов: 25%
- 10+ проектов: 30%

**Для типа 'managed':**
- 0-4 проекта: 20%
- 5-9 проектов: 25%
- 10+ проектов: 30%

## 3. Как изменять проценты комиссии (для суперадмина)

### Способ 1: Через SQL Editor в Supabase Studio

1. Откройте **SQL Editor**
2. Выполните SQL запросы для изменения процентов:

```sql
-- Пример: Изменить процент для referral с 0-4 проектов на 22%
UPDATE commission_tiers
SET commission_percentage = 22.00,
    updated_at = NOW()
WHERE link_type = 'referral'
AND min_projects = 0
AND max_projects = 4;

-- Пример: Добавить новый tier для 15+ проектов с 35%
INSERT INTO commission_tiers (min_projects, max_projects, commission_percentage, link_type)
VALUES (15, NULL, 35.00, 'referral');

-- Пример: Деактивировать tier
UPDATE commission_tiers
SET is_active = false,
    updated_at = NOW()
WHERE id = 'your-tier-id';
```

### Способ 2: Прямое редактирование через Table Editor

1. Откройте **Table Editor**
2. Найдите таблицу `commission_tiers`
3. Отредактируйте нужные строки:
   - Измените `commission_percentage`
   - Обновите `updated_at` (или это сделается автоматически)
4. Сохраните изменения

### Примеры запросов для управления

```sql
-- Посмотреть все активные tiers
SELECT * FROM commission_tiers 
WHERE is_active = true 
ORDER BY link_type, min_projects;

-- Посмотреть tiers для конкретного типа связи
SELECT * FROM commission_tiers 
WHERE link_type = 'referral' 
AND is_active = true 
ORDER BY min_projects;

-- Проверить, какой процент будет применен для партнера
SELECT get_partner_commission_percentage('referral', 'partner-id-here');

-- Посчитать количество проектов у партнера
SELECT 
    pp.id as partner_id,
    COUNT(DISTINCT p.id) as total_projects
FROM partner_profiles pp
LEFT JOIN user_profiles up ON up.partner_id = pp.id
LEFT JOIN projects p ON p.user_id = up.id
WHERE pp.id = 'partner-id-here'
GROUP BY pp.id;
```

## 4. Триггер начисления комиссии

Триггер `award_partner_commission` срабатывает:
- **Когда:** Подписка становится активной (`status = 'active'`)
- **Что делает:**
  1. Получает `partner_id` из профиля пользователя
  2. Проверяет наличие активной партнерской связи
  3. Вызывает `get_partner_commission_percentage()` для получения процента
  4. Рассчитывает сумму комиссии: `final_price * (percentage / 100)`
  5. Обновляет подписку и профиль партнера

## 5. Важные замечания

⚠️ **Внимание:**
- Изменения в `commission_tiers` применяются **только к новым** начислениям комиссии
- Уже начисленные комиссии не пересчитываются автоматически
- При изменении процентов убедитесь, что tiers не перекрываются некорректно
- Поле `max_projects = NULL` означает "неограничено" (10+ проектов)

## 6. Проверка работы системы

```sql
-- Тест функции для конкретного партнера
SELECT 
    'referral' as link_type,
    get_partner_commission_percentage('referral', 'your-partner-id') as commission_percentage;

-- Проверка количества проектов у партнера
SELECT 
    pp.id,
    COUNT(DISTINCT p.id) as total_projects
FROM partner_profiles pp
LEFT JOIN user_profiles up ON up.partner_id = pp.id
LEFT JOIN projects p ON p.user_id = up.id
WHERE pp.id = 'your-partner-id'
GROUP BY pp.id;
```

