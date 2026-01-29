# Инструкции по сборке приложения

## Локальная разработка

### Запуск dev сервера

```bash
# Из корня монорепозитория
pnpm dev:main

# Или напрямую
pnpm --filter @gridix/main dev
```

Приложение будет доступно на `http://localhost:8080`

### Запуск agent-cabinet

```bash
pnpm dev:agent

# Или
pnpm --filter @gridix/agent-cabinet dev
```

Приложение будет доступно на `http://localhost:8081`

## Сборка для продакшена

### Основное приложение

```bash
# Установка зависимостей (если еще не установлены)
pnpm install

# Сборка основного приложения
pnpm --filter @gridix/main build

# Результат будет в apps/main/dist/
```

### Сборка виджета

```bash
pnpm --filter @gridix/main build:widget

# Результат будет в public/widget/
```

### Сборка всех пакетов

```bash
# Сборка всех packages и apps
pnpm turbo run build

# Или только packages
pnpm turbo run build --filter='./packages/*'
```

## Структура после сборки

```
gridix-app/
├── apps/
│   ├── main/
│   │   └── dist/              # ← Продакшен сборка основного приложения
│   │       ├── index.html
│   │       └── assets/
│   └── agent-cabinet/
│       └── dist/              # ← Продакшен сборка agent-cabinet
├── public/
│   └── widget/                # ← Виджет (если собран)
│       ├── index.js
│       └── style.css
└── packages/
    ├── ui/
    │   └── dist/              # ← Собранные UI компоненты (если настроено)
    └── ...
```

## Проверка сборки

### Проверка структуры

```bash
# Проверка наличия файлов
ls -la apps/main/dist/

# Должны быть:
# - index.html
# - assets/ (папка с JS и CSS)
```

### Локальный preview

```bash
# После сборки можно запустить preview
pnpm --filter @gridix/main preview

# Или использовать serve
npx serve apps/main/dist
```

## Типичные проблемы и решения

### 1. Ошибка: "Cannot find module @gridix/ui"

**Причина:** Workspace packages не установлены

**Решение:**
```bash
pnpm install
```

### 2. Ошибка: "tsconfig extends not found"

**Причина:** Неправильные пути в tsconfig.json

**Решение:** Используйте относительные пути:
```json
{
  "extends": "../../packages/config/typescript/tsconfig.base.json"
}
```

### 3. Ошибка: "Module not found" для workspace packages

**Причина:** Неправильные импорты

**Решение:** Убедитесь, что используете правильные импорты:
```typescript
// ✅ Правильно
import { Button } from '@gridix/ui';
import { cn } from '@gridix/utils/lib';

// ❌ Неправильно
import { Button } from '/ui';
import { Button } from '@/shared/ui/button';
```

### 4. Ошибка сборки: "Rollup failed to resolve import"

**Причина:** Неправильные пути импортов или отсутствующие зависимости

**Решение:**
1. Проверьте все импорты в коде
2. Убедитесь, что все workspace packages имеют правильные `package.json`
3. Выполните `pnpm install` заново

## Оптимизация сборки

### Использование Turborepo кэша

Turborepo автоматически кэширует результаты сборки:

```bash
# Первая сборка (медленнее)
pnpm turbo run build

# Последующие сборки (быстрее, использует кэш)
pnpm turbo run build
```

### Очистка кэша

```bash
# Очистка кэша Turborepo
pnpm turbo run clean

# Очистка node_modules и переустановка
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

## Production Build Checklist

Перед деплоем убедитесь:

- [ ] `pnpm install` выполнен успешно
- [ ] `pnpm turbo run typecheck` проходит без ошибок
- [ ] `pnpm turbo run lint` проходит без ошибок
- [ ] `pnpm --filter @gridix/main build` завершается успешно
- [ ] `apps/main/dist/` содержит все необходимые файлы
- [ ] `index.html` существует в `apps/main/dist/`
- [ ] Все environment variables настроены
- [ ] Тесты проходят (если есть)

## Размер сборки

Проверка размера сборки:

```bash
# Размер dist папки
du -sh apps/main/dist/

# Детальный размер файлов
du -h apps/main/dist/**/* | sort -h
```

## Source Maps

Source maps отключены в продакшен сборке (для безопасности и размера).

Если нужны source maps для debugging:

1. Откройте `apps/main/vite.config.ts`
2. Измените `sourcemap: false` на `sourcemap: true`
3. Пересоберите приложение

## Команды для быстрого доступа

Добавьте в `package.json` (root):

```json
{
  "scripts": {
    "dev": "pnpm turbo run dev",
    "build": "pnpm turbo run build",
    "build:main": "pnpm --filter @gridix/main build",
    "build:agent": "pnpm --filter @gridix/agent-cabinet build",
    "preview:main": "pnpm --filter @gridix/main preview",
    "clean": "pnpm turbo run clean"
  }
}
```

Тогда можно использовать:
- `pnpm build:main` - сборка основного приложения
- `pnpm preview:main` - preview собранного приложения
