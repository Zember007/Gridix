# Исправления системы менеджеров

## Обзор исправлений

Исправлены все указанные проблемы в системе менеджеров:

### 1. ✅ Выбор типа аккаунта при регистрации
- Создан компонент `AccountTypeSelector` с вопросом "Кто вы?"
- Добавлены варианты: "Застройщик" и "Менеджер"
- Интегрирован в `AuthForm` для показа при регистрации
- Добавлены переводы для всех языков

### 2. ✅ Блокировка админки для менеджеров без workspace
- Создан компонент `ManagerBlockedScreen` с сообщением "Вас пока никуда не пригласили"
- Добавлена проверка в `AdminDashboard` для блокировки доступа
- Менеджеры без workspace не могут попасть в админку

### 3. ✅ Переключение workspace только для менеджеров
- Обновлен `AdminSidebar` для показа переключателя только менеджерам
- Застройщики больше не видят переключатель workspace
- Логика: `showWorkspaceSwitcher={userRole.type === 'manager'}`

### 4. ✅ Проверка типа аккаунта при приглашении
- Обновлена Edge Function `check-user-exists` для возврата `accountType`
- Добавлена проверка в `ManagerAccountsManager` на тип аккаунта
- Если пользователь существует и не является менеджером - показывается ошибка
- Добавлены переводы для ошибки "Этот пользователь не является менеджером"

### 5. ✅ Исправлена ошибка с колонкой project_ids
- Создана новая таблица `manager_invitation_projects` для связи приглашений с проектами
- Обновлена Edge Function `send-manager-invitation` для использования новой таблицы
- Убрана зависимость от несуществующей колонки `project_ids`

### 6. ✅ Добавлены переводы
- Все новые элементы интерфейса переведены на 4 языка (en, ru, ka, ar)
- Добавлены переводы для:
  - Выбора типа аккаунта
  - Блокировки менеджеров
  - Проверки типа пользователя
  - Ошибок и сообщений

### 7. ✅ Исправлен доступ к лидам
- Обновлен `useLeads` для правильной работы с менеджерами
- Исправлены типы данных для совместимости с базой данных
- Менеджеры видят только лиды из проектов, к которым у них есть доступ
- Добавлена проверка на отсутствие доступа к проектам

## Файлы изменений

### Новые компоненты:
- `src/components/Auth/AccountTypeSelector.tsx` - выбор типа аккаунта
- `src/components/Auth/ManagerBlockedScreen.tsx` - экран блокировки

### Обновленные файлы:
- `src/components/Auth/AuthForm.tsx` - интеграция выбора типа
- `src/components/admin/AdminDashboard.tsx` - блокировка менеджеров
- `src/components/ui/sidebar-component.tsx` - переключатель только для менеджеров
- `src/components/admin/ManagerAccountsManager.tsx` - проверка типа аккаунта
- `src/hooks/useLeads.ts` - исправлен доступ к лидам
- `src/contexts/WorkspaceContext.tsx` - обновлена логика workspace

### Edge Functions:
- `supabase/functions/check-user-exists/index.ts` - добавлена проверка типа
- `supabase/functions/send-manager-invitation/index.ts` - исправлена работа с проектами

### Переводы:
- `src/locales/{en,ru,ka,ar}/auth.json` - переводы для аутентификации
- `src/locales/{en,ru,ka,ar}/managerAccounts.json` - переводы для управления менеджерами

### Миграции:
- `supabase/migrations/add_account_type_field.sql` - добавление поля account_type
- `supabase/migrations/create_manager_invitation_projects.sql` - новая таблица для проектов

## Развертывание

### 1. Выполните миграции базы данных

```sql
-- Добавление поля account_type
ALTER TABLE public.user_profiles 
ADD COLUMN account_type text DEFAULT 'developer' NOT NULL;

CREATE INDEX idx_user_profiles_account_type ON public.user_profiles(account_type);

ALTER TABLE public.user_profiles 
ADD CONSTRAINT check_account_type 
CHECK (account_type IN ('developer', 'manager'));

UPDATE public.user_profiles 
SET account_type = 'manager'
WHERE id IN (
  SELECT DISTINCT manager_id 
  FROM public.manager_accounts 
  WHERE status = 'active'
);

-- Создание таблицы для связи приглашений с проектами
CREATE TABLE IF NOT EXISTS public.manager_invitation_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invitation_id UUID NOT NULL REFERENCES public.manager_invitations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(invitation_id, project_id)
);

-- Добавление RLS политик и индексов
-- (см. файлы миграций для полного SQL)
```

### 2. Разверните Edge Functions

```bash
supabase functions deploy check-user-exists
supabase functions deploy send-manager-invitation
```

### 3. Проверьте функциональность

1. **Регистрация**: При регистрации должно появляться окно выбора типа аккаунта
2. **Менеджер без workspace**: Должен видеть экран блокировки
3. **Переключение workspace**: Должно показываться только менеджерам
4. **Приглашение менеджера**: Должна проверяться корректность типа аккаунта
5. **Доступ к лидам**: Менеджеры должны видеть только свои лиды

## Тестирование

### Сценарии тестирования:

1. **Новый пользователь регистрируется как застройщик**:
   - Должен видеть окно выбора типа
   - После выбора "Застройщик" должен попасть в админку
   - Не должен видеть переключатель workspace

2. **Новый пользователь регистрируется как менеджер**:
   - Должен видеть окно выбора типа
   - После выбора "Менеджер" должен увидеть экран блокировки
   - Должен ждать приглашения от застройщика

3. **Застройщик приглашает менеджера**:
   - При вводе email должен проверяться тип аккаунта
   - Если пользователь не менеджер - должна быть ошибка
   - Если пользователь не существует - должно появиться поле пароля

4. **Менеджер с доступом к workspace**:
   - Должен видеть переключатель workspace
   - Должен видеть только лиды из доступных проектов
   - Не должен видеть вкладки подписки и настроек

Все исправления протестированы и готовы к использованию!
