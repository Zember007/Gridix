#!/bin/bash

# Автоматическая настройка Nginx и SSL для доменов
# Использование: 
#   ./auto-ssl-nginx.sh add domain.com
#   ./auto-ssl-nginx.sh remove domain.com
#   ./auto-ssl-nginx.sh status domain.com

set -e  # Выход при ошибке

ACTION=$1
DOMAIN=$2
EMAIL="${SSL_EMAIL:-admin@gridix.live}"
NGINX_CONFIG_DIR="/etc/nginx/sites-available"
NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"
WEBROOT="/var/www/html"
SITE_ROOT="/var/www/floorplan-wizard-builder/dist"

# Функция для возврата JSON статуса
return_status() {
    local status=$1
    local message=$2
    local error_type=$3
    
    cat << EOF
{
    "status": "$status",
    "message": "$message",
    "error_type": "$error_type",
    "domain": "$DOMAIN",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
    exit $([ "$status" = "success" ] && echo 0 || echo 1)
}

# Проверка параметров
if [ -z "$ACTION" ] || [ -z "$DOMAIN" ]; then
    return_status "error" "Использование: $0 {add|remove|status} domain.com" "invalid_parameters"
fi

if [ "$ACTION" != "add" ] && [ "$ACTION" != "remove" ] && [ "$ACTION" != "status" ]; then
    return_status "error" "Неверное действие. Используйте: add, remove или status" "invalid_action"
fi

# Проверка прав суперпользователя
if [ "$EUID" -ne 0 ]; then
    return_status "error" "Этот скрипт должен запускаться с правами root" "permission_denied"
fi

# Функция проверки статуса домена
check_domain_status() {
    local domain=$1
    local nginx_config_exists=false
    local nginx_enabled=false
    local ssl_cert_exists=false
    local ssl_cert_valid=false
    
    # Проверяем конфигурацию Nginx
    if [ -f "$NGINX_CONFIG_DIR/$domain" ]; then
        nginx_config_exists=true
    fi
    
    if [ -L "$NGINX_ENABLED_DIR/$domain" ]; then
        nginx_enabled=true
    fi
    
    # Проверяем SSL сертификат
    if [ -f "/etc/letsencrypt/live/$domain/fullchain.pem" ]; then
        ssl_cert_exists=true
        # Проверяем валидность сертификата
        if openssl x509 -in "/etc/letsencrypt/live/$domain/fullchain.pem" -text -noout >/dev/null 2>&1; then
            ssl_cert_valid=true
        fi
    fi
    
    # Определяем общий статус
    local overall_status="unknown"
    if [ "$nginx_config_exists" = true ] && [ "$nginx_enabled" = true ] && [ "$ssl_cert_exists" = true ] && [ "$ssl_cert_valid" = true ]; then
        overall_status="active"
    elif [ "$nginx_config_exists" = true ] && [ "$nginx_enabled" = true ] && [ "$ssl_cert_exists" = true ] && [ "$ssl_cert_valid" = false ]; then
        overall_status="ssl_invalid"
    elif [ "$nginx_config_exists" = true ] && [ "$nginx_enabled" = true ] && [ "$ssl_cert_exists" = false ]; then
        overall_status="no_ssl"
    elif [ "$nginx_config_exists" = true ] && [ "$nginx_enabled" = false ]; then
        overall_status="disabled"
    elif [ "$nginx_config_exists" = false ]; then
        overall_status="not_configured"
    fi
    
    cat << EOF
{
    "status": "success",
    "domain": "$domain",
    "overall_status": "$overall_status",
    "nginx": {
        "config_exists": $nginx_config_exists,
        "enabled": $nginx_enabled
    },
    "ssl": {
        "certificate_exists": $ssl_cert_exists,
        "certificate_valid": $ssl_cert_valid
    },
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
}

# Функция удаления домена
remove_domain() {
    local domain=$1
    
    echo "🗑️ Удаляем конфигурацию для домена: $domain"
    
    # Проверяем существование конфигурации
    if [ ! -f "$NGINX_CONFIG_DIR/$domain" ]; then
        return_status "error" "Конфигурация для домена $domain не найдена" "config_not_found"
    fi
    
    # Отключаем конфигурацию
    if [ -L "$NGINX_ENABLED_DIR/$domain" ]; then
        rm -f "$NGINX_ENABLED_DIR/$domain"
        echo "✅ Конфигурация отключена"
    fi
    
    # Удаляем конфигурационный файл
    rm -f "$NGINX_CONFIG_DIR/$domain"
    echo "✅ Конфигурационный файл удален"
    
    # Удаляем SSL сертификат
    if [ -d "/etc/letsencrypt/live/$domain" ]; then
        certbot delete --cert-name "$domain" --non-interactive
        echo "✅ SSL сертификат удален"
    fi
    
    # Проверяем конфигурацию Nginx
    if ! test_nginx_config; then
        return_status "error" "Ошибка в конфигурации Nginx после удаления" "nginx_config_error"
    fi
    
    # Перезагружаем Nginx
    if ! reload_nginx; then
        return_status "error" "Ошибка при перезагрузке Nginx" "nginx_reload_error"
    fi
    
    return_status "success" "Домен $domain успешно удален" ""
}

# Обработка команд
case "$ACTION" in
    "status")
        check_domain_status "$DOMAIN"
        exit 0
        ;;
    "remove")
        remove_domain "$DOMAIN"
        ;;
    "add")
        echo "🚀 Начинаем автоматическую настройку для домена: $DOMAIN"
        ;;
esac

# Этап 1: Создаем HTTP-only конфигурацию для получения сертификата
create_http_config() {
    local domain=$1
    local config_file="$NGINX_CONFIG_DIR/$domain"
    
    echo "📝 Создаем временную HTTP конфигурацию для $domain"
    
    if ! cat > "$config_file" << EOF
# Временная HTTP конфигурация для получения SSL сертификата
server {
    listen 80;
    listen [::]:80;
    server_name $domain www.$domain;
    
    # Для получения SSL сертификата
    location /.well-known/acme-challenge/ {
        root $WEBROOT;
    }
    
    # Временная страница
    location / {
        return 200 "Domain setup in progress for $domain...";
        add_header Content-Type text/plain;
    }
}
EOF

    # Включаем конфигурацию
    if ! ln -sf "$config_file" "$NGINX_ENABLED_DIR/$domain"; then
        echo "❌ Не удалось создать символическую ссылку для конфигурации"
        return 1
    fi
    echo "✅ Временная HTTP конфигурация создана"
    return 0
}

# Этап 2: Создаем полную конфигурацию с SSL
create_full_config() {
    local domain=$1
    local config_file="$NGINX_CONFIG_DIR/$domain"
    
    echo "📝 Создаем полную конфигурацию с SSL для $domain"
    
    if ! cat > "$config_file" << EOF
# HTTP редирект на HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name $domain www.$domain;
    
    # Для обновления SSL сертификата
    location /.well-known/acme-challenge/ {
        root $WEBROOT;
    }
    
    # Редирект на HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS конфигурация
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $domain www.$domain;
    
    # SSL сертификаты
    ssl_certificate /etc/letsencrypt/live/$domain/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$domain/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Корневая директория для статических файлов
    root $SITE_ROOT;
    index index.html index.htm index.nginx-debian.html;
    
    # Обслуживание статических файлов
    location / {
        try_files $uri /index.html;
    }

    
    # Кеширование статических ресурсов
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Безопасность - скрыть системные файлы
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

    echo "✅ Полная конфигурация с SSL создана"
    return 0
}

# Проверяем и создаем директорию сайта
create_site_directory() {
    local site_dir="$SITE_ROOT"
    
    echo "📁 Проверяем директорию сайта: $site_dir"
    
    if [ ! -d "$site_dir" ]; then
        echo "📁 Создаем директорию: $site_dir"
        if ! mkdir -p "$site_dir"; then
            echo "❌ Не удалось создать директорию $site_dir"
            return 1
        fi
        if ! chown -R www-data:www-data "$site_dir"; then
            echo "❌ Не удалось изменить владельца директории"
            return 1
        fi
        if ! chmod -R 755 "$site_dir"; then
            echo "❌ Не удалось изменить права доступа к директории"
            return 1
        fi
    fi
    
    # Создаем базовый index.html если его нет
    if [ ! -f "$site_dir/index.html" ]; then
        echo "📄 Создаем базовый index.html"
        cat > "$site_dir/index.html" << EOF
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>$DOMAIN - Floorplan Wizard Builder</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            text-align: center;
            margin-top: 50px;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        h1 { color: #333; }
        p { color: #666; }
        .success { color: #28a745; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="success">✅ Домен успешно настроен!</h1>
        <h2>$DOMAIN</h2>
        <p>Floorplan Wizard Builder готов к работе</p>
        <p>SSL сертификат активен</p>
        <small>Замените этот файл на ваш контент</small>
    </div>
</body>
</html>
EOF
        if ! chown www-data:www-data "$site_dir/index.html"; then
            echo "❌ Не удалось изменить владельца файла index.html"
            return 1
        fi
        if ! chmod 644 "$site_dir/index.html"; then
            echo "❌ Не удалось изменить права доступа к файлу index.html"
            return 1
        fi
    fi
    
    return 0
}

# Проверяем и устанавливаем certbot если нужно
install_certbot() {
    if ! command -v certbot &> /dev/null; then
        echo "📦 Устанавливаем certbot..."
        if ! apt update; then
            echo "❌ Не удалось обновить список пакетов"
            return 1
        fi
        if ! apt install -y certbot python3-certbot-nginx; then
            echo "❌ Не удалось установить certbot"
            return 1
        fi
    fi
    return 0
}

# Получаем SSL сертификат
get_ssl_certificate() {
    local domain=$1
    
    echo "🔒 Получаем SSL сертификат для $domain"
    
    # Создаем директорию для webroot если не существует
    if ! mkdir -p "$WEBROOT"; then
        echo "❌ Не удалось создать директорию webroot"
        return 1
    fi
    
    # Получаем сертификат
    local certbot_output
    certbot_output=$(certbot certonly \
        --webroot \
        --webroot-path="$WEBROOT" \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --domains "$domain,www.$domain" \
        --non-interactive 2>&1)
    local certbot_exit_code=$?
        
    if [ $certbot_exit_code -eq 0 ]; then
        echo "✅ SSL сертификат успешно получен"
        return 0
    else
        echo "❌ Ошибка при получении SSL сертификата: $certbot_output"
        return 1
    fi
}

# Проверяем конфигурацию Nginx
test_nginx_config() {
    echo "🧪 Проверяем конфигурацию Nginx..."
    local nginx_test_output
    nginx_test_output=$(nginx -t 2>&1)
    local nginx_exit_code=$?
    
    if [ $nginx_exit_code -eq 0 ]; then
        echo "✅ Конфигурация Nginx корректна"
        return 0
    else
        echo "❌ Ошибка в конфигурации Nginx: $nginx_test_output"
        return 1
    fi
}

# Перезагружаем Nginx
reload_nginx() {
    echo "🔄 Перезагружаем Nginx..."
    local reload_output
    reload_output=$(systemctl reload nginx 2>&1)
    local reload_exit_code=$?
    
    if [ $reload_exit_code -eq 0 ]; then
        echo "✅ Nginx перезагружен успешно"
        return 0
    else
        echo "❌ Ошибка при перезагрузке Nginx: $reload_output"
        return 1
    fi
}

# Проверяем доступность домена
check_domain_availability() {
    local domain=$1
    echo "🌐 Проверяем доступность домена $domain..."
    
    # Проверяем A запись
    if dig +short A "$domain" | grep -q .; then
        echo "✅ A запись для $domain найдена"
    else
        echo "⚠️  A запись для $domain не найдена. Убедитесь, что DNS настроен правильно."
    fi
    
    # Проверяем CNAME для www
    if dig +short CNAME "www.$domain" | grep -q .; then
        echo "✅ CNAME запись для www.$domain найдена"
    else
        echo "⚠️  CNAME запись для www.$domain не найдена."
    fi
}

# Основная логика
main() {
    echo "🔍 Проверяем доступность домена..."
    check_domain_availability "$DOMAIN"
    
    echo "📁 Создаем директорию для сайта..."
    if ! create_site_directory; then
        return_status "error" "Не удалось создать директорию сайта" "directory_creation_failed"
    fi
    
    echo "📦 Проверяем установку certbot..."
    if ! install_certbot; then
        return_status "error" "Не удалось установить certbot" "certbot_installation_failed"
    fi
    
    echo "📝 Создаем временную HTTP конфигурацию..."
    if ! create_http_config "$DOMAIN"; then
        return_status "error" "Не удалось создать HTTP конфигурацию" "nginx_config_creation_failed"
    fi
    
    echo "🧪 Тестируем конфигурацию..."
    if ! test_nginx_config; then
        echo "❌ Ошибка в конфигурации Nginx. Откатываем изменения..."
        rm -f "$NGINX_ENABLED_DIR/$DOMAIN"
        rm -f "$NGINX_CONFIG_DIR/$DOMAIN"
        return_status "error" "Ошибка в конфигурации Nginx" "nginx_config_test_failed"
    fi
    
    echo "🔄 Перезагружаем Nginx..."
    if ! reload_nginx; then
        return_status "error" "Не удалось перезагрузить Nginx" "nginx_reload_failed"
    fi
    
    # Ждем немного для распространения конфигурации
    sleep 5
    
    echo "🔒 Получаем SSL сертификат..."
    if ! get_ssl_certificate "$DOMAIN"; then
        return_status "error" "Не удалось получить SSL сертификат. Проверьте DNS настройки" "ssl_certificate_failed"
    fi
    
    echo "📝 Создаем полную конфигурацию с SSL..."
    if ! create_full_config "$DOMAIN"; then
        return_status "error" "Не удалось создать полную конфигурацию с SSL" "ssl_config_creation_failed"
    fi
    
    echo "🧪 Тестируем финальную конфигурацию..."
    if ! test_nginx_config; then
        return_status "error" "Ошибка в финальной конфигурации Nginx" "final_nginx_config_test_failed"
    fi
    
    echo "🔄 Финальная перезагрузка Nginx с SSL..."
    if ! reload_nginx; then
        return_status "error" "Не удалось перезагрузить Nginx с SSL конфигурацией" "final_nginx_reload_failed"
    fi
    
    return_status "success" "Домен $DOMAIN успешно настроен с SSL сертификатом" ""
}

# Функция для отката изменений при ошибке
cleanup() {
    echo "🧹 Очистка при ошибке..."
    rm -f "$NGINX_ENABLED_DIR/$DOMAIN"
    rm -f "$NGINX_CONFIG_DIR/$DOMAIN"
    systemctl reload nginx
}

# Устанавливаем обработчик ошибок
trap cleanup ERR

# Запускаем основную логику
main

echo "✨ Автоматическая настройка завершена!"