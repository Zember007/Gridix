# Деплой автоматизированной системы доменов

## Быстрый старт

### 1. Настройка переменных окружения

Добавьте в ваш `.env` файл:

```env
# Основные настройки (уже есть)
VITE_MAIN_HOSTNAMES=localhost,127.0.0.1,yourdomain.com,www.yourdomain.com
VITE_SERVER_IP=123.456.789.123
VITE_SERVER_DOMAIN=yourdomain.com

# Новые переменные для автоматизации
NGINX_WEBHOOK_URL=https://yourdomain.com/webhook/nginx-ssl
WEBHOOK_SECRET=your-super-secure-webhook-secret-here
SSL_EMAIL=admin@yourdomain.com

# Для Vercel (опционально)
VERCEL_API_KEY=your-vercel-api-token
VERCEL_PROJECT_ID=your-vercel-project-id

# Для Supabase Functions
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

### 2. Деплой Supabase Functions

```bash
# Деплой функций автоматизации
supabase functions deploy auto-domain-manager
supabase functions deploy nginx-ssl-webhook

# Проверка деплоя
supabase functions list
```

### 3. Настройка VPS сервера

#### A. Установка скрипта автоматизации:

```bash
# На вашем VPS сервере
sudo mkdir -p /usr/local/bin
sudo wget -O /usr/local/bin/auto-ssl-nginx.sh https://raw.githubusercontent.com/your-repo/scripts/auto-ssl-nginx.sh
sudo chmod +x /usr/local/bin/auto-ssl-nginx.sh
```

#### B. Базовая настройка Nginx (один раз):

```bash
# Создайте базовую конфигурацию
sudo nano /etc/nginx/sites-available/domain-automation

# Добавьте содержимое:
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://$host$request_uri;
    }
}

# Активируйте конфигурацию
sudo ln -sf /etc/nginx/sites-available/domain-automation /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

#### C. Настройка webhook endpoint:

```bash
# Установите webhook сервер (например, с помощью Node.js)
npm install -g webhook-server

# Или используйте простой Python сервер
sudo nano /usr/local/bin/webhook-server.py
```

```python
#!/usr/bin/env python3
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import subprocess
import os

class WebhookHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/webhook/nginx-ssl':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Проверяем webhook secret
            if data.get('webhook_secret') != os.getenv('WEBHOOK_SECRET'):
                self.send_response(401)
                self.end_headers()
                return
            
            domain = data.get('domain')
            action = data.get('action', 'add')
            
            if action == 'add':
                # Запускаем скрипт автоматизации
                result = subprocess.run(['/usr/local/bin/auto-ssl-nginx.sh', domain], 
                                      capture_output=True, text=True)
                
                if result.returncode == 0:
                    response = {'success': True, 'message': f'Domain {domain} configured successfully'}
                else:
                    response = {'success': False, 'error': result.stderr}
            else:
                response = {'success': False, 'error': 'Invalid action'}
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())

if __name__ == '__main__':
    server = HTTPServer(('localhost', 8080), WebhookHandler)
    server.serve_forever()
```

```bash
# Сделайте скрипт исполняемым
sudo chmod +x /usr/local/bin/webhook-server.py

# Создайте systemd сервис
sudo nano /etc/systemd/system/domain-webhook.service
```

```ini
[Unit]
Description=Domain Automation Webhook
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/usr/local/bin
ExecStart=/usr/local/bin/webhook-server.py
Restart=always
Environment=WEBHOOK_SECRET=your-super-secure-webhook-secret-here

[Install]
WantedBy=multi-user.target
```

```bash
# Запустите сервис
sudo systemctl daemon-reload
sudo systemctl enable domain-webhook
sudo systemctl start domain-webhook
```

### 4. Настройка Nginx для проксирования webhook:

```bash
sudo nano /etc/nginx/sites-available/webhook-proxy
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location /webhook/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
sudo ln -sf /etc/nginx/sites-available/webhook-proxy /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## Тестирование

### 1. Тест автоматизации домена:

```bash
# Тестовый запрос к Edge Function
curl -X POST https://your-project.supabase.co/functions/v1/auto-domain-manager \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-anon-key" \
  -d '{
    "domain": "test.example.com",
    "project_id": "your-project-uuid"
  }'
```

### 2. Тест webhook:

```bash
# Тестовый запрос к webhook
curl -X POST https://yourdomain.com/webhook/nginx-ssl \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "test.example.com",
    "action": "add",
    "webhook_secret": "your-super-secure-webhook-secret-here"
  }'
```

## Мониторинг

### 1. Логи Supabase Functions:

```bash
# Просмотр логов функций
supabase functions logs auto-domain-manager
supabase functions logs nginx-ssl-webhook
```

### 2. Логи системы:

```bash
# Логи webhook сервиса
sudo journalctl -u domain-webhook -f

# Логи Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Логи certbot
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

## Troubleshooting

### Частые проблемы:

1. **Webhook не отвечает:**
   ```bash
   sudo systemctl status domain-webhook
   sudo systemctl restart domain-webhook
   ```

2. **SSL сертификат не получается:**
   ```bash
   # Проверьте DNS записи
   dig +short A test.example.com
   
   # Проверьте доступность домена
   curl -I http://test.example.com/.well-known/acme-challenge/test
   ```

3. **Edge Function ошибки:**
   ```bash
   # Проверьте переменные окружения
   supabase functions env list
   
   # Обновите функцию
   supabase functions deploy auto-domain-manager
   ```

## Масштабирование

Для обработки тысяч доменов:

1. **Используйте очередь задач** (Redis/BullMQ)
2. **Настройте load balancer** для webhook endpoints
3. **Мониторьте ресурсы** сервера
4. **Настройте автоматическое резервное копирование** конфигураций

## Безопасность

1. **Используйте сильные webhook secrets**
2. **Ограничьте доступ к webhook endpoints** по IP
3. **Регулярно обновляйте SSL сертификаты**
4. **Мониторьте подозрительную активность**
