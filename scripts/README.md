# Автоматическая настройка Nginx и SSL

Улучшенный скрипт для автоматической настройки Nginx и SSL сертификатов с поддержкой добавления, удаления и проверки статуса доменов.

## Возможности

- ✅ **Добавление доменов** с автоматической настройкой SSL
- ✅ **Удаление доменов** с очисткой конфигурации и сертификатов
- ✅ **Проверка статуса** доменов с детальной информацией
- ✅ **Детальная обработка ошибок** с указанием типа ошибки
- ✅ **JSON ответы** для интеграции с webhook'ами
- ✅ **Проверка валидности** SSL сертификатов

## Использование

### Добавление домена
```bash
./auto-ssl-nginx.sh add example.com
```

### Удаление домена
```bash
./auto-ssl-nginx.sh remove example.com
```

### Проверка статуса домена
```bash
./auto-ssl-nginx.sh status example.com
```

## Webhook конфигурация

Скрипт поддерживает три типа операций через webhook:

### 1. Добавление домена
```json
{
  "webhook_secret": "6365ef2da7cbb1fa5d440764867f81c3557c7de795d4aca556898af850a72941",
  "action": "add",
  "domain": "example.com"
}
```

### 2. Удаление домена
```json
{
  "webhook_secret": "6365ef2da7cbb1fa5d440764867f81c3557c7de795d4aca556898af850a72941",
  "action": "remove",
  "domain": "example.com"
}
```

### 3. Проверка статуса
```json
{
  "webhook_secret": "6365ef2da7cbb1fa5d440764867f81c3557c7de795d4aca556898af850a72941",
  "action": "status",
  "domain": "example.com"
}
```

## Формат ответов

### Успешное выполнение
```json
{
  "status": "success",
  "message": "Домен example.com успешно настроен с SSL сертификатом",
  "error_type": "",
  "domain": "example.com",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Ошибка
```json
{
  "status": "error",
  "message": "Не удалось получить SSL сертификат. Проверьте DNS настройки",
  "error_type": "ssl_certificate_failed",
  "domain": "example.com",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Статус домена
```json
{
  "status": "success",
  "domain": "example.com",
  "overall_status": "active",
  "nginx": {
    "config_exists": true,
    "enabled": true
  },
  "ssl": {
    "certificate_exists": true,
    "certificate_valid": true
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Типы ошибок

- `invalid_parameters` - Неверные параметры команды
- `invalid_action` - Неверное действие (не add/remove/status)
- `permission_denied` - Недостаточно прав (нужен root)
- `config_not_found` - Конфигурация не найдена
- `directory_creation_failed` - Ошибка создания директории
- `certbot_installation_failed` - Ошибка установки certbot
- `nginx_config_creation_failed` - Ошибка создания конфигурации Nginx
- `nginx_config_test_failed` - Ошибка тестирования конфигурации Nginx
- `nginx_reload_failed` - Ошибка перезагрузки Nginx
- `ssl_certificate_failed` - Ошибка получения SSL сертификата
- `ssl_config_creation_failed` - Ошибка создания SSL конфигурации
- `final_nginx_config_test_failed` - Ошибка финального тестирования
- `final_nginx_reload_failed` - Ошибка финальной перезагрузки

## Статусы доменов

- `active` - Домен полностью настроен и работает
- `ssl_invalid` - SSL сертификат существует, но недействителен
- `no_ssl` - Конфигурация есть, но нет SSL сертификата
- `disabled` - Конфигурация отключена
- `not_configured` - Домен не настроен
- `unknown` - Неизвестный статус

## Требования

- Права root для выполнения скрипта
- Nginx установлен и запущен
- Certbot доступен (устанавливается автоматически)
- DNS записи настроены для домена

## Безопасность

- Проверка webhook секрета
- Валидация входных параметров
- Проверка прав доступа
- Автоматическая очистка при ошибках
