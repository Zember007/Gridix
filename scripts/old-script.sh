#!/bin/bash

# Автоматическая настройка Nginx и SSL для новых доменов
# Использование: ./auto-ssl-nginx.sh domain.com

set -e  # Выход при ошибке

DOMAIN=$1
EMAIL="${SSL_EMAIL:-admin@gridix.live}"
NGINX_CONFIG_DIR="/etc/nginx/sites-available"
NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"
WEBROOT="/var/www/html"
SITE_ROOT="/var/www/floorplan-wizard-builder/dist"

# Проверка параметров
if [ -z "$DOMAIN" ]; then
    echo "Использование: $0 domain.com"
    exit 1
fi

# Проверка прав суперпользователя
if [ "$EUID" -ne 0 ]; then
    echo "Этот скрипт должен запускаться с правами root"
    exit 1
fi

echo "🚀 Начинаем автоматическую настройку для домена: $DOMAIN"

# Этап 1: Создаем HTTP-only конфигурацию для получения сертификата
create_http_config() {
    local domain=$1
    local config_file="$NGINX_CONFIG_DIR/$domain"
    
    echo "📝 Создаем временную HTTP конфигурацию для $domain"
    
    cat > "$config_file" << EOF
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
    ln -sf "$config_file" "$NGINX_ENABLED_DIR/$domain"
    echo "✅ Временная HTTP конфигурация создана"
}

# Этап 2: Создаем полную конфигурацию с SSL
create_full_config() {
    local domain=$1
    local config_file="$NGINX_CONFIG_DIR/$domain"
    
    echo "📝 Создаем полную конфигурацию с SSL для $domain"
    
    cat > "$config_file" << EOF
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
}

# Проверяем и создаем директорию сайта
create_site_directory() {
    local site_dir="$SITE_ROOT"
    
    echo "📁 Проверяем директорию сайта: $site_dir"
    
    if [ ! -d "$site_dir" ]; then
        echo "📁 Создаем директорию: $site_dir"
        mkdir -p "$site_dir"
        chown -R www-data:www-data "$site_dir"
        chmod -R 755 "$site_dir"
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
        chown www-data:www-data "$site_dir/index.html"
        chmod 644 "$site_dir/index.html"
    fi
}

# Проверяем и устанавливаем certbot если нужно
install_certbot() {
    if ! command -v certbot &> /dev/null; then
        echo "📦 Устанавливаем certbot..."
        apt update
        apt install -y certbot python3-certbot-nginx
    fi
}

# Получаем SSL сертификат
get_ssl_certificate() {
    local domain=$1
    
    echo "🔒 Получаем SSL сертификат для $domain"
    
    # Создаем директорию для webroot если не существует
    mkdir -p "$WEBROOT"
    
    # Получаем сертификат
    certbot certonly \
        --webroot \
        --webroot-path="$WEBROOT" \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --domains "$domain,www.$domain" \
        --non-interactive
        
    if [ $? -eq 0 ]; then
        echo "✅ SSL сертификат успешно получен"
        return 0
    else
        echo "❌ Ошибка при получении SSL сертификата"
        return 1
    fi
}

# Проверяем конфигурацию Nginx
test_nginx_config() {
    echo "🧪 Проверяем конфигурацию Nginx..."
    nginx -t
    if [ $? -eq 0 ]; then
        echo "✅ Конфигурация Nginx корректна"
        return 0
    else
        echo "❌ Ошибка в конфигурации Nginx"
        return 1
    fi
}

# Перезагружаем Nginx
reload_nginx() {
    echo "🔄 Перезагружаем Nginx..."
    systemctl reload nginx
    if [ $? -eq 0 ]; then
        echo "✅ Nginx перезагружен успешно"
    else
        echo "❌ Ошибка при перезагрузке Nginx"
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
    create_site_directory
    
    echo "📦 Проверяем установку certbot..."
    install_certbot
    
    echo "📝 Создаем временную HTTP конфигурацию..."
    create_http_config "$DOMAIN"
    
    echo "🧪 Тестируем конфигурацию..."
    if ! test_nginx_config; then
        echo "❌ Ошибка в конфигурации Nginx. Откатываем изменения..."
        rm -f "$NGINX_ENABLED_DIR/$DOMAIN"
        rm -f "$NGINX_CONFIG_DIR/$DOMAIN"
        exit 1
    fi
    
    echo "🔄 Перезагружаем Nginx..."
    reload_nginx
    
    # Ждем немного для распространения конфигурации
    sleep 5
    
    echo "🔒 Получаем SSL сертификат..."
    if get_ssl_certificate "$DOMAIN"; then
        echo "📝 Создаем полную конфигурацию с SSL..."
        create_full_config "$DOMAIN"
        
        echo "🧪 Тестируем финальную конфигурацию..."
        if test_nginx_config; then
            echo "🔄 Финальная перезагрузка Nginx с SSL..."
            reload_nginx
            
            echo ""
            echo "🎉 Домен $DOMAIN успешно настроен!"
            echo "🔗 Проверьте: https://$DOMAIN"
            echo "🔗 Проверьте: https://www.$DOMAIN"
            echo ""
            echo "📋 Что было сделано:"
            echo "   ✅ Создана директория сайта: $SITE_ROOT"
            echo "   ✅ Создана конфигурация Nginx для статических файлов"
            echo "   ✅ Получен SSL сертификат"
            echo "   ✅ Настроено автоматическое обновление сертификата"
            echo "   ✅ Настроено кеширование статических ресурсов"
            echo ""
            echo "📁 Загрузите ваши файлы в: $SITE_ROOT"
        else
            echo "❌ Ошибка в финальной конфигурации"
            exit 1
        fi
    else
        echo "❌ Не удалось получить SSL сертификат"
        echo "🔧 Домен настроен для HTTP, но HTTPS может не работать"
        echo "💡 Проверьте DNS настройки и попробуйте позже"
        exit 1
    fi
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