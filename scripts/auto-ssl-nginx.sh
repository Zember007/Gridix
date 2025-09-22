#!/bin/bash

# Автоматическая настройка Nginx и SSL для новых доменов
# Использование: ./auto-ssl-nginx.sh domain.com

set -e  # Выход при ошибке

DOMAIN=$1
EMAIL="${SSL_EMAIL:-admin@gridix.live}"
NGINX_CONFIG_DIR="/etc/nginx/sites-available"
NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"
WEBROOT="/var/www/html"

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

# Создаем конфигурацию Nginx для нового домена
create_nginx_config() {
    local domain=$1
    local config_file="$NGINX_CONFIG_DIR/$domain"
    
    echo "📝 Создаем конфигурацию Nginx для $domain"
    
    cat > "$config_file" << EOF
# HTTP конфигурация для $domain
server {
    listen 80;
    listen [::]:80;
    server_name $domain www.$domain;
    
    # Для получения SSL сертификата
    location /.well-known/acme-challenge/ {
        root $WEBROOT;
    }
    
    # Редирект на HTTPS после получения сертификата
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS конфигурация для $domain (будет активирована после получения SSL)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $domain www.$domain;
    
    # SSL сертификаты (будут настроены certbot'ом)
    ssl_certificate /etc/letsencrypt/live/$domain/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$domain/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Проксирование на приложение
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
}
EOF

    # Включаем конфигурацию
    ln -sf "$config_file" "$NGINX_ENABLED_DIR/$domain"
    echo "✅ Конфигурация Nginx создана и активирована"
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
    
    echo "📦 Проверяем установку certbot..."
    install_certbot
    
    echo "📝 Создаем конфигурацию Nginx..."
    create_nginx_config "$DOMAIN"
    
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
        echo "🔄 Финальная перезагрузка Nginx с SSL..."
        reload_nginx
        
        echo ""
        echo "🎉 Домен $DOMAIN успешно настроен!"
        echo "🔗 Проверьте: https://$DOMAIN"
        echo "🔗 Проверьте: https://www.$DOMAIN"
        echo ""
        echo "📋 Что было сделано:"
        echo "   ✅ Создана конфигурация Nginx"
        echo "   ✅ Получен SSL сертификат"
        echo "   ✅ Настроено автоматическое обновление сертификата"
        echo ""
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
