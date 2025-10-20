# Переделка системы менеджеров

## Обзор изменений

Система менеджеров была переделана согласно новым требованиям:

1. **Тип аккаунта**: Пользователи теперь имеют четкий тип - либо `manager`, либо `developer`
2. **Workspace для менеджеров**: Менеджеры работают только в workspace застройщиков, у них нет собственного workspace
3. **Ограниченный доступ**: Менеджеры не видят вкладки подписки и настроек
4. **Доступ к лидам**: Менеджеры видят только лиды из проектов, к которым у них есть доступ
5. **Улучшенное приглашение**: При добавлении менеджера проверяется существование пользователя и при необходимости запрашивается пароль

## Изменения в коде

### 1. База данных
- Добавлено поле `account_type` в таблицу `user_profiles`
- Создан индекс для быстрых запросов
- Добавлено ограничение для валидных значений

### 2. Хуки и контексты
- **`useUserRole`**: Убран тип `'both'`, упрощена логика определения роли
- **`WorkspaceContext`**: Менеджеры автоматически выбирают первый доступный workspace застройщика
- **`useLeads`**: Добавлена фильтрация лидов для менеджеров по доступным проектам

### 3. Компоненты
- **`AdminSidebar`**: Скрыты вкладки подписки и настроек для менеджеров
- **`AdminDashboard`**: Обновлены условия рендеринга вкладок
- **`ManagerAccountsManager`**: Добавлен onBlur для проверки email и поле пароля

### 4. Edge Functions
- **`check-user-exists`**: Новая функция для проверки существования пользователя
- **`send-manager-invitation`**: Обновлена для работы с паролями и установки `account_type`

### 5. Переводы
Добавлены переводы для всех языков (en, ru, ka, ar):
- `setPassword` - "Set password for new manager"
- `passwordPlaceholder` - "Enter password"
- `userExists` - "User with this email already exists"
- `userNotExists` - "New user will be created"
- `passwordRequired` - "Password is required for new users"
- `checkingUser` - "Checking if user exists..."

## Развертывание

### 1. Выполните миграцию базы данных

Выполните SQL скрипт из файла `supabase/migrations/add_account_type_field.sql` в Supabase SQL Editor:

```sql
-- Добавляем поле account_type в таблицу user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN account_type text DEFAULT 'developer' NOT NULL;

-- Добавляем индекс для быстрых запросов
CREATE INDEX idx_user_profiles_account_type ON public.user_profiles(account_type);

-- Добавляем ограничение для валидных значений
ALTER TABLE public.user_profiles 
ADD CONSTRAINT check_account_type 
CHECK (account_type IN ('developer', 'manager'));

-- Обновляем существующих пользователей
UPDATE public.user_profiles 
SET account_type = 'manager'
WHERE id IN (
  SELECT DISTINCT manager_id 
  FROM public.manager_accounts 
  WHERE status = 'active'
);
```

### 2. Разверните Edge Functions

Разверните новые Edge Functions в Supabase:

```bash
# Развертывание check-user-exists
supabase functions deploy check-user-exists

# Обновление send-manager-invitation
supabase functions deploy send-manager-invitation
```

### 3. Проверьте развертывание

1. **Проверьте миграцию**:
   ```sql
   SELECT account_type, COUNT(*) as user_count
   FROM public.user_profiles 
   GROUP BY account_type;
   ```

2. **Проверьте Edge Functions**:
   - Убедитесь, что `check-user-exists` работает
   - Убедитесь, что `send-manager-invitation` принимает параметр `password`

3. **Проверьте функциональность**:
   - Менеджеры не видят вкладки подписки и настроек
   - Менеджеры работают только в workspace застройщиков
   - При добавлении менеджера проверяется существование пользователя
   - Новые менеджеры создаются с правильным `account_type`

## Тестирование

### Сценарии тестирования

1. **Менеджер входит в систему**:
   - Должен автоматически выбрать workspace застройщика
   - Не должен видеть вкладки подписки и настроек
   - Должен видеть только лиды из доступных проектов

2. **Застройщик добавляет менеджера**:
   - При вводе email и потере фокуса проверяется существование пользователя
   - Если пользователь не существует, появляется поле пароля
   - Если пользователь существует, пароль не требуется

3. **Новый менеджер**:
   - Создается с `account_type = 'manager'`
   - Может войти с предоставленным паролем
   - Видит только назначенные проекты

## Откат изменений

Если необходимо откатить изменения:

1. **Удалите поле account_type**:
   ```sql
   ALTER TABLE public.user_profiles DROP COLUMN account_type;
   ```

2. **Восстановите старую логику**:
   - Верните тип `'both'` в `useUserRole`
   - Восстановите workspace переключение для менеджеров
   - Покажите все вкладки для менеджеров

3. **Удалите Edge Functions**:
   ```bash
   supabase functions delete check-user-exists
   ```

## Примечания

- Все изменения обратно совместимы
- Существующие пользователи автоматически получают правильный `account_type`
- Новые менеджеры создаются с правильными настройками
- Система поддерживает мультиязычность
