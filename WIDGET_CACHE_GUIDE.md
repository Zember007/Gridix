# Widget Cache Management Guide

## Автоматическая очистка кеша

Виджет теперь автоматически очищает кеш при изменении версии. Это происходит только один раз после пересборки виджета.

### Как это работает:

1. **При первой загрузке** - версия сохраняется в localStorage
2. **При последующих загрузках** - версия сравнивается с сохраненной
3. **При изменении версии** - кеш автоматически очищается и новая версия сохраняется

### Версии виджета:

- **Build-time версия**: `__WIDGET_VERSION__` (генерируется при сборке)
- **Runtime версия**: `window.__GRIDIX_WIDGET_VERSION__` (встраивается в widget-inline.js)
- **Приоритет**: Runtime версия имеет приоритет над build-time версией

## Ручное управление кешем

### Принудительная очистка кеша:

```javascript
// Очистить кеш для конкретного контейнера
GridixWidget.clearCache('my-widget-container');

// Очистить кеш для контейнера по умолчанию
GridixWidget.clearCache();
```

### Принудительная перезагрузка при инициализации:

```javascript
// Через параметры
GridixWidget.init({
  projectId: 'your-project',
  forceReload: true
});

// Через URL параметры
// ?forceReload=true

// Через кастомный cache busting
GridixWidget.init({
  projectId: 'your-project',
  cacheBust: 'unique-version-string'
});
```

## Логирование

Виджет выводит в консоль информацию о процессе очистки кеша:

- `GridixWidget: First load, version stored: [version]`
- `GridixWidget: Version changed, cache will be cleared`
- `GridixWidget: Version mismatch detected: [old] -> [new]`
- `GridixWidget: Cache cleared for container [id]`

## Технические детали

### localStorage ключи:
- `gridix-widget-version` - хранит текущую версию виджета

### Shadow DOM очистка:
- Очищается содержимое shadow root
- Очищается содержимое контейнера
- Принудительно перезагружаются стили

### Обработка ошибок:
- При ошибках доступа к localStorage кеш очищается принудительно
- Все ошибки логируются в консоль
