# Currency Utils - Документация

## Доступные функции

### 1. `getCurrencySymbol(currency: CurrencyType): string`
Получает символ валюты по коду валюты.

**Поддерживаемые валюты:**
- `RUB` → `₽`
- `USD` → `$`
- `EUR` → `€`
- `GEL` → `₾`

**Пример:**
```typescript
import { getCurrencySymbol } from '@/lib/currency-utils';

const symbol = getCurrencySymbol('USD'); // '$'
```

### 2. `getCurrencySymbolSafe(currency: string | null): string`
Безопасная версия получения символа валюты. Возвращает символ рубля (₽) если валюта не указана или не поддерживается.

**Пример:**
```typescript
import { getCurrencySymbolSafe } from '@/lib/currency-utils';

const symbol1 = getCurrencySymbolSafe('USD'); // '$'
const symbol2 = getCurrencySymbolSafe(null); // '₽'
const symbol3 = getCurrencySymbolSafe('INVALID'); // '₽'
```

### 3. `formatPriceWithCurrency(price: number, currency: string | null, locale?: string): string`
Форматирует цену с символом валюты. Если цена не указана, возвращает "Цена по запросу".

**Параметры:**
- `price: number` - цена
- `currency: string | null` - код валюты
- `locale: string` - локаль для форматирования (по умолчанию 'en-US')

**Пример:**
```typescript
import { formatPriceWithCurrency } from '@/lib/currency-utils';

const price1 = formatPriceWithCurrency(1500000, 'RUB'); // '1 500 000 ₽'
const price2 = formatPriceWithCurrency(50000, 'USD'); // '50,000 $'
const price3 = formatPriceWithCurrency(0, 'EUR'); // 'Цена по запросу'
```

### 4. `isValidCurrency(currency: string): currency is CurrencyType`
Проверяет, является ли строка валидным кодом валюты.

**Пример:**
```typescript
import { isValidCurrency } from '@/lib/currency-utils';

const isValid1 = isValidCurrency('USD'); // true
const isValid2 = isValidCurrency('INVALID'); // false
```

### 5. `getCurrencyInfo(currency: CurrencyType): CurrencyInfo`
Получает полную информацию о валюте.

**Пример:**
```typescript
import { getCurrencyInfo } from '@/lib/currency-utils';

const info = getCurrencyInfo('USD');
// {
//   code: 'USD',
//   symbol: '$',
//   name: 'US Dollar',
//   translationKey: 'currency.usd'
// }
```

## Использование в компонентах

### Пример в EmbedProjectsPage.tsx:
```typescript
import { formatPriceWithCurrency } from '@/lib/currency-utils';

// В JSX:
<div className="text-gray-600 text-sm mb-4">
  {project.min_price !== null ? (
    <>
      {t('gallery.from')} {formatPriceWithCurrency(project.min_price, project.currency)}
    </>
  ) : (
    <span className="text-gray-400">{t('gallery.priceOnRequest')}</span>
  )}
</div>
```

### Пример использования ApartmentList с валютой:
```typescript
import ApartmentList from '@/components/ApartmentList';

// В компоненте:
<ApartmentList
  apartments={apartments}
  onApartmentSelect={handleApartmentSelect}
  projectId={projectId} // Передаем ID проекта для получения информации о валюте
/>
```

Компонент `ApartmentList` автоматически:
1. Получает информацию о валюте проекта из базы данных (с кешированием)
2. Форматирует цены с правильным символом валюты
3. Отображает цены за квадратный метр с валютой проекта

### Оптимизированные хуки для проектов:

#### `useProjectCache(projectId)` - кеширование данных проекта
```typescript
import { useProjectCache } from '@/hooks/useProjectCache';

const { project, loading, error, getCurrency } = useProjectCache(projectId);
```

#### `useProjectCurrency(projectId)` - только валюта проекта
```typescript
import { useProjectCurrency } from '@/hooks/useProjectCache';

const { currency, loading, error } = useProjectCurrency(projectId);
```

#### `useProjectsWithPrices(userId)` - проекты с минимальными ценами
```typescript
import { useProjectsWithPrices } from '@/hooks/useProjectsWithPrices';

const { projects, loading, error } = useProjectsWithPrices(userId);
```

### Преимущества оптимизированных хуков:
- **Кеширование**: Данные кешируются на 5 минут, избегая повторных запросов
- **Дедупликация**: Предотвращение дублирования запросов при одновременном использовании
- **Подписки**: Компоненты получают обновления при изменении данных
- **Оптимизированные запросы**: Один запрос вместо множественных для получения минимальных цен

## Добавление новых валют

Для добавления новой валюты отредактируйте объект `CURRENCIES` в файле `currency-utils.ts`:

```typescript
export const CURRENCIES: Record<CurrencyType, CurrencyInfo> = {
  // ... существующие валюты
  NEW_CURRENCY: {
    code: 'NEW_CURRENCY',
    symbol: '₿',
    name: 'New Currency',
    translationKey: 'currency.new_currency'
  }
};
```

Не забудьте обновить тип `CurrencyType`:
```typescript
export type CurrencyType = 'RUB' | 'USD' | 'EUR' | 'GEL' | 'NEW_CURRENCY';
``` 