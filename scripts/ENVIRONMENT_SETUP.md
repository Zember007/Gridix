# Настройка переменных окружения

Для работы автоматической настройки доменов необходимо настроить следующие переменные окружения:

## Backend (Supabase Edge Functions)

### Обязательные переменные:
```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Server configuration
SERVER_IP=your_server_ip_address
SERVER_DOMAIN=your_server_domain.com
```

### Опциональные переменные:
```bash
# Vercel (если используете Vercel для хостинга)
VERCEL_API_KEY=your_vercel_api_key
VERCEL_PROJECT_ID=your_vercel_project_id

# Nginx Webhook (если используете собственный сервер)
# ВАЖНО: URL должен быть базовым, без /hooks/. Endpoint'ы добавляются автоматически.
NGINX_WEBHOOK_URL=http://localhost:8080
WEBHOOK_SECRET=your_webhook_secret

# Примеры правильных URL:
# NGINX_WEBHOOK_URL=http://localhost:8080 (локально)
# NGINX_WEBHOOK_URL=http://your-server-ip:8080 (удаленный сервер)
# NGINX_WEBHOOK_URL=https://your-domain.com:8080 (с доменом)

# Система автоматически добавит endpoint'ы:
# - /hooks/nginx-ssl-add - для добавления домена
# - /hooks/nginx-ssl-remove - для удаления домена
# - /hooks/nginx-ssl-status - для проверки статуса
```

## Frontend (Vite)

### Обязательные переменные:
```bash
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Server configuration
VITE_SERVER_IP=your_server_ip_address
VITE_SERVER_DOMAIN=your_server_domain.com
```

### Опциональные переменные:
```bash
# Nginx Webhook (для проверки статуса и удаления доменов)
# ВАЖНО: URL должен быть базовым, без /hooks/. Endpoint'ы добавляются автоматически.
VITE_NGINX_WEBHOOK_URL=http://localhost:8080
VITE_WEBHOOK_SECRET=your_webhook_secret

# Примеры:
# VITE_NGINX_WEBHOOK_URL=http://localhost:8080 (локально)
# VITE_NGINX_WEBHOOK_URL=http://your-server-ip:8080 (удаленный сервер)
```

## Настройка в Supabase

1. Перейдите в Supabase Dashboard
2. Выберите ваш проект
3. Перейдите в Settings > Edge Functions
4. Добавьте переменные окружения в секции "Environment Variables"

## Настройка в Vite

Создайте файл `.env.local` в корне проекта:

```bash
# .env.local
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SERVER_IP=your_server_ip_address
VITE_SERVER_DOMAIN=your_server_domain.com

# Webhook URL без /hooks/ endpoint'а
VITE_NGINX_WEBHOOK_URL=http://localhost:8080
VITE_WEBHOOK_SECRET=your_webhook_secret
```

## Настройка Webhook сервера

1. Установите webhook сервер на ваш VPS:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install webhook

# Или используйте Docker
docker run -d -p 9000:9000 -v /path/to/hooks:/etc/webhook -v /path/to/scripts:/usr/local/bin almir/webhook
```

2. Скопируйте конфигурацию webhook:
```bash
sudo cp scripts/webhook-config.json /etc/webhook/hooks.json
```

3. Скопируйте скрипт:
```bash
sudo cp scripts/auto-ssl-nginx.sh /usr/local/bin/
sudo chmod +x /usr/local/bin/auto-ssl-nginx.sh
```

4. Запустите webhook сервер:
```bash
sudo systemctl enable webhook
sudo systemctl start webhook
```

## Проверка настройки

1. **Проверьте переменные окружения:**
```bash
# В Supabase Edge Functions
echo $SUPABASE_URL
echo $SERVER_IP

# В Vite
echo $VITE_SUPABASE_URL
echo $VITE_SERVER_IP
```

2. **Проверьте webhook:**
```bash
# Проверка статуса домена
curl -X POST http://localhost:8080/hooks/nginx-ssl-status \
  -H "Content-Type: application/json" \
  -d '{"domain":"test.com","webhook_secret":"your_secret","action":"status"}'

# Добавление домена
curl -X POST http://localhost:8080/hooks/nginx-ssl-add \
  -H "Content-Type: application/json" \
  -d '{"domain":"test.com","webhook_secret":"your_secret","action":"add"}'

# Удаление домена
curl -X POST http://localhost:8080/hooks/nginx-ssl-remove \
  -H "Content-Type: application/json" \
  -d '{"domain":"test.com","webhook_secret":"your_secret","action":"remove"}'
```

3. **Проверьте скрипт:**
```bash
sudo /usr/local/bin/auto-ssl-nginx.sh status example.com
```

## Безопасность

- Используйте сильные секреты для webhook
- Ограничьте доступ к webhook URL
- Регулярно обновляйте секреты
- Используйте HTTPS для всех соединений
