# Widget Shadow DOM - Изоляция стилей

## Обзор

Виджет Gridix теперь использует **Shadow DOM** для полной изоляции стилей. Это означает, что стили виджета не будут конфликтовать со стилями сайта, на котором он встраивается, и наоборот.

## Что такое Shadow DOM?

Shadow DOM - это веб-стандарт, который позволяет создавать изолированное поддерево DOM со своими собственными стилями. Стили внутри Shadow DOM не влияют на остальную страницу, и стили страницы не влияют на содержимое Shadow DOM.

## Преимущества

✅ **Полная изоляция стилей** - стили виджета не конфликтуют со стилями сайта
✅ **Предсказуемость** - виджет выглядит одинаково на любом сайте
✅ **Безопасность** - стили сайта не могут сломать внешний вид виджета
✅ **Современный подход** - используется веб-стандартами (например, Web Components)

## Как это работает

### Структура DOM

```
<div id="gridix-widget-root">         ← Host element (обычный DOM)
  #shadow-root (open)                  ← Shadow DOM boundary
    <link rel="stylesheet" href="..."> ← Стили виджета (изолированы)
    <div id="gridix-widget-mount">     ← React рендерится здесь
      <!-- React App -->
    </div>
</div>
```

### Процесс инициализации

1. **Создание host container** - обычный div элемент в DOM страницы
2. **Создание Shadow DOM** - `attachShadow({ mode: 'open' })`
3. **Загрузка стилей** - `<link>` элемент внутри Shadow DOM
4. **Рендеринг React** - React приложение монтируется внутри Shadow DOM

## Использование

Никаких изменений в API не требуется. Виджет работает как и раньше:

```html
<div id="gridix-widget-root"></div>
<script src="https://gridix.live/widget.js"></script>
<script>
  window.GridixWidget.init({
    projectId: "your-project-id",
    lang: "ru"
  });
</script>
```

## Тестирование изоляции

См. файл `public/test.html` - там добавлены агрессивные стили страницы для демонстрации работы изоляции:

```css
/* Эти стили НЕ влияют на виджет благодаря Shadow DOM */
* {
  margin: 0 !important;
  padding: 0 !important;
}
div {
  border: 5px dashed purple !important;
}
```

## Технические детали

### Файл: `src/widget.tsx`

#### Функция `createShadowRoot`
Создаёт Shadow DOM и mount point для React:

```typescript
function createShadowRoot(hostElement: HTMLElement): { 
  shadowRoot: ShadowRoot; 
  mountPoint: HTMLElement 
}
```

#### Функция `loadStylesIntoShadow`
Загружает CSS файл внутрь Shadow DOM:

```typescript
function loadStylesIntoShadow(
  shadowRoot: ShadowRoot, 
  options: InitOptions
): Promise<void>
```

### Совместимость

Shadow DOM поддерживается всеми современными браузерами:

- ✅ Chrome 53+
- ✅ Firefox 63+
- ✅ Safari 10+
- ✅ Edge 79+

Для старых браузеров может потребоваться полифилл.

## Ограничения и особенности

### 1. Глобальные стили не работают

Стили из родительского документа НЕ попадают в Shadow DOM. Это означает:

❌ Глобальные шрифты из `<head>` не применяются
❌ CSS переменные из `:root` не доступны
❌ Reset стили (normalize.css) не действуют

**Решение**: Все необходимые стили должны быть включены в `style.css` виджета.

### 2. Event bubbling

События из Shadow DOM всё ещё всплывают в родительский документ, но с изменённым `target` (указывает на host element).

### 3. Accessibility

Shadow DOM в режиме `open` полностью доступен для screen readers и других accessibility tools.

### 4. Селекторы

Из родительского документа нельзя обратиться к элементам внутри Shadow DOM через обычные селекторы:

```javascript
// Не работает - не найдёт элементы внутри Shadow DOM
document.querySelector('#gridix-widget-mount');
```

**Решение**: Использовать `shadowRoot.querySelector()`.

## Отладка

Для отладки Shadow DOM в DevTools:

1. Откройте Chrome DevTools
2. Найдите `#gridix-widget-root` в Elements
3. Раскройте `#shadow-root (open)`
4. Внутри вы увидите изолированное дерево DOM

Консоль логи:
- `[GridixWidget] Styles loaded successfully` - стили загружены
- `[GridixWidget] Initialized successfully with Shadow DOM isolation` - виджет инициализирован

## Дальнейшее развитие

### Возможные улучшения:

1. **CSS Custom Properties** - передача темы через CSS переменные
2. **Slots** - для кастомизации отдельных частей виджета
3. **Lazy loading** - подгрузка стилей по требованию
4. **Polyfills** - поддержка старых браузеров

### Кастомизация темы

В будущем можно добавить возможность передачи CSS переменных:

```javascript
window.GridixWidget.init({
  projectId: "...",
  customStyles: {
    '--primary-color': '#007bff',
    '--font-family': 'Arial, sans-serif'
  }
});
```

## Вопросы и ответы

**Q: Можно ли отключить Shadow DOM?**
A: Нет, это базовая часть изоляции. Без Shadow DOM стили будут конфликтовать.

**Q: Как применить свои стили к виджету?**
A: Через CSS Custom Properties (если реализовано) или через `cssUrl` опцию.

**Q: Влияет ли Shadow DOM на производительность?**
A: Нет, влияние минимально. Shadow DOM - это нативная браузерная функция.

**Q: Работает ли виджет в iframe?**
A: Да, Shadow DOM работает и в iframe, обеспечивая двойную изоляцию.

## Ссылки

- [MDN: Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM)
- [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [React and Shadow DOM](https://reactjs.org/docs/web-components.html)

