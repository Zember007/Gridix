# Настройка кастомных доменов / Custom Domains Setup

## Описание функциональности

Система кастомных доменов позволяет клиентам подключать собственные домены к своим проектам для брендинга. При заходе на кастомный домен пользователь автоматически попадает на страницу соответствующего проекта.

## ⚡ Автоматизированное решение (НОВОЕ)

**Проблема старой системы:** Требовалось ручное вмешательство для каждого нового домена - обновление Nginx, получение SSL сертификатов, настройка DNS.

**Новое решение:** Полная автоматизация процесса добавления доменов для тысяч клиентов.

## Как это работает

1. **База данных**: Таблица `project_domains` хранит маппинг доменов к проектам
2. **Роутинг**: При заходе на главную страницу (`/`) проверяется hostname
3. **Редирект**: Если домен найден в БД, происходит редирект на страницу проекта
4. **Fallback**: Если домен не найден, работает обычная логика приложения

## Автоматизированная настройка для разработчика

### 1. Применить миграцию

```bash
# Применить миграцию для создания таблицы project_domains
supabase db push
```

### 2. Настроить переменные окружения

Добавьте в `.env`:

```env
# Основные домены приложения (через запятую)
# Эти домены НЕ будут маппиться на проекты
VITE_MAIN_HOSTNAMES=localhost,127.0.0.1,your-app-domain.com,www.your-app-domain.com

# IP адрес вашего VPS сервера (для A записей)
VITE_SERVER_IP=123.456.789.123

# Основной домен вашего сервиса (для CNAME записей)
VITE_SERVER_DOMAIN=your-main-domain.com

# ⚡ НОВЫЕ ПЕРЕМЕННЫЕ ДЛЯ АВТОМАТИЗАЦИИ:

# Для автоматизации Nginx + SSL (если используете VPS)
NGINX_WEBHOOK_URL=https://your-domain.com/webhook/nginx-ssl
WEBHOOK_SECRET=your-secure-webhook-secret

# Для автоматизации Vercel (если используете Vercel)
VERCEL_API_KEY=your-vercel-api-key
VERCEL_PROJECT_ID=your-vercel-project-id

# Email для SSL сертификатов
SSL_EMAIL=admin@your-domain.com
```

### 3. Деплой Edge Functions

```bash
# Деплой функций автоматизации
supabase functions deploy auto-domain-manager
supabase functions deploy nginx-ssl-webhook
```

### 4. Настройка веб-сервера (автоматизированная)

#### Для VPS с Nginx (автоматическая настройка):

1. **Установите скрипт автоматизации:**

```bash
# Скопируйте скрипт на сервер
sudo cp scripts/auto-ssl-nginx.sh /usr/local/bin/
sudo chmod +x /usr/local/bin/auto-ssl-nginx.sh
```

2. **Настройте базовую конфигурацию Nginx (один раз):**

```nginx
# /etc/nginx/sites-available/your-app
server {
    listen 80;
    listen [::]:80;
    server_name your-main-domain.com www.your-main-domain.com;
    
    # Редирект на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    
    # Основной домен и все кастомные домены клиентов
    server_name your-main-domain.com www.your-main-domain.com *.your-clients-domains.com;
    
    # SSL сертификаты (используйте Let's Encrypt)
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;
    
    # Проксирование на ваше приложение
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

2. **Для автоматических SSL сертификатов с Certbot:**

```bash
# Установка certbot
sudo apt install certbot python3-certbot-nginx

# Получение сертификата для основного домена
sudo certbot --nginx -d your-main-domain.com -d www.your-main-domain.com

# Для каждого нового домена клиента:
sudo certbot --nginx -d client-domain.com -d www.client-domain.com
```

#### Для Vercel:

В настройках проекта Vercel:
1. Перейдите в **Project Settings → Domains**
2. Добавьте каждый кастомный домен клиента
3. Настройте DNS записи (см. инструкцию для клиентов ниже)

## ⚡ Автоматизированная инструкция для клиентов

### Вариант А: Полностью автоматический (рекомендуется)

**Если у вас Cloudflare:**

1. Войдите в админ панель проекта
2. Откройте настройки проекта → вкладка "Домены"
3. Нажмите "Show DNS Automation" 
4. Выберите "Cloudflare (Auto)"
5. Введите ваш Cloudflare API Key и Zone ID
6. Добавьте домен - **всё настроится автоматически!**

🎉 **Готово!** DNS записи созданы, SSL сертификат получен, домен работает.

### Вариант Б: Полуавтоматический

1. Войдите в админ панель проекта
2. Добавьте ваш домен (например: `myproject.com`)
3. Система автоматически:
   - Настроит веб-сервер
   - Получит SSL сертификат
   - Покажет точные DNS записи для копирования
4. Создайте DNS записи в панели вашего регистратора (показаны в интерфейсе)

### Вариант В: Ручная настройка (старый способ)

Если автоматизация недоступна:

#### Пример DNS записей:

**Для основного домена (без www):**
```
Тип: A
Имя: @ (или оставьте пустым)
Значение: 123.456.789.123 (IP сервера)
TTL: 3600 (или Auto)
```

**Для поддомена www:**
```
Тип: CNAME
Имя: www
Значение: your-main-domain.com (основной домен сервиса)
TTL: 3600 (или Auto)
```

#### Популярные регистраторы:

**Reg.ru / Nic.ru:**
1. Войдите в панель управления доменом
2. Перейдите в "DNS-записи" или "Управление DNS"
3. Добавьте записи как указано выше

**Cloudflare:**
1. В разделе DNS добавьте A запись: @ → IP сервера
2. Добавьте CNAME запись: www → основной домен

**GoDaddy:**
1. В DNS Management добавьте A record: @ → IP
2. Добавьте CNAME record: www → основной домен

### Шаг 3: Ожидание

DNS изменения могут занять до 24 часов для полного распространения.

## Client Instructions (English)

### Step 1: Add Domain to Project

1. Log in to admin panel
2. Open project settings  
3. Go to "Domains" tab
4. Add your domain (e.g., `myproject.com`)

### Step 2: Configure DNS Records

In your domain registrar's control panel, create DNS records:

#### For root domain (example.com):
```
Type: A
Name: @
Value: [Hosting IP address]
```

#### For subdomain (www.example.com):
```
Type: CNAME
Name: www
Value: [Hosting domain]
```

#### For Vercel hosting:
```
Type: A
Name: @  
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Step 3: Wait for Propagation

DNS changes can take up to 24 hours to fully propagate.

## ⚡ Преимущества автоматизированной системы

### Для разработчиков:
- ✅ **Нулевое ручное вмешательство** - домены настраиваются автоматически
- ✅ **Масштабируемость** - поддержка тысяч доменов без дополнительной работы
- ✅ **Надежность** - автоматическое обновление SSL сертификатов
- ✅ **Мониторинг** - логирование всех операций в Supabase Functions

### Для клиентов:
- ✅ **Простота** - добавил домен → работает
- ✅ **Скорость** - настройка за секунды вместо часов ожидания
- ✅ **Безопасность** - автоматические SSL сертификаты
- ✅ **Поддержка** - четкие инструкции для каждого случая

### Экономия времени:
- **Было:** 15-30 минут на каждый домен × 1000 клиентов = 250-500 часов
- **Стало:** 0 минут ручной работы = полная автоматизация

## Технические детали

### Архитектура автоматизированной системы:

1. **Frontend** → вызывает `auto-domain-manager` Edge Function
2. **Edge Function** → создает DNS записи через API провайдеров
3. **Webhook** → настраивает Nginx и получает SSL сертификаты
4. **Database** → отслеживает статус доменов
5. **Monitoring** → логи в Supabase Functions

### Структура таблицы project_domains

```sql
CREATE TABLE project_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  is_primary BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Компоненты системы

- `useProjectByDomain` - хук для определения проекта по домену
- `DomainProjectPage` - страница обработки кастомных доменов
- `useProjectDomains` - хук для CRUD операций с доменами
- `ProjectDomainSettings` - компонент управления доменами в админке

### Безопасность

- RLS политики ограничивают доступ к доменам только владельцам проектов
- Валидация доменов на клиенте и сервере
- Автоматическая очистка и нормализация доменов

## Troubleshooting

### Домен не работает

1. Проверьте DNS записи через `dig` или онлайн инструменты
2. Убедитесь, что домен добавлен в настройки хостинга
3. Проверьте статус домена в админ панели проекта
4. Дождитесь полного распространения DNS (до 24 часов)

### Редирект не работает

1. Проверьте, что домен не входит в `VITE_MAIN_HOSTNAMES`
2. Убедитесь, что запись в `project_domains` имеет статус 'active'
3. Проверьте консоль браузера на ошибки

### SSL сертификат

Большинство хостингов (включая Vercel) автоматически выпускают SSL сертификаты для добавленных доменов. Если есть проблемы с SSL, обратитесь в поддержку хостинга.
