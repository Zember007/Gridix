# Устранение ошибки 404 в Webhook

## Проблема
Webhook возвращает ошибку 404 Not Found, что означает, что webhook сервер не может найти соответствующий endpoint.

## Возможные причины

### 1. Webhook сервер не запущен
```bash
# Проверить статус
sudo systemctl status webhook

# Запустить сервис
sudo systemctl start webhook
sudo systemctl enable webhook
```

### 2. Неправильная конфигурация webhook
```bash
# Проверить конфигурацию
cat /etc/webhook/hooks.json

# Проверить JSON валидность
python3 -m json.tool /etc/webhook/hooks.json
```

### 3. Неправильный URL webhook
Проверьте переменную окружения `NGINX_WEBHOOK_URL`:
```bash
# В Supabase Edge Functions
echo $NGINX_WEBHOOK_URL

# Должен быть в формате:
# http://your-server.com:9000
# https://your-server.com:9000
```

### 4. Порт заблокирован файрволом
```bash
# Проверить статус UFW
sudo ufw status

# Разрешить порт 9000
sudo ufw allow 9000
```

## Пошаговое решение

### Шаг 1: Проверка webhook сервера
```bash
# Установить webhook если не установлен
sudo apt update
sudo apt install webhook

# Скопировать конфигурацию
sudo cp scripts/webhook-config.json /etc/webhook/hooks.json

# Скопировать скрипт
sudo cp scripts/auto-ssl-nginx.sh /usr/local/bin/
sudo chmod +x /usr/local/bin/auto-ssl-nginx.sh

# Запустить сервис
sudo systemctl start webhook
sudo systemctl enable webhook
```

### Шаг 2: Проверка конфигурации
```bash
# Проверить что webhook слушает порт
sudo netstat -tlnp | grep 9000

# Проверить логи
sudo journalctl -u webhook -f
```

### Шаг 3: Тестирование webhook
```bash
# Тест GET запроса
curl http://localhost:9000

# Тест POST запроса
curl -X POST http://localhost:9000 \
  -H "Content-Type: application/json" \
  -d '{"domain":"test.com","action":"status","webhook_secret":"6365ef2da7cbb1fa5d440764867f81c3557c7de795d4aca556898af850a72941"}'
```

### Шаг 4: Проверка переменных окружения
В Supabase Dashboard:
1. Перейдите в Settings > Edge Functions
2. Проверьте переменные:
   - `NGINX_WEBHOOK_URL=http://your-server-ip:9000`
   - `WEBHOOK_SECRET=6365ef2da7cbb1fa5d440764867f81c3557c7de795d4aca556898af850a72941`

### Шаг 5: Проверка сетевого доступа
```bash
# С сервера проверить доступность
curl -I http://localhost:9000

# С внешнего сервера проверить доступность
curl -I http://your-server-ip:9000
```

## Диагностический скрипт

Запустите диагностический скрипт:
```bash
./scripts/webhook-diagnostics.sh
```

## Альтернативное решение

Если webhook не работает, можно использовать прямое выполнение скрипта:

1. **SSH на сервер:**
```bash
ssh user@your-server-ip
```

2. **Выполнить скрипт напрямую:**
```bash
sudo /usr/local/bin/auto-ssl-nginx.sh add example.com
```

3. **Проверить результат:**
```bash
sudo /usr/local/bin/auto-ssl-nginx.sh status example.com
```

## Проверка после исправления

1. **Проверить логи Supabase Edge Function:**
   - Должны появиться сообщения об успешном подключении к webhook
   - Не должно быть ошибок 404

2. **Проверить статус домена:**
```bash
sudo /usr/local/bin/auto-ssl-nginx.sh status your-domain.com
```

3. **Проверить Nginx конфигурацию:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Частые ошибки

### Ошибка: "Webhook endpoint not found"
- Проверьте что webhook сервер запущен
- Проверьте правильность URL
- Проверьте что порт открыт

### Ошибка: "Connection refused"
- Проверьте что webhook слушает на правильном порту
- Проверьте файрвол
- Проверьте что сервер доступен

### Ошибка: "Invalid webhook URL format"
- URL должен начинаться с http:// или https://
- Проверьте формат: `http://server-ip:9000`

## Мониторинг

Для мониторинга webhook:
```bash
# Следить за логами
sudo journalctl -u webhook -f

# Проверить активные соединения
sudo netstat -tlnp | grep 9000

# Проверить использование портов
sudo ss -tlnp | grep 9000
```
