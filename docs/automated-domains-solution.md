# Автоматизированная система кастомных доменов

## Проблема текущего решения

Текущая система требует ручного вмешательства для каждого нового домена:
- Ручное обновление конфигурации Nginx
- Ручное получение SSL сертификатов
- Ручное добавление доменов в хостинг-провайдера

При тысячах клиентов это становится неуправляемым.

## Автоматизированное решение

### 1. Wildcard SSL сертификат + Proxy

**Концепция:** Использовать один wildcard сертификат и динамический проксирующий сервер.

```nginx
# Основной сервер с wildcard сертификатом
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    
    # Wildcard для всех доменов
    server_name ~^(.+)$;
    
    # Wildcard SSL сертификат
    ssl_certificate /etc/ssl/certs/wildcard.crt;
    ssl_certificate_key /etc/ssl/private/wildcard.key;
    
    # Проксирование на приложение с передачей Host header
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. DNS API автоматизация

**Для популярных провайдеров DNS:**

```typescript
// supabase/functions/manage-domain-dns/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface DNSProvider {
  name: string;
  apiKey: string;
  createARecord(domain: string, ip: string): Promise<boolean>;
  createCNAMERecord(domain: string, target: string): Promise<boolean>;
}

class CloudflareDNS implements DNSProvider {
  name = "cloudflare";
  
  constructor(private apiKey: string, private zoneId: string) {}
  
  async createARecord(domain: string, ip: string): Promise<boolean> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "A",
          name: "@",
          content: ip,
          ttl: 3600,
        }),
      }
    );
    return response.ok;
  }
  
  async createCNAMERecord(domain: string, target: string): Promise<boolean> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "CNAME",
          name: "www",
          content: target,
          ttl: 3600,
        }),
      }
    );
    return response.ok;
  }
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { domain, provider, apiKey } = await req.json();
  
  // Создаем DNS записи автоматически
  const dnsProvider = new CloudflareDNS(apiKey, "zone-id");
  
  const aRecordSuccess = await dnsProvider.createARecord(domain, Deno.env.get("SERVER_IP")!);
  const cnameSuccess = await dnsProvider.createCNAMERecord(domain, Deno.env.get("SERVER_DOMAIN")!);
  
  return new Response(JSON.stringify({
    success: aRecordSuccess && cnameSuccess,
    domain,
  }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

### 3. Автоматическое получение SSL сертификатов

**Используя ACME protocol (Let's Encrypt):**

```bash
#!/bin/bash
# scripts/auto-ssl.sh

DOMAIN=$1
EMAIL="admin@yourdomain.com"

# Автоматическое получение сертификата
certbot certonly \
  --webroot \
  --webroot-path=/var/www/html \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  --domains $DOMAIN,$www.$DOMAIN

# Перезагрузка Nginx
systemctl reload nginx
```

### 4. Webhook для автоматизации

```typescript
// supabase/functions/domain-webhook/index.ts
serve(async (req) => {
  const { domain, project_id } = await req.json();
  
  // 1. Проверяем валидность домена
  if (!isValidDomain(domain)) {
    return new Response("Invalid domain", { status: 400 });
  }
  
  // 2. Добавляем в базу данных
  const { error } = await supabase
    .from('project_domains')
    .insert({
      project_id,
      domain,
      status: 'pending'
    });
    
  if (error) {
    return new Response("Database error", { status: 500 });
  }
  
  // 3. Запускаем процесс автоматизации
  try {
    // Получаем SSL сертификат
    await fetch(`${Deno.env.get("WEBHOOK_URL")}/ssl`, {
      method: "POST",
      body: JSON.stringify({ domain })
    });
    
    // Обновляем статус
    await supabase
      .from('project_domains')
      .update({ status: 'active' })
      .eq('domain', domain);
      
    return new Response(JSON.stringify({ success: true }));
  } catch (error) {
    // Обновляем статус на ошибку
    await supabase
      .from('project_domains')
      .update({ status: 'error' })
      .eq('domain', domain);
      
    return new Response("Automation failed", { status: 500 });
  }
});
```

## Альтернативные решения

### 1. Использование Cloudflare Workers

```javascript
// Cloudflare Worker для автоматического проксирования
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const hostname = url.hostname;
    
    // Проверяем домен в базе данных
    const domain = await env.DB.prepare(
      "SELECT project_id FROM project_domains WHERE domain = ?"
    ).bind(hostname).first();
    
    if (domain) {
      // Проксируем на основное приложение с параметром проекта
      const targetUrl = `https://your-main-app.com${url.pathname}?domain=${hostname}`;
      return fetch(targetUrl, request);
    }
    
    // Если домен не найден, возвращаем 404
    return new Response("Domain not found", { status: 404 });
  }
};
```

### 2. Использование Vercel API

```typescript
// Автоматическое добавление доменов через Vercel API
class VercelDomainManager {
  private apiKey: string;
  private projectId: string;
  
  constructor(apiKey: string, projectId: string) {
    this.apiKey = apiKey;
    this.projectId = projectId;
  }
  
  async addDomain(domain: string): Promise<boolean> {
    const response = await fetch(
      `https://api.vercel.com/v9/projects/${this.projectId}/domains`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: domain,
        }),
      }
    );
    
    return response.ok;
  }
}
```

## Рекомендуемая архитектура

### Для VPS решения:

1. **Nginx с wildcard конфигурацией** - обрабатывает все домены
2. **Автоматический SSL через certbot** - webhook получает сертификаты
3. **База данных для маппинга** - уже есть в project_domains
4. **Webhook система** - автоматизирует весь процесс

### Для Vercel решения:

1. **Vercel API интеграция** - автоматическое добавление доменов
2. **Webhook при добавлении домена** - вызывает Vercel API
3. **Автоматические SSL сертификаты** - Vercel делает это автоматически

## Внедрение

1. **Фаза 1**: Создать webhook для автоматизации
2. **Фаза 2**: Интегрировать с DNS API провайдерами
3. **Фаза 3**: Автоматизировать SSL сертификаты
4. **Фаза 4**: Полностью убрать ручные операции

Клиент просто добавляет домен в интерфейсе, а система автоматически:
- Создает DNS записи (если у клиента API ключ)
- Получает SSL сертификат
- Активирует домен

**Результат**: Полная автоматизация без ручного вмешательства для тысяч доменов.
